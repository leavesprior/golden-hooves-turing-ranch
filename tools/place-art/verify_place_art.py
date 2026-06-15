#!/usr/bin/env python3
"""
verify_place_art.py — verify a generated 64-bit game picture of a REAL place.

Two checks, per the research (docs CHASE_ART_BIBLE + the 2026-06-14 tooling research):

  (B) STYLE GATE  — local, free, deterministic. Is it really a 64-bit/pixel-art
      picture? (small palette, real upscaled blocks, blockiness.) Runs first; an
      image that fails here never needs a (more expensive) place check.

  (A) PLACE REFERENCE — fetch a Google Street View reference for the place's
      address so a vision judge can answer "same building, ignoring style?".
      The JUDGE itself is a vision LLM (Claude via the Read tool, or Gemini) —
      this script PREPARES the comparison bundle; it does not score identity.
      CLIP cosine is an optional supporting score (see --clip), never a gate.

Usage:
  python3 verify_place_art.py --image out/town-jackson.png --place jackson
  python3 verify_place_art.py --image x.png --place welcome_gate --no-reference

Env:
  GOOGLE_MAPS_API_KEY   required for the Street View reference fetch (step A).
                        Without it, the style gate still runs (step B).

Output: prints a summary and writes <image>.verify.json — a bundle for the judge.
"""
import argparse, json, os, sys, math, urllib.parse, urllib.request, pathlib

try:
    from PIL import Image
    import numpy as np
except Exception:
    print("Needs Pillow + numpy:  pip install pillow numpy", file=sys.stderr)
    raise

HERE = pathlib.Path(__file__).parent
PLACES = json.loads((HERE / "places.json").read_text())["places"]

# ---------- (B) STYLE GATE — is this a real 64-bit/pixel picture? ----------

def style_gate(path):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    a = np.asarray(img)

    # 1) palette size — pixel/64-bit art uses a small quantized palette.
    #    Count unique colors after a light 4-bit-per-channel quantize (kills jpeg noise).
    q = (a // 16).reshape(-1, 3)
    unique_colors = len({tuple(c) for c in q[:: max(1, len(q) // 60000)]})  # sampled

    # 2) block size — pixel art is small art upscaled in integer blocks: long runs
    #    of identical adjacent pixels. Estimate the dominant horizontal run length.
    def dominant_run(row):
        runs, cur = [], 1
        for i in range(1, len(row)):
            if np.array_equal(row[i], row[i - 1]):
                cur += 1
            else:
                runs.append(cur); cur = 1
        runs.append(cur)
        return float(np.median(runs)) if runs else 1.0
    sample_rows = a[:: max(1, h // 40)]
    block = float(np.median([dominant_run(r) for r in sample_rows]))

    # 3) blockiness — fraction of horizontal neighbor pairs that are EXACTLY equal
    #    (hard pixel edges, not gradients).
    eq = np.all(a[:, 1:] == a[:, :-1], axis=2)
    blockiness = float(eq.mean())

    # Gate on palette + hard-edge fraction (both robust to JPEG). Block-size is
    # reported as advisory only — JPEG noise breaks exact-run detection, though
    # true lossless upscaled pixel art (the real PNG assets) will read ~4px.
    passed = (unique_colors <= 512) and (blockiness >= 0.40)
    return {
        "width": w, "height": h,
        "approx_unique_colors": unique_colors,
        "dominant_block_px": round(block, 2),
        "blockiness_0_1": round(blockiness, 3),
        "pass": passed,
        "reasons": {
            "small_palette(<=512)": unique_colors <= 512,
            "hard_edges(>=0.40)": blockiness >= 0.40,
            "block_px_advisory": round(block, 2),
        },
    }

# ---------- (A) PLACE REFERENCE — fetch Street View ground truth ----------

def _get(url):
    with urllib.request.urlopen(url, timeout=20) as r:
        return r.read(), r.headers.get_content_type()

def fetch_reference(place, out_dir):
    key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not key:
        return {"status": "NO_API_KEY", "note": "set GOOGLE_MAPS_API_KEY to fetch a Street View reference"}
    loc = place.get("latlng") or place["address"]
    base = "https://maps.googleapis.com/maps/api/streetview"
    # metadata first — FREE, no quota; only fetch the billed image if coverage exists.
    meta_url = f"{base}/metadata?location={urllib.parse.quote(str(loc))}&key={key}"
    try:
        raw, _ = _get(meta_url)
        meta = json.loads(raw)
    except Exception as e:
        return {"status": "META_ERROR", "error": str(e)}
    if meta.get("status") != "OK":
        return {"status": meta.get("status", "UNKNOWN"), "note": "no Street View coverage; supply a historical photo instead"}
    ll = meta.get("location", {})
    img_url = (f"{base}?size=640x480&location={ll.get('lat')},{ll.get('lng')}"
               f"&fov=80&pitch=0&key={key}")
    try:
        raw, ctype = _get(img_url)
    except Exception as e:
        return {"status": "IMG_ERROR", "error": str(e)}
    ref_path = pathlib.Path(out_dir) / f"{place['id']}.streetview.jpg"
    ref_path.write_bytes(raw)
    return {"status": "OK", "pano_date": meta.get("date"),
            "latlng": ll, "reference_path": str(ref_path)}

# ---------- main ----------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True)
    ap.add_argument("--place", required=True, help="place id from places.json")
    ap.add_argument("--no-reference", action="store_true", help="skip Street View fetch")
    args = ap.parse_args()

    place = next((p for p in PLACES if p["id"] == args.place), None)
    if not place:
        print(f"Unknown place '{args.place}'. Known: {[p['id'] for p in PLACES]}", file=sys.stderr)
        sys.exit(2)

    style = style_gate(args.image)
    ref = {"status": "SKIPPED"} if args.no_reference else fetch_reference(place, pathlib.Path(args.image).parent)

    bundle = {
        "image": args.image,
        "place": {"id": place["id"], "name": place["name"], "clue_year": place.get("clue_year"),
                  "address": place.get("address")},
        "style_gate": style,
        "reference": ref,
        "judge": {
            "status": "PENDING",
            "instruction": ("Show a vision model BOTH the generated image and reference. Ask: "
                            "'Ignoring art style, do these depict the SAME real place/building? "
                            "List matching structural features and any conflicts. JSON "
                            "{same_place:bool, confidence:0-1, matches:[], conflicts:[]}.' "
                            "Claude via the Read tool is the in-loop judge; Gemini 2.5 Flash a cheap 2nd vote."),
        },
        "verdict": "STYLE_PASS" if style["pass"] else "STYLE_FAIL",
    }
    out = pathlib.Path(args.image).with_suffix(pathlib.Path(args.image).suffix + ".verify.json")
    out.write_text(json.dumps(bundle, indent=2))

    print(f"PLACE: {place['name']}  ({place['id']}, year {place.get('clue_year')})")
    print(f"STYLE GATE: {'PASS' if style['pass'] else 'FAIL'}  "
          f"colors~{style['approx_unique_colors']} block~{style['dominant_block_px']}px "
          f"blockiness={style['blockiness_0_1']}")
    print(f"REFERENCE: {ref.get('status')}"
          + (f"  -> {ref.get('reference_path')}" if ref.get('reference_path') else ""))
    print(f"JUDGE: PENDING — review generated vs reference with a vision model (same-place?).")
    print(f"bundle -> {out}")

if __name__ == "__main__":
    main()

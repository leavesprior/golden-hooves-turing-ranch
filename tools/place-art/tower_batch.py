#!/usr/bin/env python3
"""
Tower overnight place-art batch. Generates many 64-bit candidates per REAL place
(historical-photo img2img where available, Google-Maps-ref img2img otherwise,
txt2img as last resort), pixel-downscales, style-gates each, and saves them
organized for best-of selection. Runs in ROUNDS to keep the GPU busy all night.

Run on Tower (in ~/ComfyUI/venv) with ComfyUI up on :8188:
  cd ~/place-art && ~/ComfyUI/venv/bin/python tower_batch.py
Output: ~/place-art-batch/<place_id>/cand_*.png + results.json (per-candidate style-gate)
"""
import json, os, sys, time, io, shutil, urllib.request, urllib.parse, pathlib
from PIL import Image
import numpy as np

HERE = pathlib.Path(__file__).parent
COMFY = "http://127.0.0.1:8188"
COMFY_INPUT = pathlib.Path(os.path.expanduser("~/ComfyUI/input"))
OUT = pathlib.Path(os.path.expanduser("~/place-art-batch"))
MAPS = HERE / "refs" / "maps"
HISTDIR = HERE / "refs" / "hist"
PLACES = json.loads((HERE / "places.json").read_text())["places"]
NEG = "blurry, jpeg artifacts, text, watermark, signature, modern, cars, power lines, people, deformed, ugly"
AGED = "weathered aged period photograph impression, faded sepia-tinted tones, soft vignette, 1860s mood"
MAX_MINUTES = int(os.environ.get("MAX_MINUTES", "420"))  # wall-clock budget — fills the night, then stops
SEEDS_PER = int(os.environ.get("SEEDS_PER", "2"))        # seeds per (place,denoise) per round
# Maps-ref filename aliases (file -> place id)
MAP_ALIAS = {"murphys_hotel": "murphys"}

def base_wf(prompt, seed):
    return {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "10": {"class_type": "LoraLoader", "inputs": {"lora_name": "pixel-art-xl.safetensors",
               "strength_model": 1.0, "strength_clip": 1.0, "model": ["4", 0], "clip": ["4", 1]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["10", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["10", 1]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "bobr", "images": ["8", 0]}},
    }

def wf_txt2img(prompt, seed):
    w = base_wf(prompt, seed)
    w["5"] = {"class_type": "EmptyLatentImage", "inputs": {"width": 1152, "height": 896, "batch_size": 1}}
    w["3"] = {"class_type": "KSampler", "inputs": {"seed": seed, "steps": 28, "cfg": 7.0,
              "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0,
              "model": ["10", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}}
    return w

def wf_i2i(prompt, seed, ref_name, denoise):
    w = base_wf(prompt, seed)
    w["11"] = {"class_type": "LoadImage", "inputs": {"image": ref_name}}
    w["12"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["11", 0], "vae": ["4", 2]}}
    w["3"] = {"class_type": "KSampler", "inputs": {"seed": seed, "steps": 28, "cfg": 7.0,
              "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise,
              "model": ["10", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["12", 0]}}
    return w

def post(path, obj):
    req = urllib.request.Request(COMFY + path, data=json.dumps(obj).encode(),
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

def get(path):
    return urllib.request.urlopen(COMFY + path, timeout=600).read()

def pixelize(png_bytes, out_path):
    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    small = img.resize((160, 120), Image.BILINEAR)
    q = small.quantize(colors=64, method=Image.MEDIANCUT)
    q.convert("RGB").resize((640, 480), Image.NEAREST).save(out_path)

def style_gate(path):
    a = np.asarray(Image.open(path).convert("RGB"))
    q = (a // 16).reshape(-1, 3)
    colors = len({tuple(c) for c in q[:: max(1, len(q) // 60000)]})
    eq = np.all(a[:, 1:] == a[:, :-1], axis=2)
    blockiness = float(eq.mean())
    return (colors <= 512 and blockiness >= 0.40), colors, round(blockiness, 3)

def download(url, dest):
    if dest.exists() and dest.stat().st_size > 0:
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=60).read()
        dest.write_bytes(data)
        return dest.stat().st_size > 1000
    except Exception as e:
        print(f"  download failed {url}: {e}")
        return False

def crop_margins(src, dst, frac=0.06):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    m = int(min(w, h) * frac)
    im.crop((m, m, w - m, h - m)).save(dst)

def prep_ref(place):
    """Return (comfy_input_name, denoise_list) for the best available reference."""
    pid = place["id"]
    hist = place.get("historical_photo")
    if hist:
        HISTDIR.mkdir(parents=True, exist_ok=True)
        raw = HISTDIR / f"{pid}.jpg"
        if download(hist, raw):
            crop = HISTDIR / f"{pid}_crop.jpg"
            try:
                crop_margins(raw, crop)
            except Exception:
                crop = raw
            name = f"bobr_{pid}_hist.jpg"
            shutil.copy(crop, COMFY_INPUT / name)
            return name, [0.42, 0.5, 0.58]
    # maps ref?
    for fn in (pid, *[k for k, v in MAP_ALIAS.items() if v == pid]):
        mp = MAPS / f"{fn}.png"
        if mp.exists():
            name = f"bobr_{pid}_map.png"
            shutil.copy(mp, COMFY_INPUT / name)
            return name, [0.58, 0.66]   # modern -> period needs more repaint
    return None, [None]

def build_prompt(place):
    return (f"classic 16-bit pixel-art game scene, {place['prompt']}, "
            f"1850s California Gold Country, year {place.get('year')}, detailed pixel art, "
            f"no text, {AGED}")

def render(prompt, seed, ref_name, denoise, out_path):
    wf = wf_i2i(prompt, seed, ref_name, denoise) if ref_name and denoise else wf_txt2img(prompt, seed)
    pid = post("/prompt", {"prompt": wf})["prompt_id"]
    meta = None
    for _ in range(300):
        time.sleep(2)
        hist = json.loads(get(f"/history/{pid}"))
        if pid in hist:
            for node in hist[pid].get("outputs", {}).values():
                if node.get("images"):
                    meta = node["images"][0]; break
            if meta: break
    if not meta:
        return None
    qs = urllib.parse.urlencode({"filename": meta["filename"], "subfolder": meta.get("subfolder", ""),
                                 "type": meta.get("type", "output")})
    pixelize(get(f"/view?{qs}"), out_path)
    return style_gate(out_path)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    COMFY_INPUT.mkdir(parents=True, exist_ok=True)
    results = []
    t0 = time.time()
    total = 0
    r = 0
    while (time.time() - t0) / 60 < MAX_MINUTES and r < 24:   # time-budgeted; hard cap 24 rounds
        for place in PLACES:
            pid = place["id"]
            pdir = OUT / pid
            pdir.mkdir(parents=True, exist_ok=True)
            ref_name, denoises = prep_ref(place)
            prompt = build_prompt(place)
            ref_kind = "hist" if (ref_name and "hist" in ref_name) else ("map" if ref_name else "txt2img")
            for d in denoises:
                for k in range(SEEDS_PER):
                    seed = int(place.get("year") or 1855) + r * 1000 + k * 97 + (int(d * 100) if d else 0)
                    out = pdir / f"cand_r{r}_{ref_kind}_d{d}_s{seed}.png"
                    if out.exists():
                        continue
                    try:
                        res = render(prompt, seed, ref_name, d, out)
                    except Exception as e:
                        print(f"  [{pid}] render error: {e}"); res = None
                    total += 1
                    if res:
                        ok, colors, blk = res
                        results.append({"place": pid, "file": str(out), "ref": ref_kind,
                                        "denoise": d, "seed": seed, "style_pass": ok,
                                        "colors": colors, "blockiness": blk})
                        print(f"[{total}] {pid} {ref_kind} d={d} -> {'PASS' if ok else 'fail'} "
                              f"(c{colors} b{blk}) {time.time()-t0:.0f}s", flush=True)
                    (OUT / "results.json").write_text(json.dumps(results, indent=1))
        r += 1
        print(f"--- round {r} done, {len(results)} candidates, {(time.time()-t0)/60:.0f} min elapsed ---", flush=True)
    npass = sum(1 for x in results if x["style_pass"])
    print(f"DONE: {len(results)} candidates ({npass} style-pass) across {len(PLACES)} places, "
          f"{r} rounds, {(time.time()-t0)/60:.0f} min")

if __name__ == "__main__":
    main()

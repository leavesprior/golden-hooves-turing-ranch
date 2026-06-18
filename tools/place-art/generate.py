#!/usr/bin/env python3
"""
generate.py — generate a 64-bit place picture via local ComfyUI (SDXL + Pixel-Art
LoRA), then pixel-downscale to a crisp 640x480 asset.

  python3 generate.py --place welcome_gate --out out/town-welcome_gate.png
  python3 generate.py --prompt "a stone courthouse..." --out x.png --seed 42

Needs ComfyUI running:  ./venv/bin/python main.py --listen 127.0.0.1 --port 8188
(Place-accuracy via ControlNet-from-StreetView is a later iteration; this validates
the generation + 64-bit-style half. See README.)
"""
import argparse, json, sys, time, shutil, urllib.request, urllib.parse, pathlib, io

HERE = pathlib.Path(__file__).parent
COMFY = "http://127.0.0.1:8188"
COMFY_INPUT = pathlib.Path("/media/granny/larger SSD/ComfyUI/input")
PLACES = {p["id"]: p for p in json.loads((HERE / "places.json").read_text())["places"]}

NEG = "blurry, jpeg artifacts, text, watermark, signature, modern, cars, power lines, people, deformed, ugly"
# "aged photo impression" — keeps the 64-bit look but reads as a faded period plate.
AGED = "weathered aged period photograph impression, faded sepia-tinted tones, soft vignette, 1860s daguerreotype mood"

def workflow(prompt, seed):
    return {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "10": {"class_type": "LoraLoader", "inputs": {
            "lora_name": "pixel-art-xl.safetensors", "strength_model": 1.0, "strength_clip": 1.0,
            "model": ["4", 0], "clip": ["4", 1]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["10", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["10", 1]}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1152, "height": 896, "batch_size": 1}},
        "3": {"class_type": "KSampler", "inputs": {
            "seed": seed, "steps": 28, "cfg": 7.0, "sampler_name": "dpmpp_2m", "scheduler": "karras",
            "denoise": 1.0, "model": ["10", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "bobr_place", "images": ["8", 0]}},
    }

def workflow_i2i(prompt, seed, ref_name, denoise):
    # img2img — preserves the composition/structure of the REFERENCE (a historical
    # photo or a Google Street View grab) so the output is recognizably THAT place.
    return {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "10": {"class_type": "LoraLoader", "inputs": {
            "lora_name": "pixel-art-xl.safetensors", "strength_model": 1.0, "strength_clip": 1.0,
            "model": ["4", 0], "clip": ["4", 1]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["10", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["10", 1]}},
        "11": {"class_type": "LoadImage", "inputs": {"image": ref_name}},
        "12": {"class_type": "VAEEncode", "inputs": {"pixels": ["11", 0], "vae": ["4", 2]}},
        "3": {"class_type": "KSampler", "inputs": {
            "seed": seed, "steps": 28, "cfg": 7.0, "sampler_name": "dpmpp_2m", "scheduler": "karras",
            "denoise": denoise, "model": ["10", 0], "positive": ["6", 0], "negative": ["7", 0],
            "latent_image": ["12", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "bobr_place", "images": ["8", 0]}},
    }

def _post(path, obj):
    req = urllib.request.Request(COMFY + path, data=json.dumps(obj).encode(),
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

def _get(path):
    return urllib.request.urlopen(COMFY + path, timeout=600).read()

def pixelize(png_bytes, out_path, small=(320, 240), colors=96):
    # Higher-res "Preset A" (2026-06-17, Leif: "more pixels / better quality"):
    # 320x240 intermediate = 4x the distinct pixels of the old 160x120; 96-color
    # palette (was 64); BOX averaging (cleaner downscale than BILINEAR); NEAREST
    # up to 640x480 => 2px blocks. More detail, still crisp pixel art (measured
    # blockiness ~0.81, far above the 0.40 style-gate floor; palette far under 512).
    from PIL import Image
    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    small_img = img.resize(small, Image.BOX)                       # average down
    q = small_img.quantize(colors=colors, method=Image.MEDIANCUT)  # tight palette
    final = q.convert("RGB").resize((640, 480), Image.NEAREST)     # crisp 2px blocks
    pathlib.Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--place"); ap.add_argument("--prompt"); ap.add_argument("--out", required=True)
    ap.add_argument("--seed", type=int, default=12345)
    ap.add_argument("--ref", help="reference image (historical photo / Street View grab) for img2img place-accuracy")
    ap.add_argument("--denoise", type=float, default=0.62, help="img2img strength (lower = closer to ref)")
    ap.add_argument("--aged", action="store_true", help="add aged period-photo impression")
    a = ap.parse_args()

    if a.place:
        p = PLACES.get(a.place)
        if not p: sys.exit(f"unknown place {a.place}")
        prompt = (f"classic 16-bit pixel-art game scene, {p['prompt']}, "
                  f"1850s California Gold Country, year {p.get('clue_year')}, "
                  f"warm sunset palette, detailed pixel art, no text")
    else:
        prompt = a.prompt or sys.exit("need --place or --prompt")
    if a.aged:
        prompt = f"{prompt}, {AGED}"

    # img2img if a reference is given (copy it into ComfyUI's input dir).
    wf = None
    if a.ref:
        ref_src = pathlib.Path(a.ref)
        if not ref_src.exists(): sys.exit(f"ref not found: {a.ref}")
        ref_name = f"bobr_ref_{a.place or 'x'}{ref_src.suffix}"
        COMFY_INPUT.mkdir(parents=True, exist_ok=True)
        shutil.copy(ref_src, COMFY_INPUT / ref_name)
        wf = workflow_i2i(prompt, a.seed, ref_name, a.denoise)
        print(f"img2img from ref {ref_src.name} (denoise {a.denoise})")
    else:
        wf = workflow(prompt, a.seed)

    print(f"prompt: {prompt[:90]}...")
    try:
        r = _post("/prompt", {"prompt": wf})
    except Exception as e:
        sys.exit(f"ComfyUI not reachable ({e}). Start it: ./venv/bin/python main.py --port 8188")
    pid = r["prompt_id"]
    print(f"queued {pid}; rendering (SDXL lowvram ~30-90s)...")

    img_meta = None
    for _ in range(240):
        time.sleep(2)
        hist = json.loads(_get(f"/history/{pid}"))
        if pid in hist:
            outs = hist[pid].get("outputs", {})
            for node in outs.values():
                if "images" in node and node["images"]:
                    img_meta = node["images"][0]; break
            if img_meta: break
    if not img_meta:
        sys.exit("timed out waiting for render")

    qs = urllib.parse.urlencode({"filename": img_meta["filename"],
                                 "subfolder": img_meta.get("subfolder", ""),
                                 "type": img_meta.get("type", "output")})
    png = _get(f"/view?{qs}")
    raw_out = str(pathlib.Path(a.out).with_suffix(".raw.png"))
    pathlib.Path(raw_out).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(raw_out).write_bytes(png)
    pixelize(png, a.out)
    print(f"raw 1152x896 -> {raw_out}")
    print(f"64-bit 640x480 -> {a.out}")
    print(f"verify:  python3 verify_place_art.py --image {a.out} --place {a.place or 'jackson'} --no-reference")

if __name__ == "__main__":
    main()

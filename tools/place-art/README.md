# Place-Art Pipeline — 64-bit pictures of REAL Gold Country places

Goal (Leif's tri-fold vision, 2026-06-14): every location of interest in the game
gets a **64-bit, 640×480 picture of that exact real place as it looked in the
clue's year**, researched from Google Maps + history, then **verified** to be the
same real place. Composited with an old-style pixel NPC + a JRPG dialogue box
carrying the dated historical clue (see `bobr_game_npc in game example.jpg` — the
"Welcome Gate, Location 1 of 14" reference frame).

Two halves: **GENERATE** (make the picture) and **VERIFY** (prove it's that place,
in that style). Verify is built here and working; generate is a documented setup.

---

## VERIFY (built — `verify_place_art.py`)

```
python3 verify_place_art.py --image out/town-jackson.png --place jackson
```
- **(B) Style gate**  local, free, deterministic. Confirms it's 64-bit pixel art
  (small palette + hard pixel edges). Validated: PASSes real pixel art, FAILs
  photos and storybook illustration. An image that fails here skips the place check.
- **(A) Place reference** — with `GOOGLE_MAPS_API_KEY` set, geocodes the place's
  address, does the FREE Street View *metadata* coverage check, then fetches a
  640×480 Street View reference next to the image.
- **The place-identity JUDGE is a vision LLM** — Claude via the Read tool (zero
  added API) is the in-loop judge; show it the generated image + the Street View
  reference and ask "same building, ignoring style?". Gemini 2.5 Flash (~$0.001/img)
  is a cheap automated 2nd vote. (CLIP cosine = optional confidence dial, not a gate.
  GeoCLIP and Cloud Vision landmark/web were researched and **dropped** — wrong tools
  for known-address, obscure, stylized imagery.)
- Output: prints a summary + writes `<image>.verify.json` (the judge bundle).

Per-image cost: style gate free; with Claude as judge, ~$0.007 (the Street View
fetch) — geocode/metadata are free-tier/free; cache references per address.

**1850s caveat:** present-day Street View may show an altered/demolished building.
The bundle supports an optional manually-sourced **historical photo** as the
reference channel; note which reference was used.

## GENERATE (setup — recommended, not yet installed)

Your **RTX 3080 Ti (12GB)** is greenfield. Recommended local stack:
- **ComfyUI** (headless, HTTP `/prompt` API → scriptable batch over `places.json`).
- **SDXL** base + **xinsir union ControlNet** (use the **MLSD** straight-line mode —
  built for architecture) conditioned on the Street View photo, so the output is
  recognizably *that* building. ControlNet weight ~0.5–0.7 (keep the structure, let
  it repaint to the period/style).
- **Pixel Art XL v1.1** LoRA (Nerijs, Civitai 120096) for the 64-bit look; no refiner.
- **PixelArt-Detector** tail: generate at **1152×896**, then 8× nearest-neighbor
  downscale + palette-quantize → integer up to **640×480** (this downscale, not the
  LoRA alone, sells the SNES look).
- Unload ollama first to free VRAM. Reserve **Flux + the "64Bit" LoRA** for the
  Tower (hero shots). Zero-setup fallback: **fal.ai `flux-general`** (ControlNet +
  pixel LoRA + img2img in one call); **Gemini Imagen** for reference-less interiors.

Flow per place: `places.json` → (research the real building, 1850s appearance) →
Street View ref → SDXL+ControlNet+PixelLoRA → 640×480 → `verify_place_art.py` →
Claude judges same-place → PASS → drop into `bobr-website/public/chase/town-{id}.png`
(the chase art slots pick it up automatically, no code change).

## Files
- `places.json` — the location manifest (id, real address, clue_year, prompt seed).
- `verify_place_art.py` — the style gate + Street View reference fetcher + judge bundle.
- Targets: `public/chase/town-{id}.png`, `public/chase/vane-poster.png`,
  `public/chase/verdict-{kind}.png` (wired with graceful fallbacks in the chase).

## Honest-grounding rule
Every depicted place is real and drawn truthfully. The **ranch land-history is
unresolved**: federal land patents show no 19th-c "Stanley" patent at West Point —
the documented large ranch families on that land were **Harris, Schaad, Greve,
Herbert, Porteous** (a real "Harris Ranch" the strongest "other"). Do NOT assert a
ranch name in clue text until Leif reconciles his recollection with the record.

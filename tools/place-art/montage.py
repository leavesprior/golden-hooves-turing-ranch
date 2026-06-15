#!/usr/bin/env python3
# Build a 3x3 contact sheet of candidate variants for a place, for quick best-of selection.
import sys, json, pathlib
from PIL import Image, ImageDraw
CAND = pathlib.Path(__file__).parent / "candidates"
GRID = CAND / "_grids"; GRID.mkdir(exist_ok=True)
place = sys.argv[1]
pdir = CAND / place
files = sorted(pdir.glob("*.png"))
# prefer a spread: hist/map img2img first, then txt2img; cap 9, sample evenly
hist = [f for f in files if "_hist_" in f.name]
mp   = [f for f in files if "_map_" in f.name]
txt  = [f for f in files if "txt2img" in f.name]
pick = (hist + mp + txt)
if len(pick) > 9:
    step = len(pick)/9
    pick = [pick[int(i*step)] for i in range(9)]
cols, rows = 3, 3
tw, th = 214, 160
sheet = Image.new("RGB", (cols*tw, rows*th+18*rows), "#222")
d = ImageDraw.Draw(sheet)
for i, f in enumerate(pick):
    im = Image.open(f).convert("RGB").resize((tw, th))
    x, y = (i%cols)*tw, (i//cols)*(th+18)
    sheet.paste(im, (x, y+18))
    d.text((x+2, y+4), f"{i}: {f.name[5:34]}", fill="#fc6")
out = GRID / f"{place}.png"
sheet.save(out)
print(f"{place}: {len(files)} cands -> grid {out} ({len(pick)} shown)")
for i,f in enumerate(pick): print(f"  [{i}] {f.name}")

#!/usr/bin/env python3
# Heuristic best-of pick per place + a montage of all selections for spot-check.
import json, pathlib, shutil
from PIL import Image, ImageDraw
HERE = pathlib.Path(__file__).parent
CAND = HERE / "candidates"
SEL = HERE / "selected"; SEL.mkdir(exist_ok=True)
PLACES = [p["id"] for p in json.loads((HERE/"places.json").read_text())["places"]]
# map refs that are real BUILDINGS (good to img2img) vs markers/aerial (prefer txt2img)
BUILDING_MAP = {"vol_st_george","sa_courthouse","mh_hotel_leger","murphys","nevada_city"}
def pick(place):
    pdir = CAND / place
    fs = sorted(pdir.glob("*.png"))
    if not fs: return None
    hist = [f for f in fs if "_hist_" in f.name]
    mp   = [f for f in fs if "_map_" in f.name]
    txt  = [f for f in fs if "txt2img" in f.name]
    def mid_d(lst, d):
        c = [f for f in lst if f"_d{d}_" in f.name] or lst
        return sorted(c)[0]
    if hist:                      return mid_d(hist, "0.5")
    if place in BUILDING_MAP and mp: return mid_d(mp, "0.58")
    if txt:                       return sorted(txt)[0]
    if mp:                        return sorted(mp)[0]
    return fs[0]
sel = {}
for p in PLACES:
    f = pick(p)
    if f:
        shutil.copy(f, SEL / f"{p}.png")
        sel[p] = f.name
# montage 6 cols
cols=6; tw,th=160,120; lab=16
rows=(len(sel)+cols-1)//cols
sheet=Image.new("RGB",(cols*tw, rows*(th+lab)),"#222"); d=ImageDraw.Draw(sheet)
for i,(p,_) in enumerate(sorted(sel.items())):
    im=Image.open(SEL/f"{p}.png").convert("RGB").resize((tw,th))
    x,y=(i%cols)*tw,(i//cols)*(th+lab)
    sheet.paste(im,(x,y+lab)); d.text((x+2,y+3),p[:22],fill="#fc6")
sheet.save(HERE/"selected_montage.png")
print(f"selected {len(sel)} places -> selected/ + selected_montage.png")

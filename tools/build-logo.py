"""Rebuild the CTC logo from images/logo-source.png.

The shipped logo was a hard colour-key of a screenshot: no anti-aliasing, a
white halo left over from the removed background, and a stray dark-green rule
above "ennis" that belonged to whatever the screenshot was taken from.

  1. repair  — flood-fill the artifact's connected component and reconstruct
               what was behind it (the brass arc) by diffusion, so the arc is
               continuous rather than patched with a flat colour.
  2. rebuild — supersample, assign each pixel to its nearest of the three source
               colours (white / brass / navy). No hue-or-value threshold: that
               discards anti-aliased edge pixels, which erodes the serifs.
  3. sharpen — steepen the alpha coverage ramp. This narrows the transition band
               without moving any outline, so it cannot alter a letterform.

Outputs images/logo.png. There was briefly a bone-ink variant for a transparent
nav over the dark hero; the wordmark is a low-resolution raster and did not hold
up light-on-dark, so the navy mark is used everywhere and the nav carries a
light bar instead.
"""
from PIL import Image
from collections import deque

SRC   = "images/logo-source.png"
GREEN = (49, 95, 54)          # the artifact; appears nowhere else in the brand
WHITE, BRASS, NAVY = (255,255,255), (246,199,51), (28,68,89)
SUPERSAMPLE = 8
SHARPEN     = 2.1             # alpha contrast; higher re-introduces stair-steps

def d2(a, b): return (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2

im = Image.open(SRC).convert("RGBA")
flat = Image.new("RGB", im.size, WHITE); flat.paste(im, (0,0), im)
px = flat.load(); W, H = im.size

# ---- 1. repair -----------------------------------------------------------
seeds = [(x,y) for y in range(205,222) for x in range(140,225) if d2(px[x,y], GREEN) < 30**2]
seen = set(seeds); q = deque(seeds)
while q:
    x, y = q.popleft()
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            n = (x+dx, y+dy)
            if 0 <= n[0] < W and 0 <= n[1] < H and n not in seen and d2(px[n], GREEN) < 52**2:
                seen.add(n); q.append(n)
# the rounded cap is letter-coloured but spatially isolated from the type below
for y in range(207, 220):
    for x in range(200, 214):
        c = px[x,y]
        if not (c[0] > 238 and c[1] > 238 and c[2] > 238): seen.add((x,y))
mask = set()
for (x,y) in seen:                                   # grow 1px for the halo
    for dx in (-1,0,1):
        for dy in (-1,0,1): mask.add((x+dx, y+dy))
assert 300 < len(mask) < 600, f"artifact mask looks wrong: {len(mask)}"

buf = {(x,y): list(px[x,y]) for x in range(W) for y in range(H)}
todo = sorted(mask)
for _ in range(600):
    for (x,y) in todo:
        acc = [0,0,0]; k = 0
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            n = (x+dx, y+dy)
            if 0 <= n[0] < W and 0 <= n[1] < H:
                v = buf[n]; acc[0]+=v[0]; acc[1]+=v[1]; acc[2]+=v[2]; k += 1
        if k: buf[(x,y)] = [acc[0]//k, acc[1]//k, acc[2]//k]
repaired = Image.new("RGB", im.size); rp = repaired.load()
for x in range(W):
    for y in range(H): rp[x,y] = tuple(buf[(x,y)])

# ---- 2. rebuild ----------------------------------------------------------
S = SUPERSAMPLE
big = repaired.resize((W*S, H*S), Image.LANCZOS); bp = big.load()
ink = Image.new("L", big.size, 0); arc = Image.new("L", big.size, 0)
ip, ap = ink.load(), arc.load()
for y in range(big.height):
    for x in range(big.width):
        c = bp[x,y]; dw, db, dn = d2(c,WHITE), d2(c,BRASS), d2(c,NAVY)
        if dn <= dw and dn <= db: ip[x,y] = 255
        elif db <= dw:            ap[x,y] = 255

# ---- 3. sharpen + composite ---------------------------------------------
curve = [max(0, min(255, round((v/255 - 0.5)*SHARPEN*255 + 127.5))) for v in range(256)]
ia = ink.resize(im.size, Image.LANCZOS).point(curve).load()
aa = arc.resize(im.size, Image.LANCZOS).point(curve).load()

def compose(ink_rgb, out):
    canvas = Image.new("RGBA", im.size); cp = canvas.load()
    for y in range(H):
        for x in range(W):
            i, a = ia[x,y], aa[x,y]; tot = i + a
            if tot < 3: cp[x,y] = (0,0,0,0); continue
            # premultiplied union: a letter crossing the arc leaves no gap for
            # the page to show through, which otherwise reads as a dark rim
            cp[x,y] = ((ink_rgb[0]*i + BRASS[0]*a)//tot,
                       (ink_rgb[1]*i + BRASS[1]*a)//tot,
                       (ink_rgb[2]*i + BRASS[2]*a)//tot, min(255, tot))
    canvas.save(out); print("wrote", out)

compose(NAVY, "images/logo.png")

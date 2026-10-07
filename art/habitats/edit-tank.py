# Scene edit for the Tier 2 tank. The painted tank has only ~85px between the top frame and the water,
# far too little for an upright Pebble with his face above water and his belly in it. So:
#   (1) raise the top frame by F px, (2) lower the water surface by D px (the painted surface band,
#   including its ripples, moves down; the plant tops move down with it so their painted surface
#   crossings stay intact), and fill the newly exposed glass with the room seen through it.
import os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
F = int(os.environ.get('F', 48)); D = int(os.environ.get('D', 54))
S = np.asarray(Image.open('../tank.jpg').convert('RGB')).astype(np.float32) / 255
H, W = S.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]
r, g, b = S[..., 0], S[..., 1], S[..., 2]
lumS = S.mean(2)
X0, X1 = 252, 1018            # frame extent (incl. overhang)
G0, G1 = 262, 1006            # glass span
FR0, FR1 = 184, 253           # frame rows (back bar top highlight .. front bar bottom outline)
SURF0, MEN = 315, 360         # painted back surface line, painted front meniscus line
BAND1 = MEN + 8               # bottom of the moved band

# aquatic plant mask (greens), not the window trees / potted plant seen through the glass
plant = (g > b + 0.02) & (g > r + 0.06) & (xx > 280) & (xx < 985) & (yy > 215) & (yy < 470)
plant &= ~((xx > 860) & (yy < 330))
plant = ndi.binary_opening(plant, iterations=1)
plant = ndi.binary_fill_holes(ndi.binary_closing(plant, iterations=2))
near = ndi.binary_dilation(plant, iterations=3)
dark = (lumS < 0.40) & near & (yy > 254) & (yy < 470)          # the leaves' dark outlines
plantm = plant | dark
plantA = ndi.gaussian_filter(plantm.astype(np.float32), 0.6)
wide = ndi.binary_dilation(plantm, iterations=3)

# background with the plants removed (horizontal interpolation per row), for the rows we resample
clean = S.copy()
for y in range(254, 430):
    m = wide[y, G0:G1]
    if m.any() and (~m).sum() > 10:
        xs = np.arange(G0, G1)
        for c in range(3):
            clean[y, G0:G1, c][m] = np.interp(xs[m], xs[~m], S[y, G0:G1, c][~m])

out = S.copy()
cols = slice(X0, X1)
# 1) frame up by F (only frame pixels: the top outline is a trapezoid with inset back corners)
blk = S[FR0:FR1 + 1, cols]
fm = ndi.binary_fill_holes(ndi.binary_closing(lumS[FR0:FR1 + 1, cols] < 0.42, iterations=3))
fm = ndi.binary_dilation(fm, iterations=2)
for x in range(fm.shape[1]):
    c = np.nonzero(fm[:, x])[0]
    if len(c): fm[c.min():c.max() + 1, x] = True
fmf = ndi.gaussian_filter(fm.astype(np.float32), 0.7)[..., None]
out[FR0 - F:FR1 - F + 1, cols] = blk * fmf + out[FR0 - F:FR1 - F + 1, cols] * (1 - fmf)
# 2) glass newly exposed under the frame: blend from the room just above the old frame to the glass below it
top = S[FR0 - 2, cols]; bot = clean[FR1 + 3, cols]
for y in range(FR1 - F + 1, FR1 + 3):
    t = (y - (FR1 - F + 1)) / max(1, (FR1 + 3) - (FR1 - F + 1))
    t = t * t * (3 - 2 * t)
    out[y, cols] = top * (1 - t) + bot * t
for x in list(range(X0, G0 + 14)) + list(range(G1 - 14, X1)):   # glass side posts continue straight up
    out[FR1 - F + 1:FR1 + 3, x] = clean[FR1 + 3:FR1 + 12, x].mean(0)
out[FR1 + 3:285, cols] = clean[FR1 + 3:285, cols]     # painted plant tips here move down with the water
# 3) above-water glass extended: stretch clean rows [285, SURF0-2] over [285, SURF0+D+2]
src0, src1 = 285, SURF0 - 2
dst0, dst1 = 285, SURF0 + D + 2
for y in range(dst0, dst1 + 1):
    sy = src0 + (y - dst0) * (src1 - src0) / (dst1 - dst0)
    y0 = int(sy); f = sy - y0
    out[y, cols] = clean[y0, cols] * (1 - f) + clean[min(y0 + 1, src1), cols] * f
# 4) painted surface band (back line .. just below the meniscus, ripples included) moved down by D
b0 = SURF0 - 4
for y in range(b0, BAND1 + 1):
    a = np.clip((y - b0) / 5, 0, 1)
    out[y + D, cols] = clean[y, cols] * a + out[y + D, cols] * (1 - a)
for x in list(range(X0, G0 + 12)) + list(range(G1 - 12, X1)):   # side posts don't move with the water
    out[SURF0 + 2:BAND1 + D, x] = clean[SURF0 - 6:SURF0 - 2, x].mean(0)
# 5) plants: everything above the old band bottom moves down by D with the water (tops get a bit shorter),
#    their painted waterline crossings stay attached to the moved surface; below that they stay put.
low = (yy >= BAND1 + D - 8)
keep = plantA * low
out = out * (1 - keep[..., None]) + S * keep[..., None]
shA = np.zeros((H, W), np.float32); shC = np.zeros_like(S)
shA[215 + D:BAND1 + D + 1] = plantA[215:BAND1 + 1]; shC[215 + D:BAND1 + D + 1] = S[215:BAND1 + 1]
fade = np.clip((BAND1 + D + 1 - yy) / 6, 0, 1)        # soft seam where moved tops meet the kept stems
shA *= fade
# kept stems right under the seam blend into the moved part
out = out * (1 - shA[..., None]) + shC * shA[..., None]
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save('tank-edited.png')
print('frame bottom now', FR1 - F, 'surface back', SURF0 + D, 'meniscus', MEN + D)

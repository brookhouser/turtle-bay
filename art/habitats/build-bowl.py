import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

H, W = 720, 1280
S = np.asarray(Image.open('scene.jpg').convert('RGB')).astype(np.float32) / 255
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
lum = S @ np.array([0.3, 0.59, 0.11], np.float32)

# ---- placement (matches the app: turtle sprite and nest share one 1280x720 frame, here scaled) ----
import os
CX = 600
BASE = float(os.environ.get('BASE', 502)); SCALE = float(os.environ.get('SCALE', 0.55))
WL = float(os.environ.get('WL', 371)); OUT = os.environ.get('OUT', 'v2')          # sprite x-center, sprite bottom row, scale
SPR_CX, SPR_BOTTOM = 640, 663

def place(path):
    t = Image.open(path).convert('RGBA')
    w, h = int(round(1280 * SCALE)), int(round(720 * SCALE))
    t = t.resize((w, h), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ox = int(round(CX - SPR_CX * SCALE)); oy = int(round(BASE - SPR_BOTTOM * SCALE))
    global PLACED; PLACED = (ox, oy, w, h)
    canvas.alpha_composite(t, (ox, oy))
    return np.asarray(canvas).astype(np.float32) / 255

def smooth(m, r):
    return ndi.gaussian_filter(m.astype(np.float32), r)

def band_line(y_of_x, x0, x1, sigma, peak):
    """alpha profile around a curve y(x), soft gaussian across."""
    yc = y_of_x(xx)
    a = peak * np.exp(-0.5 * ((yy - yc) / sigma) ** 2)
    a[(xx < x0) | (xx > x1)] = 0
    return a

# ---- bowl geometry (hand-tuned, verified on overlays) ----
bowl = (((xx - 613) / 318) ** 2 + ((yy - 405) / 238) ** 2 <= 1) & (yy >= 215)

# meniscus: front edge of the water surface on the front glass (dark line near y~375-382)
cols = np.arange(W)
men_y = np.full(W, np.nan)
for x in range(300, 930):
    seg = lum[362:392, x]
    men_y[x] = 362 + int(np.argmin(seg))
xs = np.arange(300, 930)
men_fit = np.polyval(np.polyfit(xs, men_y[300:930], 2), cols)
# front lip of the rim (dark outline near y~224-232)
lip_y = np.full(W, np.nan)
for x in range(330, 900):
    seg = lum[215:246, x]
    lip_y[x] = 215 + int(np.argmin(seg))
xs2 = np.arange(330, 900)
lip_fit = np.polyval(np.polyfit(xs2, lip_y[330:900], 2), cols)

# waterline on the turtle: water surface plane at the rock-center depth, slight smile (body front is closer)
def water_y(x):
    return WL + 4 * np.clip(1 - ((x - CX) / 120) ** 2, 0, 1)

# rock top front edge (where the slab's top surface turns into its side)
def rock_edge(x):
    e = 500 - 19.5 * ((x - 600) / 130) ** 2
    return np.where((x > 462) & (x < 738), e, 476)

# ---- foreground: opaque scene pixels that sit in front of the turtle ----
fg = bowl & (yy >= rock_edge(xx) - 2)
g = S[..., 1]; r = S[..., 0]; b = S[..., 2]
plant = (g > b + 0.04) & (g > r + 0.02) & (xx > 700) & (xx < 880) & (yy > 280) & (yy < 540)
plant = ndi.binary_opening(plant, iterations=1)
plant = ndi.binary_dilation(plant, iterations=2)
fgA = np.clip(smooth(fg | plant, 0.8), 0, 1)

# ---- front layer, built back-to-front, premultiplied ----
C = np.zeros((H, W, 3), np.float32); A = np.zeros((H, W), np.float32)
def over(color, alpha):
    global C, A
    alpha = np.clip(alpha, 0, 1)[..., None]
    col = color if np.ndim(color) == 3 else np.broadcast_to(np.array(color, np.float32), (H, W, 3))
    C[:] = col * alpha + C * (1 - alpha)
    A[:] = alpha[..., 0] + A * (1 - alpha[..., 0])

under = bowl & (yy >= water_y(xx))

above_glass = bowl & (yy > lip_fit[xx.astype(int)] + 6) & (yy < water_y(xx))
# 1) faint glass film above the water
over((0.88, 0.96, 0.98), 0.035 * smooth(above_glass, 1.5))
# 2) water body: bluish, a bit grey, so the submerged turtle loses saturation
# water: a blue-grey haze. Light enough that the back layer can be compensated almost everywhere
# (even over the warm rock), strong enough to cool and desaturate whatever sits in the water.
WATER = (0.50, 0.70, 0.80)
Wc = np.array(WATER, np.float32)
feas = np.where(S > Wc, (1 - S) / (1 - Wc), S / Wc).min(axis=2)      # largest alpha the back can undo
feas = ndi.minimum_filter(smooth(np.clip(feas, 0, 1), 2.0), size=3)
a_water = np.clip(np.minimum(0.40, np.maximum(0.30, feas)), 0, 1)
over(WATER, a_water * smooth(under, 1.0))
# slightly deeper toward the bottom
over((0.42, 0.62, 0.72), 0.10 * np.clip((yy - 380) / 140, 0, 1) * under)
# 3) waterline on the turtle: bright thin meniscus plus soft scatter just below (limited to turtle span)
HALF = 215 * SCALE
span = np.clip(1 - (np.abs(xx - CX) - HALF) / 14, 0, 1)
over((0.95, 0.99, 1.0), band_line(lambda x: water_y(x) + 0.5, 0, W, 1.3, 0.80) * span)
over((0.80, 0.93, 0.97), band_line(lambda x: water_y(x) + 6, 0, W, 4.0, 0.22) * span)
# soft caustic light on the submerged part (compensated, so it only shows on the turtle)
rng = np.random.default_rng(3)
cz = np.zeros((H, W), np.float32)
for k in range(5):
    fx, fy, ph = rng.uniform(0.035, 0.06), rng.uniform(0.05, 0.09), rng.uniform(0, 6.28)
    ang = rng.uniform(0, 3.14)
    u = xx * np.cos(ang) + yy * np.sin(ang)
    v = -xx * np.sin(ang) + yy * np.cos(ang)
    cz += np.sin(u * fx + 2.0 * np.sin(v * fy + ph))
cz = np.clip((np.abs(cz) < 0.35).astype(np.float32), 0, 1)
cz = smooth(cz, 1.2) * np.clip((yy - water_y(xx) - 6) / 25, 0, 1) * np.clip((BASE - 8 - yy) / 40, 0, 1) * span
over((0.85, 0.97, 1.0), 0.16 * cz)
COMP_C, COMP_A = C.copy(), A.copy()   # everything so far is compensated in the back layer

# 4) glass highlight streaks on the front wall (visible on everything, like real glass)
def streak(x0, bow, width, peak, y0, y1):
    xc = x0 + bow * ((yy - 430) / 210) ** 2
    a = peak * np.exp(-0.5 * ((xx - xc) / width) ** 2)
    fade = np.clip((yy - y0) / 50, 0, 1) * np.clip((y1 - yy) / 60, 0, 1)
    return a * fade * bowl
CHIN = BASE - (663 - 414) * SCALE
streaks = np.clip(streak(512, -30, 9, 0.20, CHIN + 10, 600) + streak(534, -30, 2.2, 0.30, CHIN + 15, 560) + streak(706, 24, 6, 0.10, CHIN + 15, 560), 0, 1)
ring = np.zeros((H, W), np.float32)
for rx, ry, pk in [(HALF + 50, 12, 0.30), (HALF + 80, 15, 0.14)]:
    d = np.sqrt(((xx - CX) / rx) ** 2 + ((yy - (WL + 1)) / ry) ** 2)
    ring = np.maximum(ring, pk * np.exp(-0.5 * ((d - 1) * ry / 1.3) ** 2) * (yy >= WL + 1))
streaks = np.clip(streaks + ring * bowl, 0, 1)
over((1, 1, 1), streaks)
# 5) glass lines taken straight from the painting (exact on background): front lip and meniscus
lipband = np.exp(-0.5 * ((yy - (lip_fit[xx.astype(int)] + 2)) / 4.0) ** 2) * ((xx > 330) & (xx < 900))
over(S, 0.6 * lipband)
menband = np.exp(-0.5 * ((yy - (men_fit[xx.astype(int)] - 1.5)) / 3.0) ** 2) * ((xx > 300) & (xx < 930))
over(S, 0.85 * menband)
# 6) foreground pebbles, rock lip and plant
over(S, fgA)

# ---- back layer: compensate so that back + front (without turtle) == painting (+ glass streaks) ----
target = S * (1 - streaks[..., None]) + streaks[..., None]
back = target.copy()
m = A < 0.97
back[m] = (target[m] - C[m]) / (1 - A[m])[..., None]
back = np.clip(back, 0, 1)
back[~m] = S[~m]


# contact shadow on the rock top under the turtle (part of the back layer, he always sits here)
sh = 0.55 * np.exp(-0.5 * (((xx - CX) / 135) ** 2 + ((yy - (BASE + 1)) / 7) ** 2))
sh += 0.25 * np.exp(-0.5 * (((xx - CX) / 165) ** 2 + ((yy - (BASE - 4)) / 14) ** 2))
sh = np.clip(sh, 0, 0.7) * (yy < rock_edge(xx) + 3)
back = back * (1 - sh[..., None]) + np.array([0.20, 0.24, 0.22]) * sh[..., None]

def save_rgb(arr, p):
    Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8)).save(p)

frontA = np.clip(A, 0, 1)
front_rgb = np.where(frontA[..., None] > 1e-4, C / np.maximum(frontA, 1e-4)[..., None], 0)
front = np.dstack([np.clip(front_rgb, 0, 1), frontA])
Image.fromarray((front * 255 + 0.5).astype(np.uint8), 'RGBA').save(f'front-{OUT}.png')
save_rgb(back, f'back-{OUT}.png')

def composite(sprite, out):
    t = place(sprite)
    comp = back * (1 - t[..., 3:]) + t[..., :3] * t[..., 3:]
    comp = comp * (1 - frontA[..., None]) + C
    save_rgb(comp, out)

composite('/workspace/tb-art/public/sprites/turtle-idle.png', f'mock-{OUT}.png')
composite('/workspace/tb-art/public/sprites/turtle-sad.png', f'mock-sad-{OUT}.png')
print('placed', PLACED, 'eye top y', BASE - (663 - 202) * SCALE, 'brow top y', BASE - (663 - 165) * SCALE, 'mouth y', BASE - (663 - 308) * SCALE, 'chin', CHIN, 'lip', lip_fit[600])
# sanity: no-turtle reconstruction error vs target
recon = back * (1 - frontA[..., None]) + C
print('max recon err (no shadow area):', float(np.abs(recon - target)[sh < 0.01].max()), 'mean', float(np.abs(recon - target).mean()))
print('lip fit at 600:', lip_fit[600], 'men fit at 600:', men_fit[600])

# Tier 2 Garden tank: back/front layers + composites, same approach as habitat-bowl-build-v2.py.
# Input: tank-edited.png (painted tank with frame raised 48px and water lowered 54px, see edit_tank.py).
import os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

H, W = 720, 1280
S = np.asarray(Image.open('tank-edited.png').convert('RGB')).astype(np.float32) / 255
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
lum = S @ np.array([0.3, 0.59, 0.11], np.float32)

CX = float(os.environ.get('CX', 615))
BASE = float(os.environ.get('BASE', 496)); SCALE = float(os.environ.get('SCALE', 0.45))
WL = float(os.environ.get('WL', 396)); OUT = os.environ.get('OUT', 'a')
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

def band_line(y_of_x, sigma, peak):
    yc = y_of_x(xx)
    return peak * np.exp(-0.5 * ((yy - yc) / sigma) ** 2)

# ---- tank geometry (edited scene) ----
G0, G1 = 266, 1002                 # inside the glass side posts
FRAME_BOTTOM = 205                 # front top bar bottom outline after the edit
SAND_FRONT = 588                   # bottom frame bar top
X0, X1 = 252, 1018
glass = (xx > G0) & (xx < G1) & (yy > FRAME_BOTTOM + 1) & (yy < SAND_FRONT)
# front meniscus (dark line ~414 after the edit)
cols = np.arange(W)
men = np.array([404 + int(np.argmin(lum[404:425, x])) for x in range(290, 990)], np.float32)
men_fit = np.polyval(np.polyfit(np.arange(290, 990), men, 1), cols)

def water_y(x):
    return WL + 4 * np.clip(1 - ((x - CX) / 120) ** 2, 0, 1)

# rock top front edge (slab top turns into its side), measured on the painting
def rock_edge(x):
    e = 502 - 24 * ((x - 608) / 100) ** 2
    return np.where((x > 505) & (x < 735), e, 476)

# ---- foreground in front of the turtle: rock lip + sand + front pebbles + bottom bar; front top bar ----
fg = (xx >= X0) & (xx <= X1) & (yy >= rock_edge(xx) - 2) & (yy < 640)
topbar = (xx >= X0) & (xx <= X1) & (yy >= FRAME_BOTTOM - 38) & (yy <= FRAME_BOTTOM + 1) & (lum < 0.5)
topbar = ndi.binary_closing(topbar, iterations=2)
fgA = np.clip(smooth(fg | topbar, 0.8), 0, 1)

C = np.zeros((H, W, 3), np.float32); A = np.zeros((H, W), np.float32)
def over(color, alpha):
    global C, A
    alpha = np.clip(alpha, 0, 1)[..., None]
    col = color if np.ndim(color) == 3 else np.broadcast_to(np.array(color, np.float32), (H, W, 3))
    C[:] = col * alpha + C * (1 - alpha)
    A[:] = alpha[..., 0] + A * (1 - alpha[..., 0])

under = glass & (yy >= water_y(xx))
above_glass = glass & (yy < water_y(xx))
over((0.88, 0.96, 0.98), 0.035 * smooth(above_glass, 1.5))
WATER = (0.50, 0.70, 0.80)
Wc = np.array(WATER, np.float32)
feas = np.where(S > Wc, (1 - S) / (1 - Wc), S / Wc).min(axis=2)
feas = ndi.minimum_filter(smooth(np.clip(feas, 0, 1), 2.0), size=3)
# full-strength water only around his pose; elsewhere never more than the back layer can undo,
# so the back layer stays faithful to the painting (plants keep their colour)
nearT = np.clip(smooth((np.abs(xx - CX) < 250 * SCALE) & (yy < BASE + 30), 12) * 1.6, 0, 1)
a_water = np.clip(np.minimum(0.40, np.maximum(0.30 * nearT, feas)), 0, 1)
over(WATER, a_water * smooth(under, 1.0))
over((0.42, 0.62, 0.72), 0.10 * np.clip((yy - WL) / 140, 0, 1) * under)
HALF = 215 * SCALE
span = np.clip(1 - (np.abs(xx - CX) - HALF) / 14, 0, 1)
over((0.95, 0.99, 1.0), band_line(lambda x: water_y(x) + 0.5, 1.3, 0.80) * span)
over((0.80, 0.93, 0.97), band_line(lambda x: water_y(x) + 6, 4.0, 0.22) * span)
rng = np.random.default_rng(3)
cz = np.zeros((H, W), np.float32)
for k in range(5):
    fx, fy, ph = rng.uniform(0.035, 0.06), rng.uniform(0.05, 0.09), rng.uniform(0, 6.28)
    ang = rng.uniform(0, 3.14)
    u = xx * np.cos(ang) + yy * np.sin(ang)
    v = -xx * np.sin(ang) + yy * np.cos(ang)
    cz += np.sin(u * fx + 2.0 * np.sin(v * fy + ph))
cz = (np.abs(cz) < 0.35).astype(np.float32)
cz = smooth(cz, 1.2) * np.clip((yy - water_y(xx) - 6) / 25, 0, 1) * np.clip((BASE - 8 - yy) / 40, 0, 1) * span
over((0.85, 0.97, 1.0), 0.16 * cz)

# glass highlight streaks on the flat front pane (slightly slanted), kept below his chin
def streak(x0, slant, width, peak, y0, y1):
    xc = x0 + slant * (yy - 400)
    a = peak * np.exp(-0.5 * ((xx - xc) / width) ** 2)
    fade = np.clip((yy - y0) / 50, 0, 1) * np.clip((y1 - yy) / 60, 0, 1)
    return a * fade * glass
CHIN = BASE - (663 - 414) * SCALE
streaks = np.clip(streak(CX - 62, -0.10, 8, 0.16, CHIN + 12, 600) + streak(CX - 44, -0.10, 2.2, 0.26, CHIN + 16, 580)
                  + streak(CX + 88, -0.10, 5, 0.08, CHIN + 16, 580), 0, 1)
ring = np.zeros((H, W), np.float32)
for rx, ry, pk in [(HALF + 50, 11, 0.30), (HALF + 80, 14, 0.14)]:
    d = np.sqrt(((xx - CX) / rx) ** 2 + ((yy - (WL + 1)) / ry) ** 2)
    ring = np.maximum(ring, pk * np.exp(-0.5 * ((d - 1) * ry / 1.3) ** 2) * (yy >= WL + 1))
streaks = np.clip(streaks + ring * glass, 0, 1)
over((1, 1, 1), streaks)
# the painted front meniscus (on the front glass) stays in front of him
menband = np.exp(-0.5 * ((yy - (men_fit[xx.astype(int)])) / 2.6) ** 2) * glass
over(S, 0.85 * menband)
over(S, fgA)

target = S * (1 - streaks[..., None]) + streaks[..., None]
back = target.copy()
m = A < 0.97
back[m] = (target[m] - C[m]) / (1 - A[m])[..., None]
back = np.clip(back, 0, 1)
back[~m] = S[~m]

# contact shadow on the (submerged) rock top
sh = 0.50 * np.exp(-0.5 * (((xx - CX) / (245 * SCALE)) ** 2 + ((yy - (BASE + 1)) / 6) ** 2))
sh += 0.22 * np.exp(-0.5 * (((xx - CX) / (300 * SCALE)) ** 2 + ((yy - (BASE - 4)) / 12) ** 2))
sh = np.clip(sh, 0, 0.65) * (yy < rock_edge(xx) + 3)
back = back * (1 - sh[..., None]) + np.array([0.16, 0.26, 0.28]) * sh[..., None]

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
print('placed', PLACED, 'tuft top', BASE - 628 * SCALE, 'dome top', BASE - 623 * SCALE, 'eye top', BASE - 461 * SCALE,
      'chin', CHIN, 'waterline sprite row', 663 - (BASE - WL) / SCALE, 'meniscus', men_fit[int(CX)], 'frame bottom', FRAME_BOTTOM)
recon = back * (1 - frontA[..., None]) + C
print('max recon err (no shadow):', float(np.abs(recon - target)[sh < 0.01].max()))

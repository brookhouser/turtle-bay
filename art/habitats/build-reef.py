# Tier 3 Reef bay: back/front layers + composites, same approach as habitat-bowl-build-v2.py.
# Scene edit: the painted ornate top bar sits only ~85px above the basking rock, so with the bar in front an
# upright Pebble at a readable size would have the bar across his face. The middle of the front top rail is
# dipped down (smooth curve, the top molding follows it) so it crosses him at the shoulders and his head is
# up in the open air under the lamp. Ornate end sections, lamp, water and rock are the painted pixels.
import os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

H, W = 720, 1280
S0 = np.asarray(Image.open('../reef.jpg').convert('RGB')).astype(np.float32) / 255
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

CX = float(os.environ.get('CX', 660))
BASE = float(os.environ.get('BASE', 330)); SCALE = float(os.environ.get('SCALE', 0.42))
OUT = os.environ.get('OUT', 'a')
RAIL = float(os.environ.get('RAIL', 214))          # top of the dipped rail
SPR_CX, SPR_BOTTOM = 640, 663
BAR_TOP = 153
D0, D1, RAMP = 505, 815, 72                         # flat dip span and ramp width

# ---------------- scene edit: dip the rail ----------------
lum0 = S0.mean(2)
bot = np.array([205 + int(np.argmax(lum0[205:262, x] > 0.45)) for x in range(W)])   # bar bottom per column
def dip_profile(x):
    t = np.clip(np.minimum((x - (D0 - RAMP)) / RAMP, ((D1 + RAMP) - x) / RAMP), 0, 1)
    t = t * t * (3 - 2 * t)
    return BAR_TOP + (RAIL - BAR_TOP) * t
S = S0.copy()
LIP = 14
for x in range(D0 - RAMP - 2, D1 + RAMP + 3):
    p = dip_profile(np.float32(x)); pi = int(np.floor(p)); fr = p - pi
    b = bot[x] - 1
    # room behind, where the bar used to be: blend from just above the bar to the glass just below it
    for y in range(BAR_TOP - 1, pi + 1):
        t = (y - (BAR_TOP - 1)) / max(1, (b + 3) - (BAR_TOP - 1))
        S[y, x] = S0[BAR_TOP - 3, x] * (1 - t) + S0[b + 3, x] * t
    # rail: top molding (copied from the painted top lip, following the curve), then the painted bottom edge
    for y in range(pi, b + 1):
        k = y - p
        if k < LIP:
            sy = BAR_TOP + max(k, 0)
            src = S0[int(sy), x] * (1 - fr) + S0[min(int(sy) + 1, BAR_TOP + LIP), x] * fr
            if k < 0: src = S[y, x] * (1 - (1 - fr)) + src * (1 - fr)    # anti-alias the top edge
        else:
            src = S0[max(y, b - 7), x] if y >= b - 7 else S0[b - 8, x]
        S[y, x] = src
Image.fromarray((np.clip(S, 0, 1) * 255 + 0.5).astype(np.uint8)).save('reef-edited.png')
lum = S @ np.array([0.3, 0.59, 0.11], np.float32)

# ---------------- placement ----------------
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

# ---------------- geometry ----------------
prof = dip_profile(xx)
bar = (xx >= 104) & (xx <= 1178) & (yy >= prof - 0.5) & (yy <= bot[xx.astype(int)]) & (yy < 262)
caps = (((xx < 250) & (xx >= 102)) | ((xx > 1070) & (xx <= 1180))) & (yy >= 140) & (yy < 262) & (lum < 0.33)
barA = np.clip(smooth(bar | ndi.binary_closing(caps, iterations=2), 0.6), 0, 1)
glass = (xx > 126) & (xx < 1154) & (yy > bot[xx.astype(int)]) & (yy < 545)
def rock_edge(x):                 # front edge of the rock's top surface
    e = 339 - 12 * ((x - 660) / 95) ** 2
    return np.where((x > 565) & (x < 755), e, 345)
fg = (xx >= 100) & (xx <= 1180) & (yy >= rock_edge(xx) - 2) & (yy < 650)
fgA = np.clip(smooth(fg, 0.8), 0, 1)

C = np.zeros((H, W, 3), np.float32); A = np.zeros((H, W), np.float32)
def over(color, alpha):
    global C, A
    alpha = np.clip(alpha, 0, 1)[..., None]
    col = color if np.ndim(color) == 3 else np.broadcast_to(np.array(color, np.float32), (H, W, 3))
    C[:] = col * alpha + C * (1 - alpha)
    A[:] = alpha[..., 0] + A * (1 - alpha[..., 0])

def feasible(col, cap):
    c = np.array(col, np.float32)
    f = np.where(S > c, (1 - S) / np.maximum(1 - c, 1e-3), S / np.maximum(c, 1e-3)).min(axis=2)
    return np.minimum(cap, smooth(ndi.minimum_filter(np.clip(f, 0, 1), size=7), 1.0))

HALF = 215 * SCALE
nearT = np.clip(smooth((np.abs(xx - CX) < HALF + 30) & (yy < BASE + 10) & (yy > BASE - 660 * SCALE), 6) * 1.5, 0, 1)
# 1) faint film of the front glass over whatever is behind it (his body below the rail)
over((0.88, 0.96, 0.98), 0.05 * smooth(glass, 1.5) * np.clip((rock_edge(xx) - yy) / 6, 0, 1))
# 2) warm basking-lamp light on his top (lamp at ~(735, 120)), only where the back layer can undo it
LX, LY = 715, 80
d = np.sqrt(((xx - LX) / 170) ** 2 + ((yy - LY) / 120) ** 2)
glow = np.exp(-0.5 * d ** 2) * nearT
GLOW = (1.0, 0.80, 0.45)
over(GLOW, np.minimum(0.30 * glow, feasible(GLOW, 0.30)))
# soft warm bounce from the sunlit rock on his lower body
BOUNCE = (0.95, 0.72, 0.45)
bb = np.exp(-0.5 * ((yy - (BASE - 12)) / 22) ** 2) * nearT * (yy < BASE)
over(BOUNCE, np.minimum(0.07 * bb, feasible(BOUNCE, 0.07)))
# 3) glass highlight streaks on the front pane over his body (below the rail only)
def streak(x0, slant, width, peak, y0, y1):
    xc = x0 + slant * (yy - 300)
    a = peak * np.exp(-0.5 * ((xx - xc) / width) ** 2)
    fade = np.clip((yy - y0) / 18, 0, 1) * np.clip((y1 - yy) / 30, 0, 1)
    return a * fade * glass
streaks = np.clip(streak(CX - 58, -0.12, 7, 0.16, RAIL + 22, 470) + streak(CX - 41, -0.12, 2.0, 0.24, RAIL + 24, 450)
                  + streak(CX + 70, -0.12, 4.5, 0.08, RAIL + 26, 450), 0, 1)
over((1, 1, 1), streaks)
# 4) opaque front pieces: dipped rail + ornate bar + caps, rock lip and everything below it
over(S, barA)
over(S, fgA)

target = S * (1 - streaks[..., None]) + streaks[..., None]
back = target.copy()
m = A < 0.97
back[m] = (target[m] - C[m]) / (1 - A[m])[..., None]
back = np.clip(back, 0, 1)
back[~m] = S[~m]

# contact shadow on the dry rock top under him
sh = 0.55 * np.exp(-0.5 * (((xx - CX) / (240 * SCALE)) ** 2 + ((yy - (BASE + 1)) / 5) ** 2))
sh += 0.25 * np.exp(-0.5 * (((xx - CX + 10) / (300 * SCALE)) ** 2 + ((yy - (BASE - 3)) / 11) ** 2))
sh = np.clip(sh, 0, 0.65) * (yy < rock_edge(xx) + 2) * (yy > 286)
back = back * (1 - sh[..., None]) + np.array([0.24, 0.17, 0.10]) * sh[..., None]

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
print('placed', PLACED, 'tuft top', BASE - 628 * SCALE, 'eye top', BASE - 461 * SCALE, 'mouth', BASE - 355 * SCALE,
      'chin', BASE - 249 * SCALE, 'rail top', RAIL, 'rail sprite row', 663 - (BASE - RAIL) / SCALE)
recon = back * (1 - frontA[..., None]) + C
print('max recon err (no shadow):', float(np.abs(recon - target)[sh < 0.01].max()))

#!/usr/bin/env python3
"""Build install icons from the approved Pebble idle sprite.

The sprite is public/sprites/turtle-idle.png. Icons are square tiles on the
game background (#e7f6f2) so the Dock and the install dialog match the bay.
Maskable tiles keep Pebble inside the center 80% safe zone.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "sprites" / "turtle-idle.png"
OUTPUT = ROOT / "public" / "icons"

# --bg in src/styles.css. Opaque so circular masks do not turn the corners black.
BACKGROUND = (0xE7, 0xF6, 0xF2, 255)

# Any-purpose icons can use more of the tile. Maskable icons must stay inside
# the center circle whose diameter is 80% of the tile.
ICONS = {
    "icon-192.png": (192, 0.78),
    "icon-512.png": (512, 0.78),
    "icon-maskable-192.png": (192, 0.70),
    "icon-maskable-512.png": (512, 0.70),
    "apple-touch-icon.png": (180, 0.78),
}


def pebble() -> Image.Image:
    image = Image.open(SOURCE).convert("RGBA")
    box = image.getbbox()
    if box is None:
        raise SystemExit(f"{SOURCE} has no visible pixels")
    return image.crop(box)


def render(size: int, scale: float, sprite: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), BACKGROUND)
    width, height = sprite.size
    ratio = (size * scale) / max(width, height)
    resized = sprite.resize((max(1, round(width * ratio)), max(1, round(height * ratio))), Image.Resampling.LANCZOS)
    x = (size - resized.width) // 2
    y = (size - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas.convert("RGB")


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sprite = pebble()
    for name, (size, scale) in ICONS.items():
        image = render(size, scale, sprite)
        image.save(OUTPUT / name, "PNG", optimize=True)
        print(f"{name} {image.size[0]}x{image.size[1]}")


if __name__ == "__main__":
    main()

# Habitat layers (source art)

Master 1280x720 layers for the three habitat tiers. The app ships WebP copies
from `public/sprites/habitat/` (`<tier>-back.vN.webp`, `<tier>-front.vN.webp`,
and a small no-turtle `<tier>-card.vN.webp` for the Home tier cards).

- `*-back.png` is the full painting with the area behind Pebble pre-filled, so
  back + front with no turtle reproduces the scene exactly.
- `*-front.png` is RGBA: only what sits in front of Pebble (glass, water tint,
  pebbles, rail) is opaque.
- Pebble's placement per tier (center x, feet row, scale) lives in
  `src/data/habitatScenes.ts` and is covered by `habitatScenes.test.ts`.

The `build-*.py` / `edit-tank.py` scripts are the one-off Pillow scripts used to
cut the layers. They read the original scene paintings from local scratch paths,
so treat them as a record of the process rather than a reproducible build.

When a layer changes, export new WebPs with a bumped version (`.v2.webp`) and
update `habitatUrl` names in `TIER_SCENES` so cached tabs keep the old files.

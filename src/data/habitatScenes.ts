import type { HabitatTier } from '../types'

/**
 * Painted habitat scenes. Each tier is a 1280x720 back layer and a front layer (front glass,
 * water tint, rim or frame, front pebbles). Pebble sits between them. The turtle sprite frame is
 * also 1280x720 with his feet at (640, 663), so a scale of 0.55 means the sprite frame is 55% of
 * the scene. The back layer is pre-compensated, so back + front with no turtle equals the painting.
 * Source art and build scripts: art/habitats/.
 */
export const SCENE_W = 1280
export const SCENE_H = 720
export const SPRITE_FOOT = { x: 640, y: 663 } as const

export type ScenePlacement = {
  /** Scene x of his center line. */
  cx: number
  /** Scene y of the bottom of his feet. */
  base: number
  /** Sprite frame size as a fraction of the scene. */
  scale: number
}

export type TierScene = {
  key: 'bowl' | 'tank' | 'reef'
  back: string
  front: string
  /** 640x360 painting with no turtle, for the small tier cards. */
  card: string
  turtle: ScenePlacement
  /**
   * Crop focus (0 to 1 of the scene) when the stage is narrower or wider than 16:9: the point kept
   * centered when possible. y sits midway between the top of a hat and his feet.
   */
  focus: { x: number; y: number }
  /** Idle bob height, percent of his own box height. */
  bob: number
  /** Scene y of the water line baked into the front layer (null when he sits dry). */
  waterline: number | null
  /** Scene y of the bottom edge of an opaque top frame in the front layer (null when there is none). */
  frameBottom: number | null
  /** Draw his hat above the front layer, so a tall hat is not cut by an opaque top frame. */
  hatOverFront: boolean
  /** Shop plants, rooted behind the front sand so their bases are hidden. x is the center, bottom is the root. */
  plants: { x: number; bottom: number; w: number }[]
  /** Shell bed under him, centered on cx. */
  bed: { bottom: number; w: number }
}

export const TIER_SCENES: Record<HabitatTier, TierScene> = {
  1: {
    key: 'bowl',
    back: 'bowl-back.v1.webp',
    front: 'bowl-front.v1.webp',
    card: 'bowl-card.v1.webp',
    turtle: { cx: 600, base: 502, scale: 0.55 },
    focus: { x: 600 / SCENE_W, y: 0.43 },
    bob: 2.5,
    waterline: 371,
    frameBottom: null,
    hatOverFront: false,
    plants: [
      { x: 388, bottom: 490, w: 140 },
      { x: 832, bottom: 490, w: 140 },
    ],
    bed: { bottom: 508, w: 230 },
  },
  2: {
    key: 'tank',
    back: 'tank-back.v1.webp',
    front: 'tank-front.v1.webp',
    card: 'tank-card.v1.webp',
    // 4px lower than the mock (496) and a smaller bob, so his tuft clears the top frame (bottom edge y 205).
    turtle: { cx: 615, base: 500, scale: 0.45 },
    focus: { x: 615 / SCENE_W, y: 0.48 },
    bob: 2,
    waterline: 396,
    frameBottom: 205,
    hatOverFront: true,
    plants: [
      { x: 448, bottom: 492, w: 128 },
      { x: 795, bottom: 492, w: 128 },
    ],
    bed: { bottom: 508, w: 190 },
  },
  3: {
    key: 'reef',
    back: 'reef-back.v1.webp',
    front: 'reef-front.v1.webp',
    card: 'reef-card.v1.webp',
    turtle: { cx: 660, base: 330, scale: 0.42 },
    focus: { x: 660 / SCENE_W, y: 0.26 },
    bob: 2.5,
    waterline: null,
    frameBottom: null,
    hatOverFront: false,
    plants: [
      { x: 456, bottom: 378, w: 110 },
      { x: 875, bottom: 378, w: 110 },
    ],
    bed: { bottom: 338, w: 178 },
  },
}

export type Box = { left: number; top: number; width: number; height: number }

/** His sprite frame as percentages of the scene box. */
export function turtleBox(placement: ScenePlacement): Box {
  const { cx, base, scale } = placement
  return {
    left: ((cx - SPRITE_FOOT.x * scale) / SCENE_W) * 100,
    top: ((base - SPRITE_FOOT.y * scale) / SCENE_H) * 100,
    width: scale * 100,
    height: scale * 100,
  }
}

/** A prop of width w (scene px) and aspect ratio (w / h), centered on x with its bottom at y. */
export function propBox(x: number, bottom: number, w: number, aspect: number): Box {
  const h = w / aspect
  return {
    left: ((x - w / 2) / SCENE_W) * 100,
    top: ((bottom - h) / SCENE_H) * 100,
    width: (w / SCENE_W) * 100,
    height: (h / SCENE_H) * 100,
  }
}

/** Scene y of a sprite-frame row for this placement. */
export function sceneY(placement: ScenePlacement, spriteY: number): number {
  return placement.base - (SPRITE_FOOT.y - spriteY) * placement.scale
}

export function habitatUrl(file: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}sprites/habitat/${file}`
}

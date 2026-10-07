import { describe, expect, it } from 'vitest'
import { ACCESSORY_GEAR, TURTLE_ANCHORS } from './accessories'
import { SCENE_H, SCENE_W, SPRITE_FOOT, TIER_SCENES, propBox, sceneY, turtleBox } from './habitatScenes'

// Topmost opaque row of each mood sprite (hair tuft), measured on public/sprites/turtle-*.png.
const SPRITE_TOP = { idle: 35, low: 27, eat: 44 } as const
const CHIN = 414
const MOUTH_BOTTOM = 340

const tiers = [1, 2, 3] as const

describe('TIER_SCENES', () => {
  it('keeps the approved placements', () => {
    expect(TIER_SCENES[1].turtle).toEqual({ cx: 600, base: 502, scale: 0.55 })
    expect(TIER_SCENES[2].turtle).toEqual({ cx: 615, base: 500, scale: 0.45 })
    expect(TIER_SCENES[3].turtle).toEqual({ cx: 660, base: 330, scale: 0.42 })
  })

  it('maps the sprite feet onto the scene base point', () => {
    for (const tier of tiers) {
      const { turtle } = TIER_SCENES[tier]
      const box = turtleBox(turtle)
      const footX = (box.left / 100) * SCENE_W + SPRITE_FOOT.x * (box.width / 100) * (SCENE_W / 1280)
      const footY = (box.top / 100) * SCENE_H + SPRITE_FOOT.y * (box.height / 100) * (SCENE_H / 720)
      expect(footX).toBeCloseTo(turtle.cx, 6)
      expect(footY).toBeCloseTo(turtle.base, 6)
      expect(box.width).toBeCloseTo(box.height, 9)
    }
  })

  it('crosses the water line over his chest, below the chin, in the bowl and tank', () => {
    for (const tier of [1, 2] as const) {
      const scene = TIER_SCENES[tier]
      const row = SPRITE_FOOT.y - (scene.turtle.base - (scene.waterline as number)) / scene.turtle.scale
      expect(row).toBeGreaterThan(CHIN)
      expect(row).toBeLessThan(470)
    }
    expect(TIER_SCENES[3].waterline).toBeNull()
  })

  it('keeps his tuft below the tank frame at the top of the bob, in every mood', () => {
    const scene = TIER_SCENES[2]
    const bobPx = (scene.bob / 100) * SCENE_H * scene.turtle.scale
    for (const top of Object.values(SPRITE_TOP)) {
      expect(sceneY(scene.turtle, top) - bobPx).toBeGreaterThan((scene.frameBottom as number) + 1)
    }
  })

  it('keeps his face (down to the mouth) above the water', () => {
    for (const tier of [1, 2] as const) {
      const scene = TIER_SCENES[tier]
      expect(sceneY(scene.turtle, MOUTH_BOTTOM)).toBeLessThan(scene.waterline as number)
    }
  })

  it('lifts the hat over the front layer only where an opaque top frame could cut it', () => {
    for (const tier of tiers) {
      const scene = TIER_SCENES[tier]
      expect(scene.hatOverFront).toBe(scene.frameBottom !== null)
    }
  })

  it('keeps every hat inside the scene', () => {
    for (const tier of tiers) {
      const { turtle } = TIER_SCENES[tier]
      for (const [id, gear] of Object.entries(ACCESSORY_GEAR)) {
        if (gear.slot !== 'head') continue
        for (const mood of ['idle', 'low', 'eat'] as const) {
          const anchorY = TURTLE_ANCHORS[mood].head.y * 720
          const hatTop = anchorY - gear.hy * gear.h * 720
          expect(sceneY(turtle, hatTop), `${id} ${mood} tier ${tier}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('places props inside the scene with the requested root point', () => {
    for (const tier of tiers) {
      const scene = TIER_SCENES[tier]
      for (const plant of scene.plants) {
        const box = propBox(plant.x, plant.bottom, plant.w, 120 / 150)
        expect(box.left).toBeGreaterThan(0)
        expect(box.left + box.width).toBeLessThan(100)
        expect(((box.top + box.height) / 100) * SCENE_H).toBeCloseTo(plant.bottom, 6)
      }
    }
  })

  it('centers the crop between the tallest hat and his feet', () => {
    for (const tier of tiers) {
      const { turtle, focus } = TIER_SCENES[tier]
      const hatTop = sceneY(turtle, -60)
      const mid = (hatTop + turtle.base) / 2 / SCENE_H
      expect(Math.abs(focus.y - mid)).toBeLessThan(0.03)
      expect(focus.x).toBeCloseTo(turtle.cx / SCENE_W, 6)
    }
  })

  it('uses versioned file names', () => {
    for (const tier of tiers) {
      const scene = TIER_SCENES[tier]
      for (const file of [scene.back, scene.front, scene.card]) expect(file).toMatch(/\.v\d+\.webp$/)
    }
  })
})

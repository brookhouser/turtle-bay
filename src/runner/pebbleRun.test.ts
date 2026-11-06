import { describe, expect, it } from 'vitest'
import { bankShellTreats, createKid } from '../game/logic'
import { schoolProjection } from '../family/privacy'
import { abilitiesUnlocked } from './abilities'
import { PEBBLE_LEVELS } from './pebbleLevels'
import { PEBBLE_ABILITIES, startingHearts } from './pebbleRunner'
import { PEBBLE_UNIT_IDS } from '../study/pebbleUnits'

describe('pebble run', () => {
  it('unlocks gentler tricks from spelling, math, and typing mastery', () => {
    expect(abilitiesUnlocked(0, PEBBLE_ABILITIES).map((item) => item.id)).toEqual([])
    expect(abilitiesUnlocked(1, PEBBLE_ABILITIES).map((item) => item.id)).toEqual(['double-jump'])
    expect(abilitiesUnlocked(2, PEBBLE_ABILITIES).map((item) => item.id)).toEqual(['double-jump', 'dash'])
    expect(abilitiesUnlocked(5, PEBBLE_ABILITIES).at(-1)?.id).toBe('magnet')
    expect(PEBBLE_UNIT_IDS.has('spelling-sort-35')).toBe(true)
    expect(PEBBLE_UNIT_IDS.has('middle-east')).toBe(false)
  })

  it('keeps a ground path, a gate, and shells in every world', () => {
    const worlds = new Set(PEBBLE_LEVELS.map((level) => level.world))
    expect(worlds).toEqual(new Set(['beach', 'reef', 'volcano']))
    for (const level of PEBBLE_LEVELS) {
      const ground = level.rows.at(-1) ?? ''
      expect(ground.includes('G')).toBe(true)
      expect(level.rows.some((row) => row.includes('Q'))).toBe(true)
      expect(level.rows.some((row) => row.includes('S'))).toBe(true)
      expect(level.speed).toBeLessThan(180)
    }
  })

  it('turns shells into pantry snacks and an extra heart when Pebble is well', () => {
    const kid = createKid('Wally', 'hash', 'wally')
    const fed = bankShellTreats(kid, 2)
    expect(fed.turtle.inventory['kelp-chip']).toBe(2)
    expect(fed.turtle.hunger).toBeGreaterThan(kid.turtle.hunger)
    expect(startingHearts(70, 70)).toBe(2)
    expect(startingHearts(40, 80)).toBe(1)
    const school = schoolProjection({
      ...fed,
      tasks: [{ id: 't', title: 'Make the bed', notes: '', points: 1, repeat: 'daily', active: true, createdAt: '2026-11-06' }],
      routines: [{ id: 'r', title: 'Brush teeth', slot: 'morning', points: 1, active: true }],
    })
    expect(school.tasks).toEqual([])
    expect(school.routines).toEqual([])
    expect(school.turtle.inventory['kelp-chip']).toBe(2)
  })
})
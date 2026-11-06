import { describe, expect, it } from 'vitest'
import { createKid, normalizeKid } from '../game/logic'
import { chooseLook } from './progress'
import { DOJO_ACE_POSES } from './sheet'

describe('Dojo Ace sheet', () => {
  it('is Sam\'s only fighter', () => {
    const kid = normalizeKid({ ...createKid('Sam', '', 'sam'), motivation: 'fighter', fighter: { lookId: null, unlocked: [], equippedGear: [], portraitUrl: null } })
    expect(kid.fighter?.lookId).toBe('dojo-ace')
    expect(chooseLook(kid, 'shadow-blade').error).toMatch(/Dojo Ace/)
    expect(chooseLook(kid, 'dojo-ace').kid.fighter?.lookId).toBe('dojo-ace')
  })

  it('records which poses came from the sheet', () => {
    const fromSheet = DOJO_ACE_POSES.filter((pose) => pose.status === 'from-sheet').map((pose) => pose.id)
    const needed = DOJO_ACE_POSES.filter((pose) => pose.status === 'needed').map((pose) => pose.id)
    expect(fromSheet).toEqual(['run', 'jump', 'dash', 'spin-kick', 'retreat'])
    expect(DOJO_ACE_POSES.find((pose) => pose.id === 'ready')?.status).toBe('reference')
    expect(needed).toContain('super')
    expect(needed).toContain('skins')
  })
})
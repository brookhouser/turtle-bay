import { describe, expect, it } from 'vitest'
import { createKid } from '../game/logic'
import { toggleCheck } from './board'
import { claimFamilyKid, createFamilyKid } from './accounts'

describe('chore coins', () => {
  it('adds coins to the turtle jar and takes them back if unchecked', () => {
    const kid = createFamilyKid('wilsonbrookhouser@gmail.com', 'wally')!
    expect(kid.turtle.name).toBe('Jeff')
    expect(kid.nickname).toBe('Chumabagog')
    const step = kid.routines[0]
    const checked = toggleCheck(kid, { itemId: step.id, kind: 'routine', source: 'kid', groupId: '', points: step.points, repeat: 'daily' }, '2026-11-09')
    expect(checked.awarded).toBe(5)
    expect(checked.kid.turtle.coins).toBe(kid.turtle.coins + 5)
    const undone = toggleCheck(checked.kid, { itemId: step.id, kind: 'routine', source: 'kid', groupId: '', points: step.points, repeat: 'daily' }, '2026-11-09')
    expect(undone.kid.turtle.coins).toBe(kid.turtle.coins)
  })

  it('keeps an existing Jeff bay instead of making a second turtle', () => {
    const existing = createKid('Chumabagog', 'hash', 'old-id')
    existing.turtle = { ...existing.turtle, name: 'Jeff', named: true, coins: 42 }
    const claimed = claimFamilyKid([existing], 'wilsonbrookhouser@gmail.com')
    expect(claimed?.kid.id).toBe('old-id')
    expect(claimed?.kid.turtle.coins).toBe(42)
    expect(claimed?.kid.turtle.name).toBe('Jeff')
    expect(claimed?.kids).toHaveLength(1)
  })
})
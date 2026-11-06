import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createKid } from '../game/logic'
import { addRoutine, addTask, toggleCheck } from './board'
import { WALLY_SCHOOL_EMAIL } from './roster'
import { publicKidPayload, schoolProjection } from './privacy'
import { resolveAccount, foundingWorld } from './world'

describe('school scope', () => {
  it('does not grant access while the school email is blank', () => {
    expect(WALLY_SCHOOL_EMAIL).toBe('')
    const world = foundingWorld()
    expect(resolveAccount(world, 'wally@santacatalina.org')).toBeNull()
    expect(resolveAccount(world, 'wilsonbrookhouser@gmail.com')).toMatchObject({ scope: 'family', kidId: 'wally' })
  })

  it('keeps routines off the school-readable payload and the school projection', () => {
    let kid = createKid('Wally', '', 'wally')
    kid = { ...kid, familyId: 'turtlebay', email: 'wilsonbrookhouser@gmail.com' }
    kid = addRoutine(kid, { title: 'Brush teeth', slot: 'morning', points: 5 }).kid
    kid = addTask(kid, { title: 'Pack lunch', points: 8 }).kid
    const step = kid.routines[0]
    kid = toggleCheck(kid, {
      itemId: step.id,
      kind: 'routine',
      source: 'kid',
      groupId: '',
      points: step.points,
      repeat: 'daily',
    }).kid
    const payload = publicKidPayload(kid)
    expect(payload).not.toHaveProperty('tasks')
    expect(payload).not.toHaveProperty('routines')
    expect(payload).not.toHaveProperty('completions')
    expect(JSON.stringify(payload)).not.toContain('Brush teeth')
    expect(JSON.stringify(payload)).not.toContain('Pack lunch')
    const projected = schoolProjection(kid)
    expect(projected.routines).toEqual([])
    expect(projected.tasks).toEqual([])
    expect(projected.completions.every((item) => item.kind === 'assignment')).toBe(true)
    expect(projected.turtle).toEqual(kid.turtle)
    expect(projected.credits).toBe(kid.credits)
  })

  it('locks the school identity out of the private home document in rules', () => {
    const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8')
    expect(rules).toContain("function wallySchoolEmail() {\n      return '';")
    expect(rules).toContain('match /private/{docId}')
    const privateBlock = rules.slice(rules.indexOf('match /private/{docId}'), rules.indexOf('match /private/{docId}') + 500)
    expect(privateBlock).not.toContain('isSchoolWally')
    expect(rules).toContain('isSchoolWally()')
    expect(rules).toContain('wilsonbrookhouser@gmail.com')
  })
})

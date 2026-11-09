import { describe, expect, it } from 'vitest'
import { addRoutine, addTask, toggleCheck } from './board'
import { defaultAudience, deleteGroupAssignment, parentPortal, postAssignment, resolveAccount, updateGroupAssignment } from './world'
import { brookhouserWithClass, inviteChristian } from './world.test.fixture'

describe('family isolation', () => {
  it('gives Christian his own portal and a read-only copy of a class assignment', () => {
    const world = brookhouserWithClass()
    const invited = inviteChristian(world)
    expect(invited.error).toBeUndefined()
    const next = invited.world
    const christianParent = 'ada.okonkwo@gmail.com'
    const session = resolveAccount(next, christianParent)
    expect(session?.role).toBe('parent')
    if (session?.role !== 'parent') return
    const portal = parentPortal(next, session.familyId)
    expect(portal?.canInvite).toBe(false)
    expect(portal?.canManageGroups).toBe(false)
    expect(portal?.kids).toHaveLength(1)
    const row = portal?.kids[0]
    expect(row?.kid.nickname).toBe('Christian')
    expect(row?.kid.motivation).toBe('turtle')
    expect(row?.kid.credits).toBe(0)
    expect(row?.groupAssignments).toHaveLength(1)
    expect(row?.groupAssignments[0].title).toBe('Fraction practice')
    expect(row?.groupAssignments[0].canEdit).toBe(false)
    expect(row?.groupAssignments[0].authorFamilyName).toBe('Brookhouser')
    expect(JSON.stringify(portal)).not.toContain('Pack lunch')
    expect(JSON.stringify(portal)).not.toContain('sambrookhouser')
    const wally = next.kids.find((kid) => kid.id === 'wally')
    expect(wally?.tasks.some((task) => task.title === 'Pack lunch')).toBe(true)
    expect(wally?.credits).toBe(0)
  })

  it('does not grant access when the kid email is still unknown', () => {
    const world = brookhouserWithClass()
    const invited = inviteChristian(world, { kidEmail: '' })
    expect(invited.error).toBeUndefined()
    const familyId = invited.familyId ?? ''
    const kid = invited.world.kids.find((entry) => entry.familyId === familyId)
    expect(kid?.email).toBe('')
    expect(invited.world.directory.some((entry) => entry.kidId === kid?.id)).toBe(false)
    expect(resolveAccount(invited.world, 'christian.okonkwo@gmail.com')).toBeNull()
    const portal = parentPortal(invited.world, familyId)
    expect(portal?.kids[0].groupAssignments[0].canEdit).toBe(false)
  })

  it('rejects placeholder emails', () => {
    const world = brookhouserWithClass()
    const invited = inviteChristian(world, { parentEmail: 'FILL_IN_PARENT@example.com' })
    expect(invited.error).toMatch(/not a real address/i)
    expect(invited.world.families).toHaveLength(world.families.length)
    expect(resolveAccount(world, 'someone.else@gmail.com')).toBeNull()
  })

  it('lets Christian earn his own points without moving Wally', () => {
    const invited = inviteChristian(brookhouserWithClass())
    const world = invited.world
    const kid = world.kids.find((entry) => entry.nickname === 'Christian')
    expect(kid).toBeTruthy()
    if (!kid) return
    const withRoutine = addRoutine(kid, { title: 'Brush teeth', slot: 'morning', points: 5 })
    const step = withRoutine.kid.routines[0]
    const checked = toggleCheck(withRoutine.kid, {
      itemId: step.id,
      kind: 'routine',
      source: 'kid',
      groupId: '',
      points: step.points,
      repeat: 'daily',
    })
    expect(checked.awarded).toBe(5)
    expect(checked.kid.credits).toBe(5)
    expect(checked.kid.turtle.happy).toBeGreaterThan(kid.turtle.happy)
    const again = toggleCheck(checked.kid, {
      itemId: step.id,
      kind: 'routine',
      source: 'kid',
      groupId: '',
      points: step.points,
      repeat: 'daily',
    })
    expect(again.kid.credits).toBe(0)
    const wally = world.kids.find((entry) => entry.id === 'wally')
    expect(wally?.credits).toBe(0)
    expect(wally?.tasks[0].title).toBe('Pack lunch')
  })

  it('lets the other family post to the group but not edit Brookhouser assignments', () => {
    const invited = inviteChristian(brookhouserWithClass())
    const world = invited.world
    const familyId = invited.familyId ?? ''
    const kid = world.kids.find((entry) => entry.familyId === familyId)
    expect(kid).toBeTruthy()
    if (!kid) return
    const audience = defaultAudience(world, familyId, kid.id)
    expect(audience.audience).toBe('group')
    const posted = postAssignment(world, 'ada.okonkwo@gmail.com', familyId, kid.id, {
      title: 'Spelling sentences',
      subject: 'English',
      notes: '',
      points: 10,
      due: '',
      link: '',
      audience: 'group',
      groupId: audience.groupId,
    })
    expect(posted.error).toBeUndefined()
    const own = posted.world.groupAssignments.find((item) => item.title === 'Spelling sentences')
    const shared = posted.world.groupAssignments.find((item) => item.title === 'Fraction practice')
    expect(own?.authorFamilyId).toBe(familyId)
    expect(shared).toBeTruthy()
    if (!shared || !own) return
    const blocked = updateGroupAssignment(posted.world, 'ada.okonkwo@gmail.com', familyId, shared.id, {
      title: 'Changed',
      subject: '',
      notes: '',
      points: 10,
      due: '',
      link: '',
      audience: 'group',
      groupId: shared.groupId,
    })
    expect(blocked.error).toMatch(/not change/i)
    const removed = deleteGroupAssignment(posted.world, 'ada.okonkwo@gmail.com', familyId, shared.id)
    expect(removed.error).toMatch(/not delete/i)
    const wallyPortal = parentPortal(posted.world, 'turtlebay')
    const wallyRow = wallyPortal?.kids.find((row) => row.kid.id === 'wally')
    expect(wallyRow?.groupAssignments.some((item) => item.title === 'Spelling sentences' && !item.canEdit)).toBe(true)
    expect(wallyRow?.kid.tasks.some((task) => task.title === 'Pack lunch')).toBe(true)
    const christian = parentPortal(posted.world, familyId)
    expect(christian?.kids[0].kid.tasks.some((task) => task.title === 'Pack lunch')).toBe(false)
  })
})

describe('founding sign in', () => {
  it('resolves the four Brookhouser Google accounts', () => {
    const world = brookhouserWithClass()
    expect(resolveAccount(world, 'brookhouser@gmail.com')?.role).toBe('parent')
    expect(resolveAccount(world, 'bbrookhouser@gmail.com')?.role).toBe('parent')
    expect(resolveAccount(world, 'sambrookhouser@gmail.com')).toMatchObject({ role: 'kid', kidId: 'sam' })
    expect(resolveAccount(world, 'wilsonbrookhouser@gmail.com')).toMatchObject({ role: 'kid', kidId: 'wally' })
  })
})

describe('points', () => {
  it('pays a daily task once per day', () => {
    const world = brookhouserWithClass()
    const wally = world.kids.find((kid) => kid.id === 'wally')
    expect(wally).toBeTruthy()
    if (!wally) return
    const task = addTask(wally, { title: 'Read 20 minutes', points: 10, repeat: 'daily' }).kid
    const target = {
      itemId: task.tasks[0].id,
      kind: 'task' as const,
      source: 'kid' as const,
      groupId: '',
      points: 10,
      repeat: 'daily' as const,
    }
    const once = toggleCheck(task, target, '2026-11-06')
    const twice = toggleCheck(once.kid, target, '2026-11-06')
    expect(twice.kid.credits).toBe(0)
    const nextDay = toggleCheck(once.kid, target, '2026-11-07')
    expect(nextDay.kid.credits).toBe(20)
  })
})

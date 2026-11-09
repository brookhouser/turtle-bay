import { addTask } from './board'
import { createGroup, foundingWorld, inviteFamily, postAssignment, type InviteInput } from './world'

export function brookhouserWithClass() {
  const base = foundingWorld(1_700_000_000_000)
  const grouped = createGroup(base, 'brookhouser@gmail.com', "Wally's class", 'wally')
  if (!grouped.groupId) throw new Error(grouped.error)
  const wally = grouped.world.kids.find((kid) => kid.id === 'wally')
  if (!wally) throw new Error('missing wally')
  const withTask = addTask(wally, { title: 'Pack lunch', points: 8, repeat: 'daily' })
  const world = {
    ...grouped.world,
    kids: grouped.world.kids.map((kid) => (kid.id === 'wally' ? withTask.kid : kid)),
  }
  const posted = postAssignment(world, 'brookhouser@gmail.com', 'turtlebay', 'wally', {
    title: 'Fraction practice',
    subject: 'Math',
    notes: 'Page 12.',
    points: 15,
    due: '2026-11-07',
    link: '',
    audience: 'group',
    groupId: grouped.groupId,
  })
  if (posted.error) throw new Error(posted.error)
  return posted.world
}

export function inviteChristian(world: ReturnType<typeof brookhouserWithClass>, override: Partial<{ parentEmail: string; kidEmail: string }> = {}) {
  const groupId = world.groups[0]?.id ?? null
  const input: InviteInput = {
    familyName: 'Okonkwo',
    parentEmails: [override.parentEmail ?? 'ada.okonkwo@gmail.com'],
    parentNames: ['Ada'],
    kidName: 'Christian',
    kidEmail: override.kidEmail === undefined ? 'christian.okonkwo@gmail.com' : override.kidEmail,
    grade: '4th grade',
    groupId,
  }
  return inviteFamily(world, 'brookhouser@gmail.com', input, 1_700_000_000_000)
}

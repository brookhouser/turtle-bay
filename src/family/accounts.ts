import { createKid } from '../game/logic'
import type { KidFocus, KidProfile } from '../types'
import { addPersonalAssignment, addReward, addRoutine } from './board'
import { familyAccount } from './roster'

export function isWallyBay(kid: KidProfile): boolean {
  return kid.nickname.trim().toLowerCase() === 'chumabagog' || kid.turtle.name.trim().toLowerCase() === 'jeff' || kid.googleEmail === 'wilsonbrookhouser@gmail.com'
}

export function findFamilyKid(kids: KidProfile[], email: string): KidProfile | undefined {
  const account = familyAccount(email)
  if (!account || account.role !== 'kid') return undefined
  const normalized = account.email
  return kids.find((kid) => kid.googleEmail === normalized) ?? (account.key === 'wally' ? kids.find(isWallyBay) : kids.find((kid) => kid.nickname.trim().toLowerCase() === 'sam'))
}

function withSteps(kid: KidProfile, slot: 'morning' | 'evening', titles: string[]): KidProfile {
  return titles.reduce((current, title) => addRoutine(current, { title, slot, points: 5 }).kid, kid)
}

export function seedChores(kid: KidProfile, focus: KidFocus): KidProfile {
  if (kid.routines.length > 0 || kid.tasks.length > 0 || kid.assignments.length > 0) return kid
  let next = withSteps(kid, 'morning', ['Make the bed', 'Brush teeth', 'Pack the bag'])
  next = withSteps(next, 'evening', focus === 'turtle' ? ['Homework spot', 'Pajamas', 'Lights out'] : ['Pack for tomorrow', 'Devices away'])
  if (focus === 'rewards') {
    next = addPersonalAssignment(next, {
      title: 'Geography study block',
      subject: 'Geography',
      notes: 'Middle East and Central Asia, due Friday Nov 13.',
      points: 15,
      due: '2026-11-13',
    }).kid
    next = addReward(next, { title: '30 minutes of screen time', cost: 20 }).kid
  }
  return next
}

export function createFamilyKid(email: string, id: string = crypto.randomUUID()): KidProfile | null {
  const account = familyAccount(email)
  if (!account || account.role !== 'kid') return null
  if (account.key === 'wally') {
    const created = createKid('Chumabagog', '', id)
    return seedChores(
      {
        ...created,
        googleEmail: account.email,
        focus: 'turtle',
        turtle: { ...created.turtle, name: 'Jeff', named: true },
      },
      'turtle',
    )
  }
  const created = createKid('Sam', '', id)
  return seedChores({ ...created, googleEmail: account.email, focus: 'rewards' }, 'rewards')
}

export function claimFamilyKid(kids: KidProfile[], email: string): { kids: KidProfile[]; kid: KidProfile } | null {
  const account = familyAccount(email)
  if (!account || account.role !== 'kid') return null
  const existing = findFamilyKid(kids, email)
  if (!existing) {
    const created = createFamilyKid(email)
    if (!created) return null
    return { kid: created, kids: [...kids, created] }
  }
  const claimed = seedChores(
    {
      ...existing,
      googleEmail: account.email,
      focus: account.focus,
      turtle: account.key === 'wally' && !existing.turtle.named ? { ...existing.turtle, name: 'Jeff', named: true } : existing.turtle,
    },
    account.focus,
  )
  return { kid: claimed, kids: kids.map((kid) => (kid.id === claimed.id ? claimed : kid)) }
}

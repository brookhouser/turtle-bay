export const FOUNDING_PARENTS = [
  { key: 'kevin', name: 'Kevin', email: 'brookhouser@gmail.com', role: 'parent' as const },
  { key: 'beth', name: 'Beth', email: 'bbrookhouser@gmail.com', role: 'parent' as const },
]

export const FOUNDING_KIDS = [
  { key: 'sam', name: 'Sam', email: 'sambrookhouser@gmail.com', role: 'kid' as const, focus: 'rewards' as const },
  { key: 'wally', name: 'Wally', email: 'wilsonbrookhouser@gmail.com', role: 'kid' as const, focus: 'turtle' as const },
]

export const FAMILY_ACCOUNTS = [...FOUNDING_PARENTS, ...FOUNDING_KIDS]

export function familyAccount(email: string) {
  const normalized = email.trim().toLowerCase()
  return FAMILY_ACCOUNTS.find((person) => person.email === normalized)
}

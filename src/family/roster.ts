// Founding family only. Invited families are never listed here.
// Emails are real Google accounts. An address that is not in this list
// gets access only after a parent invite writes a directory entry.
// Keep these addresses in sync with firestore.rules.

export const FOUNDING_FAMILY_ID = 'turtlebay'
export const FOUNDING_FAMILY_NAME = 'Brookhouser'

export type FoundingParent = {
  key: 'kevin' | 'beth'
  name: string
  email: string
}

export type FoundingKid = {
  key: 'sam' | 'wally'
  name: string
  email: string
  grade: string
  motivation: 'turtle' | 'fighter'
}

export const FOUNDING_PARENTS: FoundingParent[] = [
  { key: 'kevin', name: 'Kevin', email: 'brookhouser@gmail.com' },
  { key: 'beth', name: 'Beth', email: 'bbrookhouser@gmail.com' },
]

export const FOUNDING_KIDS: FoundingKid[] = [
  { key: 'sam', name: 'Sam', email: 'sambrookhouser@gmail.com', grade: '7th grade', motivation: 'fighter' },
  { key: 'wally', name: 'Wally', email: 'wilsonbrookhouser@gmail.com', grade: '4th grade', motivation: 'turtle' },
]

export const FOUNDING_EMAILS = [
  ...FOUNDING_PARENTS.map((person) => person.email),
  ...FOUNDING_KIDS.map((person) => person.email),
]

export function foundingParent(email: string): FoundingParent | undefined {
  const normalized = email.trim().toLowerCase()
  return FOUNDING_PARENTS.find((person) => person.email === normalized)
}

export function foundingKid(email: string): FoundingKid | undefined {
  const normalized = email.trim().toLowerCase()
  return FOUNDING_KIDS.find((person) => person.email === normalized)
}

export function isFoundingEmail(email: string): boolean {
  return FOUNDING_EMAILS.includes(email.trim().toLowerCase())
}

// Wally's Santa Catalina school Google Workspace account.
// Leave this empty until the real address is known (it will end with @santacatalina.org).
// Copy the same value into wallySchoolEmail() in firestore.rules.
// An empty string matches nobody, so it grants no access.
export const WALLY_SCHOOL_EMAIL = ''

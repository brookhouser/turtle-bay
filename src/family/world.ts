import { createKid, normalizeKid } from '../game/logic'
import type { KidProfile, SessionData } from '../types'
import { cleanEmail, slugPart } from './ids'
import type { AssignmentDraft, ClassGroup, DirectoryEntry, FamilyRecord, GroupAssignment, World } from './model'
import {
  FOUNDING_FAMILY_ID,
  FOUNDING_FAMILY_NAME,
  FOUNDING_KIDS,
  FOUNDING_PARENTS,
  WALLY_SCHOOL_EMAIL,
  foundingKid,
  foundingParent,
  isFoundingEmail,
} from './roster'
import { DEFAULT_THRESHOLDS } from '../study/engine'
import { addPersonalAssignment, clampPoints, DEFAULT_ASSIGNMENT_POINTS, removePersonalAssignment, updatePersonalAssignment } from './board'

export const DEFAULT_GEMINI_CAP_USD = 5

export function emptyWorld(): World {
  return { families: [], kids: [], directory: [], groups: [], groupAssignments: [] }
}

export function foundingWorld(now = Date.now()): World {
  const family: FamilyRecord = {
    id: FOUNDING_FAMILY_ID,
    name: FOUNDING_FAMILY_NAME,
    invitedBy: null,
    groupIds: [],
    geminiMonthlyCapUsd: DEFAULT_GEMINI_CAP_USD,
    studyThresholds: { ...DEFAULT_THRESHOLDS },
    roster: [
      ...FOUNDING_PARENTS.map((person) => ({ name: person.name, role: 'parent' as const, kidId: null, email: person.email })),
      ...FOUNDING_KIDS.map((person) => ({ name: person.name, role: 'kid' as const, kidId: person.key, email: person.email })),
    ],
  }
  const kids = FOUNDING_KIDS.map((member) =>
    normalizeKid({
      ...createKid(member.name, '', member.key, now),
      familyId: FOUNDING_FAMILY_ID,
      email: member.email,
      grade: member.grade,
      motivation: member.motivation,
      fighter: member.motivation === 'fighter' ? { lookId: 'dojo-ace', unlocked: ['move-ready', 'move-bow'], equippedGear: [], portraitUrl: null } : null,
    }),
  )
  const directory: DirectoryEntry[] = [
    ...FOUNDING_PARENTS.map((person) => ({
      email: person.email,
      familyId: FOUNDING_FAMILY_ID,
      role: 'parent' as const,
      name: person.name,
      kidId: null,
    })),
    ...FOUNDING_KIDS.map((person) => ({
      email: person.email,
      familyId: FOUNDING_FAMILY_ID,
      role: 'kid' as const,
      name: person.name,
      kidId: person.key,
    })),
  ]
  return ensureMapAssignment({ families: [family], kids, directory, groups: [], groupAssignments: [] }, now)
}

export const MAP_ASSIGNMENT_ID = 'map-middle-east'

export function ensureMapAssignment(world: World, now = Date.now()): World {
  return {
    ...world,
    kids: world.kids.map((kid) => {
      if (kid.familyId !== FOUNDING_FAMILY_ID || kid.id !== 'sam') return kid
      if (kid.assignments.some((item) => item.id === MAP_ASSIGNMENT_ID)) return kid
      return {
        ...kid,
        assignments: [
          {
            id: MAP_ASSIGNMENT_ID,
            title: 'Middle East + Central Asia map quiz',
            subject: 'Geography',
            notes: '22 countries from the class list. Tap the country, then name the highlighted one.',
            points: 15,
            due: '2026-11-13',
            link: '',
            active: true,
            createdAt: new Date(now).toISOString(),
          },
          ...kid.assignments,
        ],
      }
    }),
  }
}

function progressScore(kid: KidProfile): number {
  return kid.sessions.length + kid.spellingSessions.length + kid.turtle.coins + (kid.turtle.named ? 1 : 0)
}

export function adoptLegacyKids(world: World, legacy: KidProfile[]): World {
  let kids = world.kids.map((kid) => normalizeKid(kid))
  const extras: KidProfile[] = []
  for (const raw of legacy) {
    const legacyKid = normalizeKid(raw)
    const nick = legacyKid.nickname.trim().toLowerCase()
    const targetKey = nick === 'sam' ? 'sam' : nick === 'wally' || nick === 'wilson' ? 'wally' : null
    if (targetKey) {
      kids = kids.map((kid) => {
        if (kid.id !== targetKey || kid.familyId !== FOUNDING_FAMILY_ID) return kid
        if (progressScore(kid) > 0 || progressScore(legacyKid) === 0) return kid
        return normalizeKid({
          ...kid,
          turtle: legacyKid.turtle,
          lessons: legacyKid.lessons,
          sessions: legacyKid.sessions,
          spellingSessions: legacyKid.spellingSessions,
          customChallenges: legacyKid.customChallenges,
          practiceDays: legacyKid.practiceDays,
        })
      })
      continue
    }
    if (kids.some((kid) => kid.id === legacyKid.id)) continue
    extras.push(normalizeKid({ ...legacyKid, familyId: FOUNDING_FAMILY_ID, archived: true, motivation: 'turtle' }))
  }
  return { ...world, kids: [...kids, ...extras] }
}

export function resolveAccount(world: World, emailRaw: string): SessionData | null {
  const email = emailRaw.trim().toLowerCase()
  if (!email) return null
  const parent = foundingParent(email)
  if (parent) return { role: 'parent', familyId: FOUNDING_FAMILY_ID, email: parent.email }
  const kid = foundingKid(email)
  if (kid) return { role: 'kid', familyId: FOUNDING_FAMILY_ID, kidId: kid.key, email: kid.email, scope: 'family' }
  const school = WALLY_SCHOOL_EMAIL.trim().toLowerCase()
  if (school && email === school && email !== 'wilsonbrookhouser@gmail.com') {
    return { role: 'kid', familyId: FOUNDING_FAMILY_ID, kidId: 'wally', email: school, scope: 'school' }
  }
  const entry = world.directory.find((person) => person.email === email)
  if (!entry) return null
  if (entry.role === 'parent') return { role: 'parent', familyId: entry.familyId, email: entry.email }
  if (entry.role === 'kid' && entry.kidId) return { role: 'kid', familyId: entry.familyId, kidId: entry.kidId, email: entry.email, scope: 'family' }
  return null
}

export function ensureRosterKids(world: World, familyId: string, now = Date.now()): World {
  const family = world.families.find((entry) => entry.id === familyId)
  if (!family) return world
  let kids = world.kids
  for (const person of family.roster) {
    if (person.role !== 'kid' || !person.kidId) continue
    if (kids.some((kid) => kid.familyId === familyId && kid.id === person.kidId)) continue
    const founding = FOUNDING_KIDS.find((kid) => kid.key === person.kidId && familyId === FOUNDING_FAMILY_ID)
    kids = [
      ...kids,
      normalizeKid({
        ...createKid(person.name, '', person.kidId, now),
        familyId,
        email: person.email,
        grade: founding?.grade ?? '4th grade',
        motivation: founding?.motivation ?? 'turtle',
        groupIds: family.groupIds,
        fighter:
          founding?.motivation === 'fighter'
            ? { lookId: 'dojo-ace', unlocked: ['move-ready', 'move-bow'], equippedGear: [], portraitUrl: null }
            : null,
      }),
    ]
  }
  return kids === world.kids ? world : { ...world, kids }
}

export function familyById(world: World, familyId: string): FamilyRecord | undefined {
  return world.families.find((family) => family.id === familyId)
}

export function kidsInFamily(world: World, familyId: string): KidProfile[] {
  return world.kids.filter((kid) => kid.familyId === familyId && !kid.archived)
}

export function groupIdsForKid(world: World, familyId: string, kidId: string): string[] {
  const kid = world.kids.find((entry) => entry.familyId === familyId && entry.id === kidId)
  const ids = new Set(kid?.groupIds ?? [])
  for (const group of world.groups) {
    if (group.kids.some((member) => member.familyId === familyId && member.kidId === kidId)) ids.add(group.id)
  }
  return [...ids]
}

export function groupsForKid(world: World, familyId: string, kidId: string): ClassGroup[] {
  const ids = new Set(groupIdsForKid(world, familyId, kidId))
  return world.groups.filter((group) => ids.has(group.id))
}

export function defaultAudience(world: World, familyId: string, kidId: string): { audience: 'kid' | 'group'; groupId: string | null } {
  const group = groupsForKid(world, familyId, kidId)[0]
  if (!group) return { audience: 'kid', groupId: null }
  return { audience: 'group', groupId: group.id }
}

export function canEditGroupAssignment(familyId: string, assignment: GroupAssignment): boolean {
  return assignment.authorFamilyId === familyId
}

export function visibleGroupAssignments(world: World, familyId: string, kidId: string): GroupAssignment[] {
  const groupIds = new Set(groupIdsForKid(world, familyId, kidId))
  return world.groupAssignments.filter((item) => item.active && groupIds.has(item.groupId))
}

function replaceKid(world: World, next: KidProfile): World {
  return { ...world, kids: world.kids.map((kid) => (kid.familyId === next.familyId && kid.id === next.id ? next : kid)) }
}

export function upsertKidPatch(world: World, next: KidProfile): World {
  const exists = world.kids.some((kid) => kid.familyId === next.familyId && kid.id === next.id)
  if (!exists) return { ...world, kids: [...world.kids, next] }
  return replaceKid(world, next)
}

export type InviteInput = {
  familyName: string
  parentEmails: string[]
  parentNames?: string[]
  kidName: string
  kidEmail?: string
  grade?: string
  groupId?: string | null
}

export function inviteFamily(world: World, actorEmail: string, input: InviteInput, now = Date.now()): { world: World; error?: string; familyId?: string } {
  const actor = foundingParent(actorEmail)
  if (!actor) return { world, error: 'Only Kevin or Beth can invite a family.' }
  const familyName = input.familyName.trim().replace(/\s+/g, ' ')
  if (familyName.length < 2 || familyName.length > 40) return { world, error: 'Family name needs 2 to 40 characters.' }
  const kidName = input.kidName.trim().replace(/\s+/g, ' ')
  if (kidName.length < 2 || kidName.length > 24) return { world, error: 'Kid name needs 2 to 24 characters.' }
  if (input.parentEmails.some((email) => email.trim() && !cleanEmail(email))) {
    return { world, error: 'That email is not a real address. Placeholders are not invited.' }
  }
  const parentEmails = [...new Set(input.parentEmails.map((email) => cleanEmail(email)).filter((email): email is string => Boolean(email)))]
  if (parentEmails.length === 0) return { world, error: 'Add at least one real parent Google email.' }
  if (parentEmails.some((email) => isFoundingEmail(email) || world.directory.some((entry) => entry.email === email))) {
    return { world, error: 'That email is already in a family.' }
  }
  const kidEmail = input.kidEmail?.trim() ? cleanEmail(input.kidEmail) : null
  if (input.kidEmail?.trim() && !kidEmail) return { world, error: 'The kid email is not a real address. Leave it blank until you know it.' }
  if (kidEmail && (isFoundingEmail(kidEmail) || world.directory.some((entry) => entry.email === kidEmail) || parentEmails.includes(kidEmail))) {
    return { world, error: 'That kid email is already in use.' }
  }
  const group = input.groupId ? world.groups.find((item) => item.id === input.groupId) : undefined
  if (input.groupId && !group) return { world, error: 'Pick a class group that exists.' }
  if (group && group.ownerFamilyId !== FOUNDING_FAMILY_ID) return { world, error: 'That group is not yours to add to.' }

  const familyId = `${slugPart(familyName)}-${crypto.randomUUID().slice(0, 8)}`
  const kidId = uniqueKidId(world, slugPart(kidName))
  const directory: DirectoryEntry[] = parentEmails.map((email, index) => ({
    email,
    familyId,
    role: 'parent',
    name: (input.parentNames?.[index] ?? '').trim() || email.split('@')[0],
    kidId: null,
  }))
  if (kidEmail) {
    directory.push({ email: kidEmail, familyId, role: 'kid', name: kidName, kidId })
  }
  const family: FamilyRecord = {
    id: familyId,
    name: familyName,
    invitedBy: actor.email,
    groupIds: group ? [group.id] : [],
    geminiMonthlyCapUsd: DEFAULT_GEMINI_CAP_USD,
    studyThresholds: { ...DEFAULT_THRESHOLDS },
    roster: [
      ...directory.map((entry) => ({
        name: entry.name,
        role: entry.role,
        kidId: entry.kidId,
        email: entry.email,
      })),
      ...(kidEmail ? [] : [{ name: kidName, role: 'kid' as const, kidId, email: '' }]),
    ],
  }
  const kid = normalizeKid({
    ...createKid(kidName, '', kidId, now),
    familyId,
    email: kidEmail ?? '',
    grade: (input.grade ?? '4th grade').trim().slice(0, 24),
    motivation: 'turtle',
    groupIds: group ? [group.id] : [],
  })
  let groups = world.groups
  if (group) {
    groups = groups.map((item) =>
      item.id === group.id
        ? {
            ...item,
            familyIds: item.familyIds.includes(familyId) ? item.familyIds : [...item.familyIds, familyId],
            kids: [...item.kids, { familyId, kidId, name: kidName }],
          }
        : item,
    )
  }
  return {
    familyId,
    world: {
      ...world,
      families: [...world.families, family],
      kids: [...world.kids, kid],
      directory: [...world.directory, ...directory],
      groups,
    },
  }
}

function uniqueKidId(world: World, base: string): string {
  const taken = new Set(world.kids.map((kid) => kid.id))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export function addKidEmail(world: World, actorEmail: string, familyId: string, kidId: string, emailRaw: string): { world: World; error?: string } {
  const email = cleanEmail(emailRaw)
  if (!email) return { world, error: 'Enter a real Google email. A blank or placeholder does not grant access.' }
  if (isFoundingEmail(email) || world.directory.some((entry) => entry.email === email)) {
    return { world, error: 'That email is already in a family.' }
  }
  const family = familyById(world, familyId)
  const kid = world.kids.find((entry) => entry.familyId === familyId && entry.id === kidId && !entry.archived)
  if (!family || !kid) return { world, error: 'That kid is not in this family.' }
  const actor = actorEmail.trim().toLowerCase()
  const actorIsParent = world.directory.some((entry) => entry.email === actor && entry.familyId === familyId && entry.role === 'parent')
  const actorInvited = family.invitedBy === actor && Boolean(foundingParent(actor))
  if (!actorIsParent && !actorInvited) return { world, error: 'Only this family, or the parent who invited them, can add that email.' }
  if (kid.email && kid.email !== email) return { world, error: 'This kid already has a Google email.' }
  const directory: DirectoryEntry = { email, familyId, role: 'kid', name: kid.nickname, kidId }
  return {
    world: {
      ...world,
      families: world.families.map((entry) =>
        entry.id === familyId
          ? {
              ...entry,
              roster: entry.roster.some((person) => person.kidId === kidId)
                ? entry.roster.map((person) => (person.kidId === kidId ? { ...person, email } : person))
                : [...entry.roster, { name: kid.nickname, role: 'kid' as const, kidId, email }],
            }
          : entry,
      ),
      kids: world.kids.map((entry) => (entry.familyId === familyId && entry.id === kidId ? { ...entry, email } : entry)),
      directory: [...world.directory, directory],
    },
  }
}

export function createGroup(world: World, actorEmail: string, nameRaw: string, kidId: string): { world: World; error?: string; groupId?: string } {
  if (!foundingParent(actorEmail)) return { world, error: 'Only Kevin or Beth can start a class group.' }
  const name = nameRaw.trim().replace(/\s+/g, ' ')
  if (name.length < 2 || name.length > 40) return { world, error: 'Group name needs 2 to 40 characters.' }
  const kid = world.kids.find((entry) => entry.familyId === FOUNDING_FAMILY_ID && entry.id === kidId && !entry.archived)
  if (!kid) return { world, error: 'Pick one of your kids.' }
  const groupId = `${slugPart(name)}-${crypto.randomUUID().slice(0, 8)}`
  const group: ClassGroup = {
    id: groupId,
    name,
    ownerFamilyId: FOUNDING_FAMILY_ID,
    familyIds: [FOUNDING_FAMILY_ID],
    kids: [{ familyId: FOUNDING_FAMILY_ID, kidId: kid.id, name: kid.nickname }],
  }
  return {
    groupId,
    world: {
      ...world,
      groups: [...world.groups, group],
      kids: world.kids.map((entry) =>
        entry.familyId === FOUNDING_FAMILY_ID && entry.id === kid.id && !entry.groupIds.includes(groupId)
          ? { ...entry, groupIds: [...entry.groupIds, groupId] }
          : entry,
      ),
      families: world.families.map((family) =>
        family.id === FOUNDING_FAMILY_ID && !family.groupIds.includes(groupId)
          ? { ...family, groupIds: [...family.groupIds, groupId] }
          : family,
      ),
    },
  }
}

export function postAssignment(
  world: World,
  actorEmail: string,
  familyId: string,
  kidId: string,
  draft: AssignmentDraft,
  now = Date.now(),
): { world: World; error?: string } {
  const actor = actorEmail.trim().toLowerCase()
  const parentEntry = world.directory.find((entry) => entry.email === actor && entry.role === 'parent' && entry.familyId === familyId)
  const founding = foundingParent(actor)
  if (!parentEntry && !(founding && familyId === FOUNDING_FAMILY_ID)) {
    return { world, error: 'That family is not yours.' }
  }
  const kid = world.kids.find((entry) => entry.familyId === familyId && entry.id === kidId && !entry.archived)
  if (!kid) return { world, error: 'Pick a kid in your family.' }
  const audience = draft.audience
  if (audience === 'kid') {
    const added = addPersonalAssignment(kid, draft, now)
    if (added.error) return { world, error: added.error }
    return { world: replaceKid(world, added.kid) }
  }
  const group = world.groups.find((item) => item.id === draft.groupId)
  if (!group) return { world, error: 'Pick a class group.' }
  const member = group.kids.some((item) => item.familyId === familyId && item.kidId === kidId)
  if (!member) return { world, error: 'That kid is not in this class group.' }
  const title = draft.title.trim().replace(/\s+/g, ' ')
  if (title.length < 2 || title.length > 80) return { world, error: 'Assignment titles need 2 to 80 characters.' }
  const link = draft.link.trim()
  if (link && !/^https?:\/\//i.test(link)) return { world, error: 'Links need to start with https://.' }
  const family = familyById(world, familyId)
  const assignment: GroupAssignment = {
    id: crypto.randomUUID(),
    groupId: group.id,
    title,
    subject: draft.subject.trim().slice(0, 40),
    notes: draft.notes.trim().slice(0, 400),
    points: clampPoints(draft.points || DEFAULT_ASSIGNMENT_POINTS, DEFAULT_ASSIGNMENT_POINTS),
    due: draft.due.trim().slice(0, 20),
    link,
    active: true,
    createdAt: new Date(now).toISOString(),
    authorFamilyId: familyId,
    authorEmail: actor,
    authorFamilyName: family?.name ?? 'Family',
  }
  return { world: { ...world, groupAssignments: [assignment, ...world.groupAssignments] } }
}

export function updateGroupAssignment(
  world: World,
  actorEmail: string,
  familyId: string,
  assignmentId: string,
  draft: AssignmentDraft,
): { world: World; error?: string } {
  const current = world.groupAssignments.find((item) => item.id === assignmentId)
  if (!current) return { world, error: 'That assignment is gone.' }
  if (!canEditGroupAssignment(familyId, current)) return { world, error: 'You can read this class assignment, not change it.' }
  if (!parentOf(world, actorEmail, familyId)) return { world, error: 'That family is not yours.' }
  const title = draft.title.trim().replace(/\s+/g, ' ')
  if (title.length < 2 || title.length > 80) return { world, error: 'Assignment titles need 2 to 80 characters.' }
  return {
    world: {
      ...world,
      groupAssignments: world.groupAssignments.map((item) =>
        item.id === assignmentId
          ? {
              ...item,
              title,
              subject: draft.subject.trim().slice(0, 40),
              notes: draft.notes.trim().slice(0, 400),
              points: clampPoints(draft.points || item.points, item.points),
              due: draft.due.trim().slice(0, 20),
              link: draft.link.trim(),
            }
          : item,
      ),
    },
  }
}

export function deleteGroupAssignment(world: World, actorEmail: string, familyId: string, assignmentId: string): { world: World; error?: string } {
  const current = world.groupAssignments.find((item) => item.id === assignmentId)
  if (!current) return { world, error: 'That assignment is gone.' }
  if (!canEditGroupAssignment(familyId, current)) return { world, error: 'You can read this class assignment, not delete it.' }
  if (!parentOf(world, actorEmail, familyId)) return { world, error: 'That family is not yours.' }
  return { world: { ...world, groupAssignments: world.groupAssignments.filter((item) => item.id !== assignmentId) } }
}

export function updateOwnAssignment(
  world: World,
  familyId: string,
  kidId: string,
  assignmentId: string,
  draft: AssignmentDraft,
): { world: World; error?: string } {
  const kid = world.kids.find((entry) => entry.familyId === familyId && entry.id === kidId)
  if (!kid) return { world, error: 'Pick a kid in your family.' }
  const updated = updatePersonalAssignment(kid, assignmentId, draft)
  if (updated.error) return { world, error: updated.error }
  return { world: replaceKid(world, updated.kid) }
}

export function deleteOwnAssignment(world: World, familyId: string, kidId: string, assignmentId: string): { world: World; error?: string } {
  const kid = world.kids.find((entry) => entry.familyId === familyId && entry.id === kidId)
  if (!kid) return { world, error: 'Pick a kid in your family.' }
  return { world: replaceKid(world, removePersonalAssignment(kid, assignmentId)) }
}

function parentOf(world: World, actorEmail: string, familyId: string): boolean {
  const actor = actorEmail.trim().toLowerCase()
  if (foundingParent(actor) && familyId === FOUNDING_FAMILY_ID) return true
  return world.directory.some((entry) => entry.email === actor && entry.familyId === familyId && entry.role === 'parent')
}

export function setGeminiCap(world: World, familyId: string, usd: number): { world: World; error?: string } {
  if (!familyById(world, familyId)) return { world, error: 'Missing family.' }
  const cap = Math.min(50, Math.max(0, Math.round(usd)))
  return {
    world: {
      ...world,
      families: world.families.map((family) => (family.id === familyId ? { ...family, geminiMonthlyCapUsd: cap } : family)),
    },
  }
}

export type PortalAssignment = GroupAssignment & { canEdit: boolean }

export type ParentPortal = {
  family: FamilyRecord
  kids: Array<{ kid: KidProfile; groupAssignments: PortalAssignment[] }>
  archived: KidProfile[]
  canInvite: boolean
  canManageGroups: boolean
}

export function parentPortal(world: World, familyId: string): ParentPortal | null {
  const family = familyById(world, familyId)
  if (!family) return null
  const kids = kidsInFamily(world, familyId).map((kid) => ({
    kid,
    groupAssignments: visibleGroupAssignments(world, familyId, kid.id).map((assignment) => ({
      ...assignment,
      canEdit: canEditGroupAssignment(familyId, assignment),
    })),
  }))
  return {
    family,
    kids,
    archived: world.kids.filter((kid) => kid.familyId === familyId && kid.archived),
    canInvite: familyId === FOUNDING_FAMILY_ID,
    canManageGroups: familyId === FOUNDING_FAMILY_ID,
  }
}

export function normalizeWorld(raw: Partial<World> | null | undefined): World {
  if (!raw || !Array.isArray(raw.families) || raw.families.length === 0) return foundingWorld()
  const base = raw.families.some((family) => family.id === FOUNDING_FAMILY_ID) ? null : foundingWorld()
  const families = [...(base?.families ?? []), ...raw.families].map((family) => ({
    ...family,
    groupIds: Array.isArray(family.groupIds) ? family.groupIds : [],
    roster: Array.isArray(family.roster) ? family.roster : [],
    geminiMonthlyCapUsd: typeof family.geminiMonthlyCapUsd === 'number' ? family.geminiMonthlyCapUsd : DEFAULT_GEMINI_CAP_USD,
    studyThresholds: family.studyThresholds ?? { ...DEFAULT_THRESHOLDS },
  }))
  const seen = new Set<string>()
  return ensureMapAssignment({
    families: families.filter((family) => (seen.has(family.id) ? false : (seen.add(family.id), true))),
    kids: [...(base?.kids ?? []), ...(raw.kids ?? [])].map((kid) => normalizeKid(kid)),
    directory: [...(base?.directory ?? []), ...(raw.directory ?? [])],
    groups: raw.groups ?? [],
    groupAssignments: raw.groupAssignments ?? [],
  })
}

export function signInChoices(world: World): DirectoryEntry[] {
  const seen = new Set<string>()
  const list: DirectoryEntry[] = []
  for (const entry of world.directory) {
    if (!entry.email || seen.has(entry.email)) continue
    seen.add(entry.email)
    list.push(entry)
  }
  return list
}

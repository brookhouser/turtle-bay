import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import { emailKey } from '../family/ids'
import type { ClassGroup, DirectoryEntry, FamilyRecord, GroupAssignment, World } from '../family/model'
import { emptyWorld } from '../family/world'
import { publicKidPayload, homeBoard, schoolProjection } from '../family/privacy'
import { FOUNDING_FAMILY_ID, WALLY_SCHOOL_EMAIL, foundingKid, foundingParent } from '../family/roster'
import { normalizeKid } from '../game/logic'
import type { KidProfile, SessionData } from '../types'
import { getFirebaseConfig } from './env'

function primaryApp(): FirebaseApp {
  return getApps().find((app) => app.name === '[DEFAULT]') ?? initializeApp(getFirebaseConfig())
}

function db(): Firestore {
  return getFirestore(primaryApp())
}

function friendlyAuth(error: unknown, fallback: string): Error {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : ''
  if (code === 'auth/popup-closed-by-user') return new Error('Google sign in was closed before it finished.')
  if (code === 'auth/unauthorized-domain') return new Error('This site is not on the Firebase authorized domains list yet.')
  if (code === 'auth/network-request-failed') return new Error('The network hiccuped. Check the connection and try again.')
  return new Error(fallback)
}

export function watchAuth(onUser: (user: User | null) => void): () => void {
  return onAuthStateChanged(getAuth(primaryApp()), onUser)
}

export async function signInWithGoogle(): Promise<{ email: string }> {
  try {
    const cred = await signInWithPopup(getAuth(primaryApp()), new GoogleAuthProvider())
    const email = cred.user.email?.toLowerCase() ?? ''
    if (!email) {
      await signOut(getAuth(primaryApp()))
      throw new Error('That Google account has no email.')
    }
    return { email }
  } catch (error) {
    if (error instanceof Error && error.message.includes('no email')) throw error
    throw friendlyAuth(error, 'Google sign in did not finish.')
  }
}

export async function signOutBay(): Promise<void> {
  await signOut(getAuth(primaryApp()))
}

export async function loadAccount(email: string): Promise<SessionData | null> {
  const founding = accountFromEmail(email, null)
  if (founding) return founding
  const snap = await getDoc(doc(db(), 'directory', emailKey(email)))
  if (!snap.exists()) return null
  return accountFromEmail(email, snap.data() as DirectoryEntry)
}

export function accountFromEmail(email: string, entry: DirectoryEntry | null): SessionData | null {
  const normalized = email.trim().toLowerCase()
  const parent = foundingParent(normalized)
  if (parent) return { role: 'parent', familyId: FOUNDING_FAMILY_ID, email: parent.email }
  const kid = foundingKid(normalized)
  if (kid) return { role: 'kid', familyId: FOUNDING_FAMILY_ID, kidId: kid.key, email: kid.email, scope: 'family' }
  const school = WALLY_SCHOOL_EMAIL.trim().toLowerCase()
  if (school && normalized === school && normalized !== 'wilsonbrookhouser@gmail.com') {
    return { role: 'kid', familyId: FOUNDING_FAMILY_ID, kidId: 'wally', email: school, scope: 'school' }
  }
  if (!entry || entry.email !== normalized) return null
  if (entry.role === 'parent') return { role: 'parent', familyId: entry.familyId, email: entry.email }
  if (entry.role === 'kid' && entry.kidId) return { role: 'kid', familyId: entry.familyId, kidId: entry.kidId, email: entry.email, scope: 'family' }
  return null
}

type Listener = {
  families: FamilyRecord[]
  kids: KidProfile[]
  groups: ClassGroup[]
  groupAssignments: GroupAssignment[]
  directory: DirectoryEntry[]
}

export function subscribeFamily(
  session: SessionData,
  onWorld: (world: World) => void,
  onError: (message: string) => void,
): () => void {
  const unsubs: Array<() => void> = []
  const state: Listener = { families: [], kids: [], groups: [], groupAssignments: [], directory: [] }
  let groupUnsubs: Array<() => void> = []
  let seenGroups = ''

  function emit() {
    onWorld({ ...emptyWorld(), ...state })
  }

  function watchGroups(groupIds: string[], assignmentsOnly = false) {
    const key = `${assignmentsOnly ? 'a' : 'g'}:${[...groupIds].sort().join(',')}`
    if (key === seenGroups) return
    seenGroups = key
    groupUnsubs.forEach((stop) => stop())
    groupUnsubs = []
    state.groups = []
    state.groupAssignments = state.groupAssignments.filter((item) => groupIds.includes(item.groupId))
    for (const groupId of groupIds) {
      if (!assignmentsOnly) {
        groupUnsubs.push(onSnapshot(doc(db(), 'groups', groupId), (snap) => {
          if (!snap.exists()) {
            state.groups = state.groups.filter((group) => group.id !== groupId)
            emit()
            return
          }
          const data = snap.data() as ClassGroup
          const group = { ...data, id: snap.id }
          state.groups = [...state.groups.filter((item) => item.id !== group.id), group]
          emit()
        }, () => onError('Could not open a class group.')))
      }
      groupUnsubs.push(onSnapshot(collection(db(), 'groups', groupId, 'assignments'), (snap) => {
        const mine = snap.docs.map((child) => ({ ...(child.data() as GroupAssignment), id: child.id, groupId }))
        state.groupAssignments = [
          ...state.groupAssignments.filter((item) => item.groupId !== groupId),
          ...mine,
        ]
        emit()
      }, () => onError('Could not load class assignments.')))
    }
  }

  const familyId = session.familyId
  const school = session.role === 'kid' && session.scope === 'school'
  if (school) {
    unsubs.push(onSnapshot(doc(db(), 'families', familyId, 'kids', session.kidId), (snap) => {
      if (!snap.exists()) {
        state.kids = []
        emit()
        return
      }
      const kid = schoolProjection(normalizeKid({ ...(snap.data() as KidProfile), id: snap.id, familyId }))
      state.kids = [kid]
      watchGroups(kid.groupIds, true)
      emit()
    }, () => onError('Could not open the school profile.')))
    return () => {
      unsubs.forEach((stop) => stop())
      groupUnsubs.forEach((stop) => stop())
    }
  }
  if (session.role === 'parent' && familyId === FOUNDING_FAMILY_ID) {
    unsubs.push(onSnapshot(collection(db(), 'families'), (snap) => {
      state.families = snap.docs.map((child) => ({ ...(child.data() as FamilyRecord), id: child.id }))
      const mine = state.families.find((family) => family.id === familyId)
      watchGroups(mine?.groupIds ?? [])
      emit()
    }, () => onError('Could not load families.')))
  } else {
    unsubs.push(onSnapshot(doc(db(), 'families', familyId), (snap) => {
      if (!snap.exists()) {
        state.families = []
        emit()
        return
      }
      const family = { ...(snap.data() as FamilyRecord), id: snap.id }
      state.families = [family]
      if (session.role === 'parent') watchGroups(family.groupIds)
      emit()
    }, () => onError('Could not open this family.')))
  }

  if (session.role === 'parent') {
    unsubs.push(onSnapshot(collection(db(), 'families', familyId, 'kids'), (snap) => {
      state.kids = snap.docs.map((child) => normalizeKid({ ...(child.data() as KidProfile), id: child.id, familyId }))
      emit()
    }, () => onError('Could not load kids in this family.')))
  } else {
    unsubs.push(onSnapshot(doc(db(), 'families', familyId, 'kids', session.kidId), (snap) => {
      state.kids = snap.exists()
        ? [normalizeKid({ ...(snap.data() as KidProfile), id: snap.id, familyId })]
        : []
      if (session.role === 'kid') watchGroups(state.kids[0]?.groupIds ?? [])
      emit()
    }, () => onError('Could not open this kid.')))
  }

  return () => {
    unsubs.forEach((stop) => stop())
    groupUnsubs.forEach((stop) => stop())
  }
}

function familyPayload(family: FamilyRecord): Record<string, unknown> {
  return {
    name: family.name,
    invitedBy: family.invitedBy,
    groupIds: family.groupIds,
    geminiMonthlyCapUsd: family.geminiMonthlyCapUsd,
    studyThresholds: family.studyThresholds,
    roster: family.roster,
  }
}

function canWriteKid(session: SessionData, kid: KidProfile): boolean {
  if (kid.familyId !== session.familyId) return false
  if (session.role === 'parent') return true
  return session.kidId === kid.id
}

export async function persistDiff(prev: World, next: World, session: SessionData): Promise<void> {
  const database = db()
  for (const family of next.families) {
    const before = prev.families.find((item) => item.id === family.id)
    if (JSON.stringify(before) === JSON.stringify(family)) continue
    if (session.role !== 'parent') continue
    const ownFamily = family.id === session.familyId
    const inviteMeta = session.familyId === FOUNDING_FAMILY_ID && family.id !== FOUNDING_FAMILY_ID
    if (!ownFamily && !inviteMeta) continue
    await setDoc(doc(database, 'families', family.id), familyPayload(family))
  }
  for (const kid of next.kids) {
    const before = prev.kids.find((item) => item.familyId === kid.familyId && item.id === kid.id)
    if (JSON.stringify(before) === JSON.stringify(kid)) continue
    if (!canWriteKid(session, kid)) continue
    const kidRef = doc(database, 'families', kid.familyId, 'kids', kid.id)
    if (session.role === 'kid' && session.scope === 'school') {
      await setDoc(kidRef, {
        credits: kid.credits,
        turtle: kid.turtle,
        academicChecks: kid.completions.filter((item) => item.kind === 'assignment'),
        practiceDays: kid.practiceDays,
        lessons: kid.lessons,
        sessions: kid.sessions,
        spellingSessions: kid.spellingSessions,
      }, { merge: true })
      continue
    }
    await setDoc(kidRef, publicKidPayload(kid))
    await setDoc(doc(database, 'families', kid.familyId, 'kids', kid.id, 'private', 'home'), homeBoard(kid))
  }
  for (const entry of next.directory) {
    if (prev.directory.some((item) => item.email === entry.email)) continue
    if (entry.familyId === FOUNDING_FAMILY_ID) continue
    const foundingParent = session.role === 'parent' && session.familyId === FOUNDING_FAMILY_ID
    const ownParent = session.role === 'parent' && session.familyId === entry.familyId && entry.role === 'kid'
    if (!foundingParent && !ownParent) continue
    await setDoc(doc(database, 'directory', emailKey(entry.email)), entry)
  }
  if (session.role === 'parent' && session.familyId === FOUNDING_FAMILY_ID) {
    for (const group of next.groups) {
      const before = prev.groups.find((item) => item.id === group.id)
      if (JSON.stringify(before) === JSON.stringify(group)) continue
      await setDoc(doc(database, 'groups', group.id), {
        name: group.name,
        ownerFamilyId: group.ownerFamilyId,
        familyIds: group.familyIds,
        kids: group.kids,
      })
      for (const familyId of group.familyIds) {
        await setDoc(doc(database, 'groups', group.id, 'families', familyId), { familyId })
      }
      for (const member of group.kids) {
        await setDoc(doc(database, 'groups', group.id, 'kids', `${member.familyId}_${member.kidId}`), member)
      }
    }
  }
  for (const assignment of next.groupAssignments) {
    const before = prev.groupAssignments.find((item) => item.id === assignment.id)
    if (JSON.stringify(before) === JSON.stringify(assignment)) continue
    if (assignment.authorFamilyId !== session.familyId || session.role !== 'parent') continue
    const { id, ...rest } = assignment
    await setDoc(doc(database, 'groups', assignment.groupId, 'assignments', id), rest)
  }
  for (const assignment of prev.groupAssignments) {
    if (next.groupAssignments.some((item) => item.id === assignment.id)) continue
    if (assignment.authorFamilyId !== session.familyId || session.role !== 'parent') continue
    await deleteDoc(doc(database, 'groups', assignment.groupId, 'assignments', assignment.id))
  }
}

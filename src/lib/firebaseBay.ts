import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { collection, doc, getDoc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore'
import { createKid, normalizeKid } from '../game/logic'
import { getAllowlist, getFamilyId, getFirebaseConfig } from './env'
import { hashPin } from './pin'
import type { KidProfile } from '../types'

function primaryApp(): FirebaseApp {
  return getApps().find((app) => app.name === '[DEFAULT]') ?? initializeApp(getFirebaseConfig())
}

function makerApp(): FirebaseApp {
  return getApps().find((app) => app.name === 'kid-maker') ?? initializeApp(getFirebaseConfig(), 'kid-maker')
}

export function kidAuthEmail(nickname: string): string {
  return `${nickname.trim().toLowerCase()}@kid.turtlebay.app`
}

function friendlyAuth(error: unknown, fallback: string): Error {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : ''
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-login-credentials'
  ) {
    return new Error('That bay name and PIN do not match.')
  }
  if (code === 'auth/email-already-in-use') return new Error('That bay name is taken.')
  if (code === 'auth/popup-closed-by-user') return new Error('Google sign in was closed before it finished.')
  if (code === 'auth/unauthorized-domain') {
    return new Error('This site is not on the Firebase authorized domains list yet.')
  }
  if (code === 'auth/network-request-failed') return new Error('The network hiccuped. Check the connection and try again.')
  if (code === 'auth/weak-password') return new Error('Use 6 to 12 letters or numbers for the PIN.')
  return new Error(fallback)
}

function kidFromDoc(id: string, data: unknown): KidProfile | null {
  if (!data || typeof data !== 'object') return null
  const raw = data as Partial<KidProfile>
  if (typeof raw.nickname !== 'string') return null
  try {
    return normalizeKid({ ...raw, id, nickname: raw.nickname })
  } catch {
    return null
  }
}

function kidRef(id: string) {
  return doc(getFirestore(primaryApp()), 'families', getFamilyId(), 'kids', id)
}

export async function saveKid(kid: KidProfile): Promise<void> {
  const payload = JSON.parse(JSON.stringify(kid)) as KidProfile
  await setDoc(kidRef(kid.id), payload)
}

export async function loadKid(id: string): Promise<KidProfile | null> {
  const snap = await getDoc(kidRef(id))
  if (!snap.exists()) return null
  return kidFromDoc(snap.id, snap.data())
}

export function watchAuth(onUser: (user: User | null) => void): () => void {
  return onAuthStateChanged(getAuth(primaryApp()), onUser)
}

export function watchKids(onData: (kids: KidProfile[]) => void, onError: (message: string) => void): () => void {
  const kids = collection(getFirestore(primaryApp()), 'families', getFamilyId(), 'kids')
  return onSnapshot(
    kids,
    (snap) => {
      const list: KidProfile[] = []
      snap.forEach((child) => {
        const kid = kidFromDoc(child.id, child.data())
        if (kid) list.push(kid)
      })
      onData(list)
    },
    () => onError('Could not load kid bays. Check the Firestore rules and parent login.'),
  )
}

async function writeNewKid(uid: string, nickname: string, pin: string): Promise<KidProfile> {
  const kid = createKid(nickname.trim(), await hashPin(nickname, pin), uid)
  await saveKid(kid)
  return kid
}

export async function signUpKid(nickname: string, pin: string): Promise<KidProfile> {
  try {
    const cred = await createUserWithEmailAndPassword(getAuth(primaryApp()), kidAuthEmail(nickname), pin)
    return await writeNewKid(cred.user.uid, nickname, pin)
  } catch (error) {
    throw friendlyAuth(error, 'Could not start that bay.')
  }
}

export async function signInKid(nickname: string, pin: string): Promise<KidProfile> {
  try {
    const cred = await signInWithEmailAndPassword(getAuth(primaryApp()), kidAuthEmail(nickname), pin)
    const existing = await loadKid(cred.user.uid)
    if (existing) return existing
    return await writeNewKid(cred.user.uid, nickname, pin)
  } catch (error) {
    throw friendlyAuth(error, 'Could not open that bay.')
  }
}

export async function createKidAsParent(nickname: string, pin: string): Promise<KidProfile> {
  const auth = getAuth(makerApp())
  try {
    const cred = await createUserWithEmailAndPassword(auth, kidAuthEmail(nickname), pin)
    const kid = await writeNewKid(cred.user.uid, nickname, pin)
    await signOut(auth)
    return kid
  } catch (error) {
    throw friendlyAuth(error, 'Could not add that kid bay.')
  }
}

// Matches isParent() in firestore.rules: Google sign in, verified email, on the list.
// Email/Password is on for kid bays, so a password account using a parent address never counts.
export async function isParentUser(user: User): Promise<boolean> {
  const email = user.email?.toLowerCase() ?? ''
  if (!email || !user.emailVerified || !getAllowlist().includes(email)) return false
  const token = await user.getIdTokenResult()
  return token.signInProvider === 'google.com' && token.claims.email_verified === true
}

export async function signInParent(): Promise<{ email: string }> {
  try {
    const cred = await signInWithPopup(getAuth(primaryApp()), new GoogleAuthProvider())
    const email = cred.user.email?.toLowerCase() ?? ''
    if (!(await isParentUser(cred.user))) {
      await signOut(getAuth(primaryApp()))
      throw new Error('That Google account is not on the parent list.')
    }
    return { email }
  } catch (error) {
    if (error instanceof Error && error.message.includes('parent list')) throw error
    throw friendlyAuth(error, 'Google sign in did not finish.')
  }
}

export async function signOutBay(): Promise<void> {
  await signOut(getAuth(primaryApp()))
}

import type { User } from 'firebase/auth'
import type { KidProfile } from '../types'

export type FirebaseApi = {
  saveKid: (kid: KidProfile) => Promise<void>
  loadKid: (id: string) => Promise<KidProfile | null>
  watchAuth: (onUser: (user: User | null) => void) => () => void
  watchKids: (onData: (kids: KidProfile[]) => void, onError: (message: string) => void) => () => void
  signUpKid: (nickname: string, pin: string) => Promise<KidProfile>
  signInKid: (nickname: string, pin: string) => Promise<KidProfile>
  createKidAsParent: (nickname: string, pin: string) => Promise<KidProfile>
  signInParent: () => Promise<{ email: string }>
  signOutBay: () => Promise<void>
}

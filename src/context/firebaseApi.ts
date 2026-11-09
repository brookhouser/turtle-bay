import type { User } from 'firebase/auth'
import type { World } from '../family/model'
import type { SessionData } from '../types'

export type FirebaseApi = {
  signInWithGoogle: () => Promise<{ email: string }>
  signOutBay: () => Promise<void>
  watchAuth: (onUser: (user: User | null) => void) => () => void
  loadAccount: (email: string) => Promise<SessionData | null>
  subscribeFamily: (
    session: SessionData,
    onWorld: (world: World) => void,
    onError: (message: string) => void,
  ) => () => void
  persistDiff: (prev: World, next: World, session: SessionData) => Promise<void>
}

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  addChallenge as addChallengeToKid,
  applyDecay,
  applyLessonResult,
  buyItem as buyItemForKid,
  cleanTurtle as cleanTurtleForKid,
  createKid,
  equipItem as equipItemForKid,
  feedTurtle as feedTurtleForKid,
  normalizeKid,
  petTurtle as petTurtleForKid,
  renameTurtle as renameTurtleForKid,
  unequipItem as unequipItemForKid,
  upgradeHabitat as upgradeHabitatForKid,
  validateNickname,
  validatePin,
} from '../game/logic'
import { firebaseMode, getAllowlist } from '../lib/env'
import type { FirebaseApi } from './firebaseApi'
import { BayContext } from './useBay'
import { markDemoImported, withDemoProgress } from '../lib/demoImport'
import { hashPin } from '../lib/pin'
import { loadSave, loadSession, persistSave, persistSession } from '../lib/storage'
import type {
  ChallengeDraft,
  KidProfile,
  LessonInput,
  LessonSummary,
  SaveData,
  SessionData,
} from '../types'

export type BayContextValue = {
  ready: boolean
  mode: 'demo' | 'firebase'
  bootError: string | null
  allowlist: string[]
  session: SessionData | null
  kid: KidProfile | null
  kids: KidProfile[]
  toast: string | null
  signInKid: (nickname: string, pin: string) => Promise<string | null>
  signUpKid: (nickname: string, pin: string) => Promise<string | null>
  signInParent: (email?: string) => Promise<string | null>
  signOutBay: () => Promise<void>
  createKidBay: (nickname: string, pin: string) => Promise<string | null>
  renameTurtle: (name: string) => string | null
  petTurtle: () => string | null
  feedTurtle: (snackId?: string) => string | null
  cleanTurtle: () => string | null
  buyItem: (itemId: string) => string | null
  equipItem: (itemId: string) => string | null
  unequipItem: (itemId: string) => string | null
  upgradeHabitat: () => string | null
  recordLesson: (input: LessonInput) => LessonSummary | null
  addChallenge: (kidId: string, draft: ChallengeDraft) => string | null
  clearDemoKids: () => void
  pushToast: (message: string) => void
}

async function loadFirebase(): Promise<FirebaseApi> {
  return import('../lib/firebaseBay')
}

export function BayProvider({ children }: { children: ReactNode }) {
  const mode = firebaseMode() ? 'firebase' : 'demo'
  const allowlist = useMemo(() => getAllowlist(), [])
  const [save, setSave] = useState<SaveData>({ kids: [] })
  const [session, setSession] = useState<SessionData | null>(null)
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const fbRef = useRef<FirebaseApi | null>(null)
  const sessionRef = useRef<SessionData | null>(null)
  const kidRef = useRef<KidProfile | null>(null)
  const writeKidRef = useRef<(nextKid: KidProfile) => void>(() => {})
  const kidsUnsub = useRef<(() => void) | null>(null)
  const toastTimer = useRef<number>(0)

  sessionRef.current = session

  const kid = session?.role === 'kid' ? (save.kids.find((entry) => entry.id === session.kidId) ?? null) : null
  kidRef.current = kid

  const kids = useMemo(() => {
    if (session?.role === 'parent') {
      return save.kids.map((entry) => ({ ...entry, turtle: applyDecay(entry.turtle) }))
    }
    return kid ? [kid] : []
  }, [session, save.kids, kid])

  function pushToast(message: string) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }

  function rememberSession(next: SessionData | null) {
    setSession(next)
    sessionRef.current = next
    if (mode === 'demo') persistSession(next)
  }

  function writeSave(next: SaveData) {
    setSave(next)
    if (mode === 'demo') persistSave(next)
  }

  async function remoteSave(nextKid: KidProfile) {
    if (mode !== 'firebase') return
    const fb = fbRef.current ?? (await loadFirebase())
    fbRef.current = fb
    await fb.saveKid(nextKid)
  }

  function writeKid(nextKid: KidProfile) {
    setSave((prev) => {
      const exists = prev.kids.some((entry) => entry.id === nextKid.id)
      const next = {
        kids: exists ? prev.kids.map((entry) => (entry.id === nextKid.id ? nextKid : entry)) : [...prev.kids, nextKid],
      }
      if (mode === 'demo') persistSave(next)
      return next
    })
    if (kidRef.current?.id === nextKid.id) kidRef.current = nextKid
    if (mode === 'firebase') void remoteSave(nextKid).catch(() => pushToast('Could not sync this bay just now.'))
  }

  writeKidRef.current = writeKid
  const activeKidId = session?.role === 'kid' ? session.kidId : null

  useEffect(() => {
    let cancelled = false
    let unsubAuth = () => {}

    async function boot() {
      if (mode === 'demo') {
        const stored = loadSave()
        const storedSession = loadSession()
        const kidsNormalized = stored.kids.map((entry) => normalizeKid(entry))
        let nextSession = storedSession
        if (storedSession?.role === 'kid' && !kidsNormalized.some((entry) => entry.id === storedSession.kidId)) {
          nextSession = null
        }
        const withDecay = kidsNormalized.map((entry) => {
          if (nextSession?.role === 'kid' && entry.id === nextSession.kidId) {
            return { ...entry, turtle: applyDecay(entry.turtle) }
          }
          return entry
        })
        if (!cancelled) {
          writeSave({ kids: withDecay })
          rememberSession(nextSession)
          setReady(true)
        }
        return
      }

      try {
        const fb = await loadFirebase()
        if (cancelled) return
        fbRef.current = fb
        unsubAuth = fb.watchAuth((user) => {
          void (async () => {
            if (cancelled) return
            if (!user) {
              kidsUnsub.current?.()
              kidsUnsub.current = null
              setSession(null)
              setReady(true)
              return
            }
            const email = user.email?.toLowerCase() ?? ''
            if (email.endsWith('@kid.turtlebay.app')) {
              const loaded = await fb.loadKid(user.uid)
              if (!loaded) {
                setBootError('This login has no bay saved yet.')
                await fb.signOutBay()
                setReady(true)
                return
              }
              const nextKid = { ...loaded, turtle: applyDecay(loaded.turtle) }
              setSave({ kids: [nextKid] })
              setSession({ role: 'kid', kidId: nextKid.id })
              await fb.saveKid(nextKid)
              setReady(true)
              return
            }
            if (!allowlist.includes(email) || !(await fb.isParentUser(user))) {
              await fb.signOutBay()
              setBootError('That Google account is not on the parent list.')
              setSession(null)
              setReady(true)
              return
            }
            kidsUnsub.current?.()
            kidsUnsub.current = fb.watchKids(
              (list) => setSave({ kids: list.map((entry) => normalizeKid(entry)) }),
              (message) => setBootError(message),
            )
            setSession({ role: 'parent', email })
            setReady(true)
          })()
        })
      } catch (error) {
        if (!cancelled) {
          setBootError(error instanceof Error ? error.message : 'Firebase did not start.')
          setReady(true)
        }
      }
    }

    void boot()
    return () => {
      cancelled = true
      unsubAuth()
      kidsUnsub.current?.()
    }
    // Boot once. mode and allowlist are stable for the page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!activeKidId) return
    const id = window.setInterval(() => {
      const current = kidRef.current
      const active = sessionRef.current
      if (!current || active?.role !== 'kid' || active.kidId !== current.id) return
      const next = { ...current, turtle: applyDecay(current.turtle) }
      if (next.turtle.lastTick === current.turtle.lastTick) return
      writeKidRef.current(next)
    }, 60_000)
    return () => window.clearInterval(id)
  }, [activeKidId])

  // First synced sign in on a browser that has demo progress: carry the turtle over once.
  async function importDemo(fb: FirebaseApi, cloud: KidProfile): Promise<KidProfile> {
    const found = withDemoProgress(cloud)
    if (!found) return cloud
    try {
      await fb.saveKid(found.kid)
      markDemoImported(found.demoId, cloud.id)
      pushToast('Your turtle came along from demo mode.')
      return found.kid
    } catch {
      return cloud
    }
  }

  async function signUpKid(nickname: string, pin: string): Promise<string | null> {
    const nameError = validateNickname(nickname)
    if (nameError) return nameError
    const pinError = validatePin(pin, mode === 'firebase')
    if (pinError) return pinError
    if (mode === 'firebase') {
      try {
        const fb = fbRef.current ?? (await loadFirebase())
        fbRef.current = fb
        const fresh = await fb.signUpKid(nickname, pin)
        const created = await importDemo(fb, fresh)
        setSave({ kids: [created] })
        setSession({ role: 'kid', kidId: created.id })
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'Could not start that bay.'
      }
    }
    const stored = loadSave()
    const kidsNormalized = stored.kids.map((entry) => normalizeKid(entry))
    if (kidsNormalized.some((entry) => entry.nickname.toLowerCase() === nickname.trim().toLowerCase())) {
      return 'That bay name is taken.'
    }
    const created = createKid(nickname.trim(), await hashPin(nickname, pin))
    const next = { kids: [...kidsNormalized, created] }
    writeSave(next)
    rememberSession({ role: 'kid', kidId: created.id })
    return null
  }

  async function signInKid(nickname: string, pin: string): Promise<string | null> {
    const nameError = validateNickname(nickname)
    if (nameError) return nameError
    const pinError = validatePin(pin, mode === 'firebase')
    if (pinError) return pinError
    if (mode === 'firebase') {
      try {
        const fb = fbRef.current ?? (await loadFirebase())
        fbRef.current = fb
        const loaded = await importDemo(fb, await fb.signInKid(nickname, pin))
        const nextKid = { ...loaded, turtle: applyDecay(loaded.turtle) }
        setSave({ kids: [nextKid] })
        setSession({ role: 'kid', kidId: nextKid.id })
        await fb.saveKid(nextKid)
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'Could not open that bay.'
      }
    }
    const stored = loadSave()
    const kidsNormalized = stored.kids.map((entry) => normalizeKid(entry))
    const found = kidsNormalized.find((entry) => entry.nickname.toLowerCase() === nickname.trim().toLowerCase())
    if (!found) return 'No bay uses that name yet. Start a new bay.'
    const hashed = await hashPin(nickname, pin)
    if (hashed !== found.pinHash) return 'That bay name and PIN do not match.'
    const nextKid = { ...found, turtle: applyDecay(found.turtle) }
    writeSave({ kids: kidsNormalized.map((entry) => (entry.id === nextKid.id ? nextKid : entry)) })
    rememberSession({ role: 'kid', kidId: nextKid.id })
    return null
  }

  async function signInParent(email?: string): Promise<string | null> {
    if (mode === 'firebase') {
      try {
        const fb = fbRef.current ?? (await loadFirebase())
        fbRef.current = fb
        await fb.signInParent()
        setBootError(null)
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'Google sign in did not finish.'
      }
    }
    const normalized = (email ?? '').trim().toLowerCase()
    if (!allowlist.includes(normalized)) return 'That email is not on the parent list.'
    const stored = loadSave()
    writeSave({ kids: stored.kids.map((entry) => normalizeKid(entry)) })
    rememberSession({ role: 'parent', email: normalized })
    return null
  }

  async function signOutBay() {
    kidsUnsub.current?.()
    kidsUnsub.current = null
    if (mode === 'firebase') {
      const fb = fbRef.current ?? (await loadFirebase())
      fbRef.current = fb
      await fb.signOutBay()
    }
    rememberSession(null)
  }

  async function createKidBay(nickname: string, pin: string): Promise<string | null> {
    const nameError = validateNickname(nickname)
    if (nameError) return nameError
    const pinError = validatePin(pin, mode === 'firebase')
    if (pinError) return pinError
    if (mode === 'firebase') {
      try {
        const fb = fbRef.current ?? (await loadFirebase())
        fbRef.current = fb
        const created = await fb.createKidAsParent(nickname, pin)
        setSave((prev) => ({ kids: [...prev.kids.filter((entry) => entry.id !== created.id), created] }))
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'Could not add that kid bay.'
      }
    }
    const stored = loadSave()
    const kidsNormalized = stored.kids.map((entry) => normalizeKid(entry))
    if (kidsNormalized.some((entry) => entry.nickname.toLowerCase() === nickname.trim().toLowerCase())) {
      return 'That bay name is taken.'
    }
    const created = createKid(nickname.trim(), await hashPin(nickname, pin))
    writeSave({ kids: [...kidsNormalized, created] })
    return null
  }

  function mutate(run: (current: KidProfile) => { kid: KidProfile; error?: string }): string | null {
    const current = kidRef.current
    if (!current) return 'Sign in to a kid bay first.'
    const result = run(current)
    if (result.error) return result.error
    writeKid(result.kid)
    return null
  }

  function recordLesson(input: LessonInput): LessonSummary | null {
    const current = kidRef.current
    if (!current) return null
    const applied = applyLessonResult(current, input)
    writeKid(applied.kid)
    return {
      coins: applied.coinsEarned,
      passed: applied.passed,
      wpm: input.wpm,
      accuracy: input.accuracy,
      streak: input.streak,
    }
  }

  function addChallenge(kidId: string, draft: ChallengeDraft): string | null {
    const current = save.kids.find((entry) => entry.id === kidId)
    if (!current) return 'Pick a kid bay first.'
    const result = addChallengeToKid(current, draft)
    if (result.error) return result.error
    writeKid(result.kid)
    return null
  }

  function clearDemoKids() {
    if (mode !== 'demo') return
    writeSave({ kids: [] })
  }

  const value: BayContextValue = {
    ready,
    mode,
    bootError,
    allowlist,
    session,
    kid,
    kids,
    toast,
    signInKid,
    signUpKid,
    signInParent,
    signOutBay,
    createKidBay,
    renameTurtle: (name) => mutate((current) => renameTurtleForKid(current, name)),
    petTurtle: () => mutate((current) => petTurtleForKid(current)),
    feedTurtle: (snackId) => mutate((current) => feedTurtleForKid(current, snackId)),
    cleanTurtle: () => mutate((current) => cleanTurtleForKid(current)),
    buyItem: (itemId) => mutate((current) => buyItemForKid(current, itemId)),
    equipItem: (itemId) => mutate((current) => equipItemForKid(current, itemId)),
    unequipItem: (itemId) => mutate((current) => unequipItemForKid(current, itemId)),
    upgradeHabitat: () => mutate((current) => upgradeHabitatForKid(current)),
    recordLesson,
    addChallenge,
    clearDemoKids,
    pushToast,
  }

  return (
    <BayContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </BayContext.Provider>
  )
}

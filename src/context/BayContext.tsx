import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { FirebaseApi } from './firebaseApi'
import { BayContext } from './useBay'
import {
  addRoutine,
  addTask,
  removeRoutine,
  removeTask,
  toggleCheck,
  updateRoutine,
  updateTask,
  type CheckTarget,
} from '../family/board'
import type { AssignmentDraft, World } from '../family/model'
import { schoolProjection } from '../family/privacy'
import {
  addKidEmail as addKidEmailToWorld,
  createGroup,
  defaultAudience,
  deleteGroupAssignment,
  deleteOwnAssignment,
  ensureMapAssignment,
  ensureRosterKids,
  foundingWorld,
  inviteFamily as inviteFamilyWorld,
  normalizeWorld,
  postAssignment,
  resolveAccount,
  setGeminiCap as setCap,
  signInChoices,
  updateGroupAssignment,
  updateOwnAssignment,
  adoptLegacyKids,
  type InviteInput,
} from '../family/world'
import { chooseLook, toggleGear, unlockItem } from '../fighter/progress'
import { reviewPrompt } from '../fighter/policy'
import {
  addChallenge as addChallengeToKid,
  applyDecay,
  applyLessonResult,
  buyItem as buyItemForKid,
  cleanTurtle as cleanTurtleForKid,
  equipItem as equipItemForKid,
  feedSpellingPatty,
  feedTurtle as feedTurtleForKid,
  bankShellTreats,
  petTurtle as petTurtleForKid,
  recordSpellingSession,
  renameTurtle as renameTurtleForKid,
  unequipItem as unequipItemForKid,
  upgradeHabitat as upgradeHabitatForKid,
} from '../game/logic'
import { markDemoImported, withDemoProgress } from '../lib/demoImport'
import { firebaseMode } from '../lib/env'
import { loadSave, loadSession, loadWorld, persistSession, persistWorld } from '../lib/storage'
import { MAP_MASTERY_CREDITS, MAP_UNIT_ID } from '../study/mapUnit'
import { PEBBLE_UNIT_IDS } from '../study/pebbleUnits'
import { applyAnswer, blankStudy, clampThresholds, ensureUnit, recordTestPrep, unlockFor, type StudyThresholds, type UnitOverrides, type ZoneId } from '../study/engine'
import type { CharacterEdit, FighterLookId, KidProfile, LessonInput, LessonSummary, RoutineSlot, SessionData, SpellingSessionInput } from '../types'

export type BayContextValue = {
  ready: boolean
  mode: 'demo' | 'firebase'
  bootError: string | null
  session: SessionData | null
  world: World
  kid: KidProfile | null
  kids: KidProfile[]
  toast: string | null
  signInChoices: ReturnType<typeof signInChoices>
  signInWithGoogle: (demoEmail?: string) => Promise<string | null>
  previewSchool: () => void
  signOutBay: () => Promise<void>
  renameTurtle: (name: string) => string | null
  petTurtle: () => string | null
  feedTurtle: (snackId?: string) => string | null
  bankShells: (count?: number) => void
  cleanTurtle: () => string | null
  buyItem: (itemId: string) => string | null
  equipItem: (itemId: string) => string | null
  unequipItem: (itemId: string) => string | null
  upgradeHabitat: () => string | null
  recordLesson: (input: LessonInput) => LessonSummary | null
  recordSpelling: (input: SpellingSessionInput) => string | null
  feedPatty: (sessionId: string) => string | null
  addChallenge: (kidId: string, draft: Parameters<typeof addChallengeToKid>[1]) => string | null
  clearDemo: () => void
  pushToast: (message: string) => void
  saveTask: (kidId: string, taskId: string | null, draft: { title: string; notes?: string; points?: number; repeat?: 'daily' | 'once' }) => string | null
  deleteTask: (kidId: string, taskId: string) => void
  saveRoutine: (kidId: string, routineId: string | null, draft: { title: string; slot: RoutineSlot; points?: number }) => string | null
  deleteRoutine: (kidId: string, routineId: string) => void
  saveAssignment: (kidId: string, assignmentId: string | null, draft: AssignmentDraft) => string | null
  deleteAssignment: (kidId: string, assignmentId: string, group: boolean) => string | null
  toggleItem: (target: CheckTarget) => string | null
  inviteFamily: (input: InviteInput) => string | null
  addKidEmail: (familyId: string, kidId: string, email: string) => string | null
  createClassGroup: (name: string, kidId: string) => string | null
  setGeminiCap: (usd: number) => string | null
  chooseFighterLook: (lookId: FighterLookId) => string | null
  unlockFighter: (itemId: string) => string | null
  toggleFighterGear: (itemId: string) => string | null
  noteBlockedEdit: (prompt: string, reason: string) => void
  answerStudy: (unitId: string, wordId: string, correct: boolean) => { justMastered: boolean; unlockName: string; credits: number } | null
  saveTestPrep: (unitId: string, score: number) => void
  setStudyOverride: (kidId: string, unitId: string, zone: keyof UnitOverrides, on: boolean) => void
  setStudyThresholds: (next: Partial<StudyThresholds>) => void
  defaultAudienceFor: (kidId: string) => { audience: 'kid' | 'group'; groupId: string | null }
}

async function loadFirebase(): Promise<FirebaseApi> {
  return import('../lib/firebaseBay')
}

export function BayProvider({ children }: { children: ReactNode }) {
  const mode = firebaseMode() ? 'firebase' : 'demo'
  const [world, setWorld] = useState<World>(foundingWorld())
  const [session, setSession] = useState<SessionData | null>(null)
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const worldRef = useRef(world)
  const sessionRef = useRef(session)
  const fbRef = useRef<FirebaseApi | null>(null)
  const toastTimer = useRef(0)
  worldRef.current = world
  sessionRef.current = session

  const familyId = session?.familyId ?? null
  const rawKid = session?.role === 'kid'
    ? world.kids.find((entry) => entry.familyId === session.familyId && entry.id === session.kidId) ?? null
    : null
  const kid = rawKid && session?.role === 'kid' && session.scope === 'school' ? schoolProjection(rawKid) : rawKid
  const kids = useMemo(() => {
    if (session?.role !== 'parent') return kid ? [kid] : []
    return world.kids
      .filter((entry) => entry.familyId === session.familyId && !entry.archived)
      .map((entry) => ({ ...entry, turtle: applyDecay(entry.turtle) }))
  }, [session, world.kids, kid])

  function pushToast(message: string) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }

  function commit(next: World, nextSession: SessionData | null = sessionRef.current) {
    const previous = worldRef.current
    const safe = ensureMapAssignment(next)
    worldRef.current = safe
    setWorld(safe)
    if (mode === 'demo') persistWorld(safe)
    else if (nextSession) {
      void (async () => {
        const fb = fbRef.current ?? (await loadFirebase())
        fbRef.current = fb
        await fb.persistDiff(previous, safe, nextSession)
      })().catch(() => pushToast('Could not sync that change.'))
    }
  }

  useEffect(() => {
    let cancelled = false
    let unsubAuth = () => {}
    let unsubWorld = () => {}
    if (mode === 'demo') {
      const stored = loadWorld()
      let next = stored ? normalizeWorld(stored) : adoptLegacyKids(foundingWorld(), loadSave().kids)
      next = ensureRosterKids(next, 'turtlebay')
      const storedSession = loadSession()
      const preview = storedSession?.role === 'kid' && storedSession.scope === 'school' && storedSession.email === ''
      const account = storedSession ? resolveAccount(next, storedSession.email) : null
      const sessionOk = preview || (account && storedSession && account.role === storedSession.role && account.familyId === storedSession.familyId)
      setWorld(next)
      persistWorld(next)
      setSession(sessionOk ? storedSession : null)
      if (!sessionOk) persistSession(null)
      setReady(true)
      return
    }
    void (async () => {
      try {
        const fb = await loadFirebase()
        if (cancelled) return
        fbRef.current = fb
        unsubAuth = fb.watchAuth((user) => {
          unsubWorld()
          if (!user?.email) {
            setSession(null)
            setReady(true)
            return
          }
          void fb.loadAccount(user.email).then((account) => {
            if (!account) {
              void fb.signOutBay()
              setBootError('That Google account is not in a family yet.')
              setSession(null)
              setReady(true)
              return
            }
            setSession(account)
            setBootError(null)
            unsubWorld = fb.subscribeFamily(account, (remote) => {
              const merged = ensureRosterKids(ensureMapAssignment(remote), account.familyId)
              setWorld(merged)
              setReady(true)
            }, (message) => setBootError(message))
          })
        })
      } catch (error) {
        if (!cancelled) {
          setBootError(error instanceof Error ? error.message : 'Firebase did not start.')
          setReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
      unsubAuth()
      unsubWorld()
    }
  }, [mode])

  useEffect(() => {
    if (!familyId || session?.role !== 'kid' || session.scope === 'school') return
    const id = window.setInterval(() => {
      const current = worldRef.current.kids.find((entry) => entry.familyId === familyId && entry.id === session.kidId)
      if (!current) return
      const turtle = applyDecay(current.turtle)
      if (turtle.lastTick === current.turtle.lastTick) return
      commit({ ...worldRef.current, kids: worldRef.current.kids.map((entry) => entry === current ? { ...current, turtle } : entry) })
    }, 60_000)
    return () => window.clearInterval(id)
  }, [familyId, session])

  function remember(next: SessionData | null) {
    sessionRef.current = next
    setSession(next)
    if (mode === 'demo') persistSession(next)
  }

  async function signInWithGoogle(demoEmail?: string): Promise<string | null> {
    if (mode === 'firebase') {
      try {
        const fb = fbRef.current ?? (await loadFirebase())
        fbRef.current = fb
        await fb.signInWithGoogle()
        setBootError(null)
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'Google sign in did not finish.'
      }
    }
    const account = resolveAccount(worldRef.current, demoEmail ?? '')
    if (!account) return 'That Google account is not in a family yet.'
    const next = ensureRosterKids(worldRef.current, account.familyId)
    if (account.role === 'kid' && mode === 'demo') {
      const cloud = next.kids.find((entry) => entry.id === account.kidId && entry.familyId === account.familyId)
      if (cloud) {
        const imported = withDemoProgress(cloud)
        if (imported) {
          markDemoImported(imported.demoId, cloud.id)
          const kids = next.kids.map((entry) => entry.id === cloud.id && entry.familyId === cloud.familyId ? imported.kid : entry)
          commit({ ...next, kids })
          remember(account)
          pushToast('Your turtle came along from the earlier bay.')
          return null
        }
      }
    }
    commit(next)
    remember(account)
    return null
  }

  function previewSchool() {
    if (mode !== 'demo') return
    const next: SessionData = { role: 'kid', familyId: 'turtlebay', kidId: 'wally', email: '', scope: 'school' }
    remember(next)
  }

  async function signOutBay() {
    if (mode === 'firebase') {
      const fb = fbRef.current ?? (await loadFirebase())
      fbRef.current = fb
      await fb.signOutBay()
    }
    remember(null)
  }

  function patchKid(nextKid: KidProfile) {
    commit({
      ...worldRef.current,
      kids: worldRef.current.kids.map((entry) => entry.familyId === nextKid.familyId && entry.id === nextKid.id ? nextKid : entry),
    })
  }

  function mutateSelf(run: (current: KidProfile) => { kid: KidProfile; error?: string }): string | null {
    const current = worldRef.current.kids.find((entry) => entry.familyId === sessionRef.current?.familyId && sessionRef.current.role === 'kid' && entry.id === sessionRef.current.kidId)
    if (!current || sessionRef.current?.role !== 'kid') return 'Sign in first.'
    if (sessionRef.current.scope === 'school') return 'School sign-in can only update schoolwork.'
    const result = run(current)
    if (result.error) return result.error
    patchKid(result.kid)
    return null
  }

  function familyKid(kidId: string): KidProfile | null {
    const active = sessionRef.current
    if (!active) return null
    return worldRef.current.kids.find((entry) => entry.familyId === active.familyId && entry.id === kidId && !entry.archived) ?? null
  }

  function saveTask(kidId: string, taskId: string | null, draft: { title: string; notes?: string; points?: number; repeat?: 'daily' | 'once' }) {
    const current = familyKid(kidId)
    if (!current || sessionRef.current?.role !== 'parent') return 'Parents edit the lists.'
    const result = taskId ? updateTask(current, taskId, draft) : addTask(current, draft)
    if (result.error) return result.error
    patchKid(result.kid)
    return null
  }

  function saveRoutine(kidId: string, routineId: string | null, draft: { title: string; slot: RoutineSlot; points?: number }) {
    const current = familyKid(kidId)
    if (!current || sessionRef.current?.role !== 'parent') return 'Parents edit the lists.'
    const result = routineId ? updateRoutine(current, routineId, draft) : addRoutine(current, draft)
    if (result.error) return result.error
    patchKid(result.kid)
    return null
  }

  function saveAssignment(kidId: string, assignmentId: string | null, draft: AssignmentDraft) {
    const active = sessionRef.current
    if (!active || active.role !== 'parent') return 'Parents edit assignments.'
    if (draft.audience === 'group') {
      const result = assignmentId
        ? updateGroupAssignment(worldRef.current, active.email, active.familyId, assignmentId, draft)
        : postAssignment(worldRef.current, active.email, active.familyId, kidId, draft)
      if (result.error) return result.error
      commit(result.world)
      return null
    }
    const result = assignmentId
      ? updateOwnAssignment(worldRef.current, active.familyId, kidId, assignmentId, draft)
      : postAssignment(worldRef.current, active.email, active.familyId, kidId, { ...draft, audience: 'kid', groupId: null })
    if (result.error) return result.error
    commit(result.world)
    return null
  }

  function deleteAssignment(kidId: string, assignmentId: string, group: boolean) {
    const active = sessionRef.current
    if (!active || active.role !== 'parent') return 'Parents edit assignments.'
    const result = group
      ? deleteGroupAssignment(worldRef.current, active.email, active.familyId, assignmentId)
      : deleteOwnAssignment(worldRef.current, active.familyId, kidId, assignmentId)
    if (result.error) return result.error
    commit(result.world)
    return null
  }

  function toggleItem(target: CheckTarget) {
    const active = sessionRef.current
    if (!active || active.role !== 'kid') return 'Sign in as the kid to check this off.'
    if (active.scope === 'school' && (target.kind !== 'assignment')) return 'School sign-in only checks schoolwork.'
    const current = familyKid(active.kidId)
    if (!current) return 'Missing profile.'
    const result = toggleCheck(current, target)
    patchKid(result.kid)
    return null
  }

  function answerStudy(unitId: string, wordId: string, correct: boolean) {
    const active = sessionRef.current
    if (!active || active.role !== 'kid') return null
    const current = familyKid(active.kidId)
    if (!current) return null
    const academic = PEBBLE_UNIT_IDS.has(unitId)
    if (current.motivation === 'fighter') {
      if (active.scope === 'school' || active.kidId !== 'sam' || academic) return null
    } else if (!academic) return null
    const ensured = ensureUnit(current.study ?? blankStudy(), unitId)
    const effect = applyAnswer(ensured.unit, wordId, correct)
    const masteredCount = Object.values(effect.unit.words).filter((word) => word.mastered).length
    const credits = current.credits + (effect.justMastered && unitId === MAP_UNIT_ID ? MAP_MASTERY_CREDITS : 0)
    patchKid({
      ...current,
      credits,
      study: { units: { ...ensured.study.units, [unitId]: effect.unit } },
    })
    return {
      justMastered: effect.justMastered,
      unlockName: effect.justMastered ? unlockFor(unitId, masteredCount).name : '',
      credits: effect.justMastered && unitId === MAP_UNIT_ID ? MAP_MASTERY_CREDITS : 0,
    }
  }

  const value: BayContextValue = {
    ready,
    mode,
    bootError,
    session,
    world,
    kid,
    kids,
    toast,
    signInChoices: signInChoices(world),
    signInWithGoogle,
    previewSchool,
    signOutBay,
    renameTurtle: (name) => mutateSelf((current) => renameTurtleForKid(current, name)),
    petTurtle: () => mutateSelf((current) => petTurtleForKid(current)),
    feedTurtle: (snackId) => mutateSelf((current) => feedTurtleForKid(current, snackId)),
    bankShells: (count = 1) => {
      const active = sessionRef.current
      if (!active || active.role !== 'kid') return
      const current = familyKid(active.kidId)
      if (!current || current.motivation !== 'turtle') return
      patchKid(bankShellTreats(current, count))
    },
    cleanTurtle: () => mutateSelf((current) => cleanTurtleForKid(current)),
    buyItem: (itemId) => mutateSelf((current) => buyItemForKid(current, itemId)),
    equipItem: (itemId) => mutateSelf((current) => equipItemForKid(current, itemId)),
    unequipItem: (itemId) => mutateSelf((current) => unequipItemForKid(current, itemId)),
    upgradeHabitat: () => mutateSelf((current) => upgradeHabitatForKid(current)),
    recordLesson: (input) => {
      const current = familyKid(sessionRef.current?.role === 'kid' ? sessionRef.current.kidId : '')
      if (!current || sessionRef.current?.role !== 'kid' || sessionRef.current.scope === 'school') return null
      const applied = applyLessonResult(current, input)
      patchKid(applied.kid)
      return { coins: applied.coinsEarned, passed: applied.passed, wpm: input.wpm, accuracy: input.accuracy, streak: input.streak }
    },
    recordSpelling: (input) => {
      const current = familyKid(sessionRef.current?.role === 'kid' ? sessionRef.current.kidId : '')
      const active = sessionRef.current
      if (!current || !active || active.role !== 'kid' || active.scope === 'school') return null
      const applied = recordSpellingSession(current, input)
      patchKid(applied.kid)
      return applied.sessionId
    },
    feedPatty: (sessionId) => mutateSelf((current) => feedSpellingPatty(current, sessionId)),
    addChallenge: (kidId, draft) => {
      const current = familyKid(kidId)
      if (!current || sessionRef.current?.role !== 'parent') return 'Pick a kid in your family.'
      const result = addChallengeToKid(current, draft)
      if (result.error) return result.error
      patchKid(result.kid)
      return null
    },
    clearDemo: () => {
      if (mode !== 'demo') return
      commit(foundingWorld())
    },
    pushToast,
    saveTask,
    deleteTask: (kidId, taskId) => {
      const current = familyKid(kidId)
      if (!current || sessionRef.current?.role !== 'parent') return
      patchKid(removeTask(current, taskId))
    },
    saveRoutine,
    deleteRoutine: (kidId, routineId) => {
      const current = familyKid(kidId)
      if (!current || sessionRef.current?.role !== 'parent') return
      patchKid(removeRoutine(current, routineId))
    },
    saveAssignment,
    deleteAssignment,
    toggleItem,
    inviteFamily: (input) => {
      const active = sessionRef.current
      if (!active || active.role !== 'parent') return 'Sign in as a parent.'
      const result = inviteFamilyWorld(worldRef.current, active.email, input)
      if (result.error) return result.error
      commit(result.world)
      return null
    },
    addKidEmail: (targetFamily, kidId, email) => {
      const active = sessionRef.current
      if (!active || active.role !== 'parent') return 'Sign in as a parent.'
      const result = addKidEmailToWorld(worldRef.current, active.email, targetFamily, kidId, email)
      if (result.error) return result.error
      commit(result.world)
      return null
    },
    createClassGroup: (name, kidId) => {
      const active = sessionRef.current
      if (!active || active.role !== 'parent') return 'Sign in as a parent.'
      const result = createGroup(worldRef.current, active.email, name, kidId)
      if (result.error) return result.error
      commit(result.world)
      return null
    },
    setGeminiCap: (usd) => {
      const active = sessionRef.current
      if (!active || active.role !== 'parent') return 'Parents set the cap.'
      const result = setCap(worldRef.current, active.familyId, usd)
      if (result.error) return result.error
      commit(result.world)
      return null
    },
    chooseFighterLook: (lookId) => mutateSelf((current) => chooseLook(current, lookId)),
    unlockFighter: (itemId) => mutateSelf((current) => unlockItem(current, itemId)),
    toggleFighterGear: (itemId) => mutateSelf((current) => toggleGear(current, itemId)),
    noteBlockedEdit: (prompt, reason) => {
      const current = familyKid(sessionRef.current?.role === 'kid' ? sessionRef.current.kidId : '')
      if (!current) return
      const safety = reviewPrompt(prompt)
      const edit: CharacterEdit = {
        id: crypto.randomUUID(),
        prompt,
        status: 'blocked',
        cost: 0,
        reason: reason || safety.reason,
        createdAt: new Date().toISOString(),
        previewUrl: null,
        retriesLeft: 0,
      }
      patchKid({ ...current, editHistory: [edit, ...current.editHistory].slice(0, 30) })
    },
    answerStudy,
    saveTestPrep: (unitId, score) => {
      const current = familyKid('sam')
      if (!current || sessionRef.current?.role !== 'kid') return
      const thresholds = worldRef.current.families.find((family) => family.id === current.familyId)?.studyThresholds
      const ensured = ensureUnit(current.study ?? blankStudy(), unitId)
      const unit = recordTestPrep(ensured.unit, score, undefined, thresholds ? clampThresholds(thresholds) : undefined)
      patchKid({ ...current, study: { units: { ...ensured.study.units, [unitId]: unit } } })
    },
    setStudyOverride: (kidId, unitId, zone: ZoneId, on) => {
      const current = familyKid(kidId)
      if (!current || sessionRef.current?.role !== 'parent') return
      const ensured = ensureUnit(current.study ?? blankStudy(), unitId)
      patchKid({
        ...current,
        study: {
          units: {
            ...ensured.study.units,
            [unitId]: { ...ensured.unit, overrides: { ...ensured.unit.overrides, [zone]: on } },
          },
        },
      })
    },
    setStudyThresholds: (next) => {
      const active = sessionRef.current
      if (!active || active.role !== 'parent') return
      commit({
        ...worldRef.current,
        families: worldRef.current.families.map((family) => family.id === active.familyId
          ? { ...family, studyThresholds: clampThresholds({ ...family.studyThresholds, ...next }) }
          : family),
      })
    },
    defaultAudienceFor: (kidId) => {
      const active = sessionRef.current
      if (!active) return { audience: 'kid', groupId: null }
      return defaultAudience(worldRef.current, active.familyId, kidId)
    },
  }

  return (
    <BayContext.Provider value={value}>
      {children}
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </BayContext.Provider>
  )
}

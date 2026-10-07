import {
  BASIC_CLEAN_COST,
  BASIC_CLEAN_GAIN,
  BASIC_CLEAN_HAPPY,
  BASIC_FEED_COST,
  BASIC_FEED_HAPPY,
  BASIC_FEED_HUNGER,
  DECAY_PER_HOUR,
  MAX_PLANTS,
  PASS_ACCURACY,
  PET_COOLDOWN_MS,
  PET_HAPPY_GAIN,
  REMATCH_PASS_COINS,
  REMATCH_TRY_COINS,
} from '../config'
import { currentItemId, findItem, HABITATS } from '../data/catalog'
import { LESSONS, nextLesson } from '../data/curriculum'
import { localDay, shiftDay } from '../lib/format'
import type {
  ChallengeDraft,
  CustomChallenge,
  HabitatTier,
  KidProfile,
  LessonInput,
  LessonProgress,
  TurtleState,
  TypingSession,
} from '../types'

export function clampMeter(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function validateNickname(raw: string): string | null {
  if (!/^[a-zA-Z0-9]{3,12}$/.test(raw.trim())) {
    return 'Bay names are 3 to 12 letters or numbers.'
  }
  return null
}

export function validatePin(pin: string, firebase: boolean): string | null {
  const pattern = firebase ? /^[a-zA-Z0-9]{6,12}$/ : /^[a-zA-Z0-9]{4,12}$/
  if (!pattern.test(pin)) {
    return firebase
      ? 'Use 6 to 12 letters or numbers for the PIN.'
      : 'Use 4 to 12 letters or numbers for the PIN.'
  }
  return null
}

export function blankLessons(): Record<string, LessonProgress> {
  const lessons: Record<string, LessonProgress> = {}
  for (const lesson of LESSONS) {
    lessons[lesson.id] = {
      lessonId: lesson.id,
      completions: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      lastWpm: 0,
      lastAccuracy: 0,
      unlocked: lesson.order === 1,
      mastered: false,
      lastMissedKeys: [],
    }
  }
  return lessons
}

export function createKid(nickname: string, pinHash: string, id: string = crypto.randomUUID(), now = Date.now()): KidProfile {
  return {
    id,
    nickname: nickname.trim(),
    pinHash,
    turtle: {
      name: '',
      named: false,
      hunger: 64,
      happy: 72,
      clean: 60,
      coins: 0,
      habitatTier: 1,
      inventory: {},
      equipped: { hat: null, scarf: null, plants: [], bed: null },
      lastTick: now,
      lastPetAt: 0,
    },
    lessons: blankLessons(),
    sessions: [],
    customChallenges: [],
    practiceDays: [],
    createdAt: new Date(now).toISOString(),
  }
}

export function normalizeKid(input: Partial<KidProfile> & { id: string; nickname: string }): KidProfile {
  const fresh = createKid(input.nickname, input.pinHash ?? '', input.id, input.turtle?.lastTick ?? Date.now())
  const lessons = { ...fresh.lessons }
  for (const [id, value] of Object.entries(input.lessons ?? {})) {
    if (!lessons[id] || !value) continue
    lessons[id] = {
      ...lessons[id],
      ...value,
      lessonId: id,
      lastMissedKeys: Array.isArray(value.lastMissedKeys) ? value.lastMissedKeys : [],
    }
  }
  for (let index = 0; index < LESSONS.length; index += 1) {
    const lesson = LESSONS[index]
    if (lessons[lesson.id]?.mastered && LESSONS[index + 1]) {
      const next = LESSONS[index + 1]
      lessons[next.id] = { ...lessons[next.id], unlocked: true }
    }
  }
  const tier = input.turtle?.habitatTier
  const habitatTier: HabitatTier = tier === 2 || tier === 3 ? tier : 1
  const turtle: TurtleState = {
    ...fresh.turtle,
    ...input.turtle,
    name: input.turtle?.name ?? '',
    named: Boolean(input.turtle?.named && (input.turtle?.name ?? '').trim()),
    hunger: clampMeter(input.turtle?.hunger ?? fresh.turtle.hunger),
    happy: clampMeter(input.turtle?.happy ?? fresh.turtle.happy),
    clean: clampMeter(input.turtle?.clean ?? fresh.turtle.clean),
    coins: Math.max(0, Math.round(input.turtle?.coins ?? 0)),
    habitatTier,
    inventory: Object.fromEntries(
      Object.entries(input.turtle?.inventory ?? {}).map(([id, count]) => [currentItemId(id), count]),
    ),
    equipped: {
      hat: input.turtle?.equipped?.hat ? currentItemId(input.turtle.equipped.hat) : null,
      scarf: input.turtle?.equipped?.scarf ? currentItemId(input.turtle.equipped.scarf) : null,
      plants: Array.isArray(input.turtle?.equipped?.plants) ? input.turtle.equipped.plants.filter(Boolean) : [],
      bed: input.turtle?.equipped?.bed ?? null,
    },
    lastTick: input.turtle?.lastTick ?? fresh.turtle.lastTick,
    lastPetAt: input.turtle?.lastPetAt ?? 0,
  }
  return {
    ...fresh,
    ...input,
    id: input.id,
    nickname: input.nickname,
    pinHash: input.pinHash ?? '',
    turtle,
    lessons,
    sessions: Array.isArray(input.sessions) ? input.sessions.slice(0, 40) : [],
    customChallenges: Array.isArray(input.customChallenges) ? input.customChallenges : [],
    practiceDays: Array.isArray(input.practiceDays) ? input.practiceDays : [],
    createdAt: input.createdAt ?? fresh.createdAt,
  }
}

export function applyDecay(turtle: TurtleState, now = Date.now()): TurtleState {
  const hours = Math.min(72, Math.max(0, now - turtle.lastTick) / 3_600_000)
  if (hours <= 0) return turtle
  return {
    ...turtle,
    hunger: clampMeter(turtle.hunger - hours * DECAY_PER_HOUR.hunger),
    happy: clampMeter(turtle.happy - hours * DECAY_PER_HOUR.happy),
    clean: clampMeter(turtle.clean - hours * DECAY_PER_HOUR.clean),
    lastTick: now,
  }
}

export function renameTurtle(kid: KidProfile, rawName: string): { kid: KidProfile; error?: string } {
  const name = rawName.trim().replace(/\s+/g, ' ')
  if (name.length < 1 || name.length > 16) return { kid, error: 'Use 1 to 16 characters.' }
  if (!/^[a-zA-Z0-9 ]+$/.test(name)) return { kid, error: 'Letters, numbers, and spaces only.' }
  return { kid: { ...kid, turtle: { ...kid.turtle, name, named: true } } }
}

export function petTurtle(kid: KidProfile, now = Date.now()): { kid: KidProfile; error?: string } {
  if (now - kid.turtle.lastPetAt < PET_COOLDOWN_MS) {
    return { kid, error: 'A short rest, then more pets.' }
  }
  const decayed = applyDecay(kid.turtle, now)
  return {
    kid: {
      ...kid,
      turtle: {
        ...decayed,
        happy: clampMeter(decayed.happy + PET_HAPPY_GAIN),
        lastPetAt: now,
      },
    },
  }
}

export function feedTurtle(kid: KidProfile, snackId?: string, now = Date.now()): { kid: KidProfile; error?: string } {
  if (kid.turtle.hunger >= 99.5) return { kid, error: 'Full tummy. No more bites right now.' }
  let hungerGain = BASIC_FEED_HUNGER
  let happyGain = BASIC_FEED_HAPPY
  let coins = kid.turtle.coins
  const inventory = { ...kid.turtle.inventory }
  if (snackId) {
    const item = findItem(snackId)
    if (!item || item.category !== 'snack') return { kid, error: 'That snack is not in the pantry.' }
    if ((inventory[snackId] ?? 0) < 1) return { kid, error: 'The pantry is out of that snack.' }
    inventory[snackId] -= 1
    hungerGain = item.hunger ?? BASIC_FEED_HUNGER
    happyGain = item.happy ?? BASIC_FEED_HAPPY
  } else if (coins < BASIC_FEED_COST) {
    return { kid, error: 'A basic nibble costs 6 coins. Finish a lesson or use a snack you own.' }
  } else {
    coins -= BASIC_FEED_COST
  }
  const decayed = applyDecay(kid.turtle, now)
  return {
    kid: {
      ...kid,
      turtle: {
        ...decayed,
        coins,
        inventory,
        hunger: clampMeter(decayed.hunger + hungerGain),
        happy: clampMeter(decayed.happy + happyGain),
        lastTick: now,
      },
    },
  }
}

export function cleanTurtle(kid: KidProfile, now = Date.now()): { kid: KidProfile; error?: string } {
  if (kid.turtle.clean >= 99.5) return { kid, error: 'Already sparkly.' }
  if (kid.turtle.coins < BASIC_CLEAN_COST) {
    return { kid, error: 'A scrub costs 8 coins. Lessons fill the coin jar.' }
  }
  const decayed = applyDecay(kid.turtle, now)
  return {
    kid: {
      ...kid,
      turtle: {
        ...decayed,
        coins: decayed.coins - BASIC_CLEAN_COST,
        clean: clampMeter(decayed.clean + BASIC_CLEAN_GAIN),
        happy: clampMeter(decayed.happy + BASIC_CLEAN_HAPPY),
        lastTick: now,
      },
    },
  }
}

export function buyItem(kid: KidProfile, itemId: string): { kid: KidProfile; error?: string } {
  const item = findItem(itemId)
  if (!item) return { kid, error: 'That item is not in the shop.' }
  if (kid.turtle.coins < item.price) return { kid, error: 'Not enough coins yet. Lessons fill the jar.' }
  const owned = kid.turtle.inventory[itemId] ?? 0
  if (item.category !== 'snack' && owned > 0) return { kid, error: 'You already have that.' }
  return {
    kid: {
      ...kid,
      turtle: {
        ...kid.turtle,
        coins: kid.turtle.coins - item.price,
        inventory: { ...kid.turtle.inventory, [itemId]: owned + 1 },
      },
    },
  }
}

export function equipItem(kid: KidProfile, itemId: string): { kid: KidProfile; error?: string } {
  const item = findItem(itemId)
  if (!item) return { kid, error: 'Unknown item.' }
  if ((kid.turtle.inventory[itemId] ?? 0) < 1) return { kid, error: 'Buy it in the shop first.' }
  if (item.category === 'snack') return { kid, error: 'Snacks get eaten from Care.' }
  const equipped = {
    ...kid.turtle.equipped,
    plants: [...kid.turtle.equipped.plants],
  }
  if (item.category === 'hat') equipped.hat = itemId
  if (item.category === 'scarf') equipped.scarf = itemId
  if (item.category === 'bed') equipped.bed = itemId
  if (item.category === 'plant') {
    if (equipped.plants.includes(itemId)) return { kid, error: 'That plant is already in the tank.' }
    if (equipped.plants.length >= MAX_PLANTS) {
      return { kid, error: 'The tank holds 2 plants. Take one out first.' }
    }
    equipped.plants = [...equipped.plants, itemId]
  }
  return { kid: { ...kid, turtle: { ...kid.turtle, equipped } } }
}

export function unequipItem(kid: KidProfile, itemId: string): { kid: KidProfile; error?: string } {
  const equipped = {
    ...kid.turtle.equipped,
    plants: kid.turtle.equipped.plants.filter((id) => id !== itemId),
  }
  if (equipped.hat === itemId) equipped.hat = null
  if (equipped.scarf === itemId) equipped.scarf = null
  if (equipped.bed === itemId) equipped.bed = null
  return { kid: { ...kid, turtle: { ...kid.turtle, equipped } } }
}

export function upgradeHabitat(kid: KidProfile): { kid: KidProfile; error?: string } {
  if (kid.turtle.habitatTier >= 3) return { kid, error: 'This is the biggest bay.' }
  const next = HABITATS.find((habitat) => habitat.tier === kid.turtle.habitatTier + 1)
  if (!next) return { kid, error: 'This is the biggest bay.' }
  if (kid.turtle.coins < next.price) {
    return { kid, error: `${next.name} costs ${next.price} coins. You have ${kid.turtle.coins}.` }
  }
  return {
    kid: {
      ...kid,
      turtle: {
        ...kid.turtle,
        coins: kid.turtle.coins - next.price,
        habitatTier: next.tier,
      },
    },
  }
}

export function coinsForRun(base: number, accuracy: number, passed: boolean): number {
  if (!passed) return Math.max(4, Math.round(base * 0.4))
  return Math.max(1, Math.round(base * (0.9 + 0.1 * (accuracy / 100))))
}

export function typingStats(correct: number, errors: number, startedAt: number, now: number) {
  const elapsed = Math.max(now - startedAt, 0)
  const minutes = Math.max(elapsed, 1000) / 60_000
  const wpm = correct <= 0 || elapsed < 800 ? 0 : Math.round(correct / 5 / minutes)
  const accuracy = correct + errors === 0 ? 100 : Math.round((correct / (correct + errors)) * 100)
  return { wpm: Number.isFinite(wpm) ? wpm : 0, accuracy }
}

export function keysMatch(expected: string, typed: string): boolean {
  if (typed === expected) return true
  return /^[a-zA-Z]$/.test(expected) && typed.toLowerCase() === expected.toLowerCase()
}

export function buildRematchPrompt(missedKeys: string[], fallback: string): string {
  const keys = [...new Set(missedKeys.map((key) => key.toLowerCase()).filter((key) => key && key !== ' '))]
  if (keys.length === 0) return fallback
  const chunks: string[] = []
  for (let round = 0; round < 3; round += 1) {
    for (const key of keys) chunks.push(`${key}${key}${key}`)
  }
  if (keys.length >= 2) {
    chunks.push(`${keys[0]}${keys[1]} ${keys[1]}${keys[0]} ${keys[0]}${keys[1]}${keys[0]}`)
  }
  const words = fallback.split(/\s+/).filter((word) => {
    const plain = word.toLowerCase()
    return keys.some((key) => plain.includes(key))
  })
  for (const word of [...new Set(words)].slice(0, 4)) chunks.push(word)
  return chunks.join(' ')
}

export function applyLessonResult(
  kid: KidProfile,
  input: LessonInput,
  now = Date.now(),
): { kid: KidProfile; coinsEarned: number; passed: boolean } {
  const passed = input.accuracy >= PASS_ACCURACY
  const coinsEarned = input.isRematch
    ? passed
      ? REMATCH_PASS_COINS
      : REMATCH_TRY_COINS
    : coinsForRun(input.baseCoins, input.accuracy, passed)
  const missedKeys = [...new Set(input.missedKeys)].slice(0, 12)
  const lessons = { ...kid.lessons }
  const progress = lessons[input.lessonId]
  if (progress && !input.isRematch) {
    lessons[input.lessonId] = {
      ...progress,
      completions: progress.completions + 1,
      bestWpm: Math.max(progress.bestWpm, input.wpm),
      bestAccuracy: Math.max(progress.bestAccuracy, input.accuracy),
      lastWpm: input.wpm,
      lastAccuracy: input.accuracy,
      mastered: progress.mastered || passed,
      lastMissedKeys: missedKeys,
    }
    if (passed) {
      const upcoming = nextLesson(input.lessonId)
      if (upcoming && lessons[upcoming.id]) {
        lessons[upcoming.id] = { ...lessons[upcoming.id], unlocked: true }
      }
    }
  } else if (progress && input.isRematch) {
    lessons[input.lessonId] = {
      ...progress,
      bestWpm: Math.max(progress.bestWpm, input.wpm),
      bestAccuracy: Math.max(progress.bestAccuracy, input.accuracy),
      lastMissedKeys: missedKeys,
    }
  }
  const day = localDay(new Date(now))
  const practiceDays = kid.practiceDays.includes(day) ? kid.practiceDays : [...kid.practiceDays, day]
  const session: TypingSession = {
    id: crypto.randomUUID(),
    lessonId: input.lessonId,
    lessonTitle: input.isRematch ? `Practice: ${input.title}` : input.title,
    date: new Date(now).toISOString(),
    wpm: input.wpm,
    accuracy: input.accuracy,
    coins: coinsEarned,
    streak: input.streak,
    missedKeys,
  }
  return {
    coinsEarned,
    passed,
    kid: {
      ...kid,
      lessons,
      practiceDays,
      sessions: [session, ...kid.sessions].slice(0, 40),
      turtle: { ...kid.turtle, coins: kid.turtle.coins + coinsEarned },
    },
  }
}

export function parseFocusKeys(raw: string): string[] {
  const keys: string[] = []
  for (const part of raw.split(/[\s,]+/).map((bit) => bit.trim().toLowerCase()).filter(Boolean)) {
    if (part.length === 1) keys.push(part)
    else if (/^[a-z0-9;',./[\]\\=-]+$/.test(part)) {
      for (const char of part) keys.push(char)
    }
  }
  return [...new Set(keys)]
}

export function addChallenge(kid: KidProfile, draft: ChallengeDraft, now = Date.now()): { kid: KidProfile; error?: string } {
  const title = draft.title.trim().replace(/\s+/g, ' ')
  const prompt = draft.prompt.trim().replace(/\s+/g, ' ')
  if (title.length < 3 || title.length > 40) return { kid, error: 'Title needs 3 to 40 characters.' }
  if (draft.type === 'typing') {
    if (prompt.length < 8 || prompt.length > 280) return { kid, error: 'Typing text needs 8 to 280 characters.' }
  } else if (prompt.length < 3 || prompt.length > 280) {
    return { kid, error: 'Add a short note so this placeholder is easy to find later.' }
  }
  const coinReward = Math.round(draft.coinReward)
  if (!Number.isFinite(coinReward) || coinReward < 5 || coinReward > 100) {
    return { kid, error: 'Coin reward should be from 5 to 100.' }
  }
  const challenge: CustomChallenge = {
    id: crypto.randomUUID(),
    type: draft.type,
    title,
    prompt,
    focusKeys: draft.focusKeys,
    coinReward,
    createdAt: new Date(now).toISOString(),
  }
  return { kid: { ...kid, customChallenges: [challenge, ...kid.customChallenges] } }
}

export function practiceStreak(days: string[], today = localDay()): number {
  const set = new Set(days)
  let streak = 0
  let cursor = today
  for (let guard = 0; guard < 400; guard += 1) {
    if (!set.has(cursor)) break
    streak += 1
    cursor = shiftDay(cursor, -1)
  }
  return streak
}

export function careHint(turtle: TurtleState): string {
  if (turtle.hunger < 40) return 'A nibble would help.'
  if (turtle.clean < 40) return 'A scrub would feel good.'
  if (turtle.happy < 40) return 'A pet would help.'
  return 'This bay feels calm.'
}

export function ownedCount(kid: KidProfile, itemId: string): number {
  return kid.turtle.inventory[itemId] ?? 0
}

export function isEquipped(kid: KidProfile, itemId: string): boolean {
  const equipped = kid.turtle.equipped
  return equipped.hat === itemId || equipped.scarf === itemId || equipped.bed === itemId || equipped.plants.includes(itemId)
}

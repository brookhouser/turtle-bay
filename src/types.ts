export type HabitatTier = 1 | 2 | 3

export type ItemCategory = 'hat' | 'scarf' | 'plant' | 'snack' | 'bed'

export type ChallengeType = 'typing' | 'spelling' | 'math'

export type TurtleMood = 'idle' | 'low' | 'pet' | 'eat' | 'clean'

export type ShopItem = {
  id: string
  name: string
  category: ItemCategory
  price: number
  blurb: string
  hunger?: number
  happy?: number
}

export type HabitatInfo = {
  tier: HabitatTier
  name: string
  price: number
  tagline: string
}

export type Lesson = {
  id: string
  order: number
  title: string
  subtitle: string
  newKeys: string[]
  prompt: string
  coinReward: number
}

export type Equipped = {
  hat: string | null
  scarf: string | null
  plants: string[]
  bed: string | null
}

export type TurtleState = {
  name: string
  named: boolean
  hunger: number
  happy: number
  clean: number
  coins: number
  habitatTier: HabitatTier
  inventory: Record<string, number>
  equipped: Equipped
  lastTick: number
  lastPetAt: number
}

export type LessonProgress = {
  lessonId: string
  completions: number
  bestWpm: number
  bestAccuracy: number
  lastWpm: number
  lastAccuracy: number
  unlocked: boolean
  mastered: boolean
  lastMissedKeys: string[]
}

export type TypingSession = {
  id: string
  lessonId: string
  lessonTitle: string
  date: string
  wpm: number
  accuracy: number
  coins: number
  streak: number
  missedKeys: string[]
}

export type CustomChallenge = {
  id: string
  type: ChallengeType
  title: string
  prompt: string
  focusKeys: string[]
  coinReward: number
  createdAt: string
}

export type KidProfile = {
  id: string
  nickname: string
  pinHash: string
  turtle: TurtleState
  lessons: Record<string, LessonProgress>
  sessions: TypingSession[]
  customChallenges: CustomChallenge[]
  practiceDays: string[]
  createdAt: string
}

export type SaveData = {
  kids: KidProfile[]
}

export type SessionData =
  | { role: 'kid'; kidId: string }
  | { role: 'parent'; email: string }

export type ChallengeDraft = {
  type: ChallengeType
  title: string
  prompt: string
  focusKeys: string[]
  coinReward: number
}

export type LessonInput = {
  lessonId: string
  title: string
  wpm: number
  accuracy: number
  streak: number
  missedKeys: string[]
  baseCoins: number
  isRematch: boolean
}

export type LessonSummary = {
  coins: number
  passed: boolean
  wpm: number
  accuracy: number
  streak: number
}

export type PlayableLesson = {
  id: string
  title: string
  prompt: string
  coinReward: number
  newKeys: string[]
  knownKeys: string[]
  isRematch: boolean
  isCustom: boolean
}

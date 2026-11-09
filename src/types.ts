import type { StudyState } from './study/engine'

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

export type SpellingSession = {
  id: string
  listId: string
  listTitle: string
  date: string
  correctWords: string[]
  missedWords: string[]
  points: number
  bestStreak: number
  reward: number
  coins: number
  finished: boolean
}

export type SpellingSessionInput = {
  listId: string
  listTitle: string
  correctWords: string[]
  missedWords: string[]
  points: number
  bestStreak: number
  reward: number
  finished: boolean
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

export type Motivation = 'turtle' | 'fighter'

export type RoutineSlot = 'morning' | 'evening'

export type RepeatMode = 'daily' | 'once'

export type TaskItem = {
  id: string
  title: string
  notes: string
  points: number
  repeat: RepeatMode
  active: boolean
  createdAt: string
}

export type RoutineItem = {
  id: string
  title: string
  slot: RoutineSlot
  points: number
  active: boolean
}

export type PersonalAssignment = {
  id: string
  title: string
  subject: string
  notes: string
  points: number
  due: string
  link: string
  active: boolean
  createdAt: string
}

export type CompletionKind = 'task' | 'routine' | 'assignment'

export type Completion = {
  id: string
  itemId: string
  kind: CompletionKind
  source: 'kid' | 'group'
  groupId: string
  day: string
  pointsAwarded: number
  happyAwarded: number
  completedAt: string
}

export type FighterLookId = 'shadow-blade' | 'dojo-ace' | 'pulse-fist' | 'street-flow'

export type FighterState = {
  lookId: FighterLookId | null
  unlocked: string[]
  equippedGear: string[]
  portraitUrl: string | null
}

export type CharacterEdit = {
  id: string
  prompt: string
  status: 'preview' | 'kept' | 'discarded' | 'blocked'
  cost: number
  reason: string
  createdAt: string
  previewUrl: string | null
  retriesLeft: number
}

export type KidProfile = {
  id: string
  familyId: string
  nickname: string
  email: string
  grade: string
  motivation: Motivation
  archived: boolean
  groupIds: string[]
  pinHash: string
  credits: number
  turtle: TurtleState
  lessons: Record<string, LessonProgress>
  sessions: TypingSession[]
  spellingSessions: SpellingSession[]
  customChallenges: CustomChallenge[]
  practiceDays: string[]
  tasks: TaskItem[]
  routines: RoutineItem[]
  assignments: PersonalAssignment[]
  completions: Completion[]
  fighter: FighterState | null
  editHistory: CharacterEdit[]
  study: StudyState
  createdAt: string
}

export type SaveData = {
  kids: KidProfile[]
}

export type ViewScope = 'family' | 'school'

export type SessionData =
  | { role: 'kid'; familyId: string; kidId: string; email: string; scope: ViewScope }
  | { role: 'parent'; familyId: string; email: string }

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

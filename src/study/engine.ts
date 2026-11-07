import { localDay } from '../lib/format'
import type { StudyUnit, StudyWord } from './content'

export type StudyThresholds = {
  zone2: number
  zone3: number
  hard: number
  legend: number
  legendDays: number
}

export const DEFAULT_THRESHOLDS: StudyThresholds = {
  zone2: 1 / 3,
  zone3: 2 / 3,
  hard: 0.8,
  legend: 0.9,
  legendDays: 2,
}

export type WordMastery = {
  correct: number
  wrong: number
  streak: number
  meter: number
  mastered: boolean
  weakened: boolean
}

export type ZoneId = 'field' | 'ridge' | 'core' | 'hard' | 'legend'

export type UnitOverrides = {
  field: boolean
  ridge: boolean
  core: boolean
  hard: boolean
  legend: boolean
}

export type UnitStudy = {
  words: Record<string, WordMastery>
  coins: number
  bestTestPrep: number
  legendDays: string[]
  overrides: UnitOverrides
}

export type StudyState = {
  units: Record<string, UnitStudy>
}

export function blankStudy(): StudyState {
  return { units: {} }
}

export function blankUnit(): UnitStudy {
  return {
    words: {},
    coins: 0,
    bestTestPrep: 0,
    legendDays: [],
    overrides: { field: false, ridge: false, core: false, hard: false, legend: false },
  }
}

export function clampThresholds(input: Partial<StudyThresholds> | undefined): StudyThresholds {
  const next = { ...DEFAULT_THRESHOLDS, ...input }
  const ratio = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) return fallback
    return Math.min(0.95, Math.max(0.05, value))
  }
  return {
    zone2: ratio(next.zone2, DEFAULT_THRESHOLDS.zone2),
    zone3: ratio(next.zone3, DEFAULT_THRESHOLDS.zone3),
    hard: ratio(next.hard, DEFAULT_THRESHOLDS.hard),
    legend: ratio(next.legend, DEFAULT_THRESHOLDS.legend),
    legendDays: Math.min(5, Math.max(1, Math.round(next.legendDays || DEFAULT_THRESHOLDS.legendDays))),
  }
}

function wordState(unit: UnitStudy, wordId: string): WordMastery {
  return unit.words[wordId] ?? { correct: 0, wrong: 0, streak: 0, meter: 0, mastered: false, weakened: false }
}

export function masteryRatio(unit: StudyUnit, progress: UnitStudy): number {
  if (unit.words.length === 0) return 0
  const mastered = unit.words.filter((word) => progress.words[word.id]?.mastered).length
  return mastered / unit.words.length
}

export function zoneOpen(unit: StudyUnit, progress: UnitStudy, zone: ZoneId, thresholds = DEFAULT_THRESHOLDS): boolean {
  if (zone === 'field') return true
  if (progress.overrides[zone]) return true
  const ratio = masteryRatio(unit, progress)
  if (zone === 'ridge') return ratio + 1e-9 >= thresholds.zone2
  if (zone === 'core') return ratio + 1e-9 >= thresholds.zone3
  if (zone === 'hard') return progress.bestTestPrep + 1e-9 >= thresholds.hard
  const days = progress.legendDays.length
  return progress.bestTestPrep + 1e-9 >= thresholds.legend && days >= thresholds.legendDays
}

export type AnswerEffect = {
  unit: UnitStudy
  coinsGained: number
  justMastered: boolean
  weakened: boolean
}

export function applyAnswer(unit: UnitStudy, wordId: string, correct: boolean, now = Date.now()): AnswerEffect {
  void now
  const prev = wordState(unit, wordId)
  const already = prev.mastered
  let next: WordMastery
  if (correct) {
    const streak = prev.streak + 1
    const meter = Math.min(100, prev.meter + (streak >= 2 ? 34 : 22))
    const mastered = prev.mastered || (streak >= 2 && meter >= 56)
    next = {
      correct: prev.correct + 1,
      wrong: prev.wrong,
      streak,
      meter: mastered ? 100 : meter,
      mastered,
      weakened: false,
    }
  } else {
    next = {
      correct: prev.correct,
      wrong: prev.wrong + 1,
      streak: 0,
      meter: Math.max(0, prev.meter - 12),
      mastered: prev.mastered,
      weakened: true,
    }
  }
  const coinsGained = correct ? (already ? 3 : 6) : 1
  return {
    coinsGained,
    justMastered: !already && next.mastered,
    weakened: next.weakened,
    unit: {
      ...unit,
      coins: unit.coins + coinsGained,
      words: { ...unit.words, [wordId]: next },
    },
  }
}

export function recordTestPrep(unit: UnitStudy, score: number, day = localDay(), thresholds = DEFAULT_THRESHOLDS): UnitStudy {
  const best = Math.max(unit.bestTestPrep, score)
  const legendDays = score + 1e-9 >= thresholds.legend && !unit.legendDays.includes(day)
    ? [...unit.legendDays, day]
    : unit.legendDays
  return { ...unit, bestTestPrep: best, legendDays }
}

export type Choice = { id: string; label: string }

export type Question = {
  wordId: string
  prompt: string
  choices: Choice[]
  answerId: string
}

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed || 1
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pickWord(unit: StudyUnit, progress: UnitStudy, recent: string[], seed: number): StudyWord {
  const rand = mulberry32(seed)
  const recentSet = new Set(recent.slice(-3))
  let pool = unit.words.filter((word) => !recentSet.has(word.id))
  if (pool.length === 0) pool = unit.words
  const weights = pool.map((word) => {
    const state = wordState(progress, word.id)
    if (state.weakened || state.meter < 40) return 4
    if (!state.mastered) return 2
    return 1
  })
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let roll = rand() * total
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i]
    if (roll <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

function escapeReg(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Hide a term inside a clue so the sentence does not give the answer away. */
export function concealTerm(text: string, term: string): string {
  const cleaned = term.trim()
  if (!cleaned) return text
  const parts = cleaned.split(/\s+/).map(escapeReg)
  const pattern = new RegExp(`(?<![A-Za-z0-9])${parts.join('\\s+')}(?![A-Za-z0-9])`, 'gi')
  return text.replace(pattern, '____')
}

export function makeQuestion(unit: StudyUnit, word: StudyWord, seed: number): Question {
  const rand = mulberry32(seed)
  const others = unit.words.filter((item) => item.id !== word.id)
  const distractors: StudyWord[] = []
  const bag = [...others]
  while (distractors.length < 3 && bag.length > 0) {
    const index = Math.floor(rand() * bag.length)
    distractors.push(bag.splice(index, 1)[0])
  }
  const askTerm = rand() < 0.5
  const choices = [
    { id: word.id, label: askTerm ? concealTerm(word.definition, word.term) : word.term },
    ...distractors.map((item) => ({
      id: item.id,
      label: askTerm ? concealTerm(item.definition, word.term) : item.term,
    })),
  ]
  for (let i = choices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const swap = choices[i]
    choices[i] = choices[j]
    choices[j] = swap
  }
  const prompt = askTerm ? word.term : concealTerm(word.definition, word.term)
  return {
    wordId: word.id,
    prompt,
    choices,
    answerId: word.id,
  }
}

export type WavePlan = {
  zone: ZoneId
  questionSeeds: number[]
  failed: false
}

export function planWave(zone: ZoneId, seed: number): WavePlan {
  const count = zone === 'legend' ? 6 : zone === 'hard' ? 5 : 4
  const questionSeeds = Array.from({ length: count }, (_, index) => hash(`${zone}:${seed}:${index}`))
  return { zone, questionSeeds, failed: false }
}

export type UnlockKind = 'tower' | 'upgrade' | 'path'

export type UnlockCard = {
  id: string
  kind: UnlockKind
  name: string
  detail: string
}

const UNLOCKS: Record<string, Array<[UnlockKind, string, string]>> = {
  science: [
    ['tower', 'Lens beam', 'A steady shot down the path.'],
    ['upgrade', 'Brighter focus', 'The beam reaches a step farther.'],
    ['path', 'Tide gate', 'A new bend opens on the field.'],
    ['tower', 'Spore sprayer', 'Short range, quick taps.'],
    ['upgrade', 'Wider spray', 'Catches two germs that bunch up.'],
    ['path', 'Root bridge', 'The ridge path connects.'],
  ],
  cells: [
    ['tower', 'ATP pulse', 'A small energy hit.'],
    ['upgrade', 'Extra charge', 'The pulse hits a little harder.'],
    ['path', 'Membrane lane', 'A side path around the cell.'],
    ['tower', 'Enzyme dart', 'Fast and light.'],
    ['upgrade', 'Sticky coat', 'Slows the next germ.'],
    ['path', 'Nucleus ring', 'The inner loop opens.'],
  ],
  vocab: [
    ['tower', 'Root post', 'Holds the line on one tile.'],
    ['upgrade', 'Deeper root', 'Stays useful when a word wobbles.'],
    ['path', 'Prefix lane', 'A short extra path.'],
    ['tower', 'Suffix sling', 'Lobs over the front germ.'],
    ['upgrade', 'Cleaner shot', 'Less scatter.'],
    ['path', 'Word bridge', 'Connects the far bank.'],
  ],
  'middle-east': [
    ['tower', 'Dune watch', 'A post on the open sand.'],
    ['upgrade', 'Wider sight', 'The watch sees the next bend.'],
    ['path', 'Gulf lane', 'A short path along the water.'],
    ['tower', 'Pass gate', 'Holds a mountain gap.'],
    ['upgrade', 'Stronger gate', 'The gap stays shut longer.'],
    ['path', 'Steppe road', 'The far road opens.'],
  ],
  west: [
    ['tower', 'Canoe watch', 'Watches the river bend.'],
    ['upgrade', 'Longer sight', 'Sees farther down the water.'],
    ['path', 'Trade fork', 'A branch off the main road.'],
    ['tower', 'Furnace drum', 'Slow, heavy hits.'],
    ['upgrade', 'Hotter forge', 'The drum hits harder.'],
    ['path', 'Savanna cut', 'A dry path through the grass.'],
  ],
}

export function unlockFor(unitId: string, masteredCount: number): UnlockCard {
  const list = UNLOCKS[unitId] ?? UNLOCKS.science
  const index = Math.max(0, masteredCount - 1) % list.length
  const [kind, name, detail] = list[index]
  return { id: `${unitId}-${index}`, kind, name, detail }
}

export function towerPower(progress: UnitStudy, wordId: string): number {
  const state = wordState(progress, wordId)
  if (!state.mastered && state.meter < 20) return 0
  const base = state.mastered ? 3 : 1
  return state.weakened ? Math.max(1, base - 1) : base
}

export function ensureUnit(study: StudyState, unitId: string): { study: StudyState; unit: UnitStudy } {
  const unit = study.units[unitId] ?? blankUnit()
  if (study.units[unitId]) return { study, unit }
  return { study: { units: { ...study.units, [unitId]: unit } }, unit }
}

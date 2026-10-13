import { SPELLING_STREAK_BONUS, SPELLING_WORD_POINTS } from '../config'

export const PATTY_LAYERS = [
  { id: 'bottom-bun', label: 'Bottom bun' },
  { id: 'patty', label: 'Patty' },
  { id: 'cheese', label: 'Cheese' },
  { id: 'lettuce', label: 'Lettuce' },
  { id: 'tomato', label: 'Tomato' },
  { id: 'pickles', label: 'Pickles' },
  { id: 'onion', label: 'Onion' },
  { id: 'sauce', label: 'Sauce' },
  { id: 'second-patty', label: 'Another patty' },
  { id: 'top-bun', label: 'Top bun' },
] as const

export type PattyLayerId = (typeof PATTY_LAYERS)[number]['id']

export function pointsForCorrect(streak: number): number {
  return SPELLING_WORD_POINTS + Math.max(0, streak - 1) * SPELLING_STREAK_BONUS
}

export function judgeSpelling(expected: string, typed: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase()
}

/** Missed words come back after the ones still waiting. */
export function requeueWord(queue: string[]): string[] {
  if (queue.length <= 1) return [...queue]
  return [...queue.slice(1), queue[0]]
}

/** The single letter to light. Never a pair like "fl". */
export function nextLetter(word: string, index: number): string | null {
  const char = [...word][index]
  if (!char || [...char].length !== 1) return null
  return char
}

export function pattyLayerCount(correctWords: number): number {
  return Math.min(PATTY_LAYERS.length, Math.max(0, correctWords))
}

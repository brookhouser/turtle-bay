import type { StudyWord } from './content'
import { makeQuestion, pickWord, type Question, type UnitStudy } from './engine'
import { MIDDLE_EAST_UNIT, neighborsOf } from './mapUnit'

export type MapPrompt =
  | { mode: 'tap'; countryId: string; name: string }
  | { mode: 'choice'; countryId: string; name: string; choices: Array<{ id: string; label: string }> }
  | { mode: 'type'; countryId: string; name: string }

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

export function nextMapPrompt(progress: UnitStudy, recent: string[], seed: number, zone: 'field' | 'ridge' | 'core' | 'hard' | 'legend'): MapPrompt {
  const word = pickWord(MIDDLE_EAST_UNIT, progress, recent, seed)
  const state = progress.words[word.id]
  const rand = mulberry32(seed + 17)
  const typed = zone === 'hard' || zone === 'legend' || (state?.meter ?? 0) >= 70
  if (!typed && rand() < 0.55) return { mode: 'tap', countryId: word.id, name: word.term }
  if (typed && rand() < 0.45) return { mode: 'type', countryId: word.id, name: word.term }
  const neighbors = neighborsOf(word.id)
  const base: Question = makeQuestion(
    { ...MIDDLE_EAST_UNIT, words: uniqueWords(word, neighbors) },
    word,
    seed + 3,
  )
  return {
    mode: 'choice',
    countryId: word.id,
    name: word.term,
    choices: base.choices.map((choice) => {
      const match = MIDDLE_EAST_UNIT.words.find((item) => item.id === choice.id)
      return { id: choice.id, label: match?.term ?? choice.label }
    }),
  }
}

function uniqueWords(word: StudyWord, neighbors: StudyWord[]): StudyWord[] {
  const seen = new Set<string>([word.id])
  const list = [word]
  for (const item of neighbors) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    list.push(item)
  }
  for (const item of MIDDLE_EAST_UNIT.words) {
    if (list.length >= 8) break
    if (seen.has(item.id)) continue
    seen.add(item.id)
    list.push(item)
  }
  return list
}

export function typedMatch(expected: string, typed: string): boolean {
  const clean = (value: string) => value.trim().toLowerCase().replace(/[^a-z]/g, '')
  return clean(expected) === clean(typed) && clean(typed).length > 0
}

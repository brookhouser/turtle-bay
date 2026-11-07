import { WEEKLY_SPELLING } from '../data/spelling'
import { LESSONS } from '../data/curriculum'
import type { StudyUnit } from './content'

const MATH_FACTS: Array<[string, string]> = [
  ['6 x 7', '42'],
  ['7 x 8', '56'],
  ['8 x 8', '64'],
  ['9 x 6', '54'],
  ['9 x 9', '81'],
  ['12 x 4', '48'],
  ['11 x 6', '66'],
  ['7 x 9', '63'],
  ['8 x 9', '72'],
  ['4 x 9', '36'],
]

export const PEBBLE_UNITS: StudyUnit[] = [
  {
    id: 'spelling-sort-35',
    title: 'Spelling · Sort 35',
    detail: 'This week’s words. A shaky word shows up more often at a gate.',
    href: '',
    words: WEEKLY_SPELLING.words.map((item) => ({
      id: item.word,
      term: item.word,
      definition: item.sentence,
      topic: 'spelling',
    })),
  },
  {
    id: 'math-facts',
    title: 'Math facts',
    detail: 'Multiplication for 4th grade.',
    href: '',
    words: MATH_FACTS.map(([term, definition]) => ({
      id: term.replace(/\s+/g, ''),
      term,
      definition,
      topic: 'math',
    })),
  },
  {
    id: 'typing-home',
    title: 'Typing',
    detail: 'Home-row chunks from the typing trainer.',
    href: '',
    words: LESSONS.slice(0, 4).map((lesson) => ({
      id: lesson.id,
      term: lesson.prompt.split(' ').slice(0, 3).join(' '),
      definition: lesson.title,
      topic: 'typing',
    })),
  },
]

export const PEBBLE_UNIT_IDS = new Set(PEBBLE_UNITS.map((unit) => unit.id))

export function pebbleUnits(): StudyUnit[] {
  return PEBBLE_UNITS
}

import { describe, expect, it } from 'vitest'
import { KEYBOARD_ROWS, isExactKey } from './keyboard'
import { WEEKLY_SPELLING, parseSpellingPrompt, spellingListFromChallenge } from './spelling'
import { PATTY_LAYERS, nextLetter, pointsForCorrect, requeueWord } from '../game/spelling'
import { hiddenSentence } from '../lib/speech'

const WEEK = ['bargain', 'pardon', 'bacon', 'chosen', 'heaven', 'slogan', 'organ', 'mission', 'children', 'fountain']

describe('weekly spelling list', () => {
  it('is sort 34, one sentence each, ready for a parent to swap', () => {
    expect(WEEKLY_SPELLING.id).toBe('sort-34')
    expect(WEEKLY_SPELLING.words.map((entry) => entry.word)).toEqual(WEEK)
    for (const entry of WEEKLY_SPELLING.words) {
      expect(entry.sentence.toLowerCase()).toContain(entry.word)
      expect(entry.sentence.length).toBeGreaterThan(8)
      expect(entry.word).toBe(entry.word.toLowerCase())
    }
    expect(PATTY_LAYERS).toHaveLength(WEEKLY_SPELLING.words.length)
  })

  it('parses a future parent list and leaves a note locked', () => {
    const prompt = ['bacon | Crispy bacon smells like breakfast.', 'toast | Toast is warm.', '', 'nope nope'].join('\n')
    expect(parseSpellingPrompt(prompt).map((entry) => entry.word)).toEqual(['bacon', 'toast'])
    expect(parseSpellingPrompt('spell salad')).toEqual([])
    expect(parseSpellingPrompt('organ')).toEqual([{ word: 'organ', sentence: 'The word is organ.' }])
    const list = spellingListFromChallenge({
      id: 'c1',
      title: 'Sort 35',
      prompt: 'mission | Our mission is to keep the bay clean.',
      coinReward: 12,
    })
    expect(list?.words).toHaveLength(1)
    expect(list?.coinReward).toBe(12)
  })
})

describe('one letter at a time', () => {
  it('does not light fl as a blob of keys', () => {
    const word = 'fl'
    for (const [index, char] of [...word].entries()) {
      const next = nextLetter(word, index)
      expect(next).toBe(char)
      const hits = KEYBOARD_ROWS.flat().filter((key) => isExactKey(key.code, next))
      expect(hits.map((key) => key.code)).toEqual([char])
    }
    const blob = KEYBOARD_ROWS.flat().filter((key) => isExactKey(key.code, 'fl'))
    expect(blob).toEqual([])
    expect(isExactKey('f', 'f')).toBe(true)
    expect(isExactKey('l', 'f')).toBe(false)
    expect(isExactKey('Shift', 'f')).toBe(false)
    expect(isExactKey('CapsLock', 'l')).toBe(false)
  })
})

describe('patty scoring', () => {
  it('grows points with the streak and sends a miss to the back', () => {
    expect(pointsForCorrect(1)).toBe(10)
    expect(pointsForCorrect(2)).toBe(12)
    expect(pointsForCorrect(3)).toBe(14)
    expect(requeueWord(['bacon', 'chosen', 'heaven'])).toEqual(['chosen', 'heaven', 'bacon'])
    expect(requeueWord(['bacon'])).toEqual(['bacon'])
    expect(hiddenSentence('bacon', 'Crispy bacon smells like breakfast.')).toBe('Crispy _____ smells like breakfast.')
  })
})

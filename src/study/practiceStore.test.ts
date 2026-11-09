import { beforeEach, describe, expect, it } from 'vitest'
import { blankUnit } from './engine'
import { loadPractice, savePractice } from './practiceStore'

const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage

describe('map practice storage', () => {
  beforeEach(() => store.clear())

  it('keeps the map practice on its own local key', () => {
    expect(loadPractice()).toEqual(blankUnit())
    const unit = { ...blankUnit(), coins: 6, words: { turkey: { correct: 1, wrong: 0, streak: 1, meter: 22, mastered: false, weakened: false } } }
    savePractice(unit)
    expect(loadPractice().coins).toBe(6)
    expect(loadPractice().words.turkey.meter).toBe(22)
    expect(store.has('turtlebay.world.v1')).toBe(false)
    expect(store.has('turtlebay.practice.middle-east.v1')).toBe(true)
  })

  it('ignores a broken save', () => {
    store.set('turtlebay.practice.middle-east.v1', '{')
    expect(loadPractice()).toEqual(blankUnit())
  })
})
import { describe, expect, it } from 'vitest'
import { STUDY_UNITS } from './content'
import { PEBBLE_UNITS } from './pebbleUnits'
import {
  applyAnswer,
  blankUnit,
  concealTerm,
  makeQuestion,
  masteryRatio,
  pickWord,
  planWave,
  recordTestPrep,
  towerPower,
  zoneOpen,
} from './engine'

const science = STUDY_UNITS[0]

describe('study mastery', () => {
  it('masters a word after two correct answers and keeps the unlock after a miss', () => {
    let unit = blankUnit()
    const word = science.words[0]
    unit = applyAnswer(unit, word.id, true).unit
    const second = applyAnswer(unit, word.id, true)
    expect(second.justMastered).toBe(true)
    expect(second.unit.words[word.id].mastered).toBe(true)
    const missed = applyAnswer(second.unit, word.id, false)
    expect(missed.unit.words[word.id].mastered).toBe(true)
    expect(missed.unit.words[word.id].weakened).toBe(true)
    expect(towerPower(missed.unit, word.id)).toBeLessThan(towerPower(second.unit, word.id))
    expect(missed.weakened).toBe(true)
  })

  it('opens ridge and core from mastery, and finales from test prep', () => {
    let unit = blankUnit()
    const need = Math.ceil(science.words.length / 3)
    for (let i = 0; i < need; i += 1) {
      const id = science.words[i].id
      unit = applyAnswer(unit, id, true).unit
      unit = applyAnswer(unit, id, true).unit
    }
    expect(masteryRatio(science, unit)).toBeGreaterThanOrEqual(1 / 3 - 0.001)
    expect(zoneOpen(science, unit, 'ridge')).toBe(true)
    expect(zoneOpen(science, unit, 'core')).toBe(false)
    expect(zoneOpen(science, unit, 'hard')).toBe(false)
    unit = recordTestPrep(unit, 0.8, '2026-11-01')
    expect(zoneOpen(science, unit, 'hard')).toBe(true)
    expect(zoneOpen(science, unit, 'legend')).toBe(false)
    unit = recordTestPrep(unit, 0.91, '2026-11-02')
    unit = recordTestPrep(unit, 0.95, '2026-11-03')
    expect(zoneOpen(science, unit, 'legend')).toBe(true)
  })

  it('lets a parent override open a zone early', () => {
    const unit = { ...blankUnit(), overrides: { ...blankUnit().overrides, core: true } }
    expect(zoneOpen(science, unit, 'core')).toBe(true)
  })

  it('mixes shaky words without repeating the last three', () => {
    let unit = blankUnit()
    const shaky = science.words[3]
    unit = applyAnswer(unit, shaky.id, false).unit
    const recent = science.words.slice(0, 3).map((word) => word.id)
    const picked = Array.from({ length: 80 }, (_, index) => pickWord(science, unit, recent, 1000 + index).id)
    expect(picked).toContain(shaky.id)
    expect(picked.some((id) => recent.includes(id))).toBe(false)
  })

  it('keeps the answer word out of a clue sentence', () => {
    expect(concealTerm('We filled our plates at the buffet.', 'buffet')).toBe('We filled our plates at the ____.')
    expect(concealTerm('Mom paid with a credit card.', 'credit')).toBe('Mom paid with a ____ card.')
    const spelling = PEBBLE_UNITS[0]
    for (const word of spelling.words) {
      for (let seed = 0; seed < 8; seed += 1) {
        const question = makeQuestion(spelling, word, seed)
        const promptIsTheWord = question.prompt.trim().toLowerCase() === word.term.toLowerCase()
        if (!promptIsTheWord) {
          expect(question.prompt.toLowerCase().includes(word.term.toLowerCase())).toBe(false)
        } else {
          for (const choice of question.choices) {
            expect(choice.label.toLowerCase().includes(word.term.toLowerCase())).toBe(false)
          }
        }
      }
    }
  })

  it('builds a question from the unit and never fails a wave', () => {
    const word = science.words[1]
    const question = makeQuestion(science, word, 42)
    expect(question.choices).toHaveLength(4)
    expect(question.choices.some((choice) => choice.id === word.id)).toBe(true)
    expect(new Set(question.choices.map((choice) => choice.label)).size).toBe(4)
    expect(planWave('legend', 7).failed).toBe(false)
    expect(planWave('field', 7).questionSeeds).toHaveLength(4)
  })

  it('ships a word list for every linked unit', () => {
    expect(STUDY_UNITS.map((unit) => unit.id)).toEqual(['science', 'cells', 'vocab', 'west'])
    for (const unit of STUDY_UNITS) {
      expect(unit.words.length).toBeGreaterThan(10)
      expect(unit.href.startsWith('https://brookhouser.github.io/sam-science-game')).toBe(true)
    }
  })
})

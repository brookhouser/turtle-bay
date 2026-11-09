import { describe, expect, it } from 'vitest'
import { STUDY_UNITS } from '../study/content'
import { applyAnswer, blankStudy, blankUnit } from '../study/engine'
import { MIDDLE_EAST_UNIT } from '../study/mapUnit'
import { abilitiesUnlocked, hasAbility, masteredIds, runnerUnits, runnerZoneOpen } from './abilities'

describe('runner abilities', () => {
  it('unlocks one ability per mastered vocab or map item and ignores credits', () => {
    expect(abilitiesUnlocked(0).map((item) => item.id)).toEqual([])
    expect(abilitiesUnlocked(1).map((item) => item.id)).toEqual(['double-jump'])
    expect(hasAbility(2, 'dash')).toBe(true)
    expect(hasAbility(5, 'wall-jump')).toBe(true)
    expect(hasAbility(6, 'magnet')).toBe(true)
    expect(hasAbility(100, 'dash')).toBe(true)
  })

  it('reads the same mastery store as tower defense', () => {
    const units = runnerUnits([...STUDY_UNITS, MIDDLE_EAST_UNIT])
    let study = blankStudy()
    const word = units[0].words[0]
    const once = applyAnswer(blankUnit(), word.id, true)
    const twice = applyAnswer(once.unit, word.id, true)
    study = { units: { [units[0].id]: twice.unit } }
    expect(masteredIds(units, study)).toEqual([`${units[0].id}:${word.id}`])
    expect(runnerZoneOpen(units, study, 'field')).toBe(true)
    expect(runnerZoneOpen(units, study, 'hard')).toBe(false)
  })
})

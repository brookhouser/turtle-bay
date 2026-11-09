import { useRef, useState } from 'react'
import { MAP_UNIT_ID } from './mapUnit'
import { applyAnswer, blankUnit, unlockFor, type UnitStudy } from './engine'

// Practice progress stays on this browser. It is not the family bay and it never goes to Firestore.
const KEY = 'turtlebay.practice.middle-east.v1'

export function loadPractice(): UnitStudy {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return blankUnit()
    const parsed = JSON.parse(raw) as Partial<UnitStudy>
    if (!parsed || typeof parsed !== 'object' || !parsed.words || typeof parsed.words !== 'object') return blankUnit()
    return {
      ...blankUnit(),
      coins: typeof parsed.coins === 'number' ? parsed.coins : 0,
      bestTestPrep: typeof parsed.bestTestPrep === 'number' ? parsed.bestTestPrep : 0,
      legendDays: Array.isArray(parsed.legendDays) ? parsed.legendDays.filter((day) => typeof day === 'string') : [],
      overrides: { ...blankUnit().overrides, ...(parsed.overrides ?? {}) },
      words: parsed.words,
    }
  } catch {
    return blankUnit()
  }
}

export function savePractice(unit: UnitStudy) {
  localStorage.setItem(KEY, JSON.stringify(unit))
}

export function useMapPractice() {
  const [progress, setProgress] = useState<UnitStudy>(() => loadPractice())
  const progressRef = useRef(progress)
  progressRef.current = progress

  function answer(wordId: string, correct: boolean) {
    const effect = applyAnswer(progressRef.current, wordId, correct)
    progressRef.current = effect.unit
    setProgress(effect.unit)
    savePractice(effect.unit)
    const masteredCount = Object.values(effect.unit.words).filter((word) => word.mastered).length
    return {
      justMastered: effect.justMastered,
      unlockName: effect.justMastered ? unlockFor(MAP_UNIT_ID, masteredCount).name : '',
    }
  }

  return { progress, answer }
}

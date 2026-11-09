import type { StudyUnit, StudyWord } from '../study/content'
import type { StudyState, StudyThresholds, UnitStudy, ZoneId } from '../study/engine'
import { blankUnit, clampThresholds, pickWord, zoneOpen } from '../study/engine'
import type { RunnerAbility, RunnerAbilityId } from './types'

export const RUNNER_UNIT_IDS = ['vocab', 'middle-east'] as const

export const RUNNER_ABILITIES: RunnerAbility[] = [
  { id: 'double-jump', name: 'Double jump', detail: 'A second hop opens the high path.', masteredAt: 1 },
  { id: 'dash', name: 'Dash through spikes', detail: 'Spikes slow other runners. You slip through.', masteredAt: 2 },
  { id: 'air-kick', name: 'Air kick', detail: 'A kick in the air pops you over a low hazard.', masteredAt: 3 },
  { id: 'glide', name: 'Glide', detail: 'Hold the jump and you fall slower.', masteredAt: 4 },
  { id: 'wall-jump', name: 'Wall jump', detail: 'Push off a wall to reach a hidden ledge.', masteredAt: 5 },
  { id: 'magnet', name: 'Credit magnet', detail: 'Shiny credits drift in. They only change looks.', masteredAt: 6 },
]

export function runnerUnits(all: StudyUnit[]): StudyUnit[] {
  return RUNNER_UNIT_IDS.map((id) => all.find((unit) => unit.id === id)).filter((unit): unit is StudyUnit => Boolean(unit))
}

export function masteredIds(units: StudyUnit[], study: StudyState): string[] {
  const ids: string[] = []
  for (const unit of units) {
    const progress = study.units[unit.id]
    if (!progress) continue
    for (const word of unit.words) {
      if (progress.words[word.id]?.mastered) ids.push(`${unit.id}:${word.id}`)
    }
  }
  return ids
}

export function abilitiesUnlocked(masteredCount: number, list: RunnerAbility[] = RUNNER_ABILITIES): RunnerAbility[] {
  return list.filter((ability) => masteredCount >= ability.masteredAt)
}

export function hasAbility(masteredCount: number, id: RunnerAbilityId, list: RunnerAbility[] = RUNNER_ABILITIES): boolean {
  return abilitiesUnlocked(masteredCount, list).some((ability) => ability.id === id)
}

export function nextAbility(masteredCount: number, list: RunnerAbility[] = RUNNER_ABILITIES): RunnerAbility | null {
  return list.find((ability) => ability.masteredAt === masteredCount + 1) ?? null
}

export function combinedProgress(units: StudyUnit[], study: StudyState): { unit: StudyUnit; progress: UnitStudy } {
  const words = units.flatMap((unit) => unit.words.map((word) => ({ ...word, id: `${unit.id}:${word.id}` })))
  const progress = blankUnit()
  let best = 0
  const days = new Set<string>()
  for (const unit of units) {
    const saved = study.units[unit.id]
    if (!saved) continue
    best = Math.max(best, saved.bestTestPrep)
    for (const day of saved.legendDays) days.add(day)
    for (const word of unit.words) {
      const state = saved.words[word.id]
      if (state) progress.words[`${unit.id}:${word.id}`] = state
    }
  }
  progress.bestTestPrep = best
  progress.legendDays = [...days]
  return {
    unit: {
      id: 'runner-track',
      title: 'Runner',
      detail: 'Shared mastery from vocab and the map quiz.',
      href: '',
      words,
    },
    progress,
  }
}

export function pickRunnerWord(units: StudyUnit[], study: StudyState, recent: string[], seed: number): { unitId: string; word: StudyWord } {
  const ranked = [...units].sort((a, b) => shakyScore(b, study) - shakyScore(a, study))
  const unit = ranked[0]
  const progress = study.units[unit.id] ?? blankUnit()
  return { unitId: unit.id, word: pickWord(unit, progress, recent, seed) }
}

function shakyScore(unit: StudyUnit, study: StudyState): number {
  const progress = study.units[unit.id]
  if (!progress) return 1
  return unit.words.reduce((score, word) => {
    const state = progress.words[word.id]
    if (!state || state.weakened || state.meter < 40) return score + 2
    return score + (state.mastered ? 0 : 1)
  }, 0)
}

export function runnerZoneOpen(units: StudyUnit[], study: StudyState, zone: ZoneId, thresholds?: StudyThresholds): boolean {
  const combined = combinedProgress(units, study)
  return zoneOpen(combined.unit, combined.progress, zone, thresholds ? clampThresholds(thresholds) : undefined)
}

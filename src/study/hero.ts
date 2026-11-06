import type { StudyUnit } from './content'
import { zoneOpen, type StudyThresholds, type UnitStudy, type ZoneId } from './engine'
import { DEFAULT_THRESHOLDS } from './engine'

export type SpecialId = 'spin-kick' | 'palm-burst' | 'team-up' | 'super'

export type HeroKit = {
  spinKick: boolean
  secondSlot: boolean
  teamUp: boolean
  superMove: boolean
  duel: boolean
  learned: SpecialId[]
}

export type HeroRuntime = {
  x: number
  y: number
  combo: number
  weakened: boolean
  retreated: boolean
  retreatLeft: number
  slot: 0 | 1
}

export const HERO_PLACEHOLDER_LOOK = 'dojo-ace' as const

const MAP_CLUSTERS: Array<{ id: string; name: string; wordIds: string[] }> = [
  { id: 'gulf', name: 'Gulf rim', wordIds: ['qatar', 'kuwait', 'united-arab-emirates', 'oman'] },
  { id: 'levant', name: 'Levant', wordIds: ['lebanon', 'israel', 'palestine', 'jordan'] },
  { id: 'caucasus', name: 'Caucasus', wordIds: ['georgia', 'armenia', 'azerbaijan', 'turkey'] },
  { id: 'steppe', name: 'Steppe', wordIds: ['kazakhstan', 'uzbekistan', 'kyrgyzstan', 'tajikistan'] },
]

const SKILL_ORDER: SpecialId[] = ['spin-kick', 'palm-burst', 'team-up', 'super']

export function freshHero(): HeroRuntime {
  return { x: 0.62, y: 0.58, combo: 0, weakened: false, retreated: false, retreatLeft: 0, slot: 0 }
}

export function clustersFor(unit: StudyUnit): Array<{ id: string; name: string; wordIds: string[] }> {
  if (unit.id === 'middle-east') return MAP_CLUSTERS
  const groups = new Map<string, string[]>()
  for (const word of unit.words) {
    const key = word.topic || 'general'
    groups.set(key, [...(groups.get(key) ?? []), word.id])
  }
  return [...groups.entries()]
    .filter(([, ids]) => ids.length >= 3)
    .map(([id, wordIds]) => ({ id, name: id, wordIds }))
}

export function completedClusters(unit: StudyUnit, progress: UnitStudy): string[] {
  return clustersFor(unit)
    .filter((cluster) => cluster.wordIds.every((id) => progress.words[id]?.mastered))
    .map((cluster) => cluster.id)
}

export function strikePower(progress: UnitStudy): number {
  const mastered = Object.values(progress.words).filter((word) => word.mastered).length
  return 1 + mastered
}

export function heroKit(unit: StudyUnit, progress: UnitStudy, thresholds: StudyThresholds = DEFAULT_THRESHOLDS): HeroKit {
  const learned = SKILL_ORDER.slice(0, completedClusters(unit, progress).length)
  const mastered = Object.values(progress.words).filter((word) => word.mastered).length
  if (mastered >= 4 && !learned.includes('spin-kick')) learned.unshift('spin-kick')
  const open = (zone: ZoneId) => zoneOpen(unit, progress, zone, thresholds)
  return {
    spinKick: learned.includes('spin-kick'),
    secondSlot: open('ridge'),
    teamUp: open('core'),
    superMove: open('hard'),
    duel: open('legend'),
    learned,
  }
}

export type SpecialFire = {
  hero: HeroRuntime
  fired: SpecialId | null
  weakenedHit: boolean
  laneClear: boolean
}

export function chargeHero(hero: HeroRuntime, kit: HeroKit, shaky: boolean): SpecialFire {
  if (hero.retreated) return { hero, fired: null, weakenedHit: false, laneClear: false }
  const weakened = hero.weakened || shaky
  if (!kit.spinKick) {
    return { hero: { ...hero, weakened, combo: Math.min(90, hero.combo + (shaky ? 8 : 16)) }, fired: null, weakenedHit: false, laneClear: false }
  }
  const gain = shaky ? 18 : 34
  const combo = hero.combo + gain
  if (combo < 100) return { hero: { ...hero, weakened, combo }, fired: null, weakenedHit: false, laneClear: false }
  const fired = pickSpecial(hero, kit)
  const laneClear = !weakened && fired !== 'palm-burst'
  return {
    fired,
    weakenedHit: weakened,
    laneClear,
    hero: { ...hero, combo: 0, weakened: false, slot: hero.slot === 0 ? 1 : 0 },
  }
}

function pickSpecial(hero: HeroRuntime, kit: HeroKit): SpecialId {
  if (kit.superMove && hero.slot === 1) return 'super'
  if (kit.teamUp && hero.slot === 0) return 'team-up'
  if (kit.secondSlot && hero.slot === 1 && kit.learned.includes('palm-burst')) return 'palm-burst'
  return 'spin-kick'
}

export function noteMiss(hero: HeroRuntime): HeroRuntime {
  if (hero.retreated) return hero
  return { ...hero, weakened: true, combo: Math.max(0, hero.combo - 8) }
}

export function knockback(hero: HeroRuntime): HeroRuntime {
  return { ...hero, retreated: true, retreatLeft: 3 }
}

export function tickHero(hero: HeroRuntime): HeroRuntime {
  if (!hero.retreated) return hero
  if (hero.retreatLeft <= 1) return { ...hero, retreated: false, retreatLeft: 0 }
  return { ...hero, retreatLeft: hero.retreatLeft - 1 }
}

export function duelStrike(bossHp: number, weakened: boolean): { bossHp: number; graze: boolean } {
  const damage = weakened ? 1 : 2
  return { bossHp: Math.max(0, bossHp - damage), graze: weakened }
}

export function inRange(hero: HeroRuntime, enemy: { x: number; y: number }, radius = 0.18): boolean {
  if (hero.retreated) return false
  const dx = hero.x - enemy.x
  const dy = hero.y - enemy.y
  return dx * dx + dy * dy <= radius * radius
}

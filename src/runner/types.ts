import type { ZoneId } from '../study/engine'

export type RunnerAbilityId = 'double-jump' | 'dash' | 'air-kick' | 'glide' | 'wall-jump' | 'magnet'

export type RunnerAbility = {
  id: RunnerAbilityId
  name: string
  detail: string
  masteredAt: number
}

export type RunnerWorld = 'dojo' | 'beach' | 'reef' | 'volcano'

export type RunnerCharacter = {
  id: string
  name: string
  poses: { run: string; jump: string; dash: string; glide?: string }
  gear?: { hat?: string | null; scarf?: string | null }
}

export type Cell = '.' | 'G' | '^' | '#' | 'P' | 'Q' | 'W' | 'M' | 'S'

export type RunnerLevel = {
  id: string
  zone: ZoneId
  name: string
  rows: string[]
  speed: number
  world?: RunnerWorld
}

export type RunnerScenery = {
  sky: string
  mid?: string
  ground: string
  ledge: string
  spike: string
  prize: string
}

export type RunnerConfig = {
  character: RunnerCharacter
  tile: number
  gravity: number
  jump: number
  holdBoost: number
  hearts: number
  levels: RunnerLevel[]
  scenery?: Partial<Record<RunnerWorld, RunnerScenery>>
}

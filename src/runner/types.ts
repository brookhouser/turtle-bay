import type { ZoneId } from '../study/engine'

export type RunnerAbilityId = 'double-jump' | 'dash' | 'air-kick' | 'glide' | 'wall-jump' | 'magnet'

export type RunnerAbility = {
  id: RunnerAbilityId
  name: string
  detail: string
  masteredAt: number
}

export type RunnerCharacter = {
  id: string
  name: string
  poses: { run: string; jump: string; dash: string }
}

export type Cell = '.' | 'G' | '^' | '#' | 'P' | 'Q' | 'W'

export type RunnerLevel = {
  id: string
  zone: ZoneId
  name: string
  rows: string[]
  speed: number
}

export type RunnerConfig = {
  character: RunnerCharacter
  tile: number
  gravity: number
  jump: number
  holdBoost: number
  levels: RunnerLevel[]
}

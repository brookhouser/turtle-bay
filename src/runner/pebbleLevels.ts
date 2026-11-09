import type { RunnerLevel, RunnerWorld } from './types'
import type { ZoneId } from '../study/engine'

type Paint = { world: RunnerWorld; cols: number; speed: number; zone: ZoneId; name: string }

function blank(cols: number, rows: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => '.'))
}

function paintLevel(spec: Paint): string[] {
  const rows = blank(spec.cols, 6)
  for (let x = 0; x < spec.cols; x += 1) rows[5][x] = 'G'
  for (let x = 0; x < spec.cols; x += 1) rows[4][x] = 'G'
  for (let x = 26; x < spec.cols - 8; x += 28) {
    rows[4][x] = '.'
    rows[4][x + 1] = '.'
  }
  for (let x = 34; x < spec.cols - 6; x += 36) {
    rows[2][x] = '#'
    rows[2][x + 1] = '#'
    rows[2][x + 2] = 'S'
  }
  for (let x = 48; x < spec.cols - 4; x += 48) rows[4][x] = '^'
  rows[3][12] = 'Q'
  rows[3][Math.floor(spec.cols * 0.62)] = 'Q'
  if (spec.world !== 'beach') {
    for (let x = 30; x < spec.cols - 10; x += 34) rows[3][x] = 'M'
  }
  if (spec.world === 'volcano') {
    rows[1][50] = 'W'
    rows[2][50] = 'W'
    rows[3][50] = 'W'
    rows[1][72] = 'P'
    rows[1][73] = 'P'
  }
  rows[3][8] = 'S'
  rows[3][9] = 'S'
  return rows.map((row) => row.join(''))
}

const SPECS: Paint[] = [
  { zone: 'field', name: 'Beach', world: 'beach', cols: 80, speed: 64 },
  { zone: 'ridge', name: 'Reef', world: 'reef', cols: 80, speed: 70 },
  { zone: 'core', name: 'Volcano', world: 'volcano', cols: 80, speed: 74 },
  { zone: 'hard', name: 'Hard reef', world: 'reef', cols: 80, speed: 84 },
  { zone: 'legend', name: 'Boss beach', world: 'beach', cols: 80, speed: 68 },
]

export const PEBBLE_LEVELS: RunnerLevel[] = SPECS.map((spec) => ({
  id: spec.zone,
  zone: spec.zone,
  name: spec.name,
  world: spec.world,
  speed: spec.speed,
  rows: paintLevel(spec),
}))

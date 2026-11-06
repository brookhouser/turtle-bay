import type { RunnerLevel } from './types'

// G ground, ^ spike, # high path, P secret ledge, Q question gate, W wall, . empty
const field = [
  '................P.........',
  '.............####.........',
  '..........W...............',
  '........Q.................',
  'GGGGGGGGGG^^G....GGGGGGGGG',
]

const ridge = [
  '.............P............',
  '..........####............',
  'G^^GG..GG^^G..Q..GG^^GGGGG',
]

export const RUNNER_LEVELS: RunnerLevel[] = [
  { id: 'field', zone: 'field', name: 'Field', rows: field, speed: 220 },
  { id: 'ridge', zone: 'ridge', name: 'Ridge', rows: ridge, speed: 240 },
  { id: 'core', zone: 'core', name: 'Core', rows: ridge, speed: 260 },
  { id: 'hard', zone: 'hard', name: 'Hard', rows: field, speed: 300 },
  { id: 'legend', zone: 'legend', name: 'Boss', rows: field, speed: 280 },
]

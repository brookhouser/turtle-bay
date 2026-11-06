import { poseSrc } from '../fighter/sheet'
import { RUNNER_LEVELS } from './levels'
import type { RunnerConfig } from './types'

export function samRunnerConfig(): RunnerConfig {
  return {
    character: {
      id: 'dojo-ace',
      name: 'Dojo Ace',
      poses: {
        run: poseSrc('run'),
        jump: poseSrc('jump'),
        dash: poseSrc('dash'),
      },
    },
    tile: 48,
    gravity: 1500,
    jump: -520,
    holdBoost: 28,
    hearts: 1,
    levels: RUNNER_LEVELS,
  }
}

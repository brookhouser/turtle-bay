import { poseSrc } from '../fighter/sheet'
import { RUNNER_LEVELS } from './levels'
import type { RunnerConfig, RunnerScenery } from './types'

function art(file: string): string {
  return `${import.meta.env.BASE_URL}runner/${file}`
}

const DOJO_SCENERY: RunnerScenery = {
  sky: art('dojo/sky.jpg'),
  mid: art('dojo/mid.png'),
  ground: art('dojo/ground.png'),
  ledge: art('dojo/ledge.png'),
  spike: art('dojo/spike.png'),
  prize: art('dojo/medal.png'),
}

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
    scenery: { dojo: DOJO_SCENERY },
  }
}

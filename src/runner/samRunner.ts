import { poseSrc } from '../fighter/sheet'
import { RUNNER_LEVELS } from './levels'
import type { RunnerConfig, RunnerScenery } from './types'

function art(file: string): string {
  return `${import.meta.env.BASE_URL}runner/${file}`
}

const DOJO_SCENERY: RunnerScenery = {
  sky: art('dojo/sky.jpg'),
  mid: art('dojo/mid.png'),
  front: art('dojo/front.png'),
  ground: art('dojo/edge.png'),
  fill: art('dojo/fill.png'),
  ledge: art('dojo/edge.png'),
  capLeft: art('dojo/cap-l.png'),
  capRight: art('dojo/cap-r.png'),
  support: art('dojo/lantern.png'),
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

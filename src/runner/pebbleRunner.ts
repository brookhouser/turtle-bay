import type { RunnerAbility, RunnerConfig, RunnerScenery, RunnerWorld } from './types'
import { PEBBLE_LEVELS } from './pebbleLevels'

export const PEBBLE_ABILITIES: RunnerAbility[] = [
  { id: 'double-jump', name: 'Double jump', detail: 'A second hop opens the high path.', masteredAt: 1 },
  { id: 'dash', name: 'Shell dash', detail: 'The shell slips through spikes.', masteredAt: 2 },
  { id: 'glide', name: 'Glide', detail: 'Hold the jump and Pebble floats down.', masteredAt: 3 },
  { id: 'wall-jump', name: 'Wall jump', detail: 'Push off a wall to a hidden ledge.', masteredAt: 4 },
  { id: 'magnet', name: 'Shell magnet', detail: 'Shells drift in and become snacks at home.', masteredAt: 5 },
]

function sprite(name: string): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}sprites/pebble-${name}.png`
}

function worldArt(world: RunnerWorld): RunnerScenery {
  const base = import.meta.env.BASE_URL || '/'
  return {
    sky: `${base}runner/pebble/${world}-sky.jpg`,
    ground: `${base}runner/pebble/${world}-ground.png`,
    ledge: `${base}runner/pebble/${world}-ledge.png`,
    spike: `${base}runner/pebble/spike.png`,
    prize: `${base}runner/pebble/shell.png`,
  }
}

export function pebbleRunnerConfig(options: { hearts: number; hat?: string | null; scarf?: string | null }): RunnerConfig {
  const base = import.meta.env.BASE_URL || '/'
  return {
    character: {
      id: 'pebble',
      name: 'Pebble',
      poses: {
        run: sprite('run'),
        jump: sprite('jump'),
        dash: sprite('dash'),
        glide: sprite('glide'),
      },
      gear: {
        hat: options.hat ? `${base}sprites/accessories/${options.hat}.png` : null,
        scarf: options.scarf ? `${base}sprites/accessories/${options.scarf}.png` : null,
      },
    },
    tile: 48,
    gravity: 1180,
    jump: -460,
    holdBoost: 22,
    hearts: options.hearts,
    levels: PEBBLE_LEVELS,
    scenery: {
      beach: worldArt('beach'),
      reef: worldArt('reef'),
      volcano: worldArt('volcano'),
    },
  }
}

export function startingHearts(hunger: number, happy: number): number {
  return hunger >= 60 && happy >= 60 ? 2 : 1
}

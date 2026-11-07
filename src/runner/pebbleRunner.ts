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
  const edge = world === 'beach' ? 'grass-edge' : world === 'reef' ? 'reef-edge' : 'lava-edge'
  const fill = world === 'beach' ? 'sand-fill' : world === 'reef' ? 'reef-fill2' : 'ash-fill'
  const cap = world === 'beach' ? 'sand' : world === 'reef' ? 'reef' : 'lava'
  const prop = world === 'beach' ? 'palm.png' : world === 'reef' ? 'coral.png' : ''
  return {
    sky: `${base}runner/pebble/${world}-sky.jpg`,
    mid: `${base}runner/pebble/${world}-mid.png`,
    front: `${base}runner/pebble/${world}-front.png`,
    ground: `${base}runner/pebble/${edge}.png`,
    fill: `${base}runner/pebble/${fill}.png`,
    ledge: `${base}runner/pebble/${edge}.png`,
    capLeft: `${base}runner/pebble/${cap}-cap-l.png`,
    capRight: `${base}runner/pebble/${cap}-cap-r.png`,
    tuft: world === 'beach' ? `${base}runner/pebble/grass-tuft.png` : undefined,
    spike: `${base}runner/pebble/spike.png`,
    prize: `${base}runner/pebble/shell.png`,
    prop: prop ? `${base}runner/pebble/${prop}` : undefined,
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

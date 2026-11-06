import type { FighterLookId } from '../types'
import { SAM_FIGHTER_ID } from './sheet'

export type FighterLook = {
  id: FighterLookId
  name: string
  style: string
  blurb: string
  image: string
  retired?: boolean
}

export const DOJO_ACE: FighterLook = {
  id: SAM_FIGHTER_ID,
  name: 'Dojo Ace',
  style: 'Karate',
  blurb: 'White gi, orange trim, orange belt. This is Sam\'s fighter.',
  image: 'fighters/dojo-ace/reference.jpg',
}

// Kept on disk only. They are not choices and not defaults.
export const RETIRED_LOOKS: FighterLook[] = [
  {
    id: 'shadow-blade',
    name: 'Shadow Blade',
    style: 'Ninja',
    blurb: 'Retired. Not a default.',
    image: 'fighters/shadow-blade.jpg',
    retired: true,
  },
  {
    id: 'pulse-fist',
    name: 'Pulse Fist',
    style: 'Cyber',
    blurb: 'Retired. Not a default.',
    image: 'fighters/pulse-fist.jpg',
    retired: true,
  },
  {
    id: 'street-flow',
    name: 'Street Flow',
    style: 'Urban kung fu',
    blurb: 'Retired. Not a default.',
    image: 'fighters/street-flow.jpg',
    retired: true,
  },
]

export const FIGHTER_LOOKS: FighterLook[] = [DOJO_ACE]

export function lookById(id: FighterLookId | null | undefined): FighterLook | undefined {
  if (id === SAM_FIGHTER_ID) return DOJO_ACE
  return RETIRED_LOOKS.find((look) => look.id === id)
}

export function playableLook(id: FighterLookId | null | undefined): FighterLook {
  return id === SAM_FIGHTER_ID ? DOJO_ACE : DOJO_ACE
}

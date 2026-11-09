// Credit prices are cosmetic: outfits, belts, and dances. They do not change
// tower-defense power. The hero's strength comes from mastery in src/study/hero.ts.
export type UnlockKind = 'gear' | 'belt' | 'skill' | 'move' | 'dance'

export type Unlock = {
  id: string
  kind: UnlockKind
  name: string
  detail: string
  cost: number
  clipId?: 'idle' | 'bow' | 'jab' | 'kick' | 'bounce' | 'shuffle'
}

export const UNLOCKS: Unlock[] = [
  { id: 'belt-white', kind: 'belt', name: 'White belt', detail: 'Starting rank.', cost: 10 },
  { id: 'belt-yellow', kind: 'belt', name: 'Yellow belt', detail: 'A step up.', cost: 20 },
  { id: 'belt-green', kind: 'belt', name: 'Green belt', detail: 'Holds a stance.', cost: 30 },
  { id: 'belt-blue', kind: 'belt', name: 'Blue belt', detail: 'Cleaner kicks.', cost: 40 },
  { id: 'belt-brown', kind: 'belt', name: 'Brown belt', detail: 'Close to the top.', cost: 55 },
  { id: 'belt-black', kind: 'belt', name: 'Black belt', detail: 'Earned, not given.', cost: 70 },
  { id: 'gear-wraps', kind: 'gear', name: 'Hand wraps', detail: 'Wrists stay tight.', cost: 15 },
  { id: 'gear-hood', kind: 'gear', name: 'Hood scarf', detail: 'A quieter outline.', cost: 20 },
  { id: 'gear-shins', kind: 'gear', name: 'Shin guards', detail: 'For the kicks.', cost: 25 },
  { id: 'gear-jacket', kind: 'gear', name: 'Team jacket', detail: 'Worn open over the kit.', cost: 40 },
  { id: 'skill-breath', kind: 'skill', name: 'Calm breath', detail: 'Reset between rounds.', cost: 10 },
  { id: 'skill-footwork', kind: 'skill', name: 'Footwork', detail: 'Shorter steps, better balance.', cost: 20 },
  { id: 'skill-focus', kind: 'skill', name: 'Focus', detail: 'Eyes on one target.', cost: 25 },
  { id: 'move-ready', kind: 'move', name: 'Ready stance', detail: 'The default.', cost: 0, clipId: 'idle' },
  { id: 'move-bow', kind: 'move', name: 'Bow', detail: 'In and out of the round.', cost: 0, clipId: 'bow' },
  { id: 'move-jab', kind: 'move', name: 'Jab combo', detail: 'Two quick hands.', cost: 15, clipId: 'jab' },
  { id: 'move-kick', kind: 'move', name: 'Rising kick', detail: 'Knee up, then out.', cost: 25, clipId: 'kick' },
  { id: 'dance-bounce', kind: 'dance', name: 'Bay bounce', detail: 'A short victory bounce.', cost: 30, clipId: 'bounce' },
  { id: 'dance-shuffle', kind: 'dance', name: 'Dojo shuffle', detail: 'Feet first, then shoulders.', cost: 30, clipId: 'shuffle' },
]

export function unlockById(id: string): Unlock | undefined {
  return UNLOCKS.find((item) => item.id === id)
}

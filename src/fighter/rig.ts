import type { FighterState } from '../types'
import { unlockById } from './catalog'

// Phase 1 plays clips through a placeholder driver. The clip ids are the
// contract a later backend has to honor. Recommendation: Rive, not three.js.
// A kept Gemini edit is a 2D image. Rive can swap that image on the same
// bones, so one state machine drives every look. Mixamo clips target
// realistic proportions and would fight this character's head-to-body ratio,
// and a glTF body would not become the picture Sam just kept.
export const RECOMMENDED_BACKEND = 'rive' as const

export type AnimClipId = 'idle' | 'bow' | 'jab' | 'kick' | 'bounce' | 'shuffle'

export type AnimClip = {
  id: AnimClipId
  label: string
  riveState: string
  gltfClip: string
}

export const CLIPS: AnimClip[] = [
  { id: 'idle', label: 'Ready', riveState: 'idle', gltfClip: 'Idle' },
  { id: 'bow', label: 'Bow', riveState: 'bow', gltfClip: 'Bow' },
  { id: 'jab', label: 'Jab combo', riveState: 'jab', gltfClip: 'Jab' },
  { id: 'kick', label: 'Rising kick', riveState: 'kick', gltfClip: 'Kick' },
  { id: 'bounce', label: 'Bay bounce', riveState: 'danceBounce', gltfClip: 'DanceBounce' },
  { id: 'shuffle', label: 'Dojo shuffle', riveState: 'danceShuffle', gltfClip: 'DanceShuffle' },
]

export type RigDriver = {
  backend: 'rive' | 'gltf' | 'placeholder'
  assetUrl: string | null
  clip: AnimClipId
}

export function placeholderRig(clip: AnimClipId): RigDriver {
  return { backend: 'placeholder', assetUrl: null, clip }
}

export function clipForUnlock(unlockId: string): AnimClipId | null {
  const clip = unlockById(unlockId)?.clipId
  return clip ?? null
}

export function ownedClips(fighter: FighterState | null): AnimClipId[] {
  const unlocked = new Set(fighter?.unlocked ?? ['move-ready', 'move-bow'])
  const clips: AnimClipId[] = []
  for (const item of unlocked) {
    const clip = clipForUnlock(item)
    if (clip && !clips.includes(clip)) clips.push(clip)
  }
  return clips.length > 0 ? clips : ['idle']
}

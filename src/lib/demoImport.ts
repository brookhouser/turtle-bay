import { normalizeKid } from '../game/logic'
import { loadSave } from './storage'
import type { KidProfile } from '../types'

// One-time move of demo progress (localStorage) into a synced bay on this browser.
// The demo save is left in place as a backup. A flag stops a second import.
const IMPORT_FLAG = 'turtlebay.imported.v1'

function progressScore(kid: KidProfile): number {
  return kid.sessions.length * 1000 + kid.turtle.coins + Object.keys(kid.turtle.inventory).length + (kid.turtle.named ? 1 : 0)
}

function isFresh(kid: KidProfile): boolean {
  return progressScore(kid) === 0 && kid.practiceDays.length === 0
}

function demoKids(): KidProfile[] {
  try {
    return loadSave()
      .kids.filter((entry) => entry && typeof entry.id === 'string' && typeof entry.nickname === 'string')
      .map((entry) => normalizeKid(entry))
  } catch {
    return []
  }
}

function alreadyImported(): boolean {
  try {
    return Boolean(localStorage.getItem(IMPORT_FLAG))
  } catch {
    return true
  }
}

// Returns the cloud kid with demo progress folded in, or null when there is nothing to import.
// Picks the demo bay with the same name, otherwise the demo bay with the most progress.
export function withDemoProgress(cloud: KidProfile): { kid: KidProfile; demoId: string } | null {
  if (alreadyImported() || !isFresh(cloud)) return null
  const kids = demoKids()
  const name = cloud.nickname.trim().toLowerCase()
  const match =
    kids.find((entry) => entry.nickname.trim().toLowerCase() === name) ??
    [...kids].sort((a, b) => progressScore(b) - progressScore(a))[0]
  if (!match || progressScore(match) === 0) return null
  return {
    demoId: match.id,
    kid: {
      ...cloud,
      turtle: match.turtle,
      lessons: match.lessons,
      sessions: match.sessions,
      customChallenges: match.customChallenges,
      practiceDays: match.practiceDays,
    },
  }
}

export function markDemoImported(demoId: string, cloudId: string) {
  try {
    localStorage.setItem(IMPORT_FLAG, JSON.stringify({ demoId, cloudId, at: Date.now() }))
  } catch {
    // Storage full or blocked. The import may run again, which only rewrites the same data.
  }
}

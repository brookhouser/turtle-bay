import type { FighterLookId, KidProfile } from '../types'
import { unlockById } from './catalog'
import { SAM_FIGHTER_ID } from './sheet'

export function chooseLook(kid: KidProfile, lookId: FighterLookId): { kid: KidProfile; error?: string } {
  if (kid.motivation !== 'fighter' || !kid.fighter) return { kid, error: 'This bay does not have a fighter.' }
  if (lookId !== SAM_FIGHTER_ID) return { kid, error: 'Dojo Ace is Sam\'s fighter.' }
  return { kid: { ...kid, fighter: { ...kid.fighter, lookId: SAM_FIGHTER_ID } } }
}

export function unlockItem(kid: KidProfile, itemId: string): { kid: KidProfile; error?: string } {
  if (kid.motivation !== 'fighter' || !kid.fighter) return { kid, error: 'This bay does not have a fighter.' }
  const item = unlockById(itemId)
  if (!item) return { kid, error: 'That upgrade is not in the list.' }
  if (kid.fighter.unlocked.includes(item.id)) return { kid, error: 'Already unlocked.' }
  if (item.cost > kid.credits) return { kid, error: `That costs ${item.cost} credits. You have ${kid.credits}.` }
  const equippedGear = item.kind === 'belt' || item.kind === 'gear'
    ? [...kid.fighter.equippedGear.filter((id) => (item.kind === 'belt' ? !id.startsWith('belt-') : true)), item.id]
    : kid.fighter.equippedGear
  return {
    kid: {
      ...kid,
      credits: kid.credits - item.cost,
      fighter: {
        ...kid.fighter,
        unlocked: [...kid.fighter.unlocked, item.id],
        equippedGear,
      },
    },
  }
}

export function toggleGear(kid: KidProfile, itemId: string): { kid: KidProfile; error?: string } {
  if (!kid.fighter) return { kid, error: 'This bay does not have a fighter.' }
  if (!kid.fighter.unlocked.includes(itemId)) return { kid, error: 'Unlock it first.' }
  const item = unlockById(itemId)
  if (!item || (item.kind !== 'gear' && item.kind !== 'belt')) return { kid, error: 'That one stays on the list.' }
  const wearing = kid.fighter.equippedGear.includes(itemId)
  const equippedGear = wearing
    ? kid.fighter.equippedGear.filter((id) => id !== itemId)
    : [...kid.fighter.equippedGear.filter((id) => (item.kind === 'belt' ? !id.startsWith('belt-') : true)), itemId]
  return { kid: { ...kid, fighter: { ...kid.fighter, equippedGear } } }
}

import { clampMeter } from '../game/logic'
import { localDay } from '../lib/format'
import type { Completion, CompletionKind, KidProfile, PersonalAssignment, RepeatMode, RewardItem, RoutineItem, RoutineSlot, TaskItem } from '../types'

export const DEFAULT_ROUTINE_POINTS = 5
export const DEFAULT_TASK_POINTS = 10
export const DEFAULT_ASSIGNMENT_POINTS = 15

export function clampPoints(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  const rounded = Math.round(value)
  if (rounded < 1) return 1
  if (rounded > 50) return 50
  return rounded
}

function cleanTitle(raw: string, min: number, max: number): string | null {
  const title = raw.trim().replace(/\s+/g, ' ')
  if (title.length < min || title.length > max) return null
  return title
}

export function addTask(kid: KidProfile, draft: { title: string; notes?: string; points?: number; repeat?: RepeatMode }, now = Date.now()): { kid: KidProfile; error?: string } {
  const title = cleanTitle(draft.title, 2, 80)
  if (!title) return { kid, error: 'Task titles need 2 to 80 characters.' }
  const task: TaskItem = {
    id: crypto.randomUUID(),
    title,
    notes: (draft.notes ?? '').trim().slice(0, 280),
    points: clampPoints(draft.points ?? DEFAULT_TASK_POINTS, DEFAULT_TASK_POINTS),
    repeat: draft.repeat === 'once' ? 'once' : 'daily',
    active: true,
    createdAt: new Date(now).toISOString(),
  }
  return { kid: { ...kid, tasks: [task, ...kid.tasks] } }
}

export function removeTask(kid: KidProfile, taskId: string): KidProfile {
  return { ...kid, tasks: kid.tasks.filter((task) => task.id !== taskId) }
}

export function addRoutine(kid: KidProfile, draft: { title: string; slot: RoutineSlot; points?: number }): { kid: KidProfile; error?: string } {
  const title = cleanTitle(draft.title, 2, 80)
  if (!title) return { kid, error: 'Routine steps need 2 to 80 characters.' }
  const item: RoutineItem = {
    id: crypto.randomUUID(),
    title,
    slot: draft.slot === 'evening' ? 'evening' : 'morning',
    points: clampPoints(draft.points ?? DEFAULT_ROUTINE_POINTS, DEFAULT_ROUTINE_POINTS),
    active: true,
  }
  return { kid: { ...kid, routines: [...kid.routines, item] } }
}

export function removeRoutine(kid: KidProfile, routineId: string): KidProfile {
  return { ...kid, routines: kid.routines.filter((item) => item.id !== routineId) }
}

export function addPersonalAssignment(
  kid: KidProfile,
  draft: { title: string; subject?: string; notes?: string; points?: number; due?: string; link?: string },
  now = Date.now(),
): { kid: KidProfile; error?: string } {
  const title = cleanTitle(draft.title, 2, 80)
  if (!title) return { kid, error: 'Assignment titles need 2 to 80 characters.' }
  const link = (draft.link ?? '').trim()
  if (link && !/^https?:\/\//i.test(link)) return { kid, error: 'Links need to start with https://.' }
  const item: PersonalAssignment = {
    id: crypto.randomUUID(),
    title,
    subject: (draft.subject ?? '').trim().slice(0, 40),
    notes: (draft.notes ?? '').trim().slice(0, 400),
    points: clampPoints(draft.points ?? DEFAULT_ASSIGNMENT_POINTS, DEFAULT_ASSIGNMENT_POINTS),
    due: (draft.due ?? '').trim().slice(0, 20),
    link,
    active: true,
    createdAt: new Date(now).toISOString(),
  }
  return { kid: { ...kid, assignments: [item, ...kid.assignments] } }
}

export function removePersonalAssignment(kid: KidProfile, assignmentId: string): KidProfile {
  return { ...kid, assignments: kid.assignments.filter((item) => item.id !== assignmentId) }
}

export function addReward(kid: KidProfile, draft: { title: string; cost?: number }): { kid: KidProfile; error?: string } {
  const title = cleanTitle(draft.title, 2, 80)
  if (!title) return { kid, error: 'Reward names need 2 to 80 characters.' }
  const reward: RewardItem = { id: crypto.randomUUID(), title, cost: clampPoints(draft.cost ?? 20, 20), active: true }
  return { kid: { ...kid, rewards: [...kid.rewards, reward] } }
}

export function removeReward(kid: KidProfile, rewardId: string): KidProfile {
  return { ...kid, rewards: kid.rewards.filter((reward) => reward.id !== rewardId) }
}

export function redeemReward(kid: KidProfile, rewardId: string): { kid: KidProfile; error?: string } {
  const reward = kid.rewards.find((item) => item.id === rewardId && item.active)
  if (!reward) return { kid, error: 'That reward is not available.' }
  if (kid.turtle.coins < reward.cost) return { kid, error: `That costs ${reward.cost} coins. You have ${kid.turtle.coins}.` }
  return {
    kid: {
      ...kid,
      turtle: { ...kid.turtle, coins: kid.turtle.coins - reward.cost },
      rewards: kid.rewards.map((item) => (item.id === rewardId ? { ...item, active: false } : item)),
    },
  }
}

export type CheckTarget = {
  itemId: string
  kind: CompletionKind
  source: 'kid' | 'group'
  groupId: string
  points: number
  repeat: RepeatMode
}

export function completionMatches(completion: Completion, target: CheckTarget, day: string): boolean {
  if (completion.itemId !== target.itemId || completion.kind !== target.kind || completion.source !== target.source) return false
  if (target.repeat === 'daily') return completion.day === day
  return true
}

export function isChecked(kid: KidProfile, target: CheckTarget, day = localDay()): boolean {
  return kid.completions.some((completion) => completionMatches(completion, target, day))
}

export function toggleCheck(kid: KidProfile, target: CheckTarget, day = localDay(), now = Date.now()): { kid: KidProfile; error?: string; awarded: number } {
  const existing = kid.completions.find((completion) => completionMatches(completion, target, day))
  if (existing) {
    return {
      awarded: 0,
      kid: {
        ...kid,
        turtle: {
          ...kid.turtle,
          coins: Math.max(0, kid.turtle.coins - existing.pointsAwarded),
          happy: kid.focus === 'turtle' ? clampMeter(kid.turtle.happy - existing.happyAwarded) : kid.turtle.happy,
        },
        completions: kid.completions.filter((completion) => completion.id !== existing.id),
      },
    }
  }
  const points = clampPoints(target.points, 1)
  const happyAwarded = kid.focus === 'turtle' ? 6 : 0
  const completion: Completion = {
    id: crypto.randomUUID(),
    itemId: target.itemId,
    kind: target.kind,
    source: target.source,
    groupId: target.groupId,
    day,
    pointsAwarded: points,
    happyAwarded,
    completedAt: new Date(now).toISOString(),
  }
  return {
    awarded: points,
    kid: {
      ...kid,
      turtle: {
        ...kid.turtle,
        coins: kid.turtle.coins + points,
        happy: kid.focus === 'turtle' ? clampMeter(kid.turtle.happy + happyAwarded) : kid.turtle.happy,
      },
      completions: [completion, ...kid.completions].slice(0, 400),
    },
  }
}

export function checksOnDay(kid: KidProfile, day = localDay()): number {
  return kid.completions.filter((completion) => completion.day === day).length
}

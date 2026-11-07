import { clampMeter } from '../game/logic'
import { localDay } from '../lib/format'
import type { Completion, CompletionKind, KidProfile, PersonalAssignment, RepeatMode, RoutineItem, RoutineSlot, TaskItem } from '../types'

export const DEFAULT_ROUTINE_POINTS = 5
export const DEFAULT_TASK_POINTS = 10
export const DEFAULT_ASSIGNMENT_POINTS = 15
export const HAPPY_ON_CHECK = 6

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

export function updateTask(kid: KidProfile, taskId: string, draft: { title: string; notes?: string; points?: number; repeat?: RepeatMode }): { kid: KidProfile; error?: string } {
  const title = cleanTitle(draft.title, 2, 80)
  if (!title) return { kid, error: 'Task titles need 2 to 80 characters.' }
  if (!kid.tasks.some((task) => task.id === taskId)) return { kid, error: 'That task is gone.' }
  return {
    kid: {
      ...kid,
      tasks: kid.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              title,
              notes: (draft.notes ?? '').trim().slice(0, 280),
              points: clampPoints(draft.points ?? task.points, task.points),
              repeat: draft.repeat === 'once' ? 'once' : 'daily',
            }
          : task,
      ),
    },
  }
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

export function updateRoutine(kid: KidProfile, routineId: string, draft: { title: string; slot: RoutineSlot; points?: number }): { kid: KidProfile; error?: string } {
  const title = cleanTitle(draft.title, 2, 80)
  if (!title) return { kid, error: 'Routine steps need 2 to 80 characters.' }
  if (!kid.routines.some((item) => item.id === routineId)) return { kid, error: 'That step is gone.' }
  return {
    kid: {
      ...kid,
      routines: kid.routines.map((item) =>
        item.id === routineId
          ? {
              ...item,
              title,
              slot: draft.slot === 'evening' ? 'evening' : 'morning',
              points: clampPoints(draft.points ?? item.points, item.points),
            }
          : item,
      ),
    },
  }
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

export function updatePersonalAssignment(
  kid: KidProfile,
  assignmentId: string,
  draft: { title: string; subject?: string; notes?: string; points?: number; due?: string; link?: string },
): { kid: KidProfile; error?: string } {
  const title = cleanTitle(draft.title, 2, 80)
  if (!title) return { kid, error: 'Assignment titles need 2 to 80 characters.' }
  const link = (draft.link ?? '').trim()
  if (link && !/^https?:\/\//i.test(link)) return { kid, error: 'Links need to start with https://.' }
  if (!kid.assignments.some((item) => item.id === assignmentId)) return { kid, error: 'That assignment is gone.' }
  return {
    kid: {
      ...kid,
      assignments: kid.assignments.map((item) =>
        item.id === assignmentId
          ? {
              ...item,
              title,
              subject: (draft.subject ?? '').trim().slice(0, 40),
              notes: (draft.notes ?? '').trim().slice(0, 400),
              points: clampPoints(draft.points ?? item.points, item.points),
              due: (draft.due ?? '').trim().slice(0, 20),
              link,
            }
          : item,
      ),
    },
  }
}

export function removePersonalAssignment(kid: KidProfile, assignmentId: string): KidProfile {
  return { ...kid, assignments: kid.assignments.filter((item) => item.id !== assignmentId) }
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
  if (target.source === 'group' && completion.groupId !== target.groupId) return false
  if (target.repeat === 'daily') return completion.day === day
  return true
}

export function isChecked(kid: KidProfile, target: CheckTarget, day = localDay()): boolean {
  return kid.completions.some((completion) => completionMatches(completion, target, day))
}

export function toggleCheck(kid: KidProfile, target: CheckTarget, day = localDay(), now = Date.now()): { kid: KidProfile; error?: string; awarded: number } {
  const existing = kid.completions.find((completion) => completionMatches(completion, target, day))
  if (existing) {
    const credits = Math.max(0, kid.credits - existing.pointsAwarded)
    const turtle = kid.motivation === 'turtle'
      ? { ...kid.turtle, happy: clampMeter(kid.turtle.happy - existing.happyAwarded) }
      : kid.turtle
    return {
      awarded: 0,
      kid: {
        ...kid,
        credits,
        turtle,
        completions: kid.completions.filter((completion) => completion.id !== existing.id),
      },
    }
  }
  const points = clampPoints(target.points, 1)
  const happyAwarded = kid.motivation === 'turtle' ? HAPPY_ON_CHECK : 0
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
      credits: kid.credits + points,
      turtle: kid.motivation === 'turtle' ? { ...kid.turtle, happy: clampMeter(kid.turtle.happy + happyAwarded) } : kid.turtle,
      completions: [completion, ...kid.completions].slice(0, 400),
    },
  }
}

export function checksOnDay(kid: KidProfile, day = localDay()): number {
  return kid.completions.filter((completion) => completion.day === day).length
}

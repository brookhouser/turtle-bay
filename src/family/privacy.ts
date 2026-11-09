import type { Completion, KidProfile, RoutineItem, TaskItem } from '../types'

export type HomeBoard = {
  tasks: TaskItem[]
  routines: RoutineItem[]
  completions: Completion[]
}

export function isSchoolSession(scope: string | undefined): boolean {
  return scope === 'school'
}

// The document a school login is allowed to read. Family tasks and routines are absent, not empty.
export function publicKidPayload(kid: KidProfile): Record<string, unknown> {
  const academicChecks = kid.completions.filter((item) => item.kind === 'assignment')
  const payload = { ...kid, academicChecks } as Record<string, unknown>
  delete payload.tasks
  delete payload.routines
  delete payload.completions
  return payload
}

export function homeBoard(kid: KidProfile): HomeBoard {
  return {
    tasks: kid.tasks,
    routines: kid.routines,
    completions: kid.completions.filter((item) => item.kind !== 'assignment'),
  }
}

export function mergeHome(kid: KidProfile, home: HomeBoard | null): KidProfile {
  const academic = kid.completions.filter((item) => item.kind === 'assignment')
  if (!home) return { ...kid, tasks: [], routines: [], completions: academic }
  return {
    ...kid,
    tasks: home.tasks ?? [],
    routines: home.routines ?? [],
    completions: [...academic, ...(home.completions ?? [])],
  }
}

// School scope never receives routine or task fields, even if a stale copy is in memory.
export function schoolProjection(kid: KidProfile): KidProfile {
  return {
    ...kid,
    tasks: [],
    routines: [],
    completions: kid.completions.filter((item) => item.kind === 'assignment'),
  }
}

export function kidFromPublicDoc(kid: KidProfile, data: { academicChecks?: Completion[]; tasks?: TaskItem[]; routines?: RoutineItem[] }): KidProfile {
  const academic = Array.isArray(data.academicChecks)
    ? data.academicChecks.filter((item) => item.kind === 'assignment')
    : kid.completions.filter((item) => item.kind === 'assignment')
  return { ...kid, tasks: [], routines: [], completions: academic }
}

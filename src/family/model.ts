import type { StudyThresholds } from '../study/engine'
import type { KidProfile } from '../types'

export type MemberRole = 'parent' | 'kid'

export type DirectoryEntry = {
  email: string
  familyId: string
  role: MemberRole
  name: string
  kidId: string | null
}

export type RosterChip = {
  name: string
  role: MemberRole
  kidId: string | null
  email: string
}

export type FamilyRecord = {
  id: string
  name: string
  invitedBy: string | null
  groupIds: string[]
  geminiMonthlyCapUsd: number
  studyThresholds: StudyThresholds
  roster: RosterChip[]
}

export type GroupKid = {
  familyId: string
  kidId: string
  name: string
}

export type ClassGroup = {
  id: string
  name: string
  ownerFamilyId: string
  familyIds: string[]
  kids: GroupKid[]
}

export type GroupAssignment = {
  id: string
  groupId: string
  title: string
  subject: string
  notes: string
  points: number
  due: string
  link: string
  active: boolean
  createdAt: string
  authorFamilyId: string
  authorEmail: string
  authorFamilyName: string
}

export type World = {
  families: FamilyRecord[]
  kids: KidProfile[]
  directory: DirectoryEntry[]
  groups: ClassGroup[]
  groupAssignments: GroupAssignment[]
}

export type AssignmentAudience = 'kid' | 'group'

export type AssignmentDraft = {
  title: string
  subject: string
  notes: string
  points: number
  due: string
  link: string
  audience: AssignmentAudience
  groupId: string | null
}

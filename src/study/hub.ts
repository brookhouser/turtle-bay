import { STUDY_UNITS, type StudyUnit } from './content'
import { MIDDLE_EAST_UNIT } from './mapUnit'

export function hubUnits(): StudyUnit[] {
  return [...STUDY_UNITS, MIDDLE_EAST_UNIT]
}

export function hubUnit(id: string): StudyUnit | undefined {
  return hubUnits().find((unit) => unit.id === id)
}

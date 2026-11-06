import type { StudyUnit } from './content'
import countriesDoc from './maps/middle-east-central-asia/countries.json'

export const MAP_UNIT_ID = 'middle-east'
export const MAP_DUE = '2026-11-13'
export const MAP_MASTERY_CREDITS = 4

type CountryRecord = {
  id: string
  name: string
  quiz?: boolean
  small?: boolean
  suggestedView?: string
  borders?: string[]
  aliases?: string[]
  rejectAlone?: string[]
  partialHint?: string
  hook?: string
}

type CountriesFile = {
  meta: {
    views: Record<string, { west: number; south: number; east: number; north: number }>
  }
  countries: CountryRecord[]
}

export const COUNTRY_PACK = countriesDoc as CountriesFile

export const QUIZ_COUNTRIES = COUNTRY_PACK.countries.filter((country) => country.quiz)

const quizIds = new Set(QUIZ_COUNTRIES.map((country) => country.id))

export const MIDDLE_EAST_UNIT: StudyUnit = {
  id: MAP_UNIT_ID,
  kind: 'map',
  title: 'Middle East + Central Asia map quiz',
  detail: '22 countries. Tap the map, then name the highlighted country.',
  href: '',
  due: MAP_DUE,
  words: QUIZ_COUNTRIES.map((country) => ({
    id: country.id,
    term: country.name,
    definition: country.hook || `Find ${country.name} on the map.`,
    topic: 'map',
  })),
}

export const MAP_COUNTRY_NAMES = MIDDLE_EAST_UNIT.words.map((word) => word.term)

export function countryRecord(id: string): CountryRecord | undefined {
  return QUIZ_COUNTRIES.find((country) => country.id === id)
}

export function suggestedView(id: string): string {
  return countryRecord(id)?.suggestedView || 'full'
}

export function viewBoxFor(name: string) {
  return COUNTRY_PACK.meta.views[name] ?? COUNTRY_PACK.meta.views.full
}

export function neighborsOf(id: string) {
  const borders = countryRecord(id)?.borders ?? []
  return borders
    .filter((border) => quizIds.has(border))
    .map((border) => MIDDLE_EAST_UNIT.words.find((word) => word.id === border))
    .filter((word): word is StudyUnit['words'][number] => Boolean(word))
}

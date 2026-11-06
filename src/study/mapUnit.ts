import type { StudyUnit, StudyWord } from './content'
import mapData from './maps/middle-east.json'

export const MAP_UNIT_ID = 'middle-east'
export const MAP_DUE = '2026-11-13'
export const MAP_MASTERY_CREDITS = 4

type MapCountry = {
  id: string
  name: string
  iso: string
  small: boolean
  label: [number, number]
  rings: number[][][]
}

export type MapPack = {
  license: string
  note: string
  countries: MapCountry[]
}

export const MIDDLE_EAST_MAP = mapData as MapPack

const NEIGHBORS: Record<string, string[]> = {
  yemen: ['oman', 'saudi-arabia'],
  oman: ['yemen', 'united-arab-emirates', 'saudi-arabia'],
  'saudi-arabia': ['yemen', 'oman', 'qatar', 'united-arab-emirates', 'kuwait', 'jordan', 'iraq'],
  qatar: ['saudi-arabia', 'united-arab-emirates'],
  'united-arab-emirates': ['oman', 'saudi-arabia', 'qatar'],
  kuwait: ['saudi-arabia', 'iraq'],
  jordan: ['saudi-arabia', 'israel', 'palestine', 'syria', 'iraq'],
  israel: ['palestine', 'jordan', 'lebanon', 'syria'],
  palestine: ['israel', 'jordan', 'lebanon'],
  lebanon: ['syria', 'israel', 'palestine'],
  syria: ['turkey', 'iraq', 'jordan', 'lebanon', 'israel'],
  iraq: ['syria', 'turkey', 'iran', 'saudi-arabia', 'kuwait', 'jordan'],
  iran: ['iraq', 'turkey', 'turkmenistan', 'azerbaijan', 'armenia'],
  azerbaijan: ['armenia', 'iran', 'georgia', 'turkey'],
  armenia: ['georgia', 'turkey', 'azerbaijan', 'iran'],
  turkey: ['syria', 'iraq', 'iran', 'georgia', 'armenia', 'azerbaijan'],
  georgia: ['turkey', 'armenia', 'azerbaijan'],
  kyrgyzstan: ['kazakhstan', 'uzbekistan', 'tajikistan'],
  turkmenistan: ['kazakhstan', 'uzbekistan', 'iran', 'tajikistan'],
  tajikistan: ['kyrgyzstan', 'uzbekistan', 'turkmenistan'],
  uzbekistan: ['kazakhstan', 'turkmenistan', 'tajikistan', 'kyrgyzstan'],
  kazakhstan: ['uzbekistan', 'kyrgyzstan', 'turkmenistan'],
}

export const MIDDLE_EAST_UNIT: StudyUnit = {
  id: MAP_UNIT_ID,
  kind: 'map',
  title: 'Middle East + Central Asia map quiz',
  detail: '22 countries. Tap the map, then name the highlighted country.',
  href: '',
  due: MAP_DUE,
  words: MIDDLE_EAST_MAP.countries.map((country) => ({
    id: country.id,
    term: country.name,
    definition: `Find ${country.name} on the map.`,
    topic: 'map',
  })),
}

export function countryById(id: string): MapCountry | undefined {
  return MIDDLE_EAST_MAP.countries.find((country) => country.id === id)
}

export function neighborsOf(id: string): StudyWord[] {
  const ids = NEIGHBORS[id] ?? []
  return ids
    .map((item) => MIDDLE_EAST_UNIT.words.find((word) => word.id === item))
    .filter((word): word is StudyWord => Boolean(word))
}

export const MAP_COUNTRY_NAMES = MIDDLE_EAST_UNIT.words.map((word) => word.term)

import { describe, expect, it } from 'vitest'
import { MAP_COUNTRY_NAMES, MIDDLE_EAST_UNIT } from './mapUnit'
import { nextMapPrompt, typedMatch } from './mapQuestions'
import { blankUnit } from './engine'
import { MECA_GEOMETRY, MECA_MAP } from './meca'

const EXPECTED = [
  'Yemen', 'Oman', 'Saudi Arabia', 'Qatar', 'United Arab Emirates', 'Kuwait', 'Jordan', 'Israel', 'Palestine',
  'Lebanon', 'Syria', 'Iraq', 'Iran', 'Azerbaijan', 'Armenia', 'Turkey', 'Georgia', 'Kyrgyzstan', 'Turkmenistan',
  'Tajikistan', 'Uzbekistan', 'Kazakhstan',
]

describe('middle east map unit', () => {
  it('lists the 22 confirmed countries and labels Palestine as Palestine', () => {
    expect(MAP_COUNTRY_NAMES).toEqual(EXPECTED)
    expect(MIDDLE_EAST_UNIT.kind).toBe('map')
    expect(MIDDLE_EAST_UNIT.due).toBe('2026-11-13')
    expect(MIDDLE_EAST_UNIT.words.find((word) => word.id === 'palestine')?.term).toBe('Palestine')
    expect(MAP_COUNTRY_NAMES).not.toContain('Bahrain')
    expect(MAP_COUNTRY_NAMES).not.toContain('Afghanistan')
  })

  it('keeps both Palestine pieces as one quiz country', () => {
    const palestine = MECA_GEOMETRY.features.filter((feature) => feature.properties.id === 'palestine')
    expect(palestine).toHaveLength(1)
    expect(palestine[0].geometry.type).toBe('MultiPolygon')
    const qatar = MECA_GEOMETRY.features.find((feature) => feature.properties.id === 'qatar')
    expect(qatar && MECA_MAP.pathFromGeometry(qatar.geometry, 0, 0, 1).length).toBeGreaterThan(20)
    const gaza = MECA_MAP.hitTest(MECA_GEOMETRY, 34.45, 31.5)
    const bank = MECA_MAP.hitTest(MECA_GEOMETRY, 35.25, 31.9)
    expect(gaza?.properties.id).toBe('palestine')
    expect(bank?.properties.id).toBe('palestine')
  })

  it('asks with a tap, a neighbor choice, or a typed name', () => {
    const prompt = nextMapPrompt(blankUnit(), [], 4, 'field')
    expect(['tap', 'choice', 'type']).toContain(prompt.mode)
    expect(prompt.view.length).toBeGreaterThan(0)
    if (prompt.mode === 'choice') {
      expect(prompt.choices.some((choice) => choice.id === prompt.countryId)).toBe(true)
    }
    expect(typedMatch('united-arab-emirates', 'U.A.E.').ok).toBe(true)
    expect(typedMatch('palestine', 'Gaza').ok).toBe(false)
    expect(typedMatch('palestine', 'West Bank').ok).toBe(false)
    expect(typedMatch('palestine', 'West Bank and Gaza').ok).toBe(true)
  })
})
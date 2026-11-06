import { describe, expect, it } from 'vitest'
import { MAP_COUNTRY_NAMES, MIDDLE_EAST_UNIT } from './mapUnit'
import { nextMapPrompt, typedMatch } from './mapQuestions'
import { blankUnit } from './engine'
import { countryPaths } from './mapDraw'
import { FULL_BOUNDS } from './mapDraw'

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
  })

  it('draws a tappable shape for the small countries', () => {
    const paths = countryPaths(FULL_BOUNDS)
    for (const id of ['qatar', 'kuwait', 'lebanon', 'israel', 'palestine']) {
      const shape = paths.find((item) => item.id === id)
      expect(shape?.d.length).toBeGreaterThan(20)
      expect(shape?.small).toBe(true)
    }
  })

  it('asks with a tap, a neighbor choice, or a typed name', () => {
    const prompt = nextMapPrompt(blankUnit(), [], 4, 'field')
    expect(['tap', 'choice', 'type']).toContain(prompt.mode)
    if (prompt.mode === 'choice') {
      expect(prompt.choices.some((choice) => choice.id === prompt.countryId)).toBe(true)
    }
    expect(typedMatch('United Arab Emirates', 'united arab emirates')).toBe(true)
    expect(typedMatch('Palestine', 'israel')).toBe(false)
  })
})

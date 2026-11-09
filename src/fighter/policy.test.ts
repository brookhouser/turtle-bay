import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { FOUNDING_EMAILS } from '../family/roster'
import { quoteEdit, reviewPrompt } from './policy'
import { RECOMMENDED_BACKEND } from './rig'

describe('character edit policy', () => {
  it('prices a belt change below a full outfit', () => {
    expect(quoteEdit('give him a blue belt').credits).toBe(25)
    expect(quoteEdit('change the whole outfit to a red gi').credits).toBe(40)
    expect(quoteEdit('make the eyes a little brighter').credits).toBe(20)
  })

  it('blocks requests that are not for a kid', () => {
    expect(reviewPrompt('give him a blue belt').ok).toBe(true)
    expect(reviewPrompt('make him bloody and naked').ok).toBe(false)
    expect(reviewPrompt('use the fortnite renegade skin').ok).toBe(false)
  })

  it('plans the rig as one clip set', () => {
    expect(RECOMMENDED_BACKEND).toBe('rive')
  })
})

describe('firestore allowlist', () => {
  it('names the four Brookhouser accounts and no placeholder grant', () => {
    const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8')
    for (const email of FOUNDING_EMAILS) expect(rules).toContain(email)
    expect(rules).not.toMatch(/example\.com/i)
    expect(rules).not.toMatch(/fill_in/i)
    expect(rules).not.toMatch(/christian/i)
    expect(rules).not.toMatch(/okonkwo/i)
  })
})

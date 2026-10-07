import { describe, expect, it } from 'vitest'
import { PASS_ACCURACY } from '../config'
import { HABITATS, SHOP_ITEMS } from '../data/catalog'
import { keysThrough, LESSONS } from '../data/curriculum'
import { fingerFor } from '../data/keyboard'
import { hashPin } from '../lib/pin'
import {
  addChallenge,
  applyDecay,
  applyLessonResult,
  buildRematchPrompt,
  buyItem,
  coinsForRun,
  createKid,
  equipItem,
  feedTurtle,
  practiceStreak,
  renameTurtle,
  upgradeHabitat,
  validateNickname,
  validatePin,
} from './logic'

const dash = /[\u2013\u2014]/

describe('curriculum', () => {
  it('ships at least 8 home row lessons in order', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(8)
    LESSONS.forEach((lesson, index) => {
      expect(lesson.order).toBe(index + 1)
      expect(lesson.prompt.length).toBeGreaterThan(10)
      expect(lesson.title).not.toMatch(dash)
      expect(lesson.subtitle).not.toMatch(dash)
      expect(lesson.prompt).not.toMatch(dash)
    })
  })

  it('only uses keys that lesson has introduced', () => {
    for (const lesson of LESSONS) {
      const allowed = new Set(keysThrough(lesson.order))
      for (const char of lesson.prompt) {
        expect(allowed.has(char), `${lesson.id} has untaught "${char}"`).toBe(true)
      }
    }
  })

  it('maps every new key to a finger', () => {
    for (const lesson of LESSONS) {
      for (const key of lesson.newKeys) {
        expect(fingerFor(key), key).not.toBeNull()
      }
    }
  })
})

describe('economy', () => {
  it('pays a finished lesson and unlocks the next one at the pass mark', () => {
    const kid = createKid('pebble', 'hash', 'kid-1', 1_700_000_000_000)
    const result = applyLessonResult(kid, {
      lessonId: 'hr-1',
      title: 'Left anchors',
      wpm: 18,
      accuracy: PASS_ACCURACY,
      streak: 12,
      missedKeys: ['f'],
      baseCoins: 20,
      isRematch: false,
    })
    expect(result.passed).toBe(true)
    expect(result.coinsEarned).toBe(coinsForRun(20, PASS_ACCURACY, true))
    expect(result.kid.turtle.coins).toBe(result.coinsEarned)
    expect(result.kid.lessons['hr-1'].mastered).toBe(true)
    expect(result.kid.lessons['hr-2'].unlocked).toBe(true)
    expect(result.kid.sessions).toHaveLength(1)
  })

  it('keeps the next lesson locked when accuracy is low', () => {
    const kid = createKid('pebble', 'hash', 'kid-1')
    const result = applyLessonResult(kid, {
      lessonId: 'hr-1',
      title: 'Left anchors',
      wpm: 8,
      accuracy: 70,
      streak: 3,
      missedKeys: ['a', 's'],
      baseCoins: 20,
      isRematch: false,
    })
    expect(result.passed).toBe(false)
    expect(result.kid.lessons['hr-2'].unlocked).toBe(false)
    expect(result.kid.turtle.coins).toBeGreaterThan(0)
  })

  it('buys a snack, equips a hat, and blocks a habitat the jar cannot afford', () => {
    let kid = createKid('pebble', 'hash', 'kid-1')
    kid = { ...kid, turtle: { ...kid.turtle, coins: 80 } }
    const bought = buyItem(kid, 'bucket-hat')
    expect(bought.error).toBeUndefined()
    kid = bought.kid
    expect(kid.turtle.coins).toBe(10)
    const worn = equipItem(kid, 'bucket-hat')
    expect(worn.kid.turtle.equipped.hat).toBe('bucket-hat')
    const blocked = upgradeHabitat(worn.kid)
    expect(blocked.error).toMatch(/500/)
    expect(blocked.kid.turtle.habitatTier).toBe(1)
  })

  it('feeds from coins and decays hunger over time', () => {
    const start = 1_700_000_000_000
    let kid = createKid('pebble', 'hash', 'kid-1', start)
    kid = { ...kid, turtle: { ...kid.turtle, coins: 6, hunger: 40 } }
    const fed = feedTurtle(kid, undefined, start)
    expect(fed.error).toBeUndefined()
    expect(fed.kid.turtle.coins).toBe(0)
    expect(fed.kid.turtle.hunger).toBeGreaterThan(40)
    const later = applyDecay(fed.kid.turtle, start + 2 * 3_600_000)
    expect(later.hunger).toBeLessThan(fed.kid.turtle.hunger)
  })

  it('upgrades in order once the coins are there', () => {
    let kid = createKid('pebble', 'hash', 'kid-1')
    kid = { ...kid, turtle: { ...kid.turtle, coins: 2000 } }
    kid = upgradeHabitat(kid).kid
    expect(kid.turtle.habitatTier).toBe(2)
    expect(kid.turtle.coins).toBe(1500)
    kid = upgradeHabitat(kid).kid
    expect(kid.turtle.habitatTier).toBe(3)
    expect(HABITATS.map((habitat) => habitat.tier)).toEqual([1, 2, 3])
  })
})

describe('names and parent challenges', () => {
  it('rejects a real-name style symbol and accepts a short turtle name', () => {
    const kid = createKid('pebble', 'hash', 'kid-1')
    expect(renameTurtle(kid, 'Shelly!').error).toBeTruthy()
    expect(renameTurtle(kid, 'Shelly').kid.turtle.name).toBe('Shelly')
    expect(validateNickname('ab')).toBeTruthy()
    expect(validateNickname('Pebble')).toBeNull()
    expect(validatePin('123', false)).toBeTruthy()
    expect(validatePin('1234', false)).toBeNull()
    expect(validatePin('1234', true)).toBeTruthy()
  })

  it('saves a typing drill and a locked spelling placeholder', () => {
    const kid = createKid('pebble', 'hash', 'kid-1')
    const typing = addChallenge(kid, {
      type: 'typing',
      title: 'Salad extra',
      prompt: 'a salad falls',
      focusKeys: ['a', 's'],
      coinReward: 15,
    })
    expect(typing.error).toBeUndefined()
    const spelling = addChallenge(typing.kid, {
      type: 'spelling',
      title: 'Bay words',
      prompt: 'spell salad',
      focusKeys: [],
      coinReward: 20,
    })
    expect(spelling.kid.customChallenges.map((challenge) => challenge.type)).toEqual(['spelling', 'typing'])
  })

  it('builds a rematch from missed keys and counts a practice streak', () => {
    const prompt = buildRematchPrompt(['f', 'f', ' '], 'asdf fad')
    expect(prompt).toContain('fff')
    expect(prompt).not.toMatch(dash)
    expect(practiceStreak(['2026-10-04', '2026-10-05', '2026-10-06'], '2026-10-06')).toBe(3)
    expect(practiceStreak(['2026-10-04'], '2026-10-06')).toBe(0)
  })

  it('hashes the same bay name without storing the pin shape', async () => {
    const a = await hashPin('Pebble', '2468')
    const b = await hashPin('pebble', '2468')
    expect(a).toBe(b)
    expect(a).not.toContain('2468')
  })
})

describe('shop catalog', () => {
  it('has unique ids and the care categories', () => {
    const ids = SHOP_ITEMS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const category of ['hat', 'scarf', 'plant', 'snack', 'bed']) {
      expect(SHOP_ITEMS.some((item) => item.category === category)).toBe(true)
    }
  })
})

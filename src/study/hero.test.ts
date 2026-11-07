import { describe, expect, it } from 'vitest'
import { STUDY_UNITS } from './content'
import { applyAnswer, blankUnit, recordTestPrep } from './engine'
import { chargeHero, duelStrike, freshHero, heroKit, knockback, strikePower, tickHero } from './hero'
import { MIDDLE_EAST_UNIT } from './mapUnit'

const vocab = STUDY_UNITS.find((unit) => unit.id === 'vocab')!

function master(unitIdWords: string[], progress = blankUnit()) {
  let unit = progress
  for (const id of unitIdWords) {
    unit = applyAnswer(unit, id, true).unit
    unit = applyAnswer(unit, id, true).unit
  }
  return unit
}

describe('fighter hero', () => {
  it('charges a spin kick from correct answers and weakens it after a miss', () => {
    const words = vocab.words.filter((word) => word.topic === 'small').map((word) => word.id)
    const progress = master(words)
    const kit = heroKit(vocab, progress)
    expect(kit.spinKick).toBe(true)
    let hero = freshHero()
    hero = chargeHero(hero, kit, false).hero
    hero = chargeHero(hero, kit, false).hero
    const fired = chargeHero(hero, kit, false)
    expect(fired.fired).toBe('spin-kick')
    expect(fired.laneClear).toBe(true)
    const shaky = chargeHero({ ...freshHero(), combo: 90 }, kit, true)
    expect(shaky.fired).toBeTruthy()
    expect(shaky.weakenedHit).toBe(true)
    expect(shaky.laneClear).toBe(false)
  })

  it('opens slots from mastery thresholds, not from credits', () => {
    const bare = heroKit(vocab, blankUnit())
    expect(bare.secondSlot).toBe(false)
    expect(bare.superMove).toBe(false)
    expect(strikePower(blankUnit())).toBe(1)
    const richLooking = blankUnit()
    expect(strikePower(richLooking)).toBe(strikePower(blankUnit()))
    let progress = blankUnit()
    const need = Math.ceil(vocab.words.length / 3)
    progress = master(vocab.words.slice(0, need).map((word) => word.id), progress)
    expect(heroKit(vocab, progress).secondSlot).toBe(true)
    expect(heroKit(vocab, progress).teamUp).toBe(false)
    progress = recordTestPrep(progress, 0.8, '2026-11-01')
    expect(heroKit(vocab, progress).superMove).toBe(true)
    progress = recordTestPrep(progress, 0.91, '2026-11-02')
    progress = recordTestPrep(progress, 0.95, '2026-11-03')
    expect(heroKit(vocab, progress).duel).toBe(true)
  })

  it('retreats to the dojo and comes back', () => {
    let hero = knockback(freshHero())
    expect(hero.retreated).toBe(true)
    hero = tickHero(hero)
    hero = tickHero(hero)
    hero = tickHero(hero)
    expect(hero.retreated).toBe(false)
    const graze = duelStrike(8, true)
    expect(graze.graze).toBe(true)
    expect(graze.bossHp).toBe(7)
    expect(duelStrike(2, false).bossHp).toBe(0)
  })

  it('uses the same hero rules on the map unit', () => {
    const gulf = ['qatar', 'kuwait', 'united-arab-emirates', 'oman']
    const progress = master(gulf)
    expect(heroKit(MIDDLE_EAST_UNIT, progress).spinKick).toBe(true)
    expect(heroKit(MIDDLE_EAST_UNIT, progress).learned).toContain('spin-kick')
  })
})

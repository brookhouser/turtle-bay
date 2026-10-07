import { beforeEach, describe, expect, it } from 'vitest'
import { createKid } from '../game/logic'
import { markDemoImported, withDemoProgress } from './demoImport'

const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage

function demoWally() {
  const kid = createKid('Wally', 'demo-hash', 'demo-1')
  kid.turtle = { ...kid.turtle, name: 'Shelly', named: true, coins: 42, inventory: { 'bucket-hat': 1 } }
  kid.turtle.equipped = { ...kid.turtle.equipped, hat: 'bucket-hat' }
  kid.sessions = [
    { id: 's1', lessonId: 'l1', lessonTitle: 'Home row', date: '2026-10-01', wpm: 12, accuracy: 90, coins: 10, streak: 3, missedKeys: [] },
  ]
  return kid
}

describe('demo progress import', () => {
  beforeEach(() => store.clear())

  it('copies demo progress into a fresh synced bay once', () => {
    store.set('turtlebay.save.v1', JSON.stringify({ kids: [demoWally()] }))
    const cloud = createKid('wally', 'cloud-hash', 'uid-1')
    const found = withDemoProgress(cloud)
    expect(found?.kid.id).toBe('uid-1')
    expect(found?.kid.pinHash).toBe('cloud-hash')
    expect(found?.kid.turtle.coins).toBe(42)
    expect(found?.kid.turtle.equipped.hat).toBe('bucket-hat')
    expect(found?.kid.sessions).toHaveLength(1)
    markDemoImported(found!.demoId, cloud.id)
    expect(withDemoProgress(cloud)).toBeNull()
  })

  it('leaves a synced bay with progress alone', () => {
    store.set('turtlebay.save.v1', JSON.stringify({ kids: [demoWally()] }))
    const cloud = createKid('wally', 'cloud-hash', 'uid-1')
    cloud.turtle.coins = 5
    expect(withDemoProgress(cloud)).toBeNull()
  })

  it('does nothing without demo progress', () => {
    expect(withDemoProgress(createKid('wally', 'h', 'uid-1'))).toBeNull()
  })
})

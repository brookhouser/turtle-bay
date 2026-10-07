import { useState } from 'react'
import { BASIC_CLEAN_COST, BASIC_FEED_COST } from '../config'
import { SHOP_ITEMS } from '../data/catalog'
import { useBay } from '../context/useBay'
import { Stage } from '../components/Habitat'
import type { TurtleMood } from '../types'

export function CarePage() {
  const { kid, petTurtle, feedTurtle, cleanTurtle, pushToast } = useBay()
  const [message, setMessage] = useState<string | null>(null)
  const [mood, setMood] = useState<TurtleMood | null>(null)
  if (!kid) return null
  const turtle = kid.turtle
  const snacks = SHOP_ITEMS.filter((item) => item.category === 'snack' && (turtle.inventory[item.id] ?? 0) > 0)
  const shown: TurtleMood = mood ?? (turtle.happy < 35 || turtle.hunger < 30 ? 'low' : 'idle')

  function flash(next: TurtleMood) {
    setMood(next)
    window.setTimeout(() => setMood(null), 1200)
  }

  function run(kind: 'pet' | 'feed' | 'clean', snackId?: string) {
    const error = kind === 'pet' ? petTurtle() : kind === 'feed' ? feedTurtle(snackId) : cleanTurtle()
    setMessage(error)
    if (error) return
    flash(kind === 'feed' ? 'eat' : kind)
    if (kind === 'pet') pushToast('That got a wiggle.')
    if (kind === 'feed') pushToast(snackId ? 'Snack time.' : 'Crunch. That helped.')
    if (kind === 'clean') pushToast('Sparkly again.')
  }

  return (
    <div className="care-layout">
      <Stage
        tier={turtle.habitatTier}
        hat={turtle.equipped.hat}
        scarf={turtle.equipped.scarf}
        plants={turtle.equipped.plants}
        bed={turtle.equipped.bed}
        mood={shown}
        size="card"
        turtleName={turtle.name}
      />
      <div className="care-grid">
        <article className="care-card">
          <h1>Pet</h1>
          <p>Free. A short rest sits between pets. Happy goes up.</p>
          <button type="button" className="btn btn-primary" onClick={() => run('pet')}>Pet {turtle.name}</button>
        </article>
        <article className="care-card">
          <h2>Feed</h2>
          <p>A basic nibble costs {BASIC_FEED_COST} coins. Snacks from the shop are already paid for.</p>
          <button
            type="button"
            className="btn"
            disabled={turtle.hunger >= 99.5 || turtle.coins < BASIC_FEED_COST}
            onClick={() => run('feed')}
          >
            Basic nibble ({BASIC_FEED_COST} coins)
          </button>
          <div className="button-row">
            {snacks.map((snack) => (
              <button key={snack.id} type="button" className="btn" onClick={() => run('feed', snack.id)}>
                {snack.name} ({turtle.inventory[snack.id]})
              </button>
            ))}
          </div>
          {snacks.length === 0 ? <p className="fine">No snacks in the pantry yet.</p> : null}
        </article>
        <article className="care-card">
          <h2>Clean</h2>
          <p>A scrub costs {BASIC_CLEAN_COST} coins and brings the clean meter up.</p>
          <button
            type="button"
            className="btn"
            disabled={turtle.clean >= 99.5 || turtle.coins < BASIC_CLEAN_COST}
            onClick={() => run('clean')}
          >
            Scrub ({BASIC_CLEAN_COST} coins)
          </button>
        </article>
      </div>
      {message ? <p className="form-error" role="alert">{message}</p> : null}
    </div>
  )
}

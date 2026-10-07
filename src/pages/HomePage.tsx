import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BASIC_CLEAN_COST, BASIC_FEED_COST } from '../config'
import { useBay } from '../context/useBay'
import { careHint } from '../game/logic'
import { Meters } from '../components/Meters'
import { PencilIcon } from '../components/Icons'
import { Stage, TierPath } from '../components/Habitat'
import type { HabitatTier, TurtleMood } from '../types'

export function HomePage() {
  const { kid, renameTurtle, petTurtle, feedTurtle, cleanTurtle, pushToast } = useBay()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(kid?.turtle.name ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [mood, setMood] = useState<TurtleMood | null>(null)

  if (!kid) return null
  const turtle = kid.turtle
  const resting: TurtleMood = turtle.happy < 35 || turtle.hunger < 30 ? 'low' : 'idle'
  const shown = mood ?? resting

  function flash(next: TurtleMood) {
    setMood(next)
    window.setTimeout(() => setMood(null), 1200)
  }

  function act(kind: 'pet' | 'feed' | 'clean') {
    const error = kind === 'pet' ? petTurtle() : kind === 'feed' ? feedTurtle() : cleanTurtle()
    if (error) {
      setMessage(error)
      return
    }
    setMessage(null)
    flash(kind === 'feed' ? 'eat' : kind)
    if (kind === 'feed') pushToast('Crunch. That helped.')
    if (kind === 'clean') pushToast('Sparkly again.')
    if (kind === 'pet') pushToast('That got a wiggle.')
  }

  return (
    <div className="home-layout">
      <div className="home-grid">
        <Meters turtle={turtle} practiceDays={kid.practiceDays} />
        <section className="home-stage">
          <Stage
            tier={turtle.habitatTier}
            hat={turtle.equipped.hat}
            scarf={turtle.equipped.scarf}
            plants={turtle.equipped.plants}
            bed={turtle.equipped.bed}
            mood={shown}
            turtleName={turtle.name}
          />
          <div className="name-row">
            {editing ? (
              <form
                className="name-edit"
                onSubmit={(event) => {
                  event.preventDefault()
                  const error = renameTurtle(draft)
                  if (error) {
                    setMessage(error)
                    return
                  }
                  setEditing(false)
                  setMessage(null)
                  pushToast('Name saved.')
                }}
              >
                <label className="sr-only" htmlFor="rename-turtle">Turtle name</label>
                <input
                  id="rename-turtle"
                  className="bay-input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={16}
                  autoFocus
                />
                <button className="btn btn-primary btn-small" type="submit">Save</button>
                <button
                  className="btn btn-small"
                  type="button"
                  onClick={() => {
                    setDraft(turtle.name)
                    setEditing(false)
                  }}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="name-pill"
                onClick={() => {
                  setDraft(turtle.name)
                  setEditing(true)
                }}
              >
                <span>{turtle.name}</span>
                <PencilIcon />
                <span className="sr-only">Rename turtle</span>
              </button>
            )}
          </div>
          <div className="care-row">
            <button type="button" className="btn" onClick={() => act('pet')}>Pet</button>
            <button
              type="button"
              className="btn"
              onClick={() => act('feed')}
              disabled={turtle.hunger >= 99.5 || turtle.coins < BASIC_FEED_COST}
              title={turtle.coins < BASIC_FEED_COST ? 'Earn coins in Challenges first.' : undefined}
            >
              Feed ({BASIC_FEED_COST} coins)
            </button>
            <button type="button" className="btn" onClick={() => act('clean')} disabled={turtle.coins < BASIC_CLEAN_COST}>
              Clean ({BASIC_CLEAN_COST} coins)
            </button>
          </div>
          <p className="hint" role="status">{message ?? careHint(turtle)}</p>
        </section>
      </div>
      <TierPath current={turtle.habitatTier} onPick={(tier: HabitatTier) => navigate(`/habitat?pick=${tier}`)} />
    </div>
  )
}

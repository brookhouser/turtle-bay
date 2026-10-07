import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { HABITATS, habitatByTier } from '../data/catalog'
import { useBay } from '../context/useBay'
import { Stage } from '../components/Habitat'
import { LockIcon } from '../components/Icons'
import type { HabitatTier } from '../types'

export function HabitatPage() {
  const { kid, upgradeHabitat, pushToast } = useBay()
  const [search] = useSearchParams()
  const requested = Number(search.get('pick'))
  const initial = requested === 2 || requested === 3 ? requested : null
  const [picked, setPicked] = useState<HabitatTier | null>(initial)
  const [message, setMessage] = useState<string | null>(null)
  if (!kid) return null
  const current = kid.turtle.habitatTier
  const focus = picked ?? (current < 3 ? ((current + 1) as HabitatTier) : current)
  const info = habitatByTier(focus)
  const isCurrent = focus === current
  const isNext = focus === current + 1
  const lockedBehind = focus > current + 1

  return (
    <div className="stack-page">
      <header className="page-head">
        <h1>Habitat</h1>
        <p>Coins move the turtle from a bowl, to a garden tank, to a reef bay. Hats, plants, and beds come along.</p>
      </header>
      <div className="habitat-layout">
        {HABITATS.map((habitat) => (
          <button
            key={habitat.tier}
            type="button"
            className={`habitat-choice ${focus === habitat.tier ? 'on' : ''}`}
            onClick={() => {
              setPicked(habitat.tier)
              setMessage(null)
            }}
          >
            <Stage
              tier={habitat.tier}
              size="card"
              hat={kid.turtle.equipped.hat}
              scarf={kid.turtle.equipped.scarf}
              plants={kid.turtle.equipped.plants}
              bed={kid.turtle.equipped.bed}
              turtleName={kid.turtle.name}
            />
            <span className="tier-kicker">Tier {habitat.tier}</span>
            <strong>{habitat.name}</strong>
            <span>{habitat.tagline}</span>
            {habitat.tier === current ? <em>Living here</em> : null}
            {habitat.tier > current ? (
              <em className="tier-price"><LockIcon /> {habitat.price} coins</em>
            ) : null}
          </button>
        ))}
      </div>
      <section className="upgrade-panel">
        <h2>{info.name}</h2>
        <p>{info.tagline}</p>
        {isCurrent ? <p>This is the tank {kid.turtle.name} uses today.</p> : null}
        {lockedBehind ? <p>Move into the earlier tank first.</p> : null}
        {isNext ? (
          <>
            <p>You have {kid.turtle.coins} coins.</p>
            <button
              type="button"
              className="btn btn-primary"
              disabled={kid.turtle.coins < info.price}
              onClick={() => {
                const error = upgradeHabitat()
                setMessage(error)
                if (!error) pushToast(`${kid.turtle.name} moved into the ${info.name}.`)
              }}
            >
              {kid.turtle.coins < info.price ? `Need ${info.price} coins` : `Move in for ${info.price} coins`}
            </button>
          </>
        ) : null}
        {message ? <p className="form-error" role="alert">{message}</p> : null}
        <Link className="btn" to="/home">Back home</Link>
      </section>
    </div>
  )
}

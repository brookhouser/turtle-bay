import { useEffect, useRef, useState } from 'react'
import { poseSrc } from '../fighter/sheet'

const GROUND = 64

export function RunnerPage() {
  const [y, setY] = useState(0)
  const [x, setX] = useState(12)
  const vy = useRef(0)
  const height = useRef(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setX((current) => (current > 78 ? 12 : current + 0.4))
      height.current = Math.max(0, height.current + vy.current)
      if (height.current <= 0) vy.current = 0
      else vy.current -= 0.7
      setY(height.current)
    }, 32)
    return () => window.clearInterval(timer)
  }, [])

  function jump() {
    if (height.current <= 0) vy.current = 12
  }

  return (
    <div className="stack-page">
      <header className="page-head">
        <h1>Runner</h1>
        <p>Queued platform run. Same fighter as the waves: Dojo Ace, from the locked sheet.</p>
      </header>
      <div className="runner-track" onClick={jump} role="application" aria-label="Dojo Ace running. Click to jump.">
        <div className="runner-ground" />
        <img
          className="runner-hero"
          src={poseSrc(y > 4 ? 'jump' : 'run')}
          alt="Dojo Ace"
          style={{ left: `${x}%`, bottom: GROUND + y }}
        />
      </div>
      <button className="btn btn-primary" type="button" onClick={jump}>Jump</button>
      <p className="fine">Slide pose still needs art. Run and jump were drawn from the Dojo Ace sheet.</p>
    </div>
  )
}

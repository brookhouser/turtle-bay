import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useBay } from '../context/useBay'
import { Turtle } from '../components/Turtle'

const IDEAS = ['Shelly', 'Pebble', 'Kelpy', 'Bubbles', 'Nori', 'Mango']

export function NamePage() {
  const { ready, session, kid, renameTurtle, pushToast } = useBay()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!ready) return null
  if (!session || session.role !== 'kid' || !kid) return <Navigate to="/" replace />
  if (kid.turtle.named) return <Navigate to="/home" replace />

  function save(event: FormEvent) {
    event.preventDefault()
    const message = renameTurtle(name)
    if (message) {
      setError(message)
      return
    }
    pushToast(`${name.trim()} is ready for the bay.`)
    navigate('/home')
  }

  return (
    <div className="name-page">
      <form className="name-card" onSubmit={save}>
        <Turtle title="Your new turtle" />
        <h1>What should we call your turtle?</h1>
        <p>Pick a turtle name. It can be changed later with the pencil.</p>
        <label className="field">
          Turtle name
          <input
            className="bay-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={16}
            autoFocus
            required
          />
        </label>
        <div className="ideas">
          {IDEAS.map((idea) => (
            <button key={idea} type="button" className="btn btn-small" onClick={() => setName(idea)}>
              {idea}
            </button>
          ))}
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="btn btn-primary" type="submit">This is my turtle</button>
      </form>
    </div>
  )
}

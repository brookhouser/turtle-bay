import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { APP_NAME } from '../config'
import { useBay } from '../context/useBay'
import { Turtle } from '../components/Turtle'

export function LoginPage() {
  const { ready, session, kid, mode, allowlist, bootError, signInKid, signUpKid, signInParent } = useBay()
  const [tab, setTab] = useState<'kid' | 'parent'>('kid')
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [email, setEmail] = useState(allowlist[0] ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!ready) return <Loading />
  if (session?.role === 'parent') return <Navigate to="/parent" replace />
  if (session?.role === 'kid' && kid) return <Navigate to={kid.turtle.named ? '/home' : '/name'} replace />

  async function onKid(create: boolean) {
    setBusy(true)
    setError(null)
    const message = create ? await signUpKid(nickname, pin) : await signInKid(nickname, pin)
    setBusy(false)
    if (message) setError(message)
  }

  async function onParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const message = await signInParent(mode === 'firebase' ? undefined : email)
    setBusy(false)
    if (message) setError(message)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-hero">
          <Turtle title="A bay turtle" />
        </div>
        <div className="login-copy">
          <p className="eyebrow">{mode === 'demo' ? 'Demo mode' : 'Synced bay'}</p>
          <h1>{APP_NAME}</h1>
          <p className="lede">A small bay, a pet turtle, and lessons that fill the coin jar.</p>
          {bootError ? <p className="form-error" role="alert">{bootError}</p> : null}
          <div className="seg" role="tablist" aria-label="Who is signing in">
            <button type="button" role="tab" aria-selected={tab === 'kid'} className={tab === 'kid' ? 'on' : ''} onClick={() => { setTab('kid'); setError(null) }}>
              Kid bay
            </button>
            <button type="button" role="tab" aria-selected={tab === 'parent'} className={tab === 'parent' ? 'on' : ''} onClick={() => { setTab('parent'); setError(null) }}>
              Parent dock
            </button>
          </div>

          {tab === 'kid' ? (
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault()
                void onKid(false)
              }}
            >
              <label className="field">
                Bay name
                <input
                  className="bay-input"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  autoComplete="username"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={12}
                  required
                />
              </label>
              <p className="fine">3 to 12 letters or numbers. This is a bay name, not a real name.</p>
              <label className="field">
                PIN
                <input
                  className="bay-input"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  autoComplete="current-password"
                  maxLength={12}
                  required
                />
              </label>
              <p className="fine">{mode === 'firebase' ? 'Use 6 to 12 letters or numbers.' : 'Use 4 to 12 letters or numbers.'}</p>
              <label className="check-row">
                <input type="checkbox" checked={showPin} onChange={(event) => setShowPin(event.target.checked)} />
                Show PIN
              </label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <div className="button-row">
                <button className="btn btn-primary" type="submit" disabled={busy}>Swim in</button>
                <button className="btn" type="button" disabled={busy} onClick={() => void onKid(true)}>
                  Start a new bay
                </button>
              </div>
            </form>
          ) : (
            <form className="stack" onSubmit={(event) => void onParent(event)}>
              <p>Parents watch lessons, coins, and how the turtle is doing.</p>
              {mode === 'firebase' ? (
                <button className="btn btn-primary" type="submit" disabled={busy}>Sign in with Google</button>
              ) : (
                <>
                  <label className="field">
                    Parent email
                    <input
                      className="bay-input"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="username"
                      required
                    />
                  </label>
                  <div className="parent-picks">
                    {allowlist.map((entry) => (
                      <button
                        key={entry}
                        type="button"
                        className="btn"
                        disabled={busy}
                        onClick={() => {
                          setEmail(entry)
                          setBusy(true)
                          setError(null)
                          void signInParent(entry).then((message) => {
                            setBusy(false)
                            if (message) setError(message)
                          })
                        }}
                      >
                        {entry}
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={busy}>Open parent dock</button>
                </>
              )}
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <p className="fine">
                {mode === 'firebase'
                  ? 'Google sign in only opens for emails on the parent list.'
                  : 'Demo dock checks the parent list on this Chromebook. With Firebase connected, this becomes Google sign in.'}
              </p>
              <p className="fine">Parent list: {allowlist.join(', ')}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="app-loading">
      <Turtle title="" />
      <p>Opening the bay...</p>
    </div>
  )
}

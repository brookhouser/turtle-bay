import { Navigate } from 'react-router-dom'
import { APP_NAME } from '../config'
import { useBay } from '../context/useBay'
import { Turtle } from '../components/Turtle'
import { FOUNDING_FAMILY_NAME } from '../family/roster'

export function LoginPage() {
  const { ready, session, kid, mode, bootError, signInChoices, signInWithGoogle, previewSchool } = useBay()
  if (!ready) return <p className="app-loading">Opening the bay...</p>
  if (session?.role === 'parent') return <Navigate to="/parent" replace />
  if (session?.role === 'kid' && session.scope === 'school') return <Navigate to="/school" replace />
  if (session?.role === 'kid' && kid?.motivation === 'fighter') return <Navigate to="/study" replace />
  if (session?.role === 'kid' && kid) return <Navigate to={kid.turtle.named ? '/home' : '/name'} replace />

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-hero">
          <Turtle title="Pebble" />
        </div>
        <div className="login-copy">
          <p className="eyebrow">{mode === 'demo' ? 'Demo mode' : 'Synced'}</p>
          <h1>{APP_NAME}</h1>
          <p className="lede">{FOUNDING_FAMILY_NAME} family, plus any family you invite. Everyone uses Google.</p>
          {bootError ? <p className="form-error" role="alert">{bootError}</p> : null}
          {mode === 'firebase' ? (
            <button className="btn btn-primary" type="button" onClick={() => void signInWithGoogle()}>Sign in with Google</button>
          ) : (
            <div className="choice-grid">
              {signInChoices.map((person) => (
                <button key={person.email} className="btn" type="button" onClick={() => void signInWithGoogle(person.email)}>
                  {person.name} · {person.role}
                </button>
              ))}
              <button className="btn" type="button" onClick={previewSchool}>Preview Wally's school screen</button>
            </div>
          )}
          <p className="fine">Demo sign-in stands in for Google on this computer. A school account is not connected yet, so the preview is local only.</p>
        </div>
      </div>
    </div>
  )
}

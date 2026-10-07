import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../config'
import { useBay } from '../context/useBay'
import { LESSONS } from '../data/curriculum'
import { findItem } from '../data/catalog'
import { formatWhen } from '../lib/format'
import { parseFocusKeys, practiceStreak } from '../game/logic'
import { Meters } from '../components/Meters'
import { Turtle } from '../components/Turtle'
import type { ChallengeType, KidProfile } from '../types'

export function ParentPage() {
  const { ready, session, kids, mode, allowlist, signOutBay, createKidBay, addChallenge, clearDemoKids, pushToast } = useBay()
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [kidId, setKidId] = useState(kids[0]?.id ?? '')
  const [type, setType] = useState<ChallengeType>('typing')
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [focus, setFocus] = useState('')
  const [coins, setCoins] = useState(15)
  const [error, setError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  if (!ready) return <p className="app-loading">Opening the bay...</p>
  if (!session || session.role !== 'parent') return null

  const selected = kids.find((kid) => kid.id === kidId) ?? kids[0]

  async function onCreateKid(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const message = await createKidBay(nickname, pin)
    if (message) {
      setError(message)
      return
    }
    setNickname('')
    setPin('')
    pushToast('Kid bay is ready. They can sign in from the kid screen.')
  }

  function onAddChallenge(event: FormEvent) {
    event.preventDefault()
    if (!selected) {
      setError('Add a kid bay first.')
      return
    }
    const message = addChallenge(selected.id, {
      type,
      title,
      prompt,
      focusKeys: parseFocusKeys(focus),
      coinReward: coins,
    })
    setError(message)
    if (!message) {
      setTitle('')
      setPrompt('')
      setFocus('')
      pushToast(type === 'typing' ? 'Typing drill added to the challenge board.' : 'Placeholder saved. It stays locked in the kid view.')
    }
  }

  return (
    <div className="parent-page">
      <header className="topbar">
        <Link to="/" className="brand">{APP_NAME}</Link>
        <span className="mode-chip">{mode === 'demo' ? 'Demo' : 'Synced'}</span>
        <p className="parent-email">Parent dock for {session.email}</p>
        <button type="button" className="text-button" onClick={() => void signOutBay()}>Sign out</button>
      </header>
      <main className="page">
        <header className="page-head">
          <h1>How the bays are doing</h1>
          <p>Meters, coins, lesson scores, and a place to add the next drill.</p>
        </header>
        {kids.length === 0 ? (
          <p className="empty-card">No kid bays yet. Add one here, or start one from the kid login on this Chromebook.</p>
        ) : (
          <div className="parent-grid">
            {kids.map((kid) => (
              <KidCard key={kid.id} kid={kid} />
            ))}
          </div>
        )}

        <section className="panel">
          <h2>Add a kid bay</h2>
          <form className="form-grid" onSubmit={(event) => void onCreateKid(event)}>
            <label className="field">
              Bay name
              <input className="bay-input" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={12} required />
            </label>
            <label className="field">
              PIN
              <input className="bay-input" type="text" value={pin} onChange={(event) => setPin(event.target.value)} maxLength={12} required />
            </label>
            <button className="btn btn-primary" type="submit">Add kid bay</button>
          </form>
          <p className="fine">Use a bay name, not a real name. {mode === 'firebase' ? 'PIN needs 6 to 12 letters or numbers.' : 'PIN needs 4 to 12 letters or numbers.'}</p>
        </section>

        <section className="panel">
          <h2>Add a challenge</h2>
          <p>Typing drills show up on the challenge board right away. Spelling and math are saved as locked placeholders.</p>
          <form className="stack" onSubmit={onAddChallenge}>
            <label className="field">
              Kid bay
              <select className="bay-input" value={selected?.id ?? ''} onChange={(event) => setKidId(event.target.value)}>
                {kids.map((kid) => (
                  <option key={kid.id} value={kid.id}>{kid.nickname}{kid.turtle.name ? ` / ${kid.turtle.name}` : ''}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Type
              <select className="bay-input" value={type} onChange={(event) => setType(event.target.value as ChallengeType)}>
                <option value="typing">Typing drill</option>
                <option value="spelling">Spelling placeholder</option>
                <option value="math">Math placeholder</option>
              </select>
            </label>
            <label className="field">
              Title
              <input className="bay-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={40} required />
            </label>
            <label className="field">
              {type === 'typing' ? 'Text to type' : 'Note for later'}
              <textarea className="bay-input bay-area" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={280} required />
            </label>
            {type === 'typing' ? (
              <label className="field">
                Focus keys
                <input className="bay-input" value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="a s d f" />
              </label>
            ) : null}
            <label className="field">
              Coin reward
              <input className="bay-input" type="number" min={5} max={100} value={coins} onChange={(event) => setCoins(Number(event.target.value))} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={!selected}>Save challenge</button>
          </form>
        </section>

        {selected && selected.customChallenges.length > 0 ? (
          <section className="panel">
            <h2>Challenges saved for {selected.nickname}</h2>
            <ul className="plain-list">
              {selected.customChallenges.map((challenge) => (
                <li key={challenge.id}>
                  <strong>{challenge.title}</strong> ({challenge.type}, {challenge.coinReward} coins)
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <section className="panel">
          <h2>Parent list</h2>
          <p className="fine">{allowlist.join(', ')}</p>
          {mode === 'demo' ? (
            confirmClear ? (
              <div className="button-row">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    clearDemoKids()
                    setConfirmClear(false)
                    pushToast('Demo kid bays on this Chromebook were cleared.')
                  }}
                >
                  Yes, clear demo bays
                </button>
                <button type="button" className="btn" onClick={() => setConfirmClear(false)}>Cancel</button>
              </div>
            ) : (
              <button type="button" className="btn" onClick={() => setConfirmClear(true)}>Clear demo bays on this Chromebook</button>
            )
          ) : (
            <p className="fine">Firebase mode keeps bays in the family collection.</p>
          )}
        </section>
      </main>
    </div>
  )
}

function KidCard({ kid }: { kid: KidProfile }) {
  const mastered = LESSONS.filter((lesson) => kid.lessons[lesson.id]?.mastered).length
  const wearing = [kid.turtle.equipped.hat, kid.turtle.equipped.scarf, kid.turtle.equipped.bed, ...kid.turtle.equipped.plants]
    .filter((id): id is string => Boolean(id))
    .map((id) => findItem(id)?.name ?? id)
  return (
    <article className="kid-card">
      <div className="kid-top">
        <Turtle hat={kid.turtle.equipped.hat} scarf={kid.turtle.equipped.scarf} title={kid.turtle.name || kid.nickname} />
        <div>
          <h2>{kid.turtle.name || 'No turtle name yet'}</h2>
          <p className="fine">Bay {kid.nickname}</p>
          <p>{kid.turtle.coins} coins · Tier {kid.turtle.habitatTier} · {mastered} of {LESSONS.length} lessons mastered</p>
          <p className="fine">{practiceStreak(kid.practiceDays)} day practice streak</p>
          {wearing.length > 0 ? <p className="fine">Wearing: {wearing.join(', ')}</p> : null}
        </div>
      </div>
      <Meters turtle={kid.turtle} practiceDays={kid.practiceDays} />
      <div className="table-wrap">
        {kid.sessions.length === 0 ? (
          <p>No lessons yet. Finished lessons will show up here.</p>
        ) : (
          <table>
            <caption className="sr-only">Typing sessions for {kid.nickname}</caption>
            <thead>
              <tr>
                <th>When</th>
                <th>Lesson</th>
                <th>WPM</th>
                <th>Accuracy</th>
                <th>Coins</th>
                <th>Tricky keys</th>
              </tr>
            </thead>
            <tbody>
              {kid.sessions.slice(0, 12).map((session) => (
                <tr key={session.id}>
                  <td>{formatWhen(session.date)}</td>
                  <td>{session.lessonTitle}</td>
                  <td>{session.wpm}</td>
                  <td>{session.accuracy}%</td>
                  <td>{session.coins}</td>
                  <td>{session.missedKeys.length > 0 ? session.missedKeys.join(' ') : 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </article>
  )
}

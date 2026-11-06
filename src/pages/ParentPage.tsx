import { Link } from 'react-router-dom'
import { APP_NAME } from '../config'
import { useBay } from '../context/useBay'
import { parentPortal } from '../family/world'
import { masteryRatio } from '../study/engine'
import { hubUnits } from '../study/hub'
import { DOJO_ACE } from '../fighter/looks'

export function ParentPage() {
  const { ready, session, world, mode, signOutBay, clearDemo } = useBay()
  if (!ready || !session || session.role !== 'parent') return null
  const portal = parentPortal(world, session.familyId)
  return (
    <div className="parent-page">
      <header className="topbar">
        <Link to="/" className="brand">{APP_NAME}</Link>
        <span className="mode-chip">{mode === 'demo' ? 'Demo' : 'Synced'}</span>
        <p className="parent-email">{session.email}</p>
        <button type="button" className="text-button" onClick={() => void signOutBay()}>Sign out</button>
      </header>
      <main className="page stack-page">
        <header className="page-head">
          <h1>{portal?.family.name ?? 'Family'}</h1>
          <p>Your kids only. Class assignments from another family stay read-only.</p>
        </header>
        {portal?.kids.map(({ kid, groupAssignments }) => (
          <article key={kid.id} className="panel">
            <h2>{kid.nickname}</h2>
            <p>{kid.credits} credits · {kid.motivation === 'fighter' ? DOJO_ACE.name : kid.turtle.name || 'Pebble'}</p>
            {kid.id === 'sam' ? (
              <div className="stack">
                {hubUnits().map((unit) => {
                  const progress = kid.study.units[unit.id]
                  const ratio = progress ? masteryRatio(unit, progress) : 0
                  return (
                    <p key={unit.id}>{unit.title}: {Math.round(ratio * 100)}% mastered</p>
                  )
                })}
              </div>
            ) : null}
            <ul className="plain-list">
              {kid.assignments.map((item) => <li key={item.id}>{item.title}{item.due ? ` · due ${item.due}` : ''}</li>)}
              {groupAssignments.map((item) => <li key={item.id}>{item.title} · from {item.authorFamilyName}{item.canEdit ? '' : ' · read only'}</li>)}
            </ul>
          </article>
        ))}
        {mode === 'demo' ? <button type="button" className="btn" onClick={clearDemo}>Clear demo data on this browser</button> : null}
      </main>
    </div>
  )
}

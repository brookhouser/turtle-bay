import { Link } from 'react-router-dom'
import { APP_NAME } from '../config'
import { useBay } from '../context/useBay'
import { parentPortal } from '../family/world'
import { blankUnit, masteryRatio, type ZoneId } from '../study/engine'
import { hubUnits } from '../study/hub'
import { pebbleUnits } from '../study/pebbleUnits'
import type { StudyUnit } from '../study/content'
import type { KidProfile } from '../types'
import { DOJO_ACE } from '../fighter/looks'

const ZONES: ZoneId[] = ['field', 'ridge', 'core', 'hard', 'legend']

function MasteryBlock({ kid, units }: { kid: KidProfile; units: StudyUnit[] }) {
  const { setStudyOverride } = useBay()
  return (
    <div className="stack">
      {units.map((unit) => {
        const progress = kid.study.units[unit.id] ?? blankUnit()
        const ratio = masteryRatio(unit, progress)
        return (
          <section key={unit.id} className="mastery-block">
            <h3>{unit.title}</h3>
            <div className="meter-track" aria-label={`${Math.round(ratio * 100)} percent mastered`}>
              <div className="meter-fill fill-happy" style={{ width: `${Math.round(ratio * 100)}%` }} />
            </div>
            <p className="fine">{Math.round(ratio * 100)}% mastered</p>
            <ul className="plain-list mastery-items">
              {unit.words.map((word) => {
                const state = progress.words[word.id]
                const label = state?.mastered ? 'mastered' : state?.weakened ? 'shaky' : `${Math.round(state?.meter ?? 0)}%`
                return <li key={word.id}>{word.term} · {label}</li>
              })}
            </ul>
            <div className="zone-row">
              {ZONES.map((zone) => (
                <button key={zone} type="button" className={progress.overrides[zone] ? 'on' : ''} onClick={() => setStudyOverride(kid.id, unit.id, zone, !progress.overrides[zone])}>
                  {zone === 'legend' ? 'Boss' : zone} {progress.overrides[zone] ? 'open' : 'auto'}
                </button>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

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
            <MasteryBlock kid={kid} units={kid.motivation === 'fighter' ? hubUnits() : pebbleUnits()} />
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

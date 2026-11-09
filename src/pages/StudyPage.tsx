import { Link } from 'react-router-dom'
import { useBay } from '../context/useBay'
import { MAP_ASSIGNMENT_ID } from '../family/world'
import { masteryRatio } from '../study/engine'
import { hubUnits } from '../study/hub'

export function StudyPage() {
  const { kid, world } = useBay()
  if (!kid) return null
  const family = world.families.find((entry) => entry.id === kid.familyId)
  const assignment = kid.assignments.find((item) => item.id === MAP_ASSIGNMENT_ID)
  return (
    <div className="stack-page">
      <header className="page-head">
        <h1>Study</h1>
        <p>Units for Sam. Mastery unlocks the fighter's skills. Credits only change how he looks.</p>
      </header>
      {assignment ? (
        <article className="panel">
          <p className="eyebrow">Assignment · due {assignment.due}</p>
          <h2>{assignment.title}</h2>
          <p>{assignment.notes}</p>
          <Link className="btn btn-primary" to="/study/middle-east">Open the map</Link>
        </article>
      ) : null}
      <div className="study-grid">
        {hubUnits().map((unit) => {
          const progress = kid.study.units[unit.id]
          const ratio = progress ? masteryRatio(unit, progress) : 0
          return (
            <Link key={unit.id} className="panel study-card" to={`/study/${unit.id}`}>
              <h2>{unit.title}</h2>
              <p>{unit.detail}</p>
              <div className="meter-track" aria-label={`${Math.round(ratio * 100)} percent mastered`}>
                <div className="meter-fill fill-happy" style={{ width: `${Math.round(ratio * 100)}%` }} />
              </div>
              <p className="fine">{unit.kind === 'map' ? 'Map quiz' : 'Word unit'} · {family ? '' : ''}{Math.round(ratio * 100)}% mastered</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

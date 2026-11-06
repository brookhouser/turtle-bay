import { Link } from 'react-router-dom'
import { Stage } from '../components/Habitat'
import { Meters } from '../components/Meters'
import { useBay } from '../context/useBay'

export function SchoolPage() {
  const { kid, world } = useBay()
  if (!kid) return null
  const checks = kid.completions.filter((item) => item.kind === 'assignment')
  const shared = world.groupAssignments.filter((item) => kid.groupIds.includes(item.groupId) && item.active)
  return (
    <div className="stack-page">
      <header className="page-head">
        <h1>School</h1>
        <p>Assignments, how the work is going, and Pebble right now.</p>
      </header>
      <div className="home-grid">
        <Meters turtle={kid.turtle} practiceDays={kid.practiceDays} />
        <Stage tier={kid.turtle.habitatTier} hat={kid.turtle.equipped.hat} scarf={kid.turtle.equipped.scarf} plants={kid.turtle.equipped.plants} bed={kid.turtle.equipped.bed} mood="idle" turtleName={kid.turtle.name || 'Pebble'} />
      </div>
      <p className="fine">{kid.credits} credits from schoolwork.</p>
      <section className="panel">
        <h2>Assignments</h2>
        {shared.length === 0 && kid.assignments.length === 0 ? <p>Nothing assigned yet.</p> : null}
        <ul className="plain-list">
          {shared.map((item) => <li key={item.id}><strong>{item.title}</strong> · {item.points} credits</li>)}
          {kid.assignments.map((item) => <li key={item.id}><strong>{item.title}</strong> · due {item.due || 'soon'}</li>)}
        </ul>
      </section>
      <p className="fine">{checks.length} assignment checks saved. <Link to="/home">Pebble</Link></p>
    </div>
  )
}

import { useState } from 'react'
import { isChecked, type CheckTarget } from '../family/board'
import { useBay } from '../context/useBay'
import type { KidProfile, PersonalAssignment, RoutineItem, TaskItem } from '../types'
import { SamStudio } from './SamStudio'

export function ChoresPage() {
  const { kid, toggleChore } = useBay()
  const [message, setMessage] = useState<string | null>(null)
  if (!kid) return null
  if (kid.focus === 'rewards') return <SamStudio />
  const morning = kid.routines.filter((item) => item.active && item.slot === 'morning')
  const evening = kid.routines.filter((item) => item.active && item.slot === 'evening')
  const tasks = kid.tasks.filter((item) => item.active)
  const assignments = kid.assignments.filter((item) => item.active)

  function toggle(target: CheckTarget) {
    const error = toggleChore(target)
    setMessage(error)
  }

  return (
    <div className="stack">
      <header className="page-head">
        <h1>Today</h1>
        <p>{kid.focus === 'turtle' ? 'Checked steps put coins in Jeff’s jar.' : 'Checked steps add coins you can spend on rewards.'}</p>
      </header>
      {message ? <p className="form-error" role="alert">{message}</p> : null}
      <CheckList title="Morning" items={morning} kid={kid} kind="routine" onToggle={toggle} />
      <CheckList title="Evening" items={evening} kid={kid} kind="routine" onToggle={toggle} />
      <CheckList title="Tasks" items={tasks} kid={kid} kind="task" onToggle={toggle} />
      <CheckList title="Study" items={assignments} kid={kid} kind="assignment" onToggle={toggle} />
    </div>
  )
}

function CheckList({
  title,
  items,
  kid,
  kind,
  onToggle,
}: {
  title: string
  items: Array<RoutineItem | TaskItem | PersonalAssignment>
  kid: KidProfile
  kind: CheckTarget['kind']
  onToggle: (target: CheckTarget) => void
}) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {items.length === 0 ? <p className="fine">Nothing here yet.</p> : null}
      <ul className="check-list">
        {items.map((item) => {
          const repeat = 'repeat' in item ? item.repeat : 'daily'
          const target: CheckTarget = { itemId: item.id, kind, source: 'kid', groupId: '', points: item.points, repeat }
          const checked = isChecked(kid, target)
          return (
            <li key={item.id}>
              <label className="check-row">
                <input type="checkbox" checked={checked} onChange={() => onToggle(target)} />
                <span>{item.title}</span>
              </label>
              <span className="fine">{item.points} coins{('due' in item && item.due) ? ` · due ${item.due}` : ''}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

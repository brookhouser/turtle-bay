import { useState, type FormEvent } from 'react'
import { checksOnDay } from '../family/board'
import { useBay } from '../context/useBay'
import type { KidProfile } from '../types'

export function ChoreDesk({ kid }: { kid: KidProfile }) {
  const { addKidRoutine, removeKidRoutine, addKidTask, removeKidTask, addKidAssignment, removeKidAssignment, addKidReward, removeKidReward } = useBay()
  const [routineTitle, setRoutineTitle] = useState('')
  const [slot, setSlot] = useState<'morning' | 'evening'>('morning')
  const [taskTitle, setTaskTitle] = useState('')
  const [studyTitle, setStudyTitle] = useState('')
  const [due, setDue] = useState('')
  const [rewardTitle, setRewardTitle] = useState('')
  const [cost, setCost] = useState(20)
  const [error, setError] = useState<string | null>(null)

  function run(message: string | null, clear: () => void) {
    setError(message)
    if (!message) clear()
  }

  return (
    <section className="panel">
      <h2>Chores for {kid.turtle.name || kid.nickname}</h2>
      <p>{checksOnDay(kid)} checked off today · {kid.turtle.coins} coins</p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="chore-columns">
        <List title="Morning" items={kid.routines.filter((item) => item.slot === 'morning')} onRemove={(id) => run(removeKidRoutine(kid.id, id), () => undefined)} />
        <List title="Evening" items={kid.routines.filter((item) => item.slot === 'evening')} onRemove={(id) => run(removeKidRoutine(kid.id, id), () => undefined)} />
        <List title="Tasks" items={kid.tasks} onRemove={(id) => run(removeKidTask(kid.id, id), () => undefined)} />
        <List title="Study" items={kid.assignments} onRemove={(id) => run(removeKidAssignment(kid.id, id), () => undefined)} />
      </div>
      <form className="form-grid" onSubmit={(event: FormEvent) => { event.preventDefault(); run(addKidRoutine(kid.id, routineTitle, slot), () => setRoutineTitle('')) }}>
        <label className="field">Routine step<input className="bay-input" value={routineTitle} onChange={(event) => setRoutineTitle(event.target.value)} required /></label>
        <label className="field">When
          <select className="bay-input" value={slot} onChange={(event) => setSlot(event.target.value === 'evening' ? 'evening' : 'morning')}>
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
          </select>
        </label>
        <button className="btn" type="submit">Add step</button>
      </form>
      <form className="form-grid" onSubmit={(event: FormEvent) => { event.preventDefault(); run(addKidTask(kid.id, taskTitle), () => setTaskTitle('')) }}>
        <label className="field">One-off task<input className="bay-input" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} required /></label>
        <button className="btn" type="submit">Add task</button>
      </form>
      <form className="form-grid" onSubmit={(event: FormEvent) => { event.preventDefault(); run(addKidAssignment(kid.id, studyTitle, due), () => { setStudyTitle(''); setDue('') }) }}>
        <label className="field">Study assignment<input className="bay-input" value={studyTitle} onChange={(event) => setStudyTitle(event.target.value)} required /></label>
        <label className="field">Due<input className="bay-input" type="date" value={due} onChange={(event) => setDue(event.target.value)} /></label>
        <button className="btn" type="submit">Add study</button>
      </form>
      {kid.focus === 'rewards' ? (
        <>
          <h3>Rewards</h3>
          <ul className="check-list">
            {kid.rewards.map((reward) => (
              <li key={reward.id}>
                <span>{reward.title} · {reward.cost} coins{reward.active ? '' : ' · used'}</span>
                <button type="button" className="text-button" onClick={() => run(removeKidReward(kid.id, reward.id), () => undefined)}>Remove</button>
              </li>
            ))}
          </ul>
          <form className="form-grid" onSubmit={(event: FormEvent) => { event.preventDefault(); run(addKidReward(kid.id, rewardTitle, cost), () => setRewardTitle('')) }}>
            <label className="field">Reward<input className="bay-input" value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} required /></label>
            <label className="field">Cost<input className="bay-input" type="number" min={1} max={50} value={cost} onChange={(event) => setCost(Number(event.target.value))} /></label>
            <button className="btn" type="submit">Add reward</button>
          </form>
        </>
      ) : null}
    </section>
  )
}

function List({ title, items, onRemove }: { title: string; items: Array<{ id: string; title: string }>; onRemove: (id: string) => void }) {
  return (
    <div>
      <h3>{title}</h3>
      {items.length === 0 ? <p className="fine">None yet.</p> : null}
      <ul className="check-list">
        {items.map((item) => (
          <li key={item.id}>
            <span>{item.title}</span>
            <button type="button" className="text-button" onClick={() => onRemove(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

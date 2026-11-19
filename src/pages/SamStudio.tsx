import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isChecked, type CheckTarget } from '../family/board'
import { FOUNDING_KIDS } from '../family/roster'
import { useBay } from '../context/useBay'
import type { KidProfile, PersonalAssignment, RoutineItem, TaskItem } from '../types'

type Tab = 'today' | 'rewards' | 'assignments'
type Row = RoutineItem | TaskItem | PersonalAssignment

export function SamStudio() {
  const { kid, signOutBay, toggleChore, redeemKidReward } = useBay()
  const [params, setParams] = useSearchParams()
  const [message, setMessage] = useState<string | null>(null)
  if (!kid) return null
  const requested = params.get('view')
  const tab: Tab = requested === 'rewards' || requested === 'assignments' ? requested : 'today'
  const grade = FOUNDING_KIDS.find((person) => person.email === kid.googleEmail && 'grade' in person && person.grade)?.grade
  const kicker = tab === 'rewards' ? 'Rewards' : tab === 'assignments' ? 'Assignments' : 'Chore checklist'

  function open(next: Tab) {
    setMessage(null)
    setParams(next === 'today' ? {} : { view: next })
  }

  function toggle(target: CheckTarget) {
    setMessage(toggleChore(target))
  }

  return (
    <div className="sleeve">
      <header className="sleeve-head">
        <div>
          <h1>{kid.nickname}</h1>
          <p>{grade ? `${grade} · ` : ''}{kicker}</p>
        </div>
        <div className="vinyl" aria-label={`${Math.round(kid.turtle.coins)} coins`}>
          <span>{Math.round(kid.turtle.coins)}</span>
          <small>Coins</small>
        </div>
      </header>
      <button type="button" className="sleeve-switch" onClick={() => void signOutBay()}>Switch bay</button>
      {message ? <p className="sleeve-note" role="status">{message}</p> : null}
      {tab === 'today' ? <Today kid={kid} onToggle={toggle} /> : null}
      {tab === 'rewards' ? <Rewards kid={kid} onRedeem={(id) => setMessage(redeemKidReward(id))} /> : null}
      {tab === 'assignments' ? <TrackSection title="Study assignments" items={kid.assignments.filter((item) => item.active)} kid={kid} kind="assignment" onToggle={toggle} /> : null}
      <nav className="sleeve-tabs" aria-label="Sam">
        <button type="button" className={tab === 'today' ? 'on' : ''} onClick={() => open('today')}>
          <SunIcon />
          Today
        </button>
        <button type="button" className={tab === 'rewards' ? 'on' : ''} onClick={() => open('rewards')}>
          <GiftIcon />
          Rewards
        </button>
        <button type="button" className={tab === 'assignments' ? 'on' : ''} onClick={() => open('assignments')}>
          <NoteIcon />
          Assignments
        </button>
      </nav>
    </div>
  )
}

function Today({ kid, onToggle }: { kid: KidProfile; onToggle: (target: CheckTarget) => void }) {
  const reward = kid.rewards.find((item) => item.active)
  return (
    <div className="sleeve-stack">
      <TrackSection title="Morning routine" items={kid.routines.filter((item) => item.active && item.slot === 'morning')} kid={kid} kind="routine" onToggle={onToggle} />
      <TrackSection title="Evening routine" items={kid.routines.filter((item) => item.active && item.slot === 'evening')} kid={kid} kind="routine" onToggle={onToggle} />
      <TrackSection title="Tasks" items={kid.tasks.filter((item) => item.active)} kid={kid} kind="task" onToggle={onToggle} />
      {reward ? (
        <article className="liner">
          <BookIcon />
          <p>{reward.title}</p>
          <small>{kid.turtle.coins >= reward.cost ? 'unlocked' : `${reward.cost} coins`}</small>
        </article>
      ) : null}
    </div>
  )
}

function Rewards({ kid, onRedeem }: { kid: KidProfile; onRedeem: (id: string) => void }) {
  const rewards = kid.rewards.filter((item) => item.active)
  if (rewards.length === 0) return <p className="sleeve-empty">No rewards yet. A parent can add one.</p>
  return (
    <div className="sleeve-stack">
      {rewards.map((reward) => (
        <article key={reward.id} className="liner">
          <BookIcon />
          <p>{reward.title}</p>
          <small>{kid.turtle.coins >= reward.cost ? 'unlocked' : `${reward.cost} coins`}</small>
          <button type="button" onClick={() => onRedeem(reward.id)}>Claim · {reward.cost}</button>
        </article>
      ))}
    </div>
  )
}

function TrackSection({
  title,
  items,
  kid,
  kind,
  onToggle,
}: {
  title: string
  items: Row[]
  kid: KidProfile
  kind: CheckTarget['kind']
  onToggle: (target: CheckTarget) => void
}) {
  const checks = items.map((item) => {
    const repeat = 'repeat' in item ? item.repeat : 'daily'
    const target: CheckTarget = { itemId: item.id, kind, source: 'kid', groupId: '', points: item.points, repeat }
    return { item, target, checked: isChecked(kid, target) }
  })
  const done = checks.filter((row) => row.checked).length
  return (
    <section className="sleeve-block">
      <div className="sleeve-label-row">
        <h2>{title}</h2>
      </div>
      {items.length > 0 ? <Rule done={done} total={items.length} /> : null}
      {items.length === 0 ? <p className="sleeve-empty">Nothing on this list.</p> : null}
      <ol className="tracklist">
        {checks.map(({ item, target, checked }, index) => (
          <li key={item.id}>
            <label className={checked ? 'track is-done' : 'track'}>
              <span className="track-no">{String(index + 1).padStart(2, '0')}</span>
              <span className="track-lead" aria-hidden="true" />
              <span className="track-title">{item.title}</span>
              <input type="checkbox" checked={checked} onChange={() => onToggle(target)} aria-label={item.title} />
            </label>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Rule({ done, total }: { done: number; total: number }) {
  const marks = Math.max(total, 2)
  return (
    <div className="sleeve-rule">
      <div className="sleeve-rule-line" aria-hidden="true">
        <span style={{ width: total === 0 ? '0%' : `${(done / total) * 100}%` }} />
        {Array.from({ length: marks }, (_, index) => (
          <i key={index} style={{ left: `${(index / (marks - 1)) * 100}%` }} />
        ))}
      </div>
      <p>{done} / {total}</p>
    </div>
  )
}

function BookIcon() {
  return (
    <svg className="liner-icon" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 7.5h8.2c1.2 0 2.3.4 3.3 1.2V25c-1-.6-2.1-.9-3.3-.9H6V7.5Z" />
      <path d="M26 7.5h-8.2c-1.2 0-2.3.4-3.3 1.2V25c1-.6 2.1-.9 3.3-.9H26V7.5Z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="10" width="16" height="9" />
      <path d="M4 10h16M12 10v9M12 10c-2.2 0-3.5-2.8-2-3.6 1.2-.6 2 .8 2 1.6 0-.8.8-2.2 2-1.6 1.5.8.2 3.6-2 3.6Z" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4.5h8l3 3V19.5H7v-15Z" />
      <path d="M15 4.8V8h3.2M9.5 12h6M9.5 15.5h6" />
    </svg>
  )
}

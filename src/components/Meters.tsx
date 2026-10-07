import { practiceStreak } from '../game/logic'
import type { TurtleState } from '../types'

function Meter({ label, value, tone }: { label: string; value: number; tone: 'hunger' | 'happy' | 'clean' }) {
  const shown = Math.round(value)
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <span>{shown}</span>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shown}
      >
        <div className={`meter-fill fill-${tone}`} style={{ width: `${shown}%` }} />
      </div>
    </div>
  )
}

export function Meters({ turtle, practiceDays }: { turtle: TurtleState; practiceDays: string[] }) {
  const streak = practiceStreak(practiceDays)
  return (
    <div className="meters">
      <Meter label="Hunger" value={turtle.hunger} tone="hunger" />
      <Meter label="Happy" value={turtle.happy} tone="happy" />
      <Meter label="Clean" value={turtle.clean} tone="clean" />
      <p className="streak-line">{streak === 1 ? '1 day practice streak' : `${streak} day practice streak`}</p>
    </div>
  )
}

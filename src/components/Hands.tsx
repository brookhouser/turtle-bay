import type { FingerId } from '../data/keyboard'

const LEFT: FingerId[] = ['l-pinky', 'l-ring', 'l-middle', 'l-index']
const RIGHT: FingerId[] = ['r-index', 'r-middle', 'r-ring', 'r-pinky']

export function Hands({ active }: { active: FingerId | null }) {
  return (
    <div className="hands" aria-hidden="true">
      <div className="hand">
        {LEFT.map((id) => (
          <span key={id} className={`digit ${id} ${active === id ? 'on' : ''}`} />
        ))}
        <span className={`digit thumb left-thumb ${active === 'thumb' ? 'on' : ''}`} />
      </div>
      <div className="hand">
        <span className={`digit thumb right-thumb ${active === 'thumb' ? 'on' : ''}`} />
        {RIGHT.map((id) => (
          <span key={id} className={`digit ${id} ${active === id ? 'on' : ''}`} />
        ))}
      </div>
    </div>
  )
}

import { fingerFor, KEYBOARD_ROWS, type FingerId } from '../data/keyboard'

export function Keyboard({
  nextKey,
  wrong,
  knownKeys,
  newKeys,
}: {
  nextKey: string | null
  wrong: boolean
  knownKeys: string[]
  newKeys: string[]
}) {
  const known = new Set(knownKeys)
  const fresh = new Set(newKeys)
  return (
    <div className="keyboard" aria-hidden="true">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div className="key-row" key={rowIndex}>
          {row.map((key) => {
            const isNext = nextKey != null && key.code.toLowerCase() === nextKey.toLowerCase()
            const isKnown = key.code.length > 1 || known.has(key.code.toLowerCase()) || key.code === ' '
            const classes = [
              'key',
              key.finger ? `finger-${key.finger}` : '',
              key.home ? 'is-home' : '',
              key.bump ? 'has-bump' : '',
              key.code === ' ' ? 'space' : '',
              isNext ? 'is-next' : '',
              isNext && wrong ? 'is-error' : '',
              fresh.has(key.code) ? 'is-new' : '',
              !isKnown && !isNext ? 'is-dim' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <div key={key.code + key.label} className={classes} style={{ flexGrow: key.grow ?? 1 }}>
                {key.bump ? <span className="bump" /> : null}
                <span>{key.label}</span>
              </div>
            )
          })}
        </div>
      ))}
      <FingerLegend active={nextKey ? fingerFor(nextKey) : null} />
    </div>
  )
}

function legendFamily(active: FingerId | null): string | null {
  if (!active) return null
  if (active === 'thumb') return 'thumb'
  if (active.endsWith('pinky')) return 'l-pinky'
  if (active.endsWith('ring')) return 'l-ring'
  if (active.endsWith('middle')) return 'l-middle'
  if (active.endsWith('index')) return 'l-index'
  return null
}

function FingerLegend({ active }: { active: FingerId | null }) {
  const items = [
    ['l-pinky', 'Pinky'],
    ['l-ring', 'Ring'],
    ['l-middle', 'Middle'],
    ['l-index', 'Index'],
    ['thumb', 'Thumb'],
  ] as const
  const family = legendFamily(active)
  return (
    <div className="legend">
      {items.map(([id, label]) => (
        <span key={id} className={`legend-item finger-${id} ${family === id ? 'on' : ''}`}>
          <i />
          {label}
        </span>
      ))}
      <span className="legend-note">F and J have a home bump.</span>
    </div>
  )
}

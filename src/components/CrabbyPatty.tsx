import type { ReactNode } from 'react'
import { PATTY_LAYERS, type PattyLayerId } from '../game/spelling'

const STEP = 20
const BASE = 292

function layerShape(id: PattyLayerId): ReactNode {
  switch (id) {
    case 'bottom-bun':
      return (
        <g>
          <path d="M30 4c0 12 140 12 140 0 0-12-140-12-140 0z" fill="#e6c79a" stroke="#1c2740" strokeWidth="2.5" />
          <path d="M38 2c18-8 106-8 124 0" fill="none" stroke="#c49a58" strokeWidth="2" strokeLinecap="round" />
        </g>
      )
    case 'patty':
      return (
        <g>
          <rect x="36" y="-14" width="128" height="22" rx="9" fill="#c47a45" stroke="#1c2740" strokeWidth="2.5" />
          <path d="M52-6h18M86-8h22M122-6h16" stroke="#8d4e2b" strokeWidth="2" strokeLinecap="round" />
        </g>
      )
    case 'cheese':
      return <path d="M32-16h112l18 16H44z" fill="#f0c14a" stroke="#1c2740" strokeWidth="2.5" strokeLinejoin="round" />
    case 'lettuce':
      return (
        <path
          d="M24-4c12-14 20 6 32-12 12 16 20-8 32 4 10-14 22 6 34-10 12 14 20-4 34 2v8H24z"
          fill="#7dcea0"
          stroke="#1c2740"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )
    case 'tomato':
      return (
        <g>
          <ellipse cx="100" cy="-6" rx="60" ry="12" fill="#e15b5b" stroke="#1c2740" strokeWidth="2.5" />
          <ellipse cx="100" cy="-8" rx="26" ry="5" fill="#f3b1aa" />
        </g>
      )
    case 'pickles':
      return (
        <g>
          <ellipse cx="62" cy="-6" rx="22" ry="9" fill="#2f9d62" stroke="#1c2740" strokeWidth="2.5" />
          <ellipse cx="100" cy="-8" rx="22" ry="9" fill="#3eaf70" stroke="#1c2740" strokeWidth="2.5" />
          <ellipse cx="138" cy="-6" rx="22" ry="9" fill="#2f9d62" stroke="#1c2740" strokeWidth="2.5" />
          <circle cx="56" cy="-8" r="1.4" fill="#1c2740" />
          <circle cx="68" cy="-5" r="1.4" fill="#1c2740" />
          <circle cx="96" cy="-10" r="1.4" fill="#1c2740" />
          <circle cx="108" cy="-6" r="1.4" fill="#1c2740" />
          <circle cx="132" cy="-8" r="1.4" fill="#1c2740" />
          <circle cx="146" cy="-5" r="1.4" fill="#1c2740" />
        </g>
      )
    case 'onion':
      return (
        <g>
          <ellipse cx="100" cy="-6" rx="58" ry="11" fill="#f7eef8" stroke="#1c2740" strokeWidth="2.5" />
          <ellipse cx="100" cy="-6" rx="40" ry="7" fill="none" stroke="#c9a8d4" strokeWidth="2" />
          <ellipse cx="100" cy="-6" rx="22" ry="4" fill="none" stroke="#d7c4e2" strokeWidth="2" />
        </g>
      )
    case 'sauce':
      return (
        <g>
          <path
            d="M38-2c12-14 22 8 36-10 14 16 22-6 36 2 12-12 24 6 40-4 4 8-140 10-148 6 0-2 8-6 36 6z"
            fill="#e8834a"
            stroke="#1c2740"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M58-2c10-8 16 4 28-4" fill="none" stroke="#f0c14a" strokeWidth="3" strokeLinecap="round" />
        </g>
      )
    case 'second-patty':
      return (
        <g>
          <rect x="34" y="-14" width="132" height="22" rx="9" fill="#a85b32" stroke="#1c2740" strokeWidth="2.5" />
          <path d="M50-7h20M84-9h26M124-7h18" stroke="#6e381c" strokeWidth="2" strokeLinecap="round" />
        </g>
      )
    case 'top-bun':
      return (
        <g>
          <path d="M30 6c0-28 140-28 140 0z" fill="#f3d7a1" stroke="#1c2740" strokeWidth="2.5" />
          <ellipse cx="100" cy="6" rx="70" ry="10" fill="#e6c79a" stroke="#1c2740" strokeWidth="2.5" />
          <ellipse cx="72" cy="-12" rx="4.5" ry="2.6" fill="#fff6e4" stroke="#1c2740" strokeWidth="1.4" transform="rotate(-18 72 -12)" />
          <ellipse cx="100" cy="-16" rx="4.5" ry="2.6" fill="#fff6e4" stroke="#1c2740" strokeWidth="1.4" />
          <ellipse cx="128" cy="-11" rx="4.5" ry="2.6" fill="#fff6e4" stroke="#1c2740" strokeWidth="1.4" transform="rotate(16 128 -11)" />
          <ellipse cx="86" cy="-6" rx="3.6" ry="2.2" fill="#fff6e4" stroke="#1c2740" strokeWidth="1.4" transform="rotate(10 86 -6)" />
        </g>
      )
    default:
      return null
  }
}

export function CrabbyPatty({
  count,
  goal,
  popKey = 0,
  ready = false,
}: {
  count: number
  goal: number
  popKey?: number
  ready?: boolean
}) {
  const shown = Math.min(PATTY_LAYERS.length, Math.max(0, count))
  const label =
    shown === 0
      ? 'An empty plate waiting for a crabby patty'
      : shown >= PATTY_LAYERS.length
        ? 'A finished crabby patty'
        : `Crabby patty with ${shown} of ${goal} layers`
  const latest = shown > 0 ? PATTY_LAYERS[shown - 1] : null

  return (
    <aside className={`patty-card ${ready ? 'is-ready' : ''}`}>
      <svg className="patty-svg" viewBox="0 0 200 348" role="img" aria-label={label} data-layer-count={shown}>
        <title>{label}</title>
        <ellipse cx="100" cy="318" rx="84" ry="16" fill="#f6ead4" stroke="#1c2740" strokeWidth="3" />
        <ellipse cx="100" cy="318" rx="50" ry="7" fill="none" stroke="#0e756c" strokeWidth="2" />
        {PATTY_LAYERS.slice(0, shown).map((layer, index) => {
          const newest = index === shown - 1
          return (
            <g key={newest ? `${layer.id}-${popKey}` : layer.id} transform={`translate(0 ${BASE - index * STEP})`}>
              <g className={newest ? 'patty-pop' : undefined}>{layerShape(layer.id)}</g>
            </g>
          )
        })}
        {shown >= PATTY_LAYERS.length ? (
          <g className="patty-spark" aria-hidden="true">
            <circle cx="22" cy="78" r="4" fill="#f0c14a" stroke="#1c2740" strokeWidth="1.5" />
            <circle cx="178" cy="70" r="3.5" fill="#8fd0c6" stroke="#1c2740" strokeWidth="1.5" />
            <circle cx="168" cy="108" r="2.5" fill="#f0c14a" stroke="#1c2740" strokeWidth="1.5" />
          </g>
        ) : null}
      </svg>
      <p className="patty-count">{shown} of {goal}</p>
      <p className="patty-label">{latest ? latest.label : 'Stack starts in round 2'}</p>
    </aside>
  )
}

const INK = '#1a1a1a'

export function PlantGraphic({ id }: { id: string }) {
  if (id === 'sea-grass') {
    return (
      <svg viewBox="0 0 120 150" className="prop-svg" aria-hidden="true">
        <path d="M30 140 C28 90 20 70 34 30" fill="none" stroke="#3d9a62" strokeWidth="8" strokeLinecap="round" />
        <path d="M52 142 C50 80 70 60 58 24" fill="none" stroke="#67b56a" strokeWidth="8" strokeLinecap="round" />
        <path d="M74 140 C80 88 96 74 86 36" fill="none" stroke="#2f8a50" strokeWidth="8" strokeLinecap="round" />
        <path d="M30 140 C28 90 20 70 34 30" fill="none" stroke={INK} strokeWidth="3" />
      </svg>
    )
  }
  if (id === 'coral') {
    return (
      <svg viewBox="0 0 120 150" className="prop-svg" aria-hidden="true">
        <path d="M60 140 L60 70" stroke="#f08a9a" strokeWidth="14" strokeLinecap="round" />
        <path d="M60 100 L30 60" stroke="#f3a0b8" strokeWidth="12" strokeLinecap="round" />
        <path d="M60 90 L96 48" stroke="#ef7d8a" strokeWidth="12" strokeLinecap="round" />
        <circle cx="60" cy="64" r="10" fill="#f3a0b8" stroke={INK} strokeWidth="4" />
        <circle cx="28" cy="54" r="9" fill="#f08a9a" stroke={INK} strokeWidth="4" />
        <circle cx="98" cy="42" r="9" fill="#ef7d8a" stroke={INK} strokeWidth="4" />
        <path d="M60 140 L60 70 M60 100 L30 60 M60 90 L96 48" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 120 160" className="prop-svg" aria-hidden="true">
      <path d="M48 150 C40 100 18 80 28 30 C40 70 52 90 58 150" fill="#2f8a50" stroke={INK} strokeWidth="5" />
      <path d="M70 150 C78 90 104 70 92 20 C80 64 72 96 64 150" fill="#3d9a62" stroke={INK} strokeWidth="5" />
    </svg>
  )
}

export function BedGraphic({ id }: { id: string }) {
  if (id === 'sand-pillow') {
    return (
      <svg viewBox="0 0 220 90" className="prop-svg" aria-hidden="true">
        <ellipse cx="110" cy="58" rx="90" ry="26" fill="#f0d7a2" stroke={INK} strokeWidth="6" />
        <path d="M40 52c30 16 110 16 140 0" fill="none" stroke="#e2c07a" strokeWidth="6" strokeLinecap="round" />
      </svg>
    )
  }
  if (id === 'moss-cushion') {
    return (
      <svg viewBox="0 0 220 90" className="prop-svg" aria-hidden="true">
        <ellipse cx="110" cy="56" rx="88" ry="28" fill="#67b56a" stroke={INK} strokeWidth="6" />
        <circle cx="70" cy="50" r="10" fill="#8dce78" stroke={INK} strokeWidth="4" />
        <circle cx="110" cy="42" r="12" fill="#8dce78" stroke={INK} strokeWidth="4" />
        <circle cx="150" cy="50" r="10" fill="#3d9a62" stroke={INK} strokeWidth="4" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 220 90" className="prop-svg" aria-hidden="true">
      <ellipse cx="55" cy="58" rx="28" ry="18" fill="#c5cdd4" stroke={INK} strokeWidth="5" />
      <ellipse cx="100" cy="50" rx="32" ry="20" fill="#d5dde3" stroke={INK} strokeWidth="5" />
      <ellipse cx="150" cy="58" rx="30" ry="18" fill="#b7c2ca" stroke={INK} strokeWidth="5" />
      <ellipse cx="188" cy="64" rx="18" ry="12" fill="#d5dde3" stroke={INK} strokeWidth="5" />
    </svg>
  )
}

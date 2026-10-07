export function CoinIcon() {
  return (
    <svg className="coin-icon" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="#f0c14a" stroke="#1a1a1a" strokeWidth="3" />
      <circle cx="16" cy="16" r="7" fill="none" stroke="#1a1a1a" strokeWidth="2" />
    </svg>
  )
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="pencil-icon">
      <path d="M4 16.5 14.8 5.7l3.5 3.5L7.5 20H4z" fill="#f6e27a" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13.5 7 17 10.5" stroke="#1a1a1a" strokeWidth="2" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="lock-icon">
      <rect x="5" y="10" width="14" height="10" rx="2" fill="#f4f7fb" stroke="#1a1a1a" strokeWidth="2" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" fill="none" stroke="#1a1a1a" strokeWidth="2" />
    </svg>
  )
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 48 24" aria-hidden="true" className="arrow-icon">
      <path d="M4 12h32" stroke="#1f8f6e" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 4l12 8-12 8" fill="none" stroke="#1f8f6e" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

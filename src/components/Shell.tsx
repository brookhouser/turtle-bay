import type { ReactNode } from 'react'
import { preload } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import { APP_NAME } from '../config'
import { useBay } from '../context/useBay'
import { TIER_SCENES, habitatUrl } from '../data/habitatScenes'
import { CoinIcon } from './Icons'

const TURTLE_LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/pebble-run', label: 'Pebble Run' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/shop', label: 'Shop' },
  { to: '/care', label: 'Care' },
]

const SAM_LINKS = [
  { to: '/study', label: 'Study' },
  { to: '/dojo', label: 'Dojo' },
  { to: '/runner', label: 'Runner' },
]

const SCHOOL_LINKS = [
  { to: '/school', label: 'School' },
  { to: '/school/run', label: 'Pebble Run' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { kid, session, mode, signOutBay } = useBay()
  const links = session?.role === 'kid' && session.scope === 'school'
    ? SCHOOL_LINKS
    : kid?.motivation === 'fighter'
      ? SAM_LINKS
      : TURTLE_LINKS
  const navigate = useNavigate()
  const coins = Math.round(kid?.turtle.coins ?? 0)
  if (kid) {
    // Start the current habitat's layers early; every kid page shows them.
    const scene = TIER_SCENES[kid.turtle.habitatTier] ?? TIER_SCENES[1]
    preload(habitatUrl(scene.back), { as: 'image', fetchPriority: 'high' })
    preload(habitatUrl(scene.front), { as: 'image', fetchPriority: 'high' })
  }

  return (
    <div className="app-frame">
      <header className="topbar">
        <NavLink to={links[0]?.to ?? '/home'} className="brand">
          {APP_NAME}
        </NavLink>
        {mode === 'demo' ? <span className="mode-chip">Demo</span> : <span className="mode-chip live">Synced</span>}
        <nav className="nav" aria-label="Bay">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/school'} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="coin-pill" aria-label={`${coins} coins`}>
          <CoinIcon />
          <span>Coins {coins}</span>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            void signOutBay().then(() => navigate('/'))
          }}
        >
          Switch bay
        </button>
      </header>
      <main className="page">{children}</main>
    </div>
  )
}

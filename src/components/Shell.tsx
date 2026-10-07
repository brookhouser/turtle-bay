import type { ReactNode } from 'react'
import { preload } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import { APP_NAME } from '../config'
import { useBay } from '../context/useBay'
import { TIER_SCENES, habitatUrl } from '../data/habitatScenes'
import { CoinIcon } from './Icons'

const LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/shop', label: 'Shop' },
  { to: '/care', label: 'Care' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { kid, mode, signOutBay } = useBay()
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
        <NavLink to="/home" className="brand">
          {APP_NAME}
        </NavLink>
        {mode === 'demo' ? <span className="mode-chip">Demo</span> : <span className="mode-chip live">Synced</span>}
        <nav className="nav" aria-label="Bay">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
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

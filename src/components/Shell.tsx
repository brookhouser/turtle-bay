import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { APP_NAME } from '../config'
import { useBay } from '../context/useBay'
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

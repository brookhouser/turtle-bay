import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { APP_NAME } from './config'
import { AppShell } from './components/Shell'
import { BayProvider } from './context/BayContext'
import { useBay } from './context/useBay'
import { CarePage } from './pages/CarePage'
import { ChallengesPage } from './pages/ChallengesPage'
import { HabitatPage } from './pages/HabitatPage'
import { HomePage } from './pages/HomePage'
import { LessonPage } from './pages/LessonPage'
import { LoginPage } from './pages/LoginPage'
import { NamePage } from './pages/NamePage'
import { ParentPage } from './pages/ParentPage'
import { ShopPage } from './pages/ShopPage'
import { SpellingPage } from './pages/SpellingPage'
import { StudyPage } from './pages/StudyPage'
import { StudyPlayPage } from './pages/StudyPlayPage'
import { DojoPage } from './pages/DojoPage'
import { RunnerPage } from './pages/RunnerPage'
import { SchoolPage } from './pages/SchoolPage'
import type { ReactNode } from 'react'

function KidGate({ children, named = false, kind = 'turtle' }: { children: ReactNode; named?: boolean; kind?: 'turtle' | 'fighter' }) {
  const { ready, session, kid } = useBay()
  if (!ready) return <p className="app-loading">Opening the bay...</p>
  if (!session || session.role !== 'kid' || !kid) return <Navigate to="/" replace />
  if (session.scope === 'school') return <Navigate to="/school" replace />
  if (kind === 'turtle' && kid.motivation === 'fighter') return <Navigate to="/study" replace />
  if (kind === 'fighter' && kid.motivation !== 'fighter') return <Navigate to="/home" replace />
  if (kind === 'turtle' && named && !kid.turtle.named) return <Navigate to="/name" replace />
  if (kind === 'turtle' && !named && kid.turtle.named) return <Navigate to="/home" replace />
  return children
}

function SchoolGate({ children }: { children: ReactNode }) {
  const { ready, session, kid } = useBay()
  if (!ready) return <p className="app-loading">Opening the bay...</p>
  if (!session || session.role !== 'kid' || session.scope !== 'school' || !kid) return <Navigate to="/" replace />
  return <AppShell>{children}</AppShell>
}

function ParentGate({ children }: { children: ReactNode }) {
  const { ready, session } = useBay()
  if (!ready) return <p className="app-loading">Opening the bay...</p>
  if (!session || session.role !== 'parent') return <Navigate to="/" replace />
  return children
}

function RoutesView() {
  useEffect(() => {
    document.title = APP_NAME
  }, [])

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/name" element={<KidGate><NamePage /></KidGate>} />
      <Route path="/home" element={<KidGate named><AppShell><HomePage /></AppShell></KidGate>} />
      <Route path="/challenges" element={<KidGate named><AppShell><ChallengesPage /></AppShell></KidGate>} />
      <Route path="/lesson/:lessonId" element={<KidGate named><LessonPage /></KidGate>} />
      <Route path="/custom/:challengeId" element={<KidGate named><LessonPage /></KidGate>} />
      <Route path="/spelling" element={<KidGate named><SpellingPage /></KidGate>} />
      <Route path="/spelling/:challengeId" element={<KidGate named><SpellingPage /></KidGate>} />
      <Route path="/shop" element={<KidGate named><AppShell><ShopPage /></AppShell></KidGate>} />
      <Route path="/care" element={<KidGate named><AppShell><CarePage /></AppShell></KidGate>} />
      <Route path="/habitat" element={<KidGate named><AppShell><HabitatPage /></AppShell></KidGate>} />
      <Route path="/study" element={<KidGate kind="fighter"><AppShell><StudyPage /></AppShell></KidGate>} />
      <Route path="/study/:unitId" element={<KidGate kind="fighter"><AppShell><StudyPlayPage /></AppShell></KidGate>} />
      <Route path="/dojo" element={<KidGate kind="fighter"><AppShell><DojoPage /></AppShell></KidGate>} />
      <Route path="/runner" element={<KidGate kind="fighter"><AppShell><RunnerPage /></AppShell></KidGate>} />
      <Route path="/school" element={<SchoolGate><SchoolPage /></SchoolGate>} />
      <Route path="/parent" element={<ParentGate><ParentPage /></ParentGate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function routerBasename(): string {
  const base = import.meta.env.BASE_URL
  if (!base || base === '/') return ''
  return base.endsWith('/') ? base.slice(0, -1) : base
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <BayProvider>
        <RoutesView />
      </BayProvider>
    </BrowserRouter>
  )
}

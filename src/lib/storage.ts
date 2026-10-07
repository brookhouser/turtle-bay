import type { SaveData, SessionData } from '../types'

const SAVE_KEY = 'turtlebay.save.v1'
const SESSION_KEY = 'turtlebay.session.v1'

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return { kids: [] }
    const parsed = JSON.parse(raw) as SaveData
    if (!parsed || !Array.isArray(parsed.kids)) return { kids: [] }
    return parsed
  } catch {
    return { kids: [] }
  }
}

export function persistSave(save: SaveData) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save))
}

export function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionData
    if (!parsed || (parsed.role !== 'kid' && parsed.role !== 'parent')) return null
    return parsed
  } catch {
    return null
  }
}

export function persistSession(session: SessionData | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY)
}

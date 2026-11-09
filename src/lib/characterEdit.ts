import { getApps } from 'firebase/app'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { firebaseMode } from './env'
import { GEMINI_NOT_READY } from '../fighter/policy'

export type EditResult = {
  status: 'not_configured' | 'blocked' | 'preview' | 'kept' | 'discarded' | 'error' | 'cap' | 'credits'
  message: string
  previewId?: string
  imageBase64?: string
  mimeType?: string
  retriesLeft?: number
  cost?: number
  reason?: string
}

export async function callCharacterEdit(payload: {
  action: 'preview' | 'retry' | 'keep' | 'discard'
  prompt?: string
  lookId?: string
  imageBase64?: string
  mimeType?: string
  previewId?: string
}): Promise<EditResult> {
  if (!firebaseMode()) return { status: 'not_configured', message: GEMINI_NOT_READY }
  const app = getApps().find((item) => item.name === '[DEFAULT]')
  if (!app) return { status: 'not_configured', message: GEMINI_NOT_READY }
  try {
    const call = httpsCallable(getFunctions(app), 'editCharacter')
    const result = await call(payload)
    const data = result.data
    if (!data || typeof data !== 'object') return { status: 'error', message: 'The edit did not come back.' }
    return data as EditResult
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : ''
    if (code === 'functions/not-found' || code === 'functions/unavailable' || code === 'functions/internal') {
      return { status: 'not_configured', message: GEMINI_NOT_READY }
    }
    return { status: 'error', message: 'The edit did not go through.' }
  }
}

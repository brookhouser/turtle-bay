import { createContext, useContext } from 'react'
import type { BayContextValue } from './BayContext'

export const BayContext = createContext<BayContextValue | null>(null)

export function useBay() {
  const value = useContext(BayContext)
  if (!value) throw new Error('useBay must be used inside BayProvider')
  return value
}

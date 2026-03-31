import { createContext, useContext } from 'react'
import type { User, Locale } from '../types'

interface AuthContextType {
  user: User | null
  locale: Locale
  setLocale: (locale: Locale) => void
  setUser: (user: User | null) => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe utilisé dentro du AuthProvider')
  }
  return context
}

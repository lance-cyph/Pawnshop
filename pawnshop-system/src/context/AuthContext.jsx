import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// MOCK LOGIN for the prototype (the design says "Offline Mode").
// Replace login() with supabase.auth.signInWithPassword(...) and read the
// role from your profiles table once the database lead has it ready.
export const MOCK_USERS = {
  appraiser: { username: 'appraiser', name: 'Appraiser', role: 'Appraiser', home: '/appraiser/appraisals' },
  cashier: { username: 'cashier', name: 'Maria Santos', role: 'Cashier', home: '/cashier' },
  admin: { username: 'admin', name: 'Juan Dela Cruz', role: 'Administrator', home: '/admin' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pawn-user')) || null
    } catch {
      return null
    }
  })

  const login = (username, password) => {
    const found = MOCK_USERS[String(username).trim().toLowerCase()]
    if (!found || !password) return false
    setUser(found)
    try {
      localStorage.setItem('pawn-user', JSON.stringify(found))
    } catch {
      /* storage blocked: still works for this session */
    }
    return found
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem('pawn-user')
    } catch {
      /* ignore */
    }
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

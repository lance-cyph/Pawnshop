
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadUser(session) {
      if (!session) {
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, full_name, role, is_active')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!mounted) return

      if (error || !data || !data.is_active) {
        setUser(null)
        await supabase.auth.signOut()
      } else {
        setUser(data)
      }

      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      loadUser(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function login(username, password) {
    const email = `${username.trim()}@pawnshop.local`

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, message: error.message }
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('user_id, username, full_name, role, is_active')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (
      profileError ||
      !profile ||
      !profile.is_active ||
      !['Administrator', 'Cashier', 'Appraiser'].includes(profile.role)
    ) {
      await supabase.auth.signOut()

      return {
        success: false,
        message: 'Your account is inactive or has no valid staff profile.',
      }
    }

    setUser(profile)

    return { success: true }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()

    if (!error) {
      setUser(null)
    }

    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

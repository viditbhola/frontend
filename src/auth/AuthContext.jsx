import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [waking, setWaking] = useState(false)

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await api('/me', { onWaking: () => setWaking(true) }))
    } catch {
      setProfile(null)
    } finally {
      setWaking(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadProfile()
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event === 'SIGNED_OUT') setProfile(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [loadProfile])

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      waking,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await loadProfile()
      },
      signOut: () => supabase.auth.signOut(),
      refreshProfile: loadProfile,
    }),
    [session, profile, loading, waking, loadProfile],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

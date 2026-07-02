import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    const supabase = getSupabaseClient()

    async function loadProfile(userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) console.error('Profile load error:', error)
      setProfile(data)
    }

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current)
      if (current?.user) loadProfile(current.user.id)
      else setProfile(null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) loadProfile(nextSession.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      async signIn(email, password) {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        const { data: prof, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileError) throw profileError
        setSession(data.session)
        setProfile(prof)
        return prof
      },
      async signOut() {
        const supabase = getSupabaseClient()
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setProfile(null)
      },
    }),
    [session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

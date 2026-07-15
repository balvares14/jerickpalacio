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
    let cancelled = false

    async function loadProfile(userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) console.error('Profile load error:', error)
      if (!cancelled) setProfile(data)
      return data
    }

    supabase.auth.getSession().then(async ({ data: { session: current } }) => {
      if (cancelled) return
      setSession(current)
      if (current?.user) {
        await loadProfile(current.user.id)
      } else {
        setProfile(null)
      }
      if (!cancelled) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (cancelled) return

      if (nextSession?.user) {
        // Keep prior profile while reloading same user — avoids Access denied flash
        setSession(nextSession)
        await loadProfile(nextSession.user.id)
      } else {
        setSession(null)
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
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
        setSession(null)
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

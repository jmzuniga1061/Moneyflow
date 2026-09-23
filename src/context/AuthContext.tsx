import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../services/supabaseClient'

type UserSession = {
  id: string
  email?: string | null
  avatar_url?: string | null
  nickname?: string | null
  role: 'usuario' | 'superusuario'
}

type AuthContextType = {
  user: UserSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isSuperuser: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  const buildUser = async (authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
    const { data: profile } = await supabase.from('users').select('nickname, role').eq('id', authUser.id).maybeSingle()
    const metadataRole = authUser.user_metadata?.role
    return {
      id: authUser.id,
      email: authUser.email,
      avatar_url: typeof authUser.user_metadata?.avatar_url === 'string' ? authUser.user_metadata.avatar_url : null,
      nickname: (profile?.nickname as string | null | undefined) ?? (authUser.user_metadata?.nickname as string | null | undefined) ?? null,
      role: profile?.role === 'superusuario' || metadataRole === 'superusuario' ? 'superusuario' as const : 'usuario' as const,
    }
  }

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!error && data.session?.user) {
        setUser(await buildUser(data.session.user))
      }

      setLoading(false)
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void buildUser(session.user).then(setUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      signIn: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
          throw new Error(error.message)
        }
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut()

        if (error) {
          throw new Error(error.message)
        }

        setUser(null)
      },
      isSuperuser: user?.role === 'superusuario',
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

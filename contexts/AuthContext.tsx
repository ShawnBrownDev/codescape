'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          setError(error.message)
          return
        }

        if (session) {
          setUser(session.user)
          setSession(session)
        } else {
          // If no session, ensure we clean up any stale data
          setUser(null)
          setSession(null)
          localStorage.removeItem('codescape-auth')
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        setSession(session)
      } else {
        setUser(null)
        setSession(null)
        // Clear any stored session data on auth state change to null
        localStorage.removeItem('codescape-auth')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      // First check if we still have a session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // If no session, just clean up the local state and storage
        setUser(null)
        setSession(null)
        // Clear any stored session data
        localStorage.removeItem('codescape-auth')
        return { error: null }
      }

      // If we have a session, try to sign out properly
      const { error } = await supabase.auth.signOut()
      
      // Regardless of error, clean up local state and storage
      setUser(null)
      setSession(null)
      // Clear any stored session data
      localStorage.removeItem('codescape-auth')
      
      return { error }
    } catch (error) {
      // Clean up local state and storage even if there's an error
      setUser(null)
      setSession(null)
      // Clear any stored session data
      localStorage.removeItem('codescape-auth')
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
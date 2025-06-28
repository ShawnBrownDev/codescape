'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type UserProfileData = Database['public']['Tables']['user_profiles']['Row']
type UserProgress = Database['public']['Tables']['user_progress']['Row']
type RankInfo = Database['public']['Tables']['ranks']['Row']

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  profileData: UserProfileData | null
  userProgress: UserProgress | null
  currentRank: RankInfo | null
  nextRank: RankInfo | null
  progressToNextRank: number
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

const CACHE_KEY = 'codescape-profile-cache'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

interface CacheData {
  timestamp: number
  profileData: UserProfileData
  userProgress: UserProgress
  currentRank: RankInfo
  nextRank: RankInfo | null
  progressToNextRank: number
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [currentRank, setCurrentRank] = useState<RankInfo | null>(null)
  const [nextRank, setNextRank] = useState<RankInfo | null>(null)
  const [progressToNextRank, setProgressToNextRank] = useState<number>(0)

  // Function to fetch user data
  const fetchUserData = async (userId: string) => {
    try {
      // Try to get cached data first
      const cachedData = localStorage.getItem(CACHE_KEY)
      if (cachedData) {
        const parsed = JSON.parse(cachedData) as CacheData
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          setProfileData(parsed.profileData)
          setUserProgress(parsed.userProgress)
          setCurrentRank(parsed.currentRank)
          setNextRank(parsed.nextRank)
          setProgressToNextRank(parsed.progressToNextRank)
          return
        }
      }

      // Fetch all data in parallel
      const [profileResult, progressResult, ranksResult] = await Promise.all([
        supabase.from('user_profiles').select().eq('id', userId).single(),
        supabase.from('user_progress').select().eq('user_id', userId).single(),
        supabase.from('ranks').select().order('level')
      ])

      if (profileResult.error) throw profileResult.error
      if (progressResult.error) throw progressResult.error
      if (ranksResult.error) throw ranksResult.error

      const profile = profileResult.data
      const progress = progressResult.data
      const ranks = ranksResult.data

      // Calculate rank info
      const currentRankData = ranks.find(r => r.level === progress.current_rank)
      const nextRankData = ranks.find(r => r.level === progress.current_rank + 1)
      const progressPercent = currentRankData && nextRankData
        ? ((progress.total_xp - currentRankData.min_xp) / (nextRankData.min_xp - currentRankData.min_xp)) * 100
        : 0

      // Update state
      setProfileData(profile)
      setUserProgress(progress)
      setCurrentRank(currentRankData || null)
      setNextRank(nextRankData || null)
      setProgressToNextRank(Math.min(Math.max(progressPercent, 0), 100))

      // Cache the data
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        profileData: profile,
        userProgress: progress,
        currentRank: currentRankData,
        nextRank: nextRankData,
        progressToNextRank: progressPercent
      }))
    } catch (err) {
      console.error('Error fetching user data:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        setLoading(true) // Ensure loading is true before we start
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          setError(error.message)
          return
        }

        console.log('Initial session:', session ? 'Found' : 'Not found')
        if (session) {
          console.log('Setting user from session:', session.user.id)
          setUser(session.user)
          setSession(session)
          // Fetch user data immediately after session is confirmed
          await fetchUserData(session.user.id)
        } else {
          console.log('No session found, cleaning up...')
          setUser(null)
          setSession(null)
          localStorage.removeItem('codescape-auth')
          localStorage.removeItem(CACHE_KEY)
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        console.log('Initial session check complete')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    console.log('Setting up auth state change listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session ? 'Session exists' : 'No session')
      setLoading(true) // Set loading to true when auth state changes
      try {
        if (session) {
          console.log('Setting user from auth change:', session.user.id)
          setUser(session.user)
          setSession(session)
          // Fetch user data on auth state change
          await fetchUserData(session.user.id)
        } else {
          console.log('No session in auth change, cleaning up...')
          setUser(null)
          setSession(null)
          setProfileData(null)
          setUserProgress(null)
          setCurrentRank(null)
          setNextRank(null)
          setProgressToNextRank(0)
          localStorage.removeItem('codescape-auth')
          localStorage.removeItem(CACHE_KEY)
        }
      } catch (err) {
        console.error('Error in auth state change:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    })

    // Set up realtime subscription for profile updates
    const channel = supabase
      .channel('profile_changes')
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'user_progress',
        filter: `user_id=eq.${user?.id}`,
      }, async (payload) => {
        if (payload.eventType === 'DELETE') return
        if (user?.id) await fetchUserData(user.id)
      })
      .subscribe()

    return () => {
      console.log('Cleaning up auth subscription')
      subscription.unsubscribe()
      channel.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setUser(null)
        setSession(null)
        setProfileData(null)
        setUserProgress(null)
        setCurrentRank(null)
        setNextRank(null)
        setProgressToNextRank(0)
        localStorage.removeItem('codescape-auth')
        localStorage.removeItem(CACHE_KEY)
        return { error: null }
      }

      const { error } = await supabase.auth.signOut()
      
      setUser(null)
      setSession(null)
      setProfileData(null)
      setUserProgress(null)
      setCurrentRank(null)
      setNextRank(null)
      setProgressToNextRank(0)
      localStorage.removeItem('codescape-auth')
      localStorage.removeItem(CACHE_KEY)
      
      return { error }
    } catch (error) {
      setUser(null)
      setSession(null)
      setProfileData(null)
      setUserProgress(null)
      setCurrentRank(null)
      setNextRank(null)
      setProgressToNextRank(0)
      localStorage.removeItem('codescape-auth')
      localStorage.removeItem(CACHE_KEY)
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    profileData,
    userProgress,
    currentRank,
    nextRank,
    progressToNextRank,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
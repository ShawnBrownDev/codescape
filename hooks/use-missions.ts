import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Mission {
  id: string
  title: string
  description: string
  xp_reward: number
  mission_type: 'daily' | 'weekly' | 'achievement'
  required_count: number
  simulation_id?: string
  time_requirement?: number
  rank_requirement?: number
  expires_at?: string
}

export interface UserMission {
  id: string
  mission_id: string
  progress: number
  completed: boolean
  completed_at?: string
}

export interface UserXP {
  total_xp: number
  current_level: number
}

export function useMissions() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [userMissions, setUserMissions] = useState<UserMission[]>([])
  const [userXP, setUserXP] = useState<UserXP>({ total_xp: 0, current_level: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('useMissions effect running, user:', user?.id)
    
    if (!user) {
      console.log('No user, skipping missions fetch')
      setLoading(false)
      return
    }

    const fetchMissions = async () => {
      try {
        console.log('Fetching missions data...')
        setLoading(true)
        setError(null)

        // Fetch active missions
        const { data: missionsData, error: missionsError } = await supabase
          .from('missions')
          .select('*')
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

        if (missionsError) {
          console.error('Error fetching missions:', missionsError)
          throw missionsError
        }

        console.log('Missions fetched:', missionsData?.length)

        // Fetch user's mission progress
        const { data: userMissionsData, error: userMissionsError } = await supabase
          .from('user_missions')
          .select('*')
          .eq('user_id', user.id)

        if (userMissionsError) {
          console.error('Error fetching user missions:', userMissionsError)
          throw userMissionsError
        }

        console.log('User missions fetched:', userMissionsData?.length)

        // Fetch user's XP
        const { data: userXPData, error: userXPError } = await supabase
          .from('user_xp')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // Only throw XP error if it's not a "no rows returned" error
        if (userXPError && userXPError.code !== 'PGRST116') {
          console.error('Error fetching user XP:', userXPError)
          throw userXPError
        }

        console.log('User XP fetched:', userXPData)

        setMissions(missionsData || [])
        setUserMissions(userMissionsData || [])
        setUserXP(userXPData || { total_xp: 0, current_level: 1 })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        console.error('Error in fetchMissions:', errorMessage)
        setError(errorMessage)
        // Don't let errors prevent the app from loading
        setMissions([])
        setUserMissions([])
        setUserXP({ total_xp: 0, current_level: 1 })
      } finally {
        console.log('Fetch missions complete, setting loading false')
        setLoading(false)
      }
    }

    fetchMissions()

    // Subscribe to real-time updates
    const userMissionsSubscription = supabase
      .channel('user_missions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_missions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('User missions update received:', payload)
          fetchMissions()
        }
      )
      .subscribe()

    const userXPSubscription = supabase
      .channel('user_xp_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_xp',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('User XP update received:', payload)
          fetchMissions()
        }
      )
      .subscribe()

    return () => {
      console.log('Cleaning up subscriptions')
      userMissionsSubscription.unsubscribe()
      userXPSubscription.unsubscribe()
    }
  }, [user])

  const updateMissionProgress = async (missionId: string) => {
    if (!user) {
      console.log('No user, cannot update mission progress')
      return
    }

    try {
      console.log('Updating mission progress:', missionId)
      const { data, error } = await supabase.rpc('complete_mission', {
        p_user_id: user.id,
        p_mission_id: missionId
      })

      if (error) {
        console.error('Error updating mission progress:', error)
        throw error
      }

      console.log('Mission progress updated:', data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      console.error('Error in updateMissionProgress:', errorMessage)
      setError(errorMessage)
      return null
    }
  }

  const getMissionProgress = (missionId: string) => {
    const userMission = userMissions.find(um => um.mission_id === missionId)
    return {
      progress: userMission?.progress || 0,
      completed: userMission?.completed || false,
      completedAt: userMission?.completed_at
    }
  }

  return {
    missions,
    userXP,
    loading,
    error,
    updateMissionProgress,
    getMissionProgress
  }
} 
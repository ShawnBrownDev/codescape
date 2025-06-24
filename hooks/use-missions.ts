import { useEffect, useState, useRef } from 'react'
import { supabaseInstance } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { RealtimeChannel } from '@supabase/supabase-js'

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
  created_at: string
  expires_at?: string
}

export interface UserMission {
  id: string
  user_id: string
  mission_id: string
  progress: number
  completed: boolean
  completed_at?: string
  created_at: string
}

export interface UserXP {
  user_id: string
  total_xp: number
  current_level: number
  created_at: string
  updated_at: string
}

export function useMissions() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [userMissions, setUserMissions] = useState<UserMission[]>([])
  const [userXP, setUserXP] = useState<UserXP>({ 
    user_id: '',
    total_xp: 0, 
    current_level: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Create refs for subscriptions
  const userMissionsChannelRef = useRef<RealtimeChannel | null>(null)
  const userXPChannelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!user) {
      return
    }

    const fetchData = async () => {
      setLoading(true)

      // Fetch missions
      const { data: missionsData, error: missionsError } = await supabaseInstance
        .from('missions')
        .select('*')

      if (missionsError) {
        console.error('Error fetching missions:', missionsError)
        return
      }

      setMissions(missionsData as Mission[] || [])

      // Fetch user missions
      const { data: userMissionsData, error: userMissionsError } = await supabaseInstance
        .from('user_missions')
        .select('*')
        .eq('user_id', user.id)

      if (userMissionsError) {
        console.error('Error fetching user missions:', userMissionsError)
        return
      }

      setUserMissions(userMissionsData as UserMission[] || [])

      // Fetch user XP
      const { data: userXPData, error: userXPError } = await supabaseInstance
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (userXPError && userXPError.code !== 'PGRST116') {
        console.error('Error fetching user XP:', userXPError)
        return
      }

      if (!userXPData) {
        // Create initial XP record if it doesn't exist
        const { data: newXPData, error: createError } = await supabaseInstance
          .from('user_xp')
          .upsert([{
            user_id: user.id,
            total_xp: 0,
            current_level: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }], {
            onConflict: 'user_id'
          })
          .select()
          .single()

        if (createError && createError.code !== '23505') { // Ignore duplicate key errors
          console.error('Error creating initial XP record:', createError)
          return
        }

        setUserXP(newXPData as UserXP || {
          user_id: user.id,
          total_xp: 0,
          current_level: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      } else {
        setUserXP(userXPData as UserXP)
      }
      setLoading(false)
    }

    fetchData()

    // Subscribe to user missions changes
    userMissionsChannelRef.current = supabaseInstance
      .channel('user_missions_changes')
      .on<UserMission>(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'user_missions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: { new: UserMission }) => {
          setUserMissions((current) => {
            const updated = [...current]
            const index = updated.findIndex((m) => m.id === payload.new.id)
            if (index !== -1) {
              updated[index] = payload.new
            } else {
              updated.push(payload.new)
            }
            return updated
          })
        }
      )
      .subscribe()

    // Subscribe to user XP changes
    userXPChannelRef.current = supabaseInstance
      .channel('user_xp_changes')
      .on<UserXP>(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'user_xp',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: { new: UserXP }) => {
          setUserXP(payload.new)
        }
      )
      .subscribe()

    return () => {
      if (userMissionsChannelRef.current) {
        userMissionsChannelRef.current.unsubscribe()
      }
      if (userXPChannelRef.current) {
        userXPChannelRef.current.unsubscribe()
      }
    }
  }, [user]) // Remove supabase from dependencies

  const updateMissionProgress = async (missionId: string) => {
    if (!user) {
      return
    }

    const { data, error } = await supabaseInstance.rpc('complete_mission', {
      p_user_id: user.id,
      p_mission_id: missionId,
    })

    if (error) {
      console.error('Error updating mission progress:', error)
      return
    }

    return data
  }

  const getMissionProgress = (missionId: string) => {
    return userMissions.find((um) => um.mission_id === missionId)
  }

  return {
    missions,
    userMissions,
    userXP,
    loading,
    error,
    updateMissionProgress,
    getMissionProgress,
  }
} 
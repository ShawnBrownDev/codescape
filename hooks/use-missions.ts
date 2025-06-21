import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!user) {
      return
    }

    const fetchData = async () => {
      setLoading(true)

      // Fetch missions
      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select('*')

      if (missionsError) {
        console.error('Error fetching missions:', missionsError)
        return
      }

      setMissions(missionsData as Mission[] || [])

      // Fetch user missions
      const { data: userMissionsData, error: userMissionsError } = await supabase
        .from('user_missions')
        .select('*')
        .eq('user_id', user.id)

      if (userMissionsError) {
        console.error('Error fetching user missions:', userMissionsError)
        return
      }

      setUserMissions(userMissionsData as UserMission[] || [])

      // Fetch user XP
      const { data: userXPData, error: userXPError } = await supabase
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
        const { data: newXPData, error: createError } = await supabase
          .from('user_xp')
          .insert([{
            user_id: user.id,
            total_xp: 0,
            current_level: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating initial XP record:', createError)
          return
        }

        setUserXP(newXPData as UserXP)
      } else {
        setUserXP(userXPData as UserXP)
      }
      setLoading(false)
    }

    fetchData()

    // Subscribe to user missions changes
    const userMissionsSubscription = supabase
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
    const userXPSubscription = supabase
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
      userMissionsSubscription.unsubscribe()
      userXPSubscription.unsubscribe()
    }
  }, [user, supabase])

  const updateMissionProgress = async (missionId: string) => {
    if (!user) {
      return
    }

    const { data, error } = await supabase.rpc('complete_mission', {
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
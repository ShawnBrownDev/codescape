'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Mail, Calendar, Terminal, Shield, Upload, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
import { initializeRanks } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { calculateRankFromDB, calculateProgress, formatXP, type RankInfo, fetchRanks } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import type { AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { createClientComponentClient, type SupabaseClient } from '@supabase/auth-helpers-nextjs'

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row']
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

interface UserProfileData extends UserProfileRow {}

interface UserXP {
  total_xp: number
  current_level: number
}

interface UserMissions {
  completed_count: number
}

interface UserProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  xp: number
  rank: string
  created_at: string
}

interface RealtimePayload {
  new: { xp: number }
  old: { xp: number }
}

interface UserProgressPayload {
  id: number;
  user_id: string;
  completed_challenges: number[];
  unlocked_skills: string[];
  total_xp: number;
  current_rank: number;
  created_at: string;
  updated_at: string;
}

type UserProgress = Database['public']['Tables']['user_progress']['Row']

// Helper functions
function getDisplayNameFromProfile(profile: UserProfileData | null): string {
  if (!profile) return 'Anonymous'
  return profile.display_name || profile.username || 'Anonymous'
}

function getInitialsFromProfile(profile: UserProfileData | null): string {
  if (!profile) return 'A'
  const name = profile.display_name || profile.username || 'A'
  return name[0].toUpperCase()
}

function getAvatarUrlFromProfile(profile: UserProfileData | null): string | undefined {
  if (!profile?.avatar_url) return undefined;
  
  try {
    // Extract just the path part after /avatars/
    const match = profile.avatar_url.match(/\/avatars\/(.+)$/);
    if (!match) return profile.avatar_url;
    
    return `${profile.avatar_url}?v=${Date.now()}`;
  } catch (error) {
    console.error('Error processing avatar URL:', error);
    return profile.avatar_url;
  }
}

export default function UserProfile() {
  const { user, signOut } = useAuth()
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [userXP, setUserXP] = useState<UserXP | null>(null)
  const [missionCount, setMissionCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [currentRank, setCurrentRank] = useState<RankInfo | null>(null)
  const [nextRank, setNextRank] = useState<RankInfo | null>(null)
  const [progressToNextRank, setProgressToNextRank] = useState<number>(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // Create refs to store channel instances and previous values
  const xpChannelRef = useRef<RealtimeChannel | null>(null)
  const missionsChannelRef = useRef<RealtimeChannel | null>(null)
  const previousXPRef = useRef<number>(0)
  const animationFrameRef = useRef<number>()
  const isMounted = useRef(true)
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  // Create a single Supabase client instance
  const supabase = useMemo(() => createClientComponentClient<Database>(), [])

  // Cleanup function for channels
  const cleanup = useCallback(() => {
    xpChannelRef.current?.unsubscribe()
    missionsChannelRef.current?.unsubscribe()
    channelRef.current?.unsubscribe()
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const animateXPChange = useCallback((startXP: number, endXP: number) => {
    const startTime = performance.now()
    const duration = 1000 // Animation duration in milliseconds
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentXP = Math.floor(startXP + (endXP - startXP) * progress)
      
      setUserXP(prev => prev ? {
        ...prev,
        total_xp: currentXP
      } : {
        total_xp: currentXP,
        current_level: 1
      })
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setIsUpdating(false)
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [])

  const updateRankInfo = useCallback(async (xp: number, animate: boolean = false) => {
    try {
      const ranks = await fetchRanks();
      if (!ranks.length) return; // Return early if no ranks available

      const currentRankInfo = ranks.find(rank => xp >= rank.min_xp && xp <= rank.max_xp);
      if (!currentRankInfo) return;

      const nextRankInfo = ranks.find(rank => rank.level === currentRankInfo.level + 1) || null;
      
      // If animating, smoothly update the progress
      if (animate) {
        setIsUpdating(true)
        animateXPChange(previousXPRef.current, xp)
      } else {
        setUserXP(prev => prev ? {
          ...prev,
          total_xp: xp
        } : {
          total_xp: xp,
          current_level: currentRankInfo.level
        })
      }
      
      previousXPRef.current = xp
      
      setCurrentRank(currentRankInfo)
      setNextRank(nextRankInfo)
      setProgressToNextRank(calculateProgress(xp, currentRankInfo, nextRankInfo))

      // Show rank up notification if rank changed
      if (currentRank && currentRankInfo.level > currentRank.level) {
        toast({
          title: "Rank Up!",
          description: `Congratulations! You've reached ${currentRankInfo.title}!`,
          variant: "default",
          className: "bg-green-950 border-green-500 text-green-400",
        })
      }
    } catch (error) {
      console.error('Error updating rank info:', error)
      setIsUpdating(false)
    }
  }, [currentRank, toast, animateXPChange])

  const fetchUserProfile = useCallback(async () => {
    // Add early return if not mounted or no user
    if (!isMounted.current || !user?.id) {
      setLoading(false);
      return;
    }

    const maxRetries = 3;
    let retryCount = 0;
    
    const fetchWithRetry = async () => {
      try {
        // First verify we have an active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setLoading(false);
          return; // Just return silently if no session
        }

        // Check if still mounted after session check
        if (!isMounted.current) {
          return;
        }

        // Fetch user profile data first
        const { data: fetchedProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // Not found is ok
          throw profileError;
        }

        // Now fetch progress data
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Check if still mounted after progress fetch
        if (!isMounted.current) {
          return;
        }

        if (progressError) {
          if (progressError.code === 'PGRST116') { // Not found
            // Create initial progress record
            const { data: newProgress, error: createError } = await supabase
              .from('user_progress')
              .insert({
                user_id: user.id,
                completed_challenges: [],
                unlocked_skills: ['basic-syntax'],
                total_xp: 0,
                current_rank: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (createError) throw createError;

            if (newProgress) {
              setUserXP({
                total_xp: newProgress.total_xp,
                current_level: newProgress.current_rank
              });
              setMissionCount(newProgress.completed_challenges.length);
              await updateRankInfo(newProgress.total_xp);
            }
          } else if (progressError.code === 'ERR_INSUFFICIENT_RESOURCES' && retryCount < maxRetries) {
            // If we hit a resource error, wait and retry
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            return await fetchWithRetry();
          } else {
            throw progressError;
          }
        } else if (progressData) {
          setUserXP({
            total_xp: progressData.total_xp,
            current_level: progressData.current_rank
          });
          setMissionCount(progressData.completed_challenges.length);
          await updateRankInfo(progressData.total_xp);
        }

        // Set profile data from user_profiles table if it exists, otherwise use auth data
        if (fetchedProfile) {
          setProfileData(fetchedProfile);
        } else {
          // Create initial profile
          const initialProfile: UserProfileInsert = {
            id: user.id,
            username: user.email?.split('@')[0] || 'Operator',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            display_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert(initialProfile)
            .select()
            .single();

          if (newProfile) {
            setProfileData(newProfile);
          }
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
        if (retryCount < maxRetries && error instanceof Error && error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
          // If we hit a resource error, wait and retry
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          return await fetchWithRetry();
        }
        throw error;
      }
    };

    try {
      await fetchWithRetry();
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      toast({
        title: "Error",
        description: "Failed to load your profile data. Please try refreshing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, updateRankInfo, toast, supabase]);

  useEffect(() => {
    // Set isMounted to true when the component mounts
    isMounted.current = true;
    
    if (user) {
      // Clean up existing subscriptions before setting up new ones
      cleanup();
      
      // Only proceed if still mounted
      if (isMounted.current) {
        fetchUserProfile();
      }

      // Only set up subscriptions if still mounted
      if (isMounted.current) {
        // Create new channel for XP with optimistic updates
        xpChannelRef.current = supabase.channel(`user_xp_${user.id}`)
        xpChannelRef.current
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_xp',
            filter: `user_id=eq.${user.id}`
          }, async (payload) => {
            if (payload.new && isMounted.current) {
              const newXP = payload.new as UserXP;
              await updateRankInfo(newXP.total_xp, true);
            }
          })
          .subscribe();

        // Create new channel for missions with optimistic updates
        missionsChannelRef.current = supabase.channel(`user_missions_${user.id}`)
        missionsChannelRef.current
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_missions',
            filter: `user_id=eq.${user.id}`
          }, async (payload) => {
            if (!isMounted.current) return;
            
            if (payload.eventType === 'INSERT' && payload.new.completed) {
              setMissionCount(prev => prev + 1);
            }
          })
          .subscribe();
      }
    } else {
      // Reset state when user is not available
      setProfileData(null);
      setUserXP(null);
      setCurrentRank(null);
      setNextRank(null);
      setProgressToNextRank(0);
      setMissionCount(0);
      setLoading(false);
    }

    // Cleanup function
    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, [user, cleanup, fetchUserProfile, updateRankInfo, supabase]);

  const handleSignOut = async () => {
    if (loading) return; // Prevent multiple clicks
    
    try {
      setLoading(true);
      
      // Immediately mark as unmounted and reset all state
      isMounted.current = false;
      
      // Cancel any pending requests
      cleanup();
      
      // Reset all state synchronously
      setProfileData(null);
      setUserXP(null);
      setCurrentRank(null);
      setNextRank(null);
      setProgressToNextRank(0);
      setMissionCount(0);
      
      // Sign out
      const { error } = await signOut();
      
      // Redirect regardless of error (unless it's a network error)
      router.push('/');
      
      // Only show error for actual failures
      if (error && error.message !== 'Auth session missing!') {
        console.error('Error signing out:', error);
      }
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
    }
  };

  const isValidProfileData = (data: UserProfileData | null): data is UserProfileData => {
    return data !== null
  }

  const getDisplayName = useCallback((): string => {
    return getDisplayNameFromProfile(profileData)
  }, [profileData])

  const getInitials = useCallback((): string => {
    return getInitialsFromProfile(profileData)
  }, [profileData])

  const getAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    // Ensure we're using the direct storage URL format
    if (!url.includes('/storage/v1/object/public/')) {
      const parts = url.split('/avatars/')
      if (parts.length === 2) {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${parts[1]}`
      }
    }
    return url
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  // Update the XP display in the UI
  const XPDisplay = ({ xp, currentRank, nextRank, progress }: { 
    xp: number, 
    currentRank: RankInfo | null,
    nextRank: RankInfo | null,
    progress: number 
  }) => (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-xs text-green-400">
        <span>{formatXP(xp)} XP</span>
        <span>{formatXP(nextRank?.min_xp || 0)} XP needed for {nextRank?.title || 'Next Level'}</span>
      </div>
      <Progress value={progress} className="h-1 bg-black">
        <div 
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </Progress>
      <div className="flex justify-between text-xs">
        <span className="text-green-400">Operator Level {currentRank?.level || 1}</span>
        <span className="text-green-400">Operator Level {(currentRank?.level || 1) + 1}</span>
      </div>
    </div>
  );

  // Add real-time subscription to user_progress
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user_progress_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${user.id}`
        },
        async (payload: RealtimePostgresChangesPayload<UserProgress>) => {
          if (payload.eventType === 'DELETE') return;
          
          const newData = payload.new;
          setUserXP({
            total_xp: newData.total_xp,
            current_level: newData.current_rank
          });
          setMissionCount(newData.completed_challenges.length);
          await updateRankInfo(newData.total_xp);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, updateRankInfo, supabase]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6">
          <div className="animate-pulse space-y-4">
          <div className="h-20 w-20 bg-green-900/30 rounded-full mx-auto"></div>
          <div className="h-4 bg-green-900/30 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-green-900/30 rounded w-1/2 mx-auto"></div>
        </div>
          </div>
    );
  }

  if (!currentRank) {
    return (
      <div className="p-6">
        <div className="text-center text-green-400">
          Initializing profile data...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-sm space-y-4">
      <div className="flex items-start space-x-3">
        <Avatar className="h-12 w-12 border-2 border-green-500">
          <AvatarImage 
            src={getAvatarUrlFromProfile(profileData) || undefined} 
            alt={getDisplayNameFromProfile(profileData)} 
          />
          <AvatarFallback className="bg-black text-green-500">
            {getInitialsFromProfile(profileData)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-green-500">
              {getDisplayNameFromProfile(profileData)}
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-sm text-green-400">
            <Terminal className="w-4 h-4" />
            <span>{missionCount} Missions</span>
            <Shield className="w-4 h-4 ml-2" />
            <span>Operator Level {currentRank?.level || 1}</span>
          </div>
        </div>
      </div>

      {userXP && currentRank && (
        <XPDisplay
          xp={userXP.total_xp}
          currentRank={currentRank}
          nextRank={nextRank}
          progress={progressToNextRank}
        />
      )}

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center text-green-400">
          <Mail className="w-4 h-4 mr-2" />
          <span>{user?.email}</span>
        </div>
        <div className="flex items-center text-green-400">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Joined {profileData?.created_at ? formatDate(profileData.created_at) : 'Unknown'}</span>
        </div>
        <div className="flex items-center text-green-400">
          <Terminal className="w-4 h-4 mr-2" />
          <span>Basic Training</span>
        </div>
        <div className="flex items-center text-green-400">
          <Shield className="w-4 h-4 mr-2" />
          <span>Novice Operator</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full mt-2 border-red-500 text-red-500 hover:bg-red-950/30"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Terminate Session
      </Button>
    </div>
  );
}
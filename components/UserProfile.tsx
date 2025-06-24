'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Mail, Calendar, Terminal, Shield, Upload, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
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

type UserProgress = Database['public']['Tables']['user_progress']['Row']

interface ProgressChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: UserProgress
  old: UserProgress | null
  schema: 'public'
  table: 'user_progress'
  commit_timestamp: string
  errors: null | unknown[]
}

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
    
    const fetchWithRetry = async (): Promise<{
      profile: UserProfileData | null;
      progress: UserProgress | null;
    }> => {
      try {
        // First verify we have an active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setLoading(false);
          return { profile: null, progress: null }; // Just return silently if no session
        }

        // Check if still mounted after session check
        if (!isMounted.current) {
          return { profile: null, progress: null };
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
          return { profile: null, progress: null };
        }

        if (progressError) {
          if (progressError.code === 'PGRST116') { // Not found
            // Create initial progress record
            const { data: newProgress, error: createError } = await supabase
              .from('user_progress')
              .upsert([{
                user_id: user.id,
                completed_challenges: [],
                unlocked_skills: [],
                total_xp: 0,
                current_rank: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }], {
                onConflict: 'user_id'
              })
              .select()
              .single();

            if (createError) {
              throw createError;
            }

            return { profile: fetchedProfile, progress: newProgress };
          }
          throw progressError;
        }

        return { profile: fetchedProfile, progress: progressData };
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return fetchWithRetry();
        }
        throw error;
      }
    };

    try {
      const { profile, progress } = await fetchWithRetry();
      if (profile) {
        setProfileData(profile);
      }
      if (progress) {
        setUserXP({
          total_xp: progress.total_xp,
          current_level: progress.current_rank
        });
        setMissionCount(progress.completed_challenges.length);
        await updateRankInfo(progress.total_xp);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, updateRankInfo]);

  useEffect(() => {
    fetchUserProfile();

    // Subscribe to user progress changes
    if (user?.id) {
      channelRef.current = supabase
        .channel('user_progress_changes')
        .on('postgres_changes' as any, {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${user.id}`,
        }, async (payload: { eventType: string; new: UserProgress | null; old: UserProgress | null }) => {
          if (payload.eventType === 'DELETE') return;
          
          const newData = payload.new;
          if (newData) {
            setUserXP({
              total_xp: newData.total_xp,
              current_level: newData.current_rank
            });
            setMissionCount(newData.completed_challenges.length);
            await updateRankInfo(newData.total_xp, true);
          }
        })
        .subscribe();
    }

    return () => {
      cleanup();
      isMounted.current = false;
    };
  }, [user, cleanup, fetchUserProfile, updateRankInfo]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isValidProfileData = (data: UserProfileData | null): data is UserProfileData => {
    return data !== null;
  };

  const getAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${url}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const XPDisplay = ({ xp, currentRank, nextRank, progress }: { 
    xp: number, 
    currentRank: RankInfo | null,
    nextRank: RankInfo | null,
    progress: number 
  }) => (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-green-400" />
          <span className="text-sm font-mono text-green-400">
            {currentRank?.title || 'Loading...'}
          </span>
        </div>
        <span className="text-sm font-mono text-green-400">
          {formatXP(xp)} XP
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      {nextRank && (
        <div className="flex justify-between mt-1">
          <span className="text-xs font-mono text-green-500/70">
            Current: {formatXP(currentRank?.min_xp || 0)} XP
          </span>
          <span className="text-xs font-mono text-green-500/70">
            Next: {formatXP(nextRank.min_xp)} XP
          </span>
        </div>
      )}
    </div>
  );

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 border-2 border-green-500/30">
            <AvatarImage
              src={getAvatarUrl(profileData?.avatar_url)}
              alt={getDisplayNameFromProfile(profileData)}
            />
            <AvatarFallback className="bg-green-900/20 text-green-400">
              {getInitialsFromProfile(profileData)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-mono text-green-400">
              {getDisplayNameFromProfile(profileData)}
            </h2>
            <p className="text-sm font-mono text-green-500/70">
              Joined {profileData ? formatDate(profileData.created_at) : 'Loading...'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="font-mono text-xs border-green-500/30 text-green-400 hover:bg-green-950/50"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Sign Out
        </Button>
      </div>

      {userXP && currentRank && (
        <XPDisplay
          xp={userXP.total_xp}
          currentRank={currentRank}
          nextRank={nextRank}
          progress={progressToNextRank}
        />
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-green-400" />
        </div>
      )}
    </div>
  );
}
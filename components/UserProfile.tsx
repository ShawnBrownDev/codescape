'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Mail, Calendar, Terminal, Shield, Upload, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { calculateRankFromDB, calculateProgress, formatXP, type RankInfo, fetchRanks } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import type { AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface UserProfileData {
  username: string
  avatar_url: string | null
  created_at: string
}

interface UserXP {
  total_xp: number
  current_level: number
}

interface UserMissions {
  completed_count: number
}

export const UserProfile = () => {
  const { user, signOut } = useAuth()
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [userXP, setUserXP] = useState<UserXP>({ total_xp: 0, current_level: 1 })
  const [missionCount, setMissionCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [currentRank, setCurrentRank] = useState<RankInfo | null>(null)
  const [nextRank, setNextRank] = useState<RankInfo | null>(null)
  const [progressToNextRank, setProgressToNextRank] = useState<number>(0)
  const [uploading, setUploading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // Create refs to store channel instances and previous values
  const xpChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const missionsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const previousXPRef = useRef<number>(0)
  const animationFrameRef = useRef<number>()

  const animateXPChange = useCallback((startXP: number, endXP: number) => {
    const duration = 1000 // 1 second animation
    const startTime = performance.now()
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentXP = Math.floor(startXP + (endXP - startXP) * easeOutQuart)
      
      setUserXP(prev => ({ ...prev, total_xp: currentXP }))
      
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
      const currentRankInfo = ranks.find(rank => xp >= rank.min_xp && xp <= rank.max_xp);
      if (!currentRankInfo) return;

      const nextRankInfo = ranks.find(rank => rank.level === currentRankInfo.level + 1) || null;
      
      // If animating, smoothly update the progress
      if (animate) {
        setIsUpdating(true)
        animateXPChange(previousXPRef.current, xp)
      } else {
        setUserXP(prev => ({ ...prev, total_xp: xp }))
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
    if (!user?.id) return;
    
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('username, avatar_url, created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch XP data
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('total_xp, current_level')
        .eq('user_id', user.id)
        .single();

      if (xpError) throw xpError;

      // Fetch completed missions count
      const { count: missionsCount, error: missionsError } = await supabase
        .from('user_missions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('completed', true);

      if (missionsError) throw missionsError;

      if (profileData) {
        setProfileData(profileData);
      }
      
      if (xpData) {
        setUserXP(xpData);
        await updateRankInfo(xpData.total_xp);
      }

      setMissionCount(missionsCount || 0);

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, updateRankInfo]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();

      // Clean up existing subscriptions
      if (xpChannelRef.current) {
        xpChannelRef.current.unsubscribe();
      }
      if (missionsChannelRef.current) {
        missionsChannelRef.current.unsubscribe();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // Create new channel for XP with optimistic updates
      xpChannelRef.current = supabase.channel(`user_xp_${user.id}`)
      xpChannelRef.current
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_xp',
          filter: `user_id=eq.${user.id}`
        }, async (payload) => {
          if (payload.new) {
            const newXP = payload.new as UserXP
            await updateRankInfo(newXP.total_xp, true) // Animate the change
          }
        })
        .subscribe()

      // Create new channel for missions with optimistic updates
      missionsChannelRef.current = supabase.channel(`user_missions_${user.id}`)
      missionsChannelRef.current
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_missions',
          filter: `user_id=eq.${user.id}`
        }, async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.completed) {
            // Optimistically update mission count
            setMissionCount(prev => prev + 1)
          }
          
          // Verify count in background
          const { count } = await supabase
            .from('user_missions')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('completed', true)
          
          setMissionCount(count || 0)
        })
        .subscribe()

      return () => {
        // Clean up subscriptions and animations
        if (xpChannelRef.current) {
          xpChannelRef.current.unsubscribe()
          xpChannelRef.current = null
        }
        if (missionsChannelRef.current) {
          missionsChannelRef.current.unsubscribe()
          missionsChannelRef.current = null
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
  }, [user, fetchUserProfile, updateRankInfo])

  const handleSignOut = async () => {
    if (loading) return; // Prevent multiple clicks
    
    try {
      setLoading(true)
      const { error } = await signOut()
      
      if (error && error.message !== 'Auth session missing!') {
        toast({
          title: "Error",
          description: error.message || "Failed to terminate session. Please try again.",
          variant: "destructive",
        })
        console.error('Error signing out:', error)
        return;
      }

      // If successful or if session was already missing, redirect to home
      router.push('/')
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      console.error('Unexpected error during sign out:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = () => {
    // First try GitHub username from metadata
    const githubUsername = user?.user_metadata?.user_name || user?.user_metadata?.preferred_username
    // Then try profile username
    const profileUsername = profileData?.username
    // Then try email username
    const emailUsername = user?.email?.split('@')[0]
    // Finally fallback to 'Operator'
    return githubUsername || profileUsername || emailUsername || 'Operator'
  }

  const getInitials = () => {
    const displayName = getDisplayName()
    return displayName.substring(0, 2).toUpperCase()
  }

  const getAvatarUrl = () => {
    // First try profile avatar
    const profileAvatar = profileData?.avatar_url
    // Then try GitHub avatar from metadata
    const githubAvatar = user?.user_metadata?.avatar_url
    return profileAvatar || githubAvatar || ''
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif']
      
      if (!allowedTypes.includes(fileExt)) {
        throw new Error('File type not supported. Please upload a JPG, PNG, or GIF image.')
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Please upload an image smaller than 5MB.')
      }

      // Create a folder with the user's ID and store the file there
      const filePath = `${user?.id}/${Math.random()}.${fileExt}`

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update the user profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, avatar_url: publicUrl } : null)

      toast({
        title: "Success!",
        description: "Your profile photo has been updated.",
        variant: "default",
      })

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive",
      })
      console.error('Error uploading avatar:', error)
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    try {
      if (!user?.id || !profileData?.avatar_url) return;

      setUploading(true);

      // Get the file path from the URL
      const url = new URL(profileData.avatar_url);
      const filePath = url.pathname.split('/avatars/')[1];

      if (!filePath) {
        throw new Error('Invalid avatar URL');
      }

      // Delete the file from storage
      const { error: deleteStorageError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteStorageError) {
        throw deleteStorageError;
      }

      // Update the user profile to remove the avatar_url
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, avatar_url: null } : null);

      toast({
        title: "Success!",
        description: "Your profile photo has been removed.",
        variant: "default",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove avatar",
        variant: "destructive",
      });
      console.error('Error removing avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  // Update the XP display in the UI
  const XPDisplay = ({ xp }: { xp: number }) => (
    <div className={cn(
      "text-2xl font-bold text-emerald-400",
      isUpdating && "transition-all duration-200"
    )}>
      {formatXP(xp)}
    </div>
  )

  if (!user || !currentRank) return null

  if (loading) {
    return (
      <div className="p-6">
          <div className="animate-pulse space-y-4">
          <div className="h-20 w-20 bg-green-900/30 rounded-full mx-auto"></div>
          <div className="h-4 bg-green-900/30 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-green-900/30 rounded w-1/2 mx-auto"></div>
        </div>
          </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-black/40 rounded-lg border border-green-500/20">
      <div className="flex items-center space-x-6 mb-8">
        <div className="relative group">
          <Avatar className="h-24 w-24 ring-2 ring-green-500/20 ring-offset-2 ring-offset-black transition-all duration-300 group-hover:ring-green-500/40">
            <AvatarImage src={getAvatarUrl()} />
            <AvatarFallback className="bg-green-900/20 text-green-400">{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={uploadAvatar}
                disabled={uploading}
              />
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-black/60 backdrop-blur-sm border-green-500/30 hover:bg-green-900/20 transition-colors duration-200"
                disabled={uploading}
              >
                <Upload className="h-4 w-4 text-green-400" />
              </Button>
            </div>
            {profileData?.avatar_url && (
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-black/60 backdrop-blur-sm border-red-500/30 hover:bg-red-900/20 transition-colors duration-200"
                onClick={removeAvatar}
                disabled={uploading}
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-400 mb-1">{getDisplayName()}</h2>
          <p className="text-sm font-medium" style={{ color: currentRank.level === 1 ? 'rgb(52, 211, 153)' : // emerald-400
                                                              currentRank.level === 2 ? 'rgb(34, 211, 238)' : // cyan-400
                                                              currentRank.level === 3 ? 'rgb(232, 121, 249)' : // fuchsia-400
                                                              currentRank.level === 4 ? 'rgb(251, 191, 36)' : // amber-400
                                                              currentRank.level === 5 ? 'rgb(251, 113, 133)' : // rose-400
                                                              currentRank.level === 6 ? 'rgb(167, 139, 250)' : // violet-400
                                                              'rgb(255, 255, 255)' // white for level 7
          }}>{currentRank.title}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="bg-black/40 rounded-lg p-3 border border-green-500/10">
            <div className="text-2xl font-bold text-emerald-400">{missionCount}</div>
            <div className="text-xs text-emerald-500/70 mt-1">MISSIONS</div>
          </div>
          <div className="bg-black/40 rounded-lg p-3 border border-green-500/10">
            <XPDisplay xp={userXP.total_xp} />
            <div className="text-xs text-emerald-500/70 mt-1">XP</div>
          </div>
          <div className="bg-black/40 rounded-lg p-3 border border-green-500/10">
            <div className="text-2xl font-bold" style={{ color: currentRank.level === 1 ? 'rgb(52, 211, 153)' : // emerald-400
                                                                 currentRank.level === 2 ? 'rgb(34, 211, 238)' : // cyan-400
                                                                 currentRank.level === 3 ? 'rgb(232, 121, 249)' : // fuchsia-400
                                                                 currentRank.level === 4 ? 'rgb(251, 191, 36)' : // amber-400
                                                                 currentRank.level === 5 ? 'rgb(251, 113, 133)' : // rose-400
                                                                 currentRank.level === 6 ? 'rgb(167, 139, 250)' : // violet-400
                                                                 'rgb(255, 255, 255)' // white for level 7
            }}>{currentRank.level}</div>
            <div className="text-xs text-emerald-500/70 mt-1">RANK</div>
          </div>
        </div>

        <div className="space-y-2 bg-black/40 rounded-lg p-4 border border-green-500/10">
          <div className="flex justify-between text-xs mb-3">
            <span className="font-medium" style={{ color: currentRank.level === 1 ? 'rgb(52, 211, 153)' : // emerald-400
                                                         currentRank.level === 2 ? 'rgb(34, 211, 238)' : // cyan-400
                                                         currentRank.level === 3 ? 'rgb(232, 121, 249)' : // fuchsia-400
                                                         currentRank.level === 4 ? 'rgb(251, 191, 36)' : // amber-400
                                                         currentRank.level === 5 ? 'rgb(251, 113, 133)' : // rose-400
                                                         currentRank.level === 6 ? 'rgb(167, 139, 250)' : // violet-400
                                                         'rgb(255, 255, 255)' // white for level 7
            }}>{currentRank.title}</span>
            <span className="text-emerald-400">
              {formatXP(userXP.total_xp - currentRank.min_xp)} / {formatXP(currentRank.max_xp - currentRank.min_xp)} XP
            </span>
          </div>
          <div className="relative h-2 bg-green-900/20 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500/50 to-green-400 transition-all duration-500"
              style={{ width: `${progressToNextRank}%` }}
            />
          </div>
          {nextRank && (
            <div className="text-xs text-right mt-2">
              <span className="text-emerald-400/70">Next: </span>
              <span style={{ color: nextRank.level === 1 ? 'rgb(52, 211, 153)' : // emerald-400
                                   nextRank.level === 2 ? 'rgb(34, 211, 238)' : // cyan-400
                                   nextRank.level === 3 ? 'rgb(232, 121, 249)' : // fuchsia-400
                                   nextRank.level === 4 ? 'rgb(251, 191, 36)' : // amber-400
                                   nextRank.level === 5 ? 'rgb(251, 113, 133)' : // rose-400
                                   nextRank.level === 6 ? 'rgb(167, 139, 250)' : // violet-400
                                   'rgb(255, 255, 255)' // white for level 7
              }}>{nextRank.title}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm text-emerald-500/70 bg-black/40 rounded-lg p-4 border border-green-500/10">
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            {user.email}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Joined {formatDate(profileData?.created_at || user.created_at)}
          </div>
          <div className="flex items-center">
            <Terminal className="h-4 w-4 mr-2" />
            Basic Training
          </div>
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Novice Operator
          </div>
        </div>
        
        <Button
          variant="outline"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/20 border-red-500/30 transition-colors duration-200"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Terminate Session
        </Button>
      </div>
    </div>
  );
};
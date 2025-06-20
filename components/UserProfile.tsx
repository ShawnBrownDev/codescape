'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  const [userXP, setUserXP] = useState<UserXP | null>(null)
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
  const isMounted = useRef(true)

  // Cleanup function
  const cleanup = useCallback(() => {
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
  }, [])

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
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      // First verify we have an active session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setLoading(false);
        return; // Just return silently if no session
      }

      // Now fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('username, avatar_url, created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        if (profileError.code === 'PGRST116') { // Not found
          setLoading(false);
          return;
        }
        throw profileError;
      }

      // If no profile data exists, create it
      if (!profileData) {
        // Generate base username
        let baseUsername = user.user_metadata?.user_name || 
                         user.user_metadata?.preferred_username || 
                         user.email?.split('@')[0] || 
                         'Operator';
        
        let username = baseUsername;
        let attempt = 1;
        let profileCreated = false;
        
        // Try to create profile with increasingly numbered usernames until success
        while (!profileCreated && attempt <= 10) {
          try {
            const { data: newProfileData, error: createProfileError } = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                username: username,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('username, avatar_url, created_at')
              .single();

            if (!createProfileError) {
              setProfileData(newProfileData);
              profileCreated = true;
            } else if (createProfileError.code === '23505') { // Unique constraint violation
              // Try next username
              username = `${baseUsername}${attempt}`;
              attempt++;
            } else {
              throw createProfileError;
            }
          } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
              // Continue the loop for duplicate username
              continue;
            }
            throw error;
          }
        }

        if (!profileCreated) {
          throw new Error('Failed to create profile after multiple attempts');
        }
      } else {
        setProfileData(profileData);
      }

      // Fetch XP data
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('total_xp, current_level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (xpError && xpError.code !== 'PGRST116') {
        console.error('XP fetch error:', xpError);
        throw xpError;
      }

      // If no XP record exists, create one
      if (!xpData) {
        const { data: newXpData, error: createXpError } = await supabase
          .from('user_xp')
          .insert({
            user_id: user.id,
            total_xp: 0,
            current_level: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('total_xp, current_level')
          .single();

        if (createXpError) {
          console.error('Error creating XP record:', createXpError);
          throw createXpError;
        }

        setUserXP(newXpData);
        await updateRankInfo(newXpData.total_xp);
      } else {
        setUserXP(xpData);
        await updateRankInfo(xpData.total_xp);
      }

      // Fetch completed missions count
      const { count: missionsCount, error: missionsError } = await supabase
        .from('user_missions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('completed', true);

      if (missionsError) {
        console.error('Missions count error:', missionsError);
        throw missionsError;
      }

      setMissionCount(missionsCount || 0);
      setLoading(false);

    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      toast({
        title: "Error",
        description: error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : "Failed to load profile data. Please refresh the page.",
        variant: "destructive",
      });

      // If we get an authentication error, redirect to sign in
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' &&
          (error.message.includes('sign in') || error.message.includes('authentication'))) {
        router.push('/auth/error');
      }
    }
  }, [user, updateRankInfo, toast, router]);

  useEffect(() => {
    // Set isMounted to true when the component mounts
    isMounted.current = true;
    
    if (user) {
      cleanup(); // Clean up existing subscriptions
      fetchUserProfile();

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
          if (!isMounted.current) return;
          
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
          
          if (isMounted.current) {
            setMissionCount(count || 0)
          }
        })
        .subscribe()
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
  }, [user, fetchUserProfile, cleanup]);

  const handleSignOut = async () => {
    if (loading) return; // Prevent multiple clicks
    
    try {
      setLoading(true)
      
      // Clean up subscriptions before signing out
      cleanup();
      
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
      if (isMounted.current) {
        setLoading(false);
      }
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

      // Create a unique file path under the user's folder
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`
      const filePath = `${user?.id}/${fileName}`

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
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (updateError) {
        // If profile update fails, try to delete the uploaded image
        await supabase.storage
          .from('avatars')
          .remove([filePath])
        throw updateError
      }

      // If there was a previous avatar, try to remove it
      if (profileData?.avatar_url) {
        try {
          const oldUrl = new URL(profileData.avatar_url)
          const oldPath = oldUrl.pathname.split('/avatars/')[1]
          if (oldPath && oldPath !== filePath) {
            await supabase.storage
              .from('avatars')
              .remove([oldPath])
          }
        } catch (error) {
          console.error('Error removing old avatar:', error)
          // Don't throw here as the new avatar was uploaded successfully
        }
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, avatar_url: publicUrl } : null)

      toast({
        title: "Success!",
        description: "Your profile photo has been updated.",
        variant: "default",
        className: "bg-green-950 border-green-500 text-green-400",
      })

    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 
                    error && typeof error === 'object' && 'message' in error ? String(error.message) :
                    "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
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
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
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
        className: "bg-green-950 border-green-500 text-green-400",
      });

    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 
                    error && typeof error === 'object' && 'message' in error ? String(error.message) :
                    "Failed to remove avatar. Please try again.",
        variant: "destructive",
      });
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
    <div className="p-6 space-y-6 bg-black/40 rounded-lg border border-green-500/20">
      <div className="flex items-center space-x-6 mb-8">
        <div className="relative group">
          <Avatar className="h-24 w-24 ring-2 ring-green-500/20 ring-offset-2 ring-offset-black transition-all duration-300 group-hover:ring-green-500/40">
            <AvatarImage src={getAvatarUrl()} />
            <AvatarFallback className="bg-green-950/50 text-green-500">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          {/* Avatar Upload Controls */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
            <div className="relative">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-black/80 border-green-500/50 hover:border-green-500"
                disabled={uploading}
              >
                <label className="cursor-pointer absolute inset-0 flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={uploadAvatar}
                    disabled={uploading}
                  />
                  <Upload className="h-4 w-4 text-green-500" />
                </label>
              </Button>
            </div>

            {profileData?.avatar_url && (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-black/80 border-red-500/50 hover:border-red-500"
                onClick={removeAvatar}
                disabled={uploading}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-2xl font-bold text-green-400">{getDisplayName()}</div>
          <div className="text-sm text-green-500/70">
            Joined {profileData?.created_at ? formatDate(profileData.created_at) : 'Recently'}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="bg-black/40 rounded-lg p-3 border border-green-500/10">
            <div className="text-2xl font-bold text-emerald-400">{missionCount}</div>
            <div className="text-xs text-emerald-500/70 mt-1">MISSIONS</div>
          </div>
          <div className="bg-black/40 rounded-lg p-3 border border-green-500/10">
            <XPDisplay xp={userXP?.total_xp || 0} />
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
              {formatXP(userXP?.total_xp ? userXP.total_xp - currentRank.min_xp : 0)} / {formatXP(currentRank.max_xp - currentRank.min_xp)} XP
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
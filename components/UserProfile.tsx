'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { XPDisplay } from './simulation/XPDisplay'
import type { Database } from '@/types/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

function getDisplayNameFromProfile(profile: UserProfile | null): string {
  if (!profile) return 'Loading...';
  return profile.display_name || profile.username || `${profile.first_name} ${profile.last_name}`;
}

function getInitialsFromProfile(profile: UserProfile | null): string {
  if (!profile) return 'A';
  if (profile.display_name) {
    return profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  }
  return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
}

export default function UserProfile() {
  const { 
    user, 
    loading: authLoading, 
    signOut,
    profileData,
    userProgress,
    currentRank,
    nextRank,
    progressToNextRank
  } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      setIsUpdating(true);
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      } else {
        router.push('/');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!user || !profileData || !currentRank) {
    return null;
  }

  const displayName = getDisplayNameFromProfile(profileData)
  const initials = getInitialsFromProfile(profileData)
  const missionCount = userProgress?.completed_challenges?.length || 0

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-black/20 rounded-lg backdrop-blur-sm border border-green-500/20">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20 border-2 border-green-500/50">
          <AvatarImage src={profileData.avatar_url || ''} />
          <AvatarFallback className="bg-green-500/10 text-green-500">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold text-green-500">{displayName}</h2>
          <p className="text-sm text-green-500/70">
            Joined {new Date(profileData.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <XPDisplay
        xp={userProgress?.total_xp || 0}
        currentRank={currentRank}
        nextRank={nextRank}
        progress={progressToNextRank}
      />

      <Button
        variant="outline"
        className="w-full border-green-500/20 hover:bg-green-500/10 hover:text-green-500"
        onClick={handleSignOut}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </>
        )}
      </Button>
    </div>
  )
}
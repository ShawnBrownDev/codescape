'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User, Mail, Calendar, Trophy, Clock, Target, Shield, Zap, Terminal } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface UserProfileData {
  first_name: string
  last_name: string
  email: string
  created_at: string
}

export const UserProfile = () => {
  const { user, signOut } = useAuth()
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // First try to fetch the existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email, created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfileData(data);
      } else {
        // Create a new profile using our function
        const { data: newProfile, error: createError } = await supabase
          .rpc('create_user_profile', {
            user_id: user.id,
            user_email: user.email || '',
            first_name: user.user_metadata?.first_name || null,
            last_name: user.user_metadata?.last_name || null
          });

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          setProfileData(newProfile);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user, fetchUserProfile])

  const handleSignOut = async () => {
    await signOut()
  }

  const getDisplayName = () => {
    // First try to get name from profile data
    if (profileData) {
      return `${profileData.first_name} ${profileData.last_name}`.trim()
    }
    
    // Then try to get from GitHub metadata
    if (user?.app_metadata?.provider === 'github') {
      // Get the username part from the email (before the @)
      const emailUsername = user?.email?.split('@')[0] || '';
      // Remove any development/gmail parts if they exist
      return emailUsername.replace('development', '').replace('gmail', '').replace('.com', '').trim();
    }
    
    // Finally fall back to email username or default
    return user?.email?.split('@')[0] || 'Operator'
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!user) return null

  if (loading) {
    return (
      <Card className="backdrop-blur-lg bg-black/40 border-green-500/20 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 bg-green-900/30 rounded-full mx-auto"></div>
            <div className="h-4 bg-green-900/30 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-green-900/30 rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="backdrop-blur-lg bg-black/40 border-green-500/20 shadow-[0_0_15px_rgba(0,255,0,0.1)] overflow-hidden">
      <CardContent className="p-6">
        {/* Profile Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
              <User className="h-8 w-8 text-green-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-black flex items-center justify-center">
              <span className="text-xs text-black font-bold">1</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-mono text-green-400">{getDisplayName()}</h2>
            <p className="text-sm font-mono text-green-500/70">Operator Level 1</p>
            <p className="text-xs font-mono text-green-500/50">{user?.email}</p>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="text-center p-2 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="text-lg font-mono text-green-400">0</div>
            <div className="text-xs font-mono text-green-500/70">MISSIONS</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="text-lg font-mono text-green-400">0</div>
            <div className="text-xs font-mono text-green-500/70">XP</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="text-lg font-mono text-green-400">1</div>
            <div className="text-xs font-mono text-green-500/70">RANK</div>
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 text-sm font-mono">
            <Mail className="h-4 w-4 text-green-500/70" />
            <span className="text-green-400">{user.email}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm font-mono">
            <Calendar className="h-4 w-4 text-green-500/70" />
            <span className="text-green-400">Joined June 2023</span>
          </div>
          <div className="flex items-center space-x-3 text-sm font-mono">
            <Terminal className="h-4 w-4 text-green-500/70" />
            <span className="text-green-400">Basic Training</span>
          </div>
          <div className="flex items-center space-x-3 text-sm font-mono">
            <Trophy className="h-4 w-4 text-green-500/70" />
            <span className="text-green-400">Novice Operator</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full font-mono border-green-500/30 text-green-400 hover:bg-green-500/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Terminate Session
        </Button>
      </CardContent>
    </Card>
  )
}
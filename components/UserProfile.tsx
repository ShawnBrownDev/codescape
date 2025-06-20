'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User, Mail, Calendar, Trophy, Clock, Target } from 'lucide-react'
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
        console.log('No profile found, creating one...');
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
      <Card className="backdrop-blur-lg bg-white/5 border-purple-500/20 shadow-2xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 bg-gray-700 rounded-full mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="backdrop-blur-lg bg-white/5 border-purple-500/20 shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-20 w-20 ring-4 ring-purple-500/30">
            <AvatarImage src={user.user_metadata?.avatar_url} alt="Profile" />
            <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-semibold">
              {profileData 
                ? getInitials(profileData.first_name, profileData.last_name)
                : getInitials(user.email?.substring(0, 1) || 'E', user.email?.substring(1, 2) || 'A')
              }
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {profileData 
            ? `${profileData.first_name} ${profileData.last_name}`
            : 'Escape Artist'
          }
        </CardTitle>
        <p className="text-gray-400 text-sm">Ready for the next challenge?</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {profileData && (
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
              <User className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-gray-300">Full Name</p>
                <p className="text-sm text-gray-400">{profileData.first_name} {profileData.last_name}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
            <Mail className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-sm font-medium text-gray-300">Email</p>
              <p className="text-sm text-gray-400">{profileData?.email || user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
            <Calendar className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-sm font-medium text-gray-300">Member Since</p>
              <p className="text-sm text-gray-400">
                {profileData?.created_at 
                  ? formatDate(profileData.created_at)
                  : formatDate(user.created_at)
                }
              </p>
            </div>
          </div>
        </div>

        {/* Player Stats */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Player Stats</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Trophy className="h-4 w-4 text-purple-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">0</div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Clock className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">--</div>
              <div className="text-xs text-gray-400">Best Time</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <Target className="h-4 w-4 text-pink-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">0</div>
              <div className="text-xs text-gray-400">Total Score</div>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 hover:text-red-300 transition-all duration-300"
          size="lg"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Exit Game
        </Button>
      </CardContent>
    </Card>
  )
}
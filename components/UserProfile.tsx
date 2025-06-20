'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Mail, Calendar, Terminal, Shield, Upload, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface UserProfileData {
  username: string
  avatar_url: string | null
  created_at: string
}

export const UserProfile = () => {
  const { user, signOut } = useAuth()
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username, avatar_url, created_at')
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
            user_email: user.email || ''
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
    return profileData?.username || user?.email?.split('@')[0] || 'Operator';
  }

  const getInitials = () => {
    const displayName = getDisplayName();
    const parts = displayName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
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

  if (!user) return null

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
    <div className="p-6 space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <Avatar className="h-24 w-24 mb-4">
            {profileData?.avatar_url ? (
              <AvatarImage src={profileData.avatar_url} />
            ) : (
              <AvatarFallback className="bg-green-900/30 text-green-400 text-xl">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="absolute -bottom-2 right-0 flex gap-2">
            <label 
              htmlFor="avatar-upload" 
              className="p-1.5 rounded-full bg-green-900/30 cursor-pointer hover:bg-green-900/50 transition-colors"
              title="Upload photo"
            >
              <Upload className="h-4 w-4 text-green-400" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {profileData?.avatar_url && (
              <button
                onClick={removeAvatar}
                disabled={uploading}
                className="p-1.5 rounded-full bg-green-900/30 cursor-pointer hover:bg-green-900/50 transition-colors"
                title="Remove photo"
              >
                <Trash2 className="h-4 w-4 text-green-400" />
              </button>
            )}
          </div>
        </div>
        <h2 className="text-xl font-bold text-green-400 mb-1">{getDisplayName()}</h2>
        <p className="text-green-500/70 text-sm mb-4">Operator Level 1</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">0</div>
            <div className="text-xs text-green-500/70">MISSIONS</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">0</div>
            <div className="text-xs text-green-500/70">XP</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">1</div>
            <div className="text-xs text-green-500/70">RANK</div>
          </div>
        </div>

        <div className="space-y-3 text-sm text-green-500/70">
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
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-green-500/30 text-green-400 hover:bg-green-900/20"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Terminate Session
        </Button>
      </div>
    </div>
  )
}
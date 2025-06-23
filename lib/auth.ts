import type { User } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { supabase } from './supabase'
import { initializeRanks } from './supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type AuthUser = User | null
type Tables = Database['public']['Tables']
type UserProgress = Tables['user_progress']['Row']
type UserProgressInsert = Tables['user_progress']['Insert']
type UserProgressUpdate = Tables['user_progress']['Update']
type UserXP = Tables['user_xp']['Insert']

export async function updateUserProgress(
  userId: string,
  completedChallengeId: number,
  unlockedSkills: string[],
  earnedXP: number
) {
  try {
    // Get current user progress
    const { data: existingProgress, error: fetchError } = await supabase
      .from('user_progress')
      .select()
      .match({ user_id: userId })
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw fetchError
    }

    const progress = existingProgress as UserProgress | null
    const newTotalXP = (progress?.total_xp ?? 0) + earnedXP
    
    // Get user's new rank based on total XP
    const { data: ranks } = await supabase
      .from('ranks')
      .select()
      .lte('min_xp', newTotalXP)
      .gte('max_xp', newTotalXP)
      .single()

    const newRank = (ranks as Tables['ranks']['Row'] | null)?.level ?? 1

    const newProgress: UserProgressInsert = {
      user_id: userId,
      completed_challenges: [
        ...(progress?.completed_challenges ?? []),
        completedChallengeId
      ],
      unlocked_skills: [
        ...(progress?.unlocked_skills ?? []),
        ...unlockedSkills
      ].filter((value, index, self) => self.indexOf(value) === index), // Remove duplicates
      total_xp: newTotalXP,
      current_rank: newRank,
      updated_at: new Date().toISOString()
    }

    if (!existingProgress) {
      // Create new progress record
      const { error: insertError } = await supabase
        .from('user_progress')
        .insert([newProgress])

      if (insertError) throw insertError
    } else {
      // Update existing progress
      const updateData: UserProgressUpdate = {
        completed_challenges: newProgress.completed_challenges,
        unlocked_skills: newProgress.unlocked_skills,
        total_xp: newProgress.total_xp,
        current_rank: newProgress.current_rank,
        updated_at: newProgress.updated_at
      }

      const { error: updateError } = await supabase
        .from('user_progress')
        .update(updateData)
        .eq('user_id', userId)

      if (updateError) throw updateError
    }

    return {
      success: true,
      data: newProgress
    }
  } catch (error) {
    console.error('Error updating user progress:', error)
    return {
      success: false,
      error
    }
  }
}

export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, metadata: { first_name: string; last_name: string }) => {
    try {
      if (!metadata?.first_name?.trim() || !metadata?.last_name?.trim()) {
        return { 
          data: null, 
          error: { message: 'First name and last name are required' } 
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata.first_name.trim(),
            last_name: metadata.last_name.trim()
          }
        }
      })

      if (error) {
        return { data: null, error };
      }

      // Return success without trying to create profile or XP record
      // These will be created on first sign in after email confirmation
      return { 
        data, 
        error: null,
        message: 'Please check your email to confirm your account before signing in.'
      };

    } catch (err) {
      console.error('Signup error:', err);
      return {
        data: null,
        error: { message: 'An unexpected error occurred during signup' }
      };
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        return { data: null, error };
      }

      // After successful sign in, ensure profile exists
      if (data.user) {
        try {
          // Check if profile exists
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select()
            .match({ id: data.user.id })
            .maybeSingle();

          if (profileError) {
            console.error('Error checking profile:', profileError);
          } else if (!profileData) {
            // Create profile if it doesn't exist
            const { error: createError } = await supabase.rpc('create_user_profile', {
              user_id: data.user.id,
              user_email: data.user.email || '',
              first_name: data.user.user_metadata?.first_name || null,
              last_name: data.user.user_metadata?.last_name || null,
              username: null // Let the function generate it from first and last name
            });

            if (createError) {
              console.error('Error creating profile:', createError);
            }
          }

          // Always try to upsert XP record
          const xpData: UserXP = {
            user_id: data.user.id,
            total_xp: 0,
            current_level: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { error: xpError } = await supabase
            .from('user_xp')
            .upsert(xpData)
            .match({ user_id: data.user.id })

          if (xpError && xpError.code !== '23505') { // Ignore duplicate key errors
            console.error('Error upserting XP record:', xpError);
          }

          // Initialize ranks if needed
          const { data: ranksData, error: ranksError } = await supabase
            .from('ranks')
            .select('count');

          if (ranksError) {
            console.error('Error checking ranks:', ranksError);
          } else if (!ranksData || ranksData.length === 0) {
            await initializeRanks();
          }
        } catch (err) {
          console.error('Error in profile initialization:', err);
        }
      }

      return { data, error }
    } catch (err) {
      console.error('Unexpected sign in error:', err);
      return {
        data: null,
        error: { 
          message: err instanceof Error ? err.message : 'An unexpected error occurred during sign in'
        }
      };
    }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  }
}

export async function createUserProfile(user: User) {
  try {
    // Extract first and last name from metadata
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    const fullName = user.user_metadata?.full_name;
    let [firstNameFromFull = '', lastNameFromFull = ''] = (fullName || '').split(' ');

    const { error } = await supabase.rpc('create_user_profile', {
      user_id: user.id,
      user_email: user.email || '',
      first_name: firstName || firstNameFromFull || null,
      last_name: lastName || lastNameFromFull || null,
      username: user.user_metadata?.user_name || user.user_metadata?.preferred_username,
      avatar_url: user.user_metadata?.avatar_url
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}
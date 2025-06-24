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

export async function initializeUserData(userId: string) {
  try {
    console.log('Starting user data initialization for:', userId);
    // First check if user progress exists
    const { data: existingProgress, error: checkError } = await supabase
      .from('user_progress')
      .select()
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking user progress:', checkError);
      return;
    }

    // If progress exists, no need to initialize
    if (existingProgress) {
      console.log('User progress already exists:', existingProgress);
      return;
    }

    console.log('No existing progress found, creating initial records...');
    // Create initial progress record with retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} to create user progress...`);
        const { error: createError } = await supabase
          .from('user_progress')
          .upsert([{
            user_id: userId,
            completed_challenges: [],
            unlocked_skills: [],
            total_xp: 0,
            current_rank: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }], {
            onConflict: 'user_id',
            ignoreDuplicates: true
          });

        if (!createError) {
          console.log('Successfully created user progress');
          break; // Success, exit the retry loop
        }

        console.error(`Error creating user progress (attempt ${retryCount + 1}):`, createError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      } catch (err) {
        console.error(`Unexpected error in user progress creation (attempt ${retryCount + 1}):`, err);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // Initialize ranks if needed
    console.log('Checking and initializing ranks...');
    await initializeRanks();
    console.log('User data initialization complete');
  } catch (err) {
    console.error('Error in initializeUserData:', err);
  }
}

export const auth = {
  // Sign up with email and password
  signUp: async (
    email: string,
    password: string,
    metadata: {
      first_name: string;
      last_name: string;
    }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        return {
          data: null,
          error,
          message: null,
        }
      }

      return {
        data,
        error: null,
        message: 'Please check your email to confirm your account before signing in.',
      }
    } catch (err) {
      console.error('Unexpected sign up error:', err)
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'An unexpected error occurred during sign up',
        },
        message: null,
      }
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
              first_name: data.user.user_metadata?.first_name || '',
              last_name: data.user.user_metadata?.last_name || '',
              username: null // Let the function generate it from first and last name
            });

            if (createError) {
              console.error('Error creating profile:', createError);
            }
          }

          // Initialize all user data with retry logic
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              await initializeUserData(data.user.id);
              break; // Success, exit the retry loop
            } catch (err) {
              console.error(`Error initializing user data (attempt ${retryCount + 1}):`, err);
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              }
            }
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
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import { initializeRanks } from './supabase'

export type AuthUser = User | null

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
            .select('*')
            .eq('id', data.user.id)
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
          const { error: xpError } = await supabase
            .from('user_xp')
            .upsert({
              user_id: data.user.id,
              total_xp: 0,
              current_level: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

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
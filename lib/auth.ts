import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

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
        console.error('Signup error:', error);
        return { data: null, error };
      }

      if (data.user) {
        // Create the user profile using our new function
        const { data: profileData, error: profileError } = await supabase
          .rpc('create_user_profile', {
            user_id: data.user.id,
            user_email: email,
            first_name: metadata.first_name.trim(),
            last_name: metadata.last_name.trim()
          });
        if (profileError) {
          console.error('Error creating profile:', profileError);
        } else {
          console.log('Profile created successfully:', profileData);
        }
      }

      return { data, error: null };
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      return {
        data: null,
        error: { message: 'An unexpected error occurred during signup' }
      };
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign in with GitHub
  signInWithGitHub: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    return { data, error }
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
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
          return { data: null, error: profileError };
        }
      }

      return { data, error: null };
    } catch (err) {
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
    try {
      const { data: authData, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
          scopes: 'read:user user:email',
        }
      })

      if (error) {
        console.error('GitHub auth error:', error)
        return { data: null, error }
      }

      // After successful GitHub auth, create/update user profile
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .rpc('create_user_profile', {
              user_id: user.id,
              user_email: user.email || '',
              username: user.user_metadata?.user_name || user.user_metadata?.preferred_username,
              avatar_url: user.user_metadata?.avatar_url
            });

          if (profileError) {
            console.error('Error creating GitHub user profile:', profileError);
          }
        } catch (err) {
          console.error('Error in GitHub profile creation:', err);
        }
      }

      return { data: authData, error: null }
    } catch (err: any) {
      console.error('Unexpected GitHub auth error:', err)
      return {
        data: null,
        error: { message: err.message || 'Failed to authenticate with GitHub' }
      }
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
    const { data: profileData, error } = await supabase.rpc('create_user_profile', {
      user_id: user.id,
      user_email: user.email || '',
      first_name: user.user_metadata?.first_name || null,
      last_name: user.user_metadata?.last_name || null
    });

    if (error) throw error;
    return profileData;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}
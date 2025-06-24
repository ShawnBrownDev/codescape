import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Create a single supabase client for interacting with your database
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    },
    db: {
      schema: 'public'
    }
  }
)

// Export the instance with an alias for components expecting supabaseInstance
export const supabaseInstance = supabase

// For components that need a client instance, return the singleton
export const createSupabaseClient = () => supabase

// Function to get all available challenges
export async function fetchAvailableChallenges() {
  try {
    const { data, error } = await supabase
      .from('matrix_challenges')
      .select('id')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching available challenges:', error);
      throw error;
    }
    
    return data?.map(c => c.id) || [];
  } catch (error) {
    console.error('Error in fetchAvailableChallenges:', error);
    throw error;
  }
}

// Export a function to get challenges that properly handles the response type
export async function fetchMatrixChallenge(challengeId: number) {
  try {
    // First try to get the requested challenge
    const { data, error } = await supabase
      .from('matrix_challenges')
      .select('*')
      .eq('id', challengeId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching challenge:', error);
      throw error;
    }
    
    // If challenge not found, get the first available challenge
    if (!data) {
      const { data: firstChallenge, error: firstError } = await supabase
        .from('matrix_challenges')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .single();
      
      if (firstError) {
        console.error('Error fetching first challenge:', firstError);
        throw firstError;
      }
      
      if (!firstChallenge) {
        throw new Error('No challenges available');
      }
      
      return firstChallenge;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchMatrixChallenge:', error);
    throw error;
  }
}

export async function initializeRanks() {
  const { error: createError } = await supabase.rpc('create_ranks_table');
  if (createError) {
    console.error('Error creating ranks table:', createError);
    return;
  }

  // Update ranks with proper colors and required challenges
  const { error: updateError } = await supabase
    .from('ranks')
    .upsert([
      { 
        level: 1, 
        title: 'Operator Level 1', 
        min_xp: 0, 
        max_xp: 999, 
        color: 'text-emerald-400',
        required_challenges: [1, 2, 3]
      },
      { 
        level: 2, 
        title: 'Operator Level 2', 
        min_xp: 1000, 
        max_xp: 2499, 
        color: 'text-cyan-400',
        required_challenges: [4, 5, 6]
      },
      { 
        level: 3, 
        title: 'Operator Level 3', 
        min_xp: 2500, 
        max_xp: 4999, 
        color: 'text-fuchsia-400',
        required_challenges: [7, 8, 9]
      },
      { 
        level: 4, 
        title: 'Senior Operator', 
        min_xp: 5000, 
        max_xp: 9999, 
        color: 'text-amber-400',
        required_challenges: [10, 11]
      },
      { 
        level: 5, 
        title: 'Matrix Controller', 
        min_xp: 10000, 
        max_xp: 19999, 
        color: 'text-rose-400',
        required_challenges: null
      },
      { 
        level: 6, 
        title: 'Matrix Architect', 
        min_xp: 20000, 
        max_xp: 49999, 
        color: 'text-violet-400',
        required_challenges: null
      },
      { 
        level: 7, 
        title: 'The One', 
        min_xp: 50000, 
        max_xp: 2147483647, 
        color: 'text-white',
        required_challenges: null
      }
    ], {
      onConflict: 'level'
    });

  if (updateError) {
    console.error('Error updating ranks:', updateError);
  }
}
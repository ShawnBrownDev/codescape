import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface RankInfo {
  level: number;
  title: string;
  min_xp: number;
  max_xp: number;
  color: string;
  required_challenges: number[] | null;
  created_at: string;
  updated_at: string;
}

async function initializeRanks() {
  const ranks = [
    { level: 1, title: 'Initiate', min_xp: 0, max_xp: 999, color: '#34D399' },
    { level: 2, title: 'Operator', min_xp: 1000, max_xp: 2499, color: '#22D3EE' },
    { level: 3, title: 'Agent', min_xp: 2500, max_xp: 4999, color: '#E879F9' },
    { level: 4, title: 'Sentinel', min_xp: 5000, max_xp: 9999, color: '#FBBF24' },
    { level: 5, title: 'Architect', min_xp: 10000, max_xp: 19999, color: '#FB7185' },
    { level: 6, title: 'Oracle', min_xp: 20000, max_xp: 49999, color: '#A78BFA' },
    { level: 7, title: 'The One', min_xp: 50000, max_xp: 999999, color: '#FFFFFF' }
  ];

  for (const rank of ranks) {
    const { error } = await supabase
      .from('ranks')
      .insert(rank)
      .select()
      .single();

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      console.error('Error initializing rank:', error);
      throw error;
    }
  }
}

export async function fetchRanks(): Promise<RankInfo[]> {
  try {
    // First check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return []; // Return empty array if no session instead of throwing
    }

    const { data, error } = await supabase
      .from('ranks')
      .select('*')
      .order('level', { ascending: true });

    if (error) {
      console.error('Error fetching ranks:', error);
      return []; // Return empty array on error
    }

    if (!data || data.length === 0) {
      // Try to initialize ranks
      await initializeRanks();

      // Retry fetching ranks after initialization
      const { data: retryData, error: retryError } = await supabase
        .from('ranks')
        .select('*')
        .order('level', { ascending: true });

      if (retryError || !retryData || retryData.length === 0) {
        console.error('Error retrying rank fetch:', retryError);
        return []; // Return empty array if retry fails
      }

      return retryData;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchRanks:', error);
    return []; // Return empty array on any other error
  }
}

export async function calculateRankFromDB(xp: number): Promise<RankInfo | null> {
  try {
    const { data, error } = await supabase
      .from('ranks')
      .select('*')
      .lte('min_xp', xp)
      .gte('max_xp', xp)
      .single();

    if (error) {
      console.error('Error calculating rank:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in calculateRankFromDB:', error);
    return null;
  }
}

export function calculateProgress(xp: number, currentRank: RankInfo | null, nextRank: RankInfo | null): number {
  if (!currentRank) return 0;
  if (!nextRank) return 100; // At max rank
  
  const xpInCurrentRank = xp - currentRank.min_xp;
  const totalXPInRank = currentRank.max_xp - currentRank.min_xp;
  return Math.min(100, Math.floor((xpInCurrentRank / totalXPInRank) * 100));
}

export function formatXP(xp: number): string {
  return new Intl.NumberFormat('en-US').format(xp);
}

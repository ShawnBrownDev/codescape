import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface RankInfo {
  id: number;
  level: number;
  title: string;
  min_xp: number;
  max_xp: number;
  color: string;
}

export async function fetchRanks(): Promise<RankInfo[]> {
  const { data, error } = await supabase
    .from('ranks')
    .select('*')
    .order('level', { ascending: true });

  if (error) {
    console.error('Error fetching ranks:', error);
    return [];
  }

  return data || [];
}

export async function calculateRankFromDB(xp: number): Promise<RankInfo | null> {
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
}

export function calculateProgress(xp: number, currentRank: RankInfo, nextRank: RankInfo | null): number {
  if (!nextRank) return 100;
  
  const xpInCurrentRank = xp - currentRank.min_xp;
  const totalXPInRank = currentRank.max_xp - currentRank.min_xp;
  return Math.min(100, Math.floor((xpInCurrentRank / totalXPInRank) * 100));
}

export function formatXP(xp: number): string {
  return new Intl.NumberFormat('en-US').format(xp);
}

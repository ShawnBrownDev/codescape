export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string
          first_name: string
          last_name: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          first_name: string
          last_name: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          first_name?: string
          last_name?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_xp: {
        Row: {
          user_id: string
          total_xp: number
          current_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          total_xp: number
          current_level: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_xp?: number
          current_level?: number
          created_at?: string
          updated_at?: string
        }
      }
      matrix_challenges: {
        Row: {
          id: number
          title: string
          description: string
          type: 'tutorial' | 'practice' | 'challenge' | 'boss'
          difficulty: number
          required_rank: number
          xp_reward: number
          requires_skills: string[]
          content: {
            explanation?: string
            example?: string
            starter_code?: string
            hints?: string[]
            test_cases?: {
              input: any[]
              expected: any
            }[]
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          description: string
          type: 'tutorial' | 'practice' | 'challenge' | 'boss'
          difficulty: number
          required_rank: number
          xp_reward: number
          requires_skills?: string[]
          content: {
            explanation?: string
            example?: string
            starter_code?: string
            hints?: string[]
            test_cases?: {
              input: any[]
              expected: any
            }[]
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string
          type?: 'tutorial' | 'practice' | 'challenge' | 'boss'
          difficulty?: number
          required_rank?: number
          xp_reward?: number
          requires_skills?: string[]
          content?: {
            explanation?: string
            example?: string
            starter_code?: string
            hints?: string[]
            test_cases?: {
              input: any[]
              expected: any
            }[]
          }
          created_at?: string
          updated_at?: string
        }
      }
      ranks: {
        Row: {
          level: number
          title: string
          min_xp: number
          max_xp: number
          color: string
          required_challenges: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          level: number
          title: string
          min_xp: number
          max_xp: number
          color: string
          required_challenges?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          level?: number
          title?: string
          min_xp?: number
          max_xp?: number
          color?: string
          required_challenges?: number[] | null
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: number
          user_id: string
          completed_challenges: number[]
          unlocked_skills: string[]
          total_xp: number
          current_rank: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          completed_challenges?: number[]
          unlocked_skills?: string[]
          total_xp?: number
          current_rank?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          completed_challenges?: number[]
          unlocked_skills?: string[]
          total_xp?: number
          current_rank?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 
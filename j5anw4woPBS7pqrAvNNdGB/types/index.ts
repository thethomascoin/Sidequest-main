/**
 * Type Definitions for Sidequest
 */

export interface UserProfile {
  id: string;
  username: string | null;
  email: string;
  player_class: string;
  level: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_quest_date: string | null;
  avatar_url: string | null;
  has_hero_pass: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Quest {
  id: string;
  user_id: string;
  quest_type: 'easy' | 'medium' | 'hard';
  title: string;
  description: string;
  xp_reward: number;
  difficulty: string;
  status: 'active' | 'completed' | 'expired';
  generated_at: string;
  expires_at: string;
  created_at: string;
}

export interface QuestCompletion {
  id: string;
  quest_id: string;
  user_id: string;
  proof_url: string;
  proof_type: 'photo' | 'video';
  ai_verified: boolean;
  ai_score: number | null;
  ai_comment: string | null;
  xp_awarded: number;
  completed_at: string;
  created_at: string;
}

export interface AIVerificationResult {
  success: boolean;
  xp_awarded: number;
  ai_comment: string;
}

export interface GeneratedQuest {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
}

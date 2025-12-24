/**
 * Quest Service - AI-powered quest generation and verification via Edge Functions
 */

import { getSupabaseClient } from '@/template';
import { GeneratedQuest } from '@/types';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface GenerateQuestsParams {
  playerClass: string;
  count: number;
}

interface VerifyQuestParams {
  questDescription: string;
  imageBase64: string;
}

/**
 * Generate daily quests using OnSpace AI via Edge Function
 */
export async function generateQuests({ playerClass, count }: GenerateQuestsParams): Promise<GeneratedQuest[]> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase.functions.invoke('generate-quests', {
      body: { playerClass, count },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const statusCode = error.context?.status ?? 500;
          const textContent = await error.context?.text();
          errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
        } catch {
          errorMessage = `${error.message || 'Failed to read response'}`;
        }
      }
      console.error('Quest generation error:', errorMessage);
      return getFallbackQuests(count);
    }

    return data || getFallbackQuests(count);
  } catch (error) {
    console.error('Quest generation error:', error);
    return getFallbackQuests(count);
  }
}

/**
 * Verify quest completion using AI vision via Edge Function
 */
export async function verifyQuestCompletion({ questDescription, imageBase64 }: VerifyQuestParams): Promise<{
  success: boolean;
  score: number;
  comment: string;
}> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase.functions.invoke('verify-quest', {
      body: { questDescription, imageBase64 },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const statusCode = error.context?.status ?? 500;
          const textContent = await error.context?.text();
          errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
        } catch {
          errorMessage = `${error.message || 'Failed to read response'}`;
        }
      }
      console.error('Quest verification error:', errorMessage);
      
      // Use fallback from error response if available
      if (data?.fallback) {
        return data.fallback;
      }
      
      return {
        success: true,
        score: 75,
        comment: 'AI verification unavailable. Quest completed on honor system! 🎯',
      };
    }

    return {
      success: data.success,
      score: data.score,
      comment: data.comment,
    };
  } catch (error) {
    console.error('Quest verification error:', error);
    
    return {
      success: true,
      score: 75,
      comment: 'AI verification unavailable. Quest completed on honor system! 🎯',
    };
  }
}

/**
 * Fallback quests when AI generation fails
 */
function getFallbackQuests(count: number): GeneratedQuest[] {
  const fallbackPool = [
    {
      title: 'Yellow Discovery',
      description: 'Find something yellow and take a photo of it',
      difficulty: 'easy' as const,
      xp_reward: 50,
    },
    {
      title: 'Cloud Gazer',
      description: 'Take a photo of an interesting cloud formation',
      difficulty: 'easy' as const,
      xp_reward: 50,
    },
    {
      title: 'Random Act of Kindness',
      description: 'Compliment a stranger and document it',
      difficulty: 'hard' as const,
      xp_reward: 200,
    },
    {
      title: 'Menu Roulette',
      description: 'Order something you have never tried before',
      difficulty: 'medium' as const,
      xp_reward: 100,
    },
    {
      title: 'Urban Explorer',
      description: 'Visit a place in your city you have never been to',
      difficulty: 'medium' as const,
      xp_reward: 100,
    },
  ];

  return fallbackPool.slice(0, count);
}

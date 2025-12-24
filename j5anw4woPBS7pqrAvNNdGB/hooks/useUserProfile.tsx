import { useState, useEffect } from 'react';
import { useAuth } from '@/template';
import { getSupabaseClient } from '@/template';
import { UserProfile } from '@/types';
import { LEVEL_CONFIG } from '@/constants/gameConfig';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { data: null, error: error.message };
    }
  };

  const addXP = async (xpAmount: number) => {
    if (!profile) return { error: 'No profile loaded' };

    const newTotalXP = profile.total_xp + xpAmount;
    const newLevel = LEVEL_CONFIG.calculateLevel(newTotalXP);
    const leveledUp = newLevel > profile.level;

    const updates = {
      total_xp: newTotalXP,
      level: newLevel,
    };

    const result = await updateProfile(updates);
    
    return {
      ...result,
      leveledUp,
      newLevel,
    };
  };

  const updateStreak = async () => {
    if (!profile) return { error: 'No profile loaded' };

    const today = new Date().toISOString().split('T')[0];
    const lastQuestDate = profile.last_quest_date;

    let newStreak = profile.current_streak;

    if (!lastQuestDate) {
      newStreak = 1;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastQuestDate === yesterdayStr) {
        newStreak = profile.current_streak + 1;
      } else if (lastQuestDate !== today) {
        newStreak = 1;
      }
    }

    const updates = {
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, profile.longest_streak),
      last_quest_date: today,
    };

    return await updateProfile(updates);
  };

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    addXP,
    updateStreak,
  };
}

import { useState, useEffect } from 'react';
import { useAuth } from '@/template';
import { getSupabaseClient } from '@/template';
import { Quest } from '@/types';
import { generateQuests } from '@/services/questService';
import { QUEST_CONFIG } from '@/constants/gameConfig';

export function useQuests() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (user) {
      fetchQuests();
    } else {
      setQuests([]);
      setLoading(false);
    }
  }, [user]);

  const fetchQuests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuests(data || []);
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyQuests = async (playerClass: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Check if user already has quests today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingQuests } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .eq('status', 'active');

      if (existingQuests && existingQuests.length >= QUEST_CONFIG.dailyQuestCount) {
        return { error: 'Daily quests already generated' };
      }

      // Generate new quests using AI
      const generatedQuests = await generateQuests({
        playerClass,
        count: QUEST_CONFIG.dailyQuestCount,
      });

      // Save to database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + QUEST_CONFIG.questExpirationHours);

      const questsToInsert = generatedQuests.map(q => ({
        user_id: user.id,
        quest_type: q.difficulty,
        title: q.title,
        description: q.description,
        xp_reward: q.xp_reward,
        difficulty: q.difficulty,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      }));

      const { data, error } = await supabase
        .from('quests')
        .insert(questsToInsert)
        .select();

      if (error) throw error;

      await fetchQuests();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error generating quests:', error);
      return { data: null, error: error.message };
    }
  };

  const completeQuest = async (questId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('quests')
        .update({ status: 'completed' })
        .eq('id', questId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchQuests();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error completing quest:', error);
      return { data: null, error: error.message };
    }
  };

  const getActiveQuests = () => {
    return quests.filter(q => q.status === 'active');
  };

  const getTodayQuests = () => {
    const today = new Date().toISOString().split('T')[0];
    return quests.filter(q => {
      const questDate = new Date(q.created_at).toISOString().split('T')[0];
      return questDate === today && q.status === 'active';
    });
  };

  return {
    quests,
    loading,
    fetchQuests,
    generateDailyQuests,
    completeQuest,
    getActiveQuests,
    getTodayQuests,
  };
}

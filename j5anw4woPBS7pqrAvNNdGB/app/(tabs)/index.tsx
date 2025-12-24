import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useQuests } from '@/hooks/useQuests';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdMob } from '@/hooks/useAdMob';
import { useAlert } from '@/template';
import { QuestCard } from '@/components/QuestCard';
import { Quest } from '@/types';
import { LEVEL_CONFIG } from '@/constants/gameConfig';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function QuestBoardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();
  const { quests, loading: questsLoading, generateDailyQuests, getTodayQuests } = useQuests();
  const { status, loading: subLoading } = useSubscription();
  const { showRewardedAd, isAdLoaded } = useAdMob();
  const { showAlert } = useAlert();
  const [generating, setGenerating] = useState(false);
  const [rerolling, setRerolling] = useState(false);

  const todayQuests = getTodayQuests();
  const hasHeroPass = status.subscribed;

  useEffect(() => {
    // Redirect to onboarding if no class selected
    if (profile && (!profile.player_class || profile.player_class === 'Wanderer') && !profileLoading) {
      router.replace('/onboarding');
    }
  }, [profile, profileLoading]);

  const handleGenerateQuests = async () => {
    if (!profile) return;
    
    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const { error } = await generateDailyQuests(profile.player_class);
    
    if (error) {
      console.error('Failed to generate quests:', error);
    }
    
    setGenerating(false);
  };

  const handleAcceptQuest = (quest: Quest) => {
    router.push({
      pathname: '/camera',
      params: { questId: quest.id, questTitle: quest.title, questDescription: quest.description },
    });
  };

  const handleRerollQuest = async (questId: string) => {
    if (hasHeroPass) {
      // Hero Pass users can reroll directly
      await rerollQuest(questId);
      return;
    }

    // Free users must watch an ad
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!isAdLoaded) {
      showAlert('Loading Ad', 'Please wait a few seconds for the ad to load, then try again.');
      return;
    }

    setRerolling(true);
    console.log('[QuestBoard] Showing rewarded ad...');
    const { success, error } = await showRewardedAd();
    console.log('[QuestBoard] Ad result:', { success, error });
    
    if (success) {
      await rerollQuest(questId);
      showAlert('Quest Rerolled!', 'Thanks for watching! Here is your new quest.');
    } else {
      showAlert('Ad Not Completed', error || 'Please watch the full ad to reroll your quest.');
    }
    
    setRerolling(false);
  };

  const rerollQuest = async (questId: string) => {
    if (!profile) return;

    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Delete the old quest
      const supabase = (await import('@/template')).getSupabaseClient();
      await supabase.from('quests').delete().eq('id', questId);

      // Generate a new quest
      const { generateQuests } = await import('@/services/questService');
      const newQuests = await generateQuests({
        playerClass: profile.player_class,
        count: 1,
      });

      if (newQuests.length > 0) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await supabase.from('quests').insert({
          user_id: profile.id,
          quest_type: newQuests[0].difficulty,
          title: newQuests[0].title,
          description: newQuests[0].description,
          xp_reward: newQuests[0].xp_reward,
          difficulty: newQuests[0].difficulty,
          status: 'active',
          expires_at: expiresAt.toISOString(),
        });

        // Refresh the quest list
        const { fetchQuests } = await import('@/hooks/useQuests');
      }
    } catch (error) {
      console.error('Error rerolling quest:', error);
      showAlert('Error', 'Failed to reroll quest. Please try again.');
    } finally {
      setGenerating(false);
      // Force refresh
      window.location.reload?.();
    }
  };

  if (profileLoading || questsLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.neonPurple} />
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  const levelProgress = LEVEL_CONFIG.getProgress(profile.total_xp, profile.level);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back, {profile.username || 'Hero'}!</Text>
          <View style={styles.levelContainer}>
            <Text style={styles.level}>Level {profile.level}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${levelProgress * 100}%` }]} />
            </View>
          </View>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statBadge}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statText}>{profile.current_streak}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statText}>{profile.total_xp}</Text>
          </View>
        </View>
      </View>

      {/* Quest Board */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY'S QUESTS</Text>
          {todayQuests.length === 0 && (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateQuests}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.generateButtonText}>GENERATE</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {todayQuests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎲</Text>
            <Text style={styles.emptyText}>No quests available</Text>
            <Text style={styles.emptySubtext}>Generate your daily quests to begin!</Text>
          </View>
        ) : (
          <View>
            {todayQuests.map(quest => (
              <View key={quest.id} style={styles.questContainer}>
                <QuestCard
                  quest={quest}
                  onAccept={handleAcceptQuest}
                />
                <TouchableOpacity
                  style={styles.rerollButton}
                  onPress={() => handleRerollQuest(quest.id)}
                  disabled={rerolling || generating}
                >
                  {rerolling ? (
                    <ActivityIndicator size="small" color={colors.neonYellow} />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color={colors.neonYellow} />
                      <Text style={styles.rerollText}>
                        {hasHeroPass ? 'REROLL' : 'REROLL (AD)'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontSize: typography.lg,
    color: colors.textPrimary,
    fontWeight: typography.semibold,
    marginBottom: spacing.xs,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  level: {
    fontSize: typography.base,
    color: colors.neonPurple,
    fontWeight: typography.bold,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.neonPurple,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  statIcon: {
    fontSize: typography.lg,
  },
  statText: {
    fontSize: typography.base,
    color: colors.textPrimary,
    fontWeight: typography.bold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.xl,
    fontWeight: typography.extrabold,
    color: colors.neonCyan,
    letterSpacing: 1,
  },
  generateButton: {
    backgroundColor: colors.neonPurple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  generateButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.xl,
    color: colors.textPrimary,
    fontWeight: typography.bold,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  questContainer: {
    marginBottom: spacing.lg,
  },
  rerollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 2,
    borderColor: colors.neonYellow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  rerollText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.neonYellow,
  },
});

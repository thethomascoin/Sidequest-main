import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Quest } from '@/types';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { QUEST_CONFIG } from '@/constants/gameConfig';
import * as Haptics from 'expo-haptics';

interface QuestCardProps {
  quest: Quest;
  onAccept: (quest: Quest) => void;
}

export function QuestCard({ quest, onAccept }: QuestCardProps) {
  const difficultyConfig = QUEST_CONFIG.difficulties[quest.quest_type as keyof typeof QUEST_CONFIG.difficulties];
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAccept(quest);
  };

  return (
    <View style={[styles.card, { borderColor: difficultyConfig.color }]}>
      <View style={styles.header}>
        <View style={styles.difficultyBadge}>
          <Text style={styles.difficultyIcon}>{difficultyConfig.icon}</Text>
          <Text style={[styles.difficultyText, { color: difficultyConfig.color }]}>
            {difficultyConfig.name.toUpperCase()}
          </Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{quest.xp_reward} XP</Text>
        </View>
      </View>

      <Text style={styles.title}>{quest.title}</Text>
      <Text style={styles.description}>{quest.description}</Text>

      <TouchableOpacity 
        style={[styles.acceptButton, { backgroundColor: difficultyConfig.color }]}
        onPress={handlePress}
      >
        <Text style={styles.acceptButtonText}>ACCEPT QUEST</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  difficultyIcon: {
    fontSize: typography.base,
  },
  difficultyText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    letterSpacing: 1,
  },
  xpBadge: {
    backgroundColor: colors.neonPurple,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  xpText: {
    color: colors.textPrimary,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  acceptButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: colors.textPrimary,
    fontSize: typography.base,
    fontWeight: typography.extrabold,
    letterSpacing: 1,
  },
});

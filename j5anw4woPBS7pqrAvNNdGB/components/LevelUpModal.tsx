import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  xpGained: number;
  onClose: () => void;
}

export function LevelUpModal({ visible, level, xpGained, onClose }: LevelUpModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Scale in animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();

      // Glow pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      glowAnim.setValue(0);
    }
  }, [visible]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const rewards = getRewards(level);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Rotating glow effect */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                opacity: glowOpacity,
                transform: [{ rotate: rotation }],
              },
            ]}
          />

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>LEVEL UP!</Text>
            
            <View style={styles.levelBadge}>
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <Ionicons name="star" size={64} color={colors.neonYellow} />
              </Animated.View>
              <Text style={styles.levelNumber}>{level}</Text>
            </View>

            <Text style={styles.congratsText}>Congratulations!</Text>
            <Text style={styles.xpText}>+{xpGained} XP Earned</Text>

            {/* Rewards */}
            <View style={styles.rewardsContainer}>
              <Text style={styles.rewardsTitle}>REWARDS UNLOCKED</Text>
              {rewards.map((reward, index) => (
                <View key={index} style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>{reward.icon}</Text>
                  <Text style={styles.rewardText}>{reward.text}</Text>
                </View>
              ))}
            </View>

            {/* Continue button */}
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>CONTINUE QUEST</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function getRewards(level: number): { icon: string; text: string }[] {
  const rewards = [
    { icon: '⭐', text: 'New Level Unlocked!' },
  ];

  // Add level-specific rewards
  if (level % 5 === 0) {
    rewards.push({ icon: '🎁', text: 'Bonus XP Multiplier' });
  }
  
  if (level % 10 === 0) {
    rewards.push({ icon: '🏆', text: 'Special Achievement Badge' });
  }

  if (level === 5) {
    rewards.push({ icon: '🎨', text: 'Custom Avatar Unlocked' });
  }

  if (level === 10) {
    rewards.push({ icon: '🌟', text: 'Elite Quests Available' });
  }

  if (level === 15) {
    rewards.push({ icon: '👑', text: 'Legendary Status' });
  }

  if (level >= 20) {
    rewards.push({ icon: '💎', text: 'Master Tier Rewards' });
  }

  return rewards;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: borderRadius.xxl,
    borderWidth: 3,
    borderColor: colors.neonPurple,
    shadowColor: colors.neonPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  content: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neonYellow,
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: typography.extrabold,
    color: colors.neonYellow,
    letterSpacing: 3,
    marginBottom: spacing.lg,
  },
  levelBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  levelNumber: {
    position: 'absolute',
    fontSize: typography.xxl,
    fontWeight: typography.extrabold,
    color: colors.textPrimary,
  },
  congratsText: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  xpText: {
    fontSize: typography.lg,
    color: colors.neonCyan,
    fontWeight: typography.semibold,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  rewardsContainer: {
    width: '100%',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.lg,
  },
  rewardsTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.neonCyan,
    letterSpacing: 1,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  rewardIcon: {
    fontSize: typography.xl,
  },
  rewardText: {
    fontSize: typography.base,
    color: colors.textPrimary,
    fontWeight: typography.semibold,
  },
  button: {
    backgroundColor: colors.neonPurple,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.base,
    fontWeight: typography.extrabold,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
});

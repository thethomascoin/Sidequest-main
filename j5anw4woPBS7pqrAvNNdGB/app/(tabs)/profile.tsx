import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth, useAlert } from '@/template';
import { PLAYER_CLASSES, PlayerClass, LEVEL_CONFIG } from '@/constants/gameConfig';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { status, loading: subLoading, createCheckout, openCustomerPortal } = useSubscription();
  const { logout } = useAuth();
  const { showAlert } = useAlert();

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const { error } = await logout();
    if (error) {
      showAlert('Error', error);
    }
  };

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const { error } = await createCheckout();
    if (error) {
      showAlert('Error', error);
    }
  };

  const handleManageSubscription = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await openCustomerPortal();
    if (error) {
      showAlert('Error', error);
    }
  };

  if (!profile) {
    return null;
  }

  const classInfo = PLAYER_CLASSES[profile.player_class as PlayerClass] || PLAYER_CLASSES.Wanderer;
  const levelProgress = LEVEL_CONFIG.getProgress(profile.total_xp, profile.level);
  const xpForNext = Math.floor(100 * Math.pow(1.15, profile.level - 1));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.neonPurple} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        {/* Player Card */}
        <View style={styles.playerCard}>
          <View style={styles.classIconContainer}>
            <Text style={styles.classIcon}>{classInfo.icon}</Text>
          </View>
          <Text style={styles.username}>{profile.username || profile.email}</Text>
          <Text style={styles.className}>{classInfo.name}</Text>
          <Text style={styles.classDescription}>{classInfo.description}</Text>
        </View>

        {/* Level Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEVEL PROGRESS</Text>
          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelText}>Level {profile.level}</Text>
              <Text style={styles.xpText}>{profile.total_xp} XP</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${levelProgress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.floor(levelProgress * xpForNext)} / {xpForNext} XP to next level
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STATISTICS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statValue}>{profile.current_streak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statValue}>{profile.longest_streak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statValue}>{profile.total_xp}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📈</Text>
              <Text style={styles.statValue}>{profile.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>
        </View>

        {/* Hero Pass Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {status.subscribed ? '⚡ HERO STATUS' : '🔒 UPGRADE'}
          </Text>
          {subLoading ? (
            <View style={styles.heroPassCard}>
              <ActivityIndicator size="large" color={colors.neonYellow} />
            </View>
          ) : status.subscribed ? (
            <View style={[styles.heroPassCard, styles.heroPassActive]}>
              <View style={styles.heroPassBadge}>
                <Text style={styles.heroPassBadgeText}>⚡ HERO PASS ACTIVE</Text>
              </View>
              <Text style={styles.heroPassActiveText}>
                You have unlimited access to all premium features!
              </Text>
              <View style={styles.benefitsList}>
                <Text style={styles.benefitItem}>✨ Unlimited daily quests</Text>
                <Text style={styles.benefitItem}>🎭 All player classes unlocked</Text>
                <Text style={styles.benefitItem}>🏆 Exclusive rewards & badges</Text>
                <Text style={styles.benefitItem}>🚀 Priority AI verification</Text>
              </View>
              {status.subscription_end && (
                <Text style={styles.subscriptionEndText}>
                  Renews on {new Date(status.subscription_end).toLocaleDateString()}
                </Text>
              )}
              <TouchableOpacity 
                style={styles.manageButton}
                onPress={handleManageSubscription}
              >
                <Text style={styles.manageButtonText}>MANAGE SUBSCRIPTION</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.heroPassCard}>
              <Text style={styles.heroPassTitle}>⚡ HERO PASS</Text>
              <Text style={styles.heroPassDescription}>
                Unlock unlimited quests, custom classes, and exclusive rewards
              </Text>
              <View style={styles.benefitsList}>
                <Text style={styles.benefitItem}>✨ Unlimited daily quests</Text>
                <Text style={styles.benefitItem}>🎭 All player classes unlocked</Text>
                <Text style={styles.benefitItem}>🏆 Exclusive rewards & badges</Text>
                <Text style={styles.benefitItem}>🚀 Priority AI verification</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>$2.99</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
              <TouchableOpacity 
                style={styles.heroPassButton}
                onPress={handleSubscribe}
              >
                <Text style={styles.heroPassButtonText}>SUBSCRIBE NOW</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: typography.extrabold,
    color: colors.neonCyan,
    letterSpacing: 2,
  },
  content: {
    padding: spacing.lg,
  },
  playerCard: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.neonPurple,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  classIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  classIcon: {
    fontSize: 48,
  },
  username: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  className: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.neonPurple,
    marginBottom: spacing.xs,
  },
  classDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.neonCyan,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  levelCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  levelText: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  xpText: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.neonPurple,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.neonPurple,
  },
  progressText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  heroPassCard: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.neonYellow,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroPassActive: {
    borderColor: colors.neonCyan,
    backgroundColor: colors.backgroundTertiary,
  },
  heroPassBadge: {
    backgroundColor: colors.neonYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  heroPassBadgeText: {
    color: colors.background,
    fontSize: typography.sm,
    fontWeight: typography.extrabold,
    letterSpacing: 1,
  },
  heroPassActiveText: {
    fontSize: typography.base,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  benefitsList: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  benefitItem: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    paddingLeft: spacing.sm,
  },
  heroPassTitle: {
    fontSize: typography.xxl,
    fontWeight: typography.extrabold,
    color: colors.neonYellow,
    marginBottom: spacing.sm,
  },
  heroPassDescription: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  heroPassButton: {
    backgroundColor: colors.neonYellow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  heroPassButtonText: {
    color: colors.background,
    fontSize: typography.base,
    fontWeight: typography.extrabold,
    letterSpacing: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  priceText: {
    fontSize: typography.xxxl,
    fontWeight: typography.extrabold,
    color: colors.neonYellow,
  },
  pricePeriod: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  subscriptionEndText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  manageButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.neonYellow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  manageButtonText: {
    color: colors.neonYellow,
    fontSize: typography.base,
    fontWeight: typography.extrabold,
    letterSpacing: 1,
  },
});

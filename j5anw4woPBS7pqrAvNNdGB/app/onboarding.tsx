import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { PLAYER_CLASSES, PlayerClass } from '@/constants/gameConfig';
import { useUserProfile } from '@/hooks/useUserProfile';
import * as Haptics from 'expo-haptics';

export default function OnboardingScreen() {
  const [selectedClass, setSelectedClass] = useState<PlayerClass>('Wanderer');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { updateProfile } = useUserProfile();

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await updateProfile({ player_class: selectedClass });
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>CHOOSE YOUR CLASS</Text>
          <Text style={styles.subtitle}>Select your playstyle</Text>
        </View>

        <View style={styles.classGrid}>
          {Object.entries(PLAYER_CLASSES).map(([key, classData]) => {
            const isSelected = selectedClass === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.classCard,
                  isSelected && styles.classCardSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedClass(key as PlayerClass);
                }}
              >
                <Text style={styles.classIcon}>{classData.icon}</Text>
                <Text style={styles.className}>{classData.name}</Text>
                <Text style={styles.classDescription}>{classData.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStart}
        >
          <Text style={styles.startButtonText}>START ADVENTURE</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: typography.extrabold,
    color: colors.neonPurple,
    marginBottom: spacing.sm,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  classGrid: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  classCard: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  classCardSelected: {
    borderColor: colors.neonPurple,
    backgroundColor: colors.backgroundTertiary,
  },
  classIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  className: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  classDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: colors.neonPurple,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.extrabold,
    letterSpacing: 1,
  },
});

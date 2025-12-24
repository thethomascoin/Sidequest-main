import { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { getSupabaseClient } from '@/template';
import { useAuth, useAlert } from '@/template';
import { useQuests } from '@/hooks/useQuests';
import { useUserProfile } from '@/hooks/useUserProfile';
import { verifyQuestCompletion } from '@/services/questService';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LevelUpModal } from '@/components/LevelUpModal';

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ questId: string; questTitle: string; questDescription: string }>();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { completeQuest } = useQuests();
  const { addXP, updateStreak, profile } = useUserProfile();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photo, setPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1, xpGained: 0 });
  const cameraRef = useRef<CameraView>(null);
  const supabase = getSupabaseClient();

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.neonPurple} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>GRANT PERMISSION</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      
      setPhoto(photo?.uri || null);
    } catch (error) {
      console.error('Error taking picture:', error);
      showAlert('Error', 'Failed to take picture');
    }
  };

  const retakePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhoto(null);
  };

  const submitQuest = async () => {
    if (!photo || !user || !params.questId) return;

    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Get base64 from photo
      const response = await fetch(photo);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      // Verify with AI
      console.log('Starting AI verification...');
      const verification = await verifyQuestCompletion({
        questDescription: params.questDescription,
        imageBase64: base64,
      });

      console.log('Verification result:', verification);

      if (!verification.success) {
        showAlert('Quest Failed', verification.comment || 'Try again with better proof!');
        setProcessing(false);
        return;
      }

      console.log('Quest verified successfully! XP to award:', verification.score);

      // Upload photo to storage
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('quest-proofs')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('quest-proofs')
        .getPublicUrl(fileName);

      // Save completion
      console.log('Saving quest completion to database...');
      const { error: completionError } = await supabase
        .from('quest_completions')
        .insert({
          quest_id: params.questId,
          user_id: user.id,
          proof_url: publicUrl,
          proof_type: 'photo',
          ai_verified: true,
          ai_score: verification.score,
          ai_comment: verification.comment,
          xp_awarded: verification.score,
        });

      if (completionError) {
        console.error('Completion insert error:', completionError);
        throw completionError;
      }

      console.log('Quest completion saved successfully');

      // Mark quest as completed
      console.log('Marking quest as completed...');
      await completeQuest(params.questId);

      // Award XP and update streak
      console.log('Awarding XP:', verification.score);
      const xpResult = await addXP(verification.score);
      console.log('XP result:', xpResult);
      
      console.log('Updating streak...');
      await updateStreak();
      console.log('Streak updated');

      const { leveledUp, newLevel } = xpResult || { leveledUp: false, newLevel: profile?.level || 1 };

      // Show success
      if (leveledUp) {
        setLevelUpData({ level: newLevel, xpGained: verification.score });
        setShowLevelUp(true);
      } else {
        showAlert('Quest Complete!', verification.comment);
        router.back();
      }
    } catch (error: any) {
      console.error('Error submitting quest:', error);
      showAlert('Error', error.message || 'Failed to submit quest');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseLevelUp = useCallback(() => {
    setShowLevelUp(false);
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={32} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.questInfo}>
          <Text style={styles.questTitle}>{params.questTitle}</Text>
          <Text style={styles.questDescription}>{params.questDescription}</Text>
        </View>
      </View>

      {/* Camera or Preview */}
      {!photo ? (
        <CameraView 
          ref={cameraRef}
          style={styles.camera} 
          facing={facing}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse" size={32} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <Image source={{ uri: photo }} style={styles.preview} />
      )}

      {/* Bottom Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.lg }]}>
        {!photo ? (
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        ) : (
          <View style={styles.reviewControls}>
            <TouchableOpacity 
              style={styles.retakeButton} 
              onPress={retakePhoto}
              disabled={processing}
            >
              <Text style={styles.retakeButtonText}>RETAKE</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, processing && styles.buttonDisabled]} 
              onPress={submitQuest}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.submitButtonText}>SUBMIT</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Level Up Modal */}
      <LevelUpModal
        visible={showLevelUp}
        level={levelUpData.level}
        xpGained={levelUpData.xpGained}
        onClose={handleCloseLevelUp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  permissionText: {
    fontSize: typography.lg,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: colors.neonPurple,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  permissionButtonText: {
    color: colors.textPrimary,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: colors.overlay,
    padding: spacing.lg,
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  questInfo: {
    gap: spacing.xs,
  },
  questTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  questDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: spacing.lg,
  },
  flipButton: {
    backgroundColor: colors.overlay,
    padding: spacing.md,
    borderRadius: borderRadius.full,
  },
  preview: {
    flex: 1,
    resizeMode: 'cover',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: spacing.lg,
    backgroundColor: colors.overlay,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.textPrimary,
  },
  reviewControls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  retakeButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retakeButtonText: {
    color: colors.textPrimary,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  submitButton: {
    backgroundColor: colors.neonPurple,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.textPrimary,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

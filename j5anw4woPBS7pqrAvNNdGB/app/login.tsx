import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth, useAlert } from '@/template';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const { sendOTP, verifyOTPAndLogin, signInWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const handleSendOTP = async () => {
    if (!email.trim()) {
      showAlert('Error', 'Please enter your email');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await sendOTP(email);
    
    if (error) {
      showAlert('Error', error);
      return;
    }
    
    setOtpSent(true);
    showAlert('Success', 'Verification code sent to your email');
  };

  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !otp.trim()) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const { error } = await verifyOTPAndLogin(email, otp, { password });
    
    if (error) {
      showAlert('Error', error);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Error', 'Please enter email and password');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const { error } = await signInWithPassword(email, password);
    
    if (error) {
      showAlert('Error', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>⚔️ SIDEQUEST</Text>
          <Text style={styles.tagline}>TURN LIFE INTO AN RPG</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!operationLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!operationLoading}
          />

          {mode === 'signup' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!operationLoading}
              />

              {!otpSent ? (
                <TouchableOpacity
                  style={[styles.secondaryButton, operationLoading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={operationLoading}
                >
                  <Text style={styles.secondaryButtonText}>
                    {operationLoading ? 'SENDING...' : 'SEND VERIFICATION CODE'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="Enter 4-digit code"
                  placeholderTextColor={colors.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={4}
                  editable={!operationLoading}
                />
              )}
            </>
          )}

          {/* Main Action Button */}
          <TouchableOpacity
            style={[styles.primaryButton, operationLoading && styles.buttonDisabled]}
            onPress={mode === 'login' ? handleLogin : handleSignup}
            disabled={operationLoading || (mode === 'signup' && !otpSent)}
          >
            <Text style={styles.primaryButtonText}>
              {operationLoading ? 'LOADING...' : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
            </Text>
          </TouchableOpacity>

          {/* Toggle Mode */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setOtpSent(false);
              setOtp('');
              setConfirmPassword('');
            }}
            disabled={operationLoading}
          >
            <Text style={styles.toggleText}>
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: typography.xxxl,
    fontWeight: typography.extrabold,
    color: colors.neonPurple,
    marginBottom: spacing.sm,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: typography.sm,
    color: colors.neonCyan,
    letterSpacing: 3,
    fontWeight: typography.semibold,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.base,
    color: colors.textPrimary,
    fontWeight: typography.medium,
  },
  primaryButton: {
    backgroundColor: colors.neonPurple,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.extrabold,
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.neonCyan,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.neonCyan,
    fontSize: typography.base,
    fontWeight: typography.bold,
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
});

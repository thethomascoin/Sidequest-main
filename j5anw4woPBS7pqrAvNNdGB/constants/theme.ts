/**
 * Sidequest Theme Configuration
 * Cyberpunk-lite dark mode with neon accents
 */

export const colors = {
  // Background
  background: '#0A0E1A',
  backgroundSecondary: '#111827',
  backgroundTertiary: '#1F2937',
  
  // Neon Accents
  neonPurple: '#A855F7',
  neonBlue: '#3B82F6',
  neonPink: '#EC4899',
  neonGreen: '#10B981',
  neonYellow: '#FBBF24',
  neonCyan: '#06B6D4',
  
  // Quest Difficulty Colors
  easyGlow: '#10B981',
  mediumGlow: '#FBBF24',
  hardGlow: '#EF4444',
  
  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#6B7280',
  
  // UI Elements
  border: '#374151',
  borderGlow: '#6366F1',
  success: '#10B981',
  error: '#EF4444',
  warning: '#FBBF24',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  cardOverlay: 'rgba(17, 24, 39, 0.9)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  // Font Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Font Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  }),
} as const;

export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  spring: {
    damping: 15,
    stiffness: 150,
  },
} as const;

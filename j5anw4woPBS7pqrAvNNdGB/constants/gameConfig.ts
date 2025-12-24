/**
 * RPG Game Configuration
 */

export const PLAYER_CLASSES = {
  Wanderer: {
    name: 'Wanderer',
    icon: '🎒',
    description: 'Balanced adventurer, ready for anything',
    questPreference: 'balanced',
  },
  Bard: {
    name: 'Bard',
    icon: '🎭',
    description: 'Master of social interactions',
    questPreference: 'social',
  },
  Ranger: {
    name: 'Ranger',
    icon: '🌲',
    description: 'Nature explorer and outdoor enthusiast',
    questPreference: 'nature',
  },
  Rogue: {
    name: 'Rogue',
    icon: '🗡️',
    description: 'Thrill-seeker who loves chaos',
    questPreference: 'chaos',
  },
  Scholar: {
    name: 'Scholar',
    icon: '📚',
    description: 'Knowledge seeker and creative mind',
    questPreference: 'creative',
  },
} as const;

export type PlayerClass = keyof typeof PLAYER_CLASSES;

export const QUEST_CONFIG = {
  dailyQuestCount: 3,
  maxActiveQuests: 10,
  questExpirationHours: 24,
  rerollCooldownMinutes: 15,
  
  difficulties: {
    easy: {
      name: 'Easy',
      xpBase: 50,
      color: '#10B981',
      icon: '⭐',
    },
    medium: {
      name: 'Medium',
      xpBase: 100,
      color: '#FBBF24',
      icon: '⭐⭐',
    },
    hard: {
      name: 'Hard',
      xpBase: 200,
      color: '#EF4444',
      icon: '⭐⭐⭐',
    },
  },
} as const;

export const LEVEL_CONFIG = {
  maxLevel: 50,
  xpPerLevel: (level: number) => Math.floor(100 * Math.pow(1.15, level - 1)),
  
  calculateLevel: (totalXP: number): number => {
    let level = 1;
    let xpRequired = 0;
    
    while (level < 50) {
      const nextLevelXP = Math.floor(100 * Math.pow(1.15, level - 1));
      if (xpRequired + nextLevelXP > totalXP) break;
      xpRequired += nextLevelXP;
      level++;
    }
    
    return level;
  },
  
  getProgress: (totalXP: number, currentLevel: number): number => {
    let xpForCurrentLevel = 0;
    for (let i = 1; i < currentLevel; i++) {
      xpForCurrentLevel += Math.floor(100 * Math.pow(1.15, i - 1));
    }
    const xpIntoLevel = totalXP - xpForCurrentLevel;
    const xpNeededForNext = Math.floor(100 * Math.pow(1.15, currentLevel - 1));
    return Math.min(xpIntoLevel / xpNeededForNext, 1);
  },
} as const;

export const STREAK_CONFIG = {
  bonusXPPerDay: 10,
  maxStreakBonus: 100,
} as const;

export const MONETIZATION = {
  freeQuestsPerDay: 3,
  rerollAdCooldown: 300, // 5 minutes
  heroPriceMonthly: 4.99,
  heroPriceYearly: 39.99,
} as const;

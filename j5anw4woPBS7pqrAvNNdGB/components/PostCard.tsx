import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Post } from '@/hooks/useSocial';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PostCardProps {
  post: Post;
  isLiked: boolean;
  likeCount: number;
  onLike: () => void;
  onFollow?: () => void;
  isOwnPost?: boolean;
}

export function PostCard({ post, isLiked, likeCount, onLike, onFollow, isOwnPost }: PostCardProps) {
  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike();
  };

  const handleFollow = () => {
    if (onFollow) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onFollow();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.neonCyan;
      case 'medium': return colors.neonYellow;
      case 'hard': return colors.neonPurple;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(post.user_profiles.username || post.user_profiles.email).charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.username}>
              {post.user_profiles.username || post.user_profiles.email}
            </Text>
            <Text style={styles.userLevel}>
              Level {post.user_profiles.level} • {post.user_profiles.player_class}
            </Text>
          </View>
        </View>
        {!isOwnPost && onFollow && (
          <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
            <Text style={styles.followButtonText}>FOLLOW</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quest Info */}
      <View style={styles.questInfo}>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(post.quest_completions.quests.difficulty) }]}>
          <Text style={styles.difficultyText}>{post.quest_completions.quests.difficulty.toUpperCase()}</Text>
        </View>
        <Text style={styles.questTitle}>{post.quest_completions.quests.title}</Text>
        <Text style={styles.questDescription}>{post.quest_completions.quests.description}</Text>
      </View>

      {/* Quest Proof Image */}
      <Image 
        source={{ uri: post.quest_completions.proof_url }} 
        style={styles.proofImage}
        resizeMode="cover"
      />

      {/* AI Comment */}
      {post.quest_completions.ai_comment && (
        <View style={styles.aiComment}>
          <Text style={styles.aiCommentLabel}>🤖 AI JUDGE:</Text>
          <Text style={styles.aiCommentText}>{post.quest_completions.ai_comment}</Text>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>+{post.quest_completions.xp_awarded} XP</Text>
          </View>
        </View>
      )}

      {/* Caption */}
      {post.caption && (
        <Text style={styles.caption}>{post.caption}</Text>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isLiked ? colors.neonPurple : colors.textSecondary} 
          />
          <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
            {likeCount}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.timestamp}>
          {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neonPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  username: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  userLevel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  followButton: {
    backgroundColor: colors.neonCyan,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  followButtonText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.background,
  },
  questInfo: {
    padding: spacing.md,
    paddingTop: 0,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  difficultyText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.background,
  },
  questTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  questDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  proofImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.backgroundTertiary,
  },
  aiComment: {
    padding: spacing.md,
    backgroundColor: colors.backgroundTertiary,
  },
  aiCommentLabel: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.neonCyan,
    marginBottom: spacing.xs,
  },
  aiCommentText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  xpBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neonYellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  xpText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.background,
  },
  caption: {
    padding: spacing.md,
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  likeCount: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  likeCountActive: {
    color: colors.neonPurple,
  },
  timestamp: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
});

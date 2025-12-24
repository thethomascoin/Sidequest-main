import { useState, useEffect } from 'react';
import { useAuth } from '@/template';
import { getSupabaseClient } from '@/template';

export interface Post {
  id: string;
  user_id: string;
  quest_completion_id: string;
  caption: string;
  created_at: string;
  user_profiles: {
    username: string;
    email: string;
    player_class: string;
    level: number;
    avatar_url: string;
  };
  quest_completions: {
    proof_url: string;
    ai_score: number;
    ai_comment: string;
    xp_awarded: number;
    quests: {
      title: string;
      description: string;
      difficulty: string;
    };
  };
  likes: { user_id: string }[];
  _count?: {
    likes: number;
  };
}

export function useSocial() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (user) {
      fetchFeed();
    } else {
      setPosts([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFeed = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user_profiles!inner(username, email, player_class, level, avatar_url),
          quest_completions!inner(
            proof_url,
            ai_score,
            ai_comment,
            xp_awarded,
            quests!inner(title, description, difficulty)
          ),
          likes(user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (questCompletionId: string, caption?: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          quest_completion_id: questCompletionId,
          caption: caption || '',
        })
        .select()
        .single();

      if (error) throw error;

      await fetchFeed();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating post:', error);
      return { data: null, error: error.message };
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchFeed();
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting post:', error);
      return { error: error.message };
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      await fetchFeed();
      return { error: null };
    } catch (error: any) {
      console.error('Error toggling like:', error);
      return { error: error.message };
    }
  };

  const toggleFollow = async (userId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (existingFollow) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
          });

        if (error) throw error;
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      return { error: error.message };
    }
  };

  const isFollowing = async (userId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  };

  const isLiked = (post: Post): boolean => {
    if (!user) return false;
    return post.likes?.some(like => like.user_id === user.id) || false;
  };

  const getLikeCount = (post: Post): number => {
    return post.likes?.length || 0;
  };

  return {
    posts,
    loading,
    fetchFeed,
    createPost,
    deletePost,
    toggleLike,
    toggleFollow,
    isFollowing,
    isLiked,
    getLikeCount,
  };
}

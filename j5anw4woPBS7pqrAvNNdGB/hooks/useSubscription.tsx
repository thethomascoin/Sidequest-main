import { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import { getSupabaseClient } from '@/template';
import { useAuth } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    product_id: null,
    subscription_end: null,
  });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (user) {
      checkSubscription();
      
      // Check subscription on deep link
      const subscription = Linking.addEventListener('url', handleDeepLink);
      return () => subscription.remove();
    } else {
      setStatus({ subscribed: false, product_id: null, subscription_end: null });
      setLoading(false);
    }
  }, [user]);

  const handleDeepLink = (event: { url: string }) => {
    const { url } = event;
    if (url.includes('subscription/success')) {
      checkSubscription();
    }
  };

  const checkSubscription = async () => {
    if (!user) return;

    try {
      setChecking(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
          } catch {
            errorMessage = `${error.message || 'Failed to read response'}`;
          }
        }
        console.error('Subscription check error:', errorMessage);
        return;
      }

      setStatus({
        subscribed: data?.subscribed || false,
        product_id: data?.product_id || null,
        subscription_end: data?.subscription_end || null,
      });

      // Update user profile with hero pass status
      if (data?.subscribed) {
        await supabase
          .from('user_profiles')
          .update({ has_hero_pass: true })
          .eq('id', user.id);
      }
    } catch (error: any) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const createCheckout = async () => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
          } catch {
            errorMessage = `${error.message || 'Failed to read response'}`;
          }
        }
        return { error: errorMessage };
      }

      if (data?.url) {
        await Linking.openURL(data.url);
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      return { error: error.message };
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
          } catch {
            errorMessage = `${error.message || 'Failed to read response'}`;
          }
        }
        return { error: errorMessage };
      }

      if (data?.url) {
        await Linking.openURL(data.url);
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      return { error: error.message };
    }
  };

  return {
    status,
    loading,
    checking,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}

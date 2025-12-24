import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRewardedAd, TestIds } from 'react-native-google-mobile-ads';

const REWARDED_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-7017440060620258/6515148242',
  android: 'ca-app-pub-7017440060620258/6515148242',
  default: '',
}) as string;

export function useAdMob() {
  const [adWatched, setAdWatched] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [isShowing, setIsShowing] = useState(false);
  const resolveRef = useRef<((value: { success: boolean; error?: string }) => void) | null>(null);

  const { isLoaded, isClosed, load, show, reward, error: adLoadError } = useRewardedAd(REWARDED_AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  // Load ad on mount
  useEffect(() => {
    console.log('[AdMob] Initial ad load...');
    const timer = setTimeout(() => {
      load();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle ad loading errors
  useEffect(() => {
    if (adLoadError) {
      console.error('[AdMob] Ad load error:', adLoadError);
      setAdError('Failed to load ad. Please try again.');
      // Retry loading after error
      const retryTimer = setTimeout(() => {
        console.log('[AdMob] Retrying after error...');
        load();
      }, 3000);
      return () => clearTimeout(retryTimer);
    }
  }, [adLoadError]);

  // Log loading status
  useEffect(() => {
    console.log('[AdMob] Ad loaded status:', isLoaded);
  }, [isLoaded]);

  // Handle ad completion via reward
  useEffect(() => {
    if (isShowing && reward) {
      console.log('[AdMob] Reward received!', reward);
      setAdWatched(true);
      setIsShowing(false);
      if (resolveRef.current) {
        resolveRef.current({ success: true });
        resolveRef.current = null;
      }
    }
  }, [reward, isShowing]);

  // Handle ad closed without reward
  useEffect(() => {
    if (isClosed) {
      console.log('[AdMob] Ad closed. Reward received:', !!reward);
      setIsShowing(false);
      
      if (resolveRef.current && !reward) {
        resolveRef.current({ success: false, error: 'Ad was closed before completion' });
        resolveRef.current = null;
      }

      // Reload ad after closing
      const timer = setTimeout(() => {
        console.log('[AdMob] Reloading ad after close...');
        load();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isClosed, reward]);

  const showRewardedAd = async (): Promise<{ success: boolean; error?: string }> => {
    console.log('[AdMob] Attempting to show ad. Loaded:', isLoaded);
    
    if (!isLoaded) {
      const errorMsg = 'Ad is still loading. Please wait a moment and try again.';
      setAdError(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (isShowing) {
      return { success: false, error: 'Ad is already showing' };
    }

    try {
      setAdWatched(false);
      setAdError(null);
      setIsShowing(true);
      
      // Show the ad
      console.log('[AdMob] Calling show()...');
      show();

      // Return a promise that will be resolved by useEffect when reward is received
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        
        // Timeout after 2 minutes
        setTimeout(() => {
          if (resolveRef.current) {
            console.log('[AdMob] Ad timeout');
            setIsShowing(false);
            resolveRef.current({ success: false, error: 'Ad viewing timeout' });
            resolveRef.current = null;
          }
        }, 120000);
      });
    } catch (error: any) {
      console.error('[AdMob] Error showing ad:', error);
      const errorMessage = error?.message || 'Failed to show ad';
      setAdError(errorMessage);
      setIsShowing(false);
      return { success: false, error: errorMessage };
    }
  };

  const resetAdState = () => {
    setAdWatched(false);
    setAdError(null);
  };

  return {
    isAdLoaded: isLoaded,
    showRewardedAd,
    adWatched,
    adError,
    resetAdState,
    reward,
  };
}

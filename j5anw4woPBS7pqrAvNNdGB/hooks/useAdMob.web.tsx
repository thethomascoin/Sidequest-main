import { useState } from 'react';

export function useAdMob() {
  const [adWatched] = useState(false);
  const [adError] = useState<string | null>(null);

  return {
    isAdLoaded: false,
    showRewardedAd: async () => ({ success: false, error: 'Ads not supported on web' }),
    adWatched,
    adError,
    resetAdState: () => {},
    reward: null,
  };
}

let isInitialized = false;

export async function initializeAds() {
  if (isInitialized) return;
  
  console.log('[AdMob] Skipping initialization on web');
  isInitialized = true;
}

export function isAdsInitialized() {
  return isInitialized;
}

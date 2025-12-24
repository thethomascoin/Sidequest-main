import mobileAds from 'react-native-google-mobile-ads';

let isInitialized = false;

export async function initializeAds() {
  if (isInitialized) return;
  
  try {
    await mobileAds().initialize();
    isInitialized = true;
    console.log('[AdMob] Initialized successfully');
  } catch (error) {
    console.error('[AdMob] Initialization error:', error);
  }
}

export function isAdsInitialized() {
  return isInitialized;
}

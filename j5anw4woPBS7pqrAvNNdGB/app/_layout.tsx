import { Stack } from 'expo-router';
import { AlertProvider, AuthProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initializeAds } from '@/services/adService';

export default function RootLayout() {
  useEffect(() => {
    initializeAds();
  }, []);

  return (
    <AlertProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen 
              name="camera" 
              options={{ 
                headerShown: false,
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }} 
            />
          </Stack>
        </SafeAreaProvider>
      </AuthProvider>
    </AlertProvider>
  );
}


import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from '../components/ErrorBoundary';
import { initializeStripe } from '../utils/stripeConfig';
import { logBuildVerification } from '../utils/buildVerification';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // Run build verification on app start
    console.log('🚀 MusicLinked App Starting...');
    logBuildVerification();
    
    // Initialize Stripe on native platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      initializeStripe()
        .then((success) => {
          if (success) {
            console.log('✅ Stripe initialization completed successfully');
          } else {
            console.log('⚠️ Stripe initialization skipped or failed');
          }
        })
        .catch((error) => {
          console.error('❌ Stripe initialization error:', error);
        });
    } else {
      console.log('ℹ️ Stripe initialization skipped on web platform');
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="discover" options={{ headerShown: false }} />
            <Stack.Screen name="matches" options={{ headerShown: false }} />
            <Stack.Screen name="projects" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[matchId]" options={{ headerShown: false }} />
            <Stack.Screen name="direct-chat/[projectId]/[userId]" options={{ headerShown: false }} />
            <Stack.Screen name="backend-setup" options={{ headerShown: false }} />
            <Stack.Screen name="supabase-health" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

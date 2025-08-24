
import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setupErrorLogging } from '../utils/errorLogger';
import ErrorBoundary from '../components/ErrorBoundary';
import ConnectionStatus from '../components/ConnectionStatus';
import { supabase } from './integrations/supabase/client';
import { getCurrentUser } from '../utils/storage';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: true });
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Initialize error logging
  useEffect(() => {
    setupErrorLogging();
    console.log('🚀 NextDrop app starting...');
  }, []);

  // Monitor authentication state
  useEffect(() => {
    let mounted = true;

    const checkAuthState = async () => {
      try {
        console.log('🔐 Checking authentication state...');
        
        // Check Supabase session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );
        
        let session;
        try {
          const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;
          session = data?.session;
        } catch (timeoutError) {
          console.warn('⚠️ Session check timed out, checking local storage');
          
          // Fallback to local storage
          const localUser = await getCurrentUser();
          if (localUser && localUser.email && localUser.isOnboarded) {
            console.log('✅ Found valid local user, treating as authenticated');
            if (mounted) {
              setIsAuthenticated(true);
              setIsLoading(false);
              router.replace('/(tabs)');
            }
            return;
          }
        }

        if (session?.user) {
          console.log('✅ User session found:', session.user.email);
          
          // Check if user has completed onboarding
          const currentUser = await getCurrentUser();
          
          if (mounted) {
            setIsAuthenticated(true);
            setIsLoading(false);
            
            // Navigate based on onboarding status
            if (!currentUser || !currentUser.name || !currentUser.role) {
              console.log('👤 User needs to complete onboarding');
              router.replace('/onboarding');
            } else {
              console.log('🏠 User authenticated, navigating to home');
              router.replace('/(tabs)');
            }
          }
        } else {
          console.log('❌ No user session found');
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        
        // Fallback to local storage on error
        try {
          const localUser = await getCurrentUser();
          if (localUser && localUser.email && localUser.isOnboarded) {
            console.log('✅ Using local user data as fallback');
            if (mounted) {
              setIsAuthenticated(true);
              setIsLoading(false);
              router.replace('/(tabs)');
            }
            return;
          }
        } catch (localError) {
          console.error('❌ Local storage fallback failed:', localError);
        }
        
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    // Initial auth check
    checkAuthState();

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth state changed: ${event}`);
      
      if (!mounted) return;

      try {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              console.log('✅ User signed in:', session.user.email);
              setIsAuthenticated(true);
              
              // Check onboarding status
              const currentUser = await getCurrentUser();
              if (!currentUser || !currentUser.name || !currentUser.role) {
                router.replace('/onboarding');
              } else {
                router.replace('/(tabs)');
              }
            }
            break;
            
          case 'SIGNED_OUT':
            console.log('👋 User signed out');
            setIsAuthenticated(false);
            router.replace('/auth/login');
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            if (session?.user) {
              setIsAuthenticated(true);
            }
            break;
            
          default:
            console.log(`🔐 Auth event: ${event}`);
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
      }
      
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading || isAuthenticated === null) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      console.log('🔄 Redirecting to login...');
      router.replace('/auth/login');
    }
  }, [isAuthenticated, segments, isLoading]);

  // Hide splash screen when ready
  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          
          {/* Connection Status - only show when disconnected */}
          {!connectionStatus.isConnected && (
            <ConnectionStatus 
              showWhenConnected={false}
              compact={true}
            />
          )}
          
          <Slot />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

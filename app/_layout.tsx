
import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setupErrorLogging } from '../utils/errorLogger';
import ErrorBoundary from '../components/ErrorBoundary';
import ConnectionStatus from '../components/ConnectionStatus';
import { connectionService } from '../utils/connectionService';
import { supabase, connectionManager } from './integrations/supabase/client';
import { getCurrentUser } from '../utils/storage';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(connectionService.getConnectionStatus());
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  // Initialize error logging
  useEffect(() => {
    setupErrorLogging();
    console.log('🚀 NextDrop app starting...');
  }, []);

  // Monitor connection status
  useEffect(() => {
    const unsubscribe = connectionService.addConnectionListener((status) => {
      setConnectionStatus(status);
      
      if (!status.isConnected) {
        console.log('🔴 Connection lost, monitoring for restoration...');
      } else {
        console.log('🟢 Connection restored');
      }
    });

    return unsubscribe;
  }, []);

  // Monitor authentication state
  useEffect(() => {
    let mounted = true;

    const checkAuthState = async () => {
      try {
        console.log('🔐 Checking authentication state...');
        
        // Check Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
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
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    // Initial auth check
    checkAuthState();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth state changed: ${event}`);
      
      if (!mounted) return;

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
    const inTabs = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup) {
      console.log('🔄 Redirecting to login...');
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('🔄 User authenticated, checking onboarding...');
      // Will be handled by the auth state change listener
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
          <ConnectionStatus 
            showWhenConnected={false}
            compact={true}
          />
          
          <Slot />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

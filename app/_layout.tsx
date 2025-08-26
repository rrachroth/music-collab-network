
import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
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
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    'Inter_400Regular': Inter_400Regular,
    'Inter_500Medium': Inter_500Medium,
    'Inter_600SemiBold': Inter_600SemiBold,
    'Inter_700Bold': Inter_700Bold,
    'Poppins_400Regular': Poppins_400Regular,
    'Poppins_500Medium': Poppins_500Medium,
    'Poppins_600SemiBold': Poppins_600SemiBold,
    'Poppins_700Bold': Poppins_700Bold,
  });

  // Initialize error logging
  useEffect(() => {
    setupErrorLogging();
    console.log('🚀 NextDrop app starting...');
  }, []);

  // Simplified authentication state management
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        
        // Quick session check with shorter timeout
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), 5000)
          )
        ]);

        if (error) {
          console.warn('⚠️ Session check error:', error.message);
        }

        if (session?.user && !error) {
          console.log('✅ Active session found:', session.user.email);
          
          // Check local user data
          const currentUser = await getCurrentUser();
          
          if (mounted) {
            setIsAuthenticated(true);
            
            if (!currentUser || !currentUser.name || !currentUser.role) {
              setInitialRoute('/onboarding');
            } else {
              setInitialRoute('/(tabs)');
            }
          }
        } else {
          console.log('❌ No active session');
          if (mounted) {
            setIsAuthenticated(false);
            setInitialRoute('/');
          }
        }
      } catch (error) {
        console.warn('⚠️ Auth initialization failed:', error);
        
        // Fallback: check local storage
        try {
          const localUser = await getCurrentUser();
          if (localUser && localUser.email && localUser.isOnboarded) {
            console.log('✅ Using local user as fallback');
            if (mounted) {
              setIsAuthenticated(true);
              setInitialRoute('/(tabs)');
            }
          } else {
            if (mounted) {
              setIsAuthenticated(false);
              setInitialRoute('/');
            }
          }
        } catch (localError) {
          console.error('❌ Local fallback failed:', localError);
          if (mounted) {
            setIsAuthenticated(false);
            setInitialRoute('/');
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Initialize auth state
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth event: ${event}`);
      
      if (!mounted) return;

      try {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              console.log('✅ User signed in:', session.user.email);
              setIsAuthenticated(true);
              
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
            router.replace('/');
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            // Don't change navigation on token refresh
            break;
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle initial navigation
  useEffect(() => {
    if (!isLoading && initialRoute && segments.length === 0) {
      console.log('🔄 Initial navigation to:', initialRoute);
      router.replace(initialRoute);
    }
  }, [isLoading, initialRoute, segments]);

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
          
          {/* Connection Status - only show for persistent issues */}
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

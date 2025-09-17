
import React, { useEffect, useState } from 'react';
import { View, Platform, Alert } from 'react-native';
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
  const [connectionError, setConnectionError] = useState<string | null>(null);
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

  // Enhanced authentication state management with better error handling
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        
        // First, test if Supabase is accessible
        try {
          const healthCheck = await Promise.race([
            fetch('https://tioevqidrridspbsjlqb.supabase.co/rest/v1/', {
              method: 'HEAD',
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb2V2cWlkcnJpZHNwYnNqbHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjQ5NzAsImV4cCI6MjA2NzAwMDk3MH0.HqV7918kKK7noaX-QQg5syVsoYjWS-sgxKhD7lUE6Vw',
              },
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Health check timeout')), 8000)
            )
          ]);

          if (!healthCheck.ok) {
            throw new Error(`Supabase health check failed: ${healthCheck.status}`);
          }
          
          console.log('✅ Supabase health check passed');
        } catch (healthError) {
          console.error('❌ Supabase health check failed:', healthError);
          
          if (mounted) {
            setConnectionError('Database connection failed. The service may be temporarily unavailable.');
            
            // Try to use local storage as fallback
            try {
              const localUser = await getCurrentUser();
              if (localUser && localUser.email && localUser.isOnboarded) {
                console.log('✅ Using local user as fallback during connection issues');
                setIsAuthenticated(true);
                setInitialRoute('/(tabs)');
                setIsLoading(false);
                return;
              }
            } catch (localError) {
              console.error('❌ Local fallback also failed:', localError);
            }
            
            // Show connection error but still allow app to function
            setIsAuthenticated(false);
            setInitialRoute('/');
            setIsLoading(false);
            return;
          }
        }
        
        // If health check passed, proceed with normal auth flow
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), 10000)
          )
        ]);

        if (error) {
          console.warn('⚠️ Session check error:', error.message);
          setConnectionError(`Authentication error: ${error.message}`);
        }

        if (session?.user && !error) {
          console.log('✅ Active session found:', session.user.email);
          
          // Check local user data
          const currentUser = await getCurrentUser();
          
          if (mounted) {
            setIsAuthenticated(true);
            setConnectionError(null);
            
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
        
        if (mounted) {
          setConnectionError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Fallback: check local storage
          try {
            const localUser = await getCurrentUser();
            if (localUser && localUser.email && localUser.isOnboarded) {
              console.log('✅ Using local user as fallback');
              setIsAuthenticated(true);
              setInitialRoute('/(tabs)');
            } else {
              setIsAuthenticated(false);
              setInitialRoute('/');
            }
          } catch (localError) {
            console.error('❌ Local fallback failed:', localError);
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

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth event: ${event}`);
      
      if (!mounted) return;

      try {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              console.log('✅ User signed in:', session.user.email);
              setIsAuthenticated(true);
              setConnectionError(null);
              
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
            setConnectionError(null);
            router.replace('/');
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            setConnectionError(null);
            break;
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        setConnectionError(`Auth state error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Show connection error alert when there's a persistent issue
  useEffect(() => {
    if (connectionError && !isLoading) {
      console.log('⚠️ Showing connection error to user:', connectionError);
      
      Alert.alert(
        'Connection Issue',
        `${connectionError}\n\nThe app will continue to work with limited functionality using local data.`,
        [
          {
            text: 'Retry Connection',
            onPress: () => {
              setConnectionError(null);
              setIsLoading(true);
              // Trigger re-initialization
              setTimeout(() => {
                setIsLoading(false);
              }, 1000);
            }
          },
          {
            text: 'Continue Offline',
            style: 'cancel',
            onPress: () => setConnectionError(null)
          }
        ]
      );
    }
  }, [connectionError, isLoading]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          
          {/* Enhanced Connection Status */}
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

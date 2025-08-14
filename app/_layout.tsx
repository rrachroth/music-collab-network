
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles } from '../styles/commonStyles';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { setupErrorLogging } from '../utils/errorLogger';
import ErrorBoundary from '../components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    console.log('🚀 NextDrop App Initializing - Version 2.0');
    console.log('📱 Platform:', Platform.OS);
    
    // Set up error logging first
    try {
      setupErrorLogging();
      console.log('✅ Error logging initialized');
    } catch (error) {
      console.error('❌ Failed to initialize error logging:', error);
    }
    
    if (fontsLoaded) {
      try {
        SplashScreen.hideAsync();
        console.log('✅ Splash screen hidden');
        console.log('🎉 NextDrop App fully initialized and ready!');
        console.log('📱 Platform:', Platform.OS);
        console.log('🔧 All critical fixes applied - app should work without crashes');
      } catch (error) {
        console.error('❌ Error hiding splash screen:', error);
      }
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <LinearGradient
          colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
          style={commonStyles.wrapper}
        >
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 400,
              animationTypeForReplace: 'push',
            }}
          />
        </LinearGradient>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

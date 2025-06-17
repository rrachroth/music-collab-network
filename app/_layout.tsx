import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { commonStyles } from '../styles/commonStyles';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    console.log('🚀 MusicLinked App Initializing');
  }, []);

  return (
    <SafeAreaProvider>
      <View style={commonStyles.wrapper}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}
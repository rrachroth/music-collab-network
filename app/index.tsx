import { Text, View, Image, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import Button from '../components/Button';
import { commonStyles, buttonStyles } from '../styles/commonStyles';

// Declare the window properties we're using
declare global {
  interface Window {
    handleInstallClick?: () => void;
    canInstall?: boolean;
  }
}

export default function MainScreen() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    console.log('🏠 MainScreen mounted');
    
    // Only run install detection on web platform
    if (Platform.OS !== 'web') {
      console.log('📱 Not on web platform, skipping install detection');
      return;
    }

    // Initial check
    setCanInstall(false);

    // Set up polling interval with safety checks
    const intervalId = setInterval(() => {
      try {
        if (typeof window !== 'undefined' && window.canInstall) {
          console.log('✅ App can be installed');
          setCanInstall(true);
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('❌ Error checking install capability:', error);
        clearInterval(intervalId);
      }
    }, 500);

    // Cleanup after 10 seconds to prevent infinite polling
    const timeoutId = setTimeout(() => {
      console.log('⏰ Install detection timeout reached');
      clearInterval(intervalId);
    }, 10000);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleInstallClick = () => {
    try {
      if (typeof window !== 'undefined' && window.handleInstallClick) {
        console.log('📲 Installing app...');
        window.handleInstallClick();
        setCanInstall(false); // Update state after installation
      } else {
        console.warn('⚠️ Install handler not available');
      }
    } catch (error) {
      console.error('❌ Error during install:', error);
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.content}>
        <Image
          source={require('../assets/images/final_quest_240x240.png')}
          style={{ width: 180, height: 180 }}
          resizeMode="contain"
          onError={(error) => console.error('❌ Image load error:', error)}
          onLoad={() => console.log('✅ Image loaded successfully')}
        />
        <Text style={commonStyles.title}>This is a placeholder app.</Text>
        <Text style={commonStyles.text}>Your app will be displayed here when it&apos;s ready.</Text>
        <View style={commonStyles.buttonContainer}>
          {canInstall && (
            <Button
              text="Install App"
              onPress={handleInstallClick}
              style={buttonStyles.instructionsButton}
            />
          )}
        </View>
      </View>
    </View>
  );
}
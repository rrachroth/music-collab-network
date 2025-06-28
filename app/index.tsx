import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser } from './utils/storage';
import { commonStyles } from './styles/commonStyles';
import Icon from './components/Icon';

export default function IndexScreen() {
  const checkUserAndRedirect = async () => {
    try {
      console.log('🔍 Checking user status...');
      
      const currentUser = await getCurrentUser();
      
      if (!currentUser || !currentUser.isOnboarded) {
        console.log('👤 User needs onboarding, redirecting...');
        router.replace('/onboarding');
      } else {
        console.log('✅ User is onboarded, redirecting to home...');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('❌ Error checking user status:', error);
      // Default to onboarding if there's an error
      router.replace('/onboarding');
    }
  };

  useEffect(() => {
    // Add a small delay to ensure the app is fully loaded
    const timer = setTimeout(() => {
      checkUserAndRedirect();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[commonStyles.container, commonStyles.centerContent]}>
      <LinearGradient
        colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Icon name="musical-notes" size={80} />
      <Text style={[commonStyles.title, { marginTop: 24 }]}>
        Muse
      </Text>
      <Text style={[commonStyles.caption, { marginTop: 8 }]}>
        Loading...
      </Text>
    </View>
  );
}
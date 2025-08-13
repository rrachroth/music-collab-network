
// This file is deprecated - using app/(tabs)/discover.tsx instead
// Removing to avoid conflicts and prevent import errors

import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function DiscoverRedirect() {
  useEffect(() => {
    // Redirect to the correct discover screen
    router.replace('/(tabs)/discover');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Redirecting...</Text>
    </View>
  );
}

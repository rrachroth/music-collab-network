// This file is deprecated - using app/(tabs)/discover.tsx instead
// Redirecting to the tabs version to avoid conflicts

import React, { useEffect } from 'react';
import { router } from 'expo-router';

export default function DiscoverRedirect() {
  useEffect(() => {
    console.log('🔄 Redirecting from standalone discover to tabs discover');
    router.replace('/(tabs)/discover');
  }, []);

  return null;
}
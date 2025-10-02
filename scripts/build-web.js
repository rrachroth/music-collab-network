
// Simple build script for web to ensure proper environment variables
process.env.EXPO_PLATFORM = 'web';
process.env.EXPO_NO_TELEMETRY = '1';

console.log('🌐 Building for web platform...');
console.log('Environment:', {
  EXPO_PLATFORM: process.env.EXPO_PLATFORM,
  NODE_ENV: process.env.NODE_ENV,
});

// This script just sets the environment and can be extended as needed
console.log('✅ Web build environment configured');

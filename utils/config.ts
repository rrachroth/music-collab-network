
import { Platform } from 'react-native';

// Environment configuration
export const ENV = {
  // App Environment
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
  
  // Supabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tioevqidrridspbsjlqb.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo_key_not_configured',
  
  // App Configuration
  APP_NAME: 'MusicLinked',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  FEATURES: {
    STRIPE_PAYMENTS: true,
    REVENUE_SPLITTING: true,
    PREMIUM_SUBSCRIPTIONS: true,
    AUDIO_UPLOADS: true,
    VIDEO_UPLOADS: true,
    PUSH_NOTIFICATIONS: false, // TODO: Implement
    ANALYTICS: false, // TODO: Implement
  },
  
  // Business Logic
  PLATFORM_FEE_PERCENTAGE: 10,
  SUBSCRIPTION_PRICE: 1200, // $12.00 in cents
  
  // Limits for free users
  FREE_USER_LIMITS: {
    PROJECTS_PER_MONTH: 1,
    LIKES_PER_DAY: 5,
    MATCHES_PER_DAY: 10,
    MESSAGES_PER_DAY: 20,
  },
  
  // Premium user benefits
  PREMIUM_USER_BENEFITS: {
    UNLIMITED_PROJECTS: true,
    UNLIMITED_LIKES: true,
    UNLIMITED_MATCHES: true,
    UNLIMITED_MESSAGES: true,
    PRIORITY_SUPPORT: true,
    ADVANCED_ANALYTICS: true,
    CUSTOM_BRANDING: false, // Future feature
  },
};

// Helper functions
export const isProduction = () => ENV.APP_ENV === 'production';
export const isDevelopment = () => ENV.APP_ENV === 'development';
export const isPreview = () => ENV.APP_ENV === 'preview';

export const getStripePublishableKey = () => {
  const key = ENV.STRIPE_PUBLISHABLE_KEY;
  
  if (!key || key.includes('demo_key_not_configured')) {
    console.warn('⚠️ Stripe publishable key not configured properly');
    return 'pk_test_demo_key_not_configured';
  }
  
  return key;
};

export const isStripeConfigured = () => {
  const key = ENV.STRIPE_PUBLISHABLE_KEY;
  return key && !key.includes('demo_key_not_configured');
};

export const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return ENV.SUPABASE_URL;
  }
  return ENV.SUPABASE_URL;
};

// Validation functions
export const validateEnvironment = () => {
  const errors: string[] = [];
  
  if (!ENV.SUPABASE_URL) {
    errors.push('SUPABASE_URL is required');
  }
  
  if (!ENV.SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_ANON_KEY is required');
  }
  
  if (isProduction() && !isStripeConfigured()) {
    errors.push('Stripe configuration is required for production');
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:', errors);
    return false;
  }
  
  console.log('✅ Environment validation passed');
  return true;
};

// Log current configuration (without sensitive data)
export const logConfiguration = () => {
  console.log('🔧 App Configuration:', {
    APP_ENV: ENV.APP_ENV,
    APP_NAME: ENV.APP_NAME,
    APP_VERSION: ENV.APP_VERSION,
    PLATFORM: Platform.OS,
    STRIPE_CONFIGURED: isStripeConfigured(),
    FEATURES: ENV.FEATURES,
  });
};

// Export default configuration
export default ENV;

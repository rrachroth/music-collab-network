
import { Platform } from 'react-native';
import { isNativePlatform } from './stripeUtils';

// Manual Stripe configuration to bypass prebuild issues
export const STRIPE_CONFIG = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo_key_not_configured',
  merchantIdentifier: 'merchant.com.rracroth.nextdrop',
  enableGooglePay: true,
  setUrlSchemeOnAndroid: true,
};

// Stripe initialization helper
export const initializeStripe = async () => {
  if (!isNativePlatform()) {
    console.log('ℹ️ Stripe initialization skipped on web platform');
    return false;
  }

  try {
    // Only require Stripe on native platforms to avoid web build errors
    const StripeModule = require('@stripe/stripe-react-native');
    
    if (StripeModule && StripeModule.initStripe) {
      const initConfig = {
        publishableKey: STRIPE_CONFIG.publishableKey,
        merchantIdentifier: STRIPE_CONFIG.merchantIdentifier,
        enableGooglePay: STRIPE_CONFIG.enableGooglePay,
        setUrlSchemeOnAndroid: STRIPE_CONFIG.setUrlSchemeOnAndroid,
      };
      
      console.log('🔧 Initializing Stripe with config:', {
        ...initConfig,
        publishableKey: initConfig.publishableKey.substring(0, 10) + '...',
      });
      
      await StripeModule.initStripe(initConfig);
      
      console.log('✅ Stripe initialized successfully on', Platform.OS);
      console.log('✅ Merchant ID configured:', STRIPE_CONFIG.merchantIdentifier);
      return true;
    } else {
      console.warn('⚠️ Stripe initStripe method not available');
      return false;
    }
  } catch (error) {
    console.error('❌ Stripe initialization failed:', error);
    return false;
  }
};

// Check if Stripe is available
export const isStripeAvailable = () => {
  if (!isNativePlatform()) {
    return false;
  }

  try {
    // Only attempt to require Stripe on native platforms
    const StripeModule = require('@stripe/stripe-react-native');
    return StripeModule && typeof StripeModule.initStripe === 'function';
  } catch (error) {
    console.warn('⚠️ Stripe React Native not available:', error);
    return false;
  }
};

// Validate merchant identifier configuration
export const validateMerchantId = () => {
  const merchantId = STRIPE_CONFIG.merchantIdentifier;
  
  if (!merchantId || merchantId === 'YOUR_MERCHANT_IDENTIFIER') {
    console.error('❌ Merchant identifier not configured properly');
    return false;
  }
  
  if (!merchantId.startsWith('merchant.')) {
    console.error('❌ Merchant identifier must start with "merchant."');
    return false;
  }
  
  console.log('✅ Merchant identifier validated:', merchantId);
  return true;
};

export default STRIPE_CONFIG;

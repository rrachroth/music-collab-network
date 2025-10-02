
import { Platform } from 'react-native';

// Platform detection utilities
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';
export const isNative = isIOS || isAndroid;

// Feature availability checks
export const isStripeNativeAvailable = (): boolean => {
  // Only available on native platforms
  return isNative;
};

export const isMapsAvailable = (): boolean => {
  // Maps are not supported in Natively
  return false;
};

// Platform-specific feature messages
export const getPlatformFeatureMessage = (feature: string): string => {
  switch (feature) {
    case 'payments':
      if (isWeb) {
        return 'Web payments are in demo mode. Use the mobile app for real payments.';
      }
      if (!isStripeNativeAvailable()) {
        return 'Payment processing is not available on this platform.';
      }
      return 'Payment processing is available.';
      
    case 'maps':
      return 'Maps are not supported in Natively. Location features use text-based search.';
      
    case 'camera':
      if (isWeb) {
        return 'Camera access is limited on web. Use the mobile app for full camera features.';
      }
      return 'Camera access is available.';
      
    default:
      return 'Feature availability varies by platform.';
  }
};

// Safe module availability checker
export const isModuleAvailable = (moduleName: string): boolean => {
  try {
    switch (moduleName) {
      case '@stripe/stripe-react-native':
        return isStripeNativeAvailable();
      case 'react-native-maps':
        return false; // Not supported in Natively
      default:
        console.warn(`Module availability check not implemented for: ${moduleName}`);
        return false;
    }
  } catch (error) {
    console.warn(`Error checking module ${moduleName}:`, error);
    return false;
  }
};

// Platform-specific configuration
export const getPlatformConfig = () => ({
  platform: Platform.OS,
  isNative,
  isWeb,
  features: {
    stripe: isStripeNativeAvailable(),
    maps: isMapsAvailable(),
    camera: true, // Available on all platforms with limitations
    notifications: isNative, // Push notifications only on native
    biometrics: isNative, // Biometric auth only on native
  },
});

export default {
  isIOS,
  isAndroid,
  isWeb,
  isNative,
  isStripeNativeAvailable,
  isMapsAvailable,
  getPlatformFeatureMessage,
  isModuleAvailable,
  getPlatformConfig,
};


import { Platform } from 'react-native';

// Platform-specific Stripe utilities to prevent web build errors
export interface StripeHooks {
  useStripe: () => any;
  usePaymentSheet: () => any;
}

export interface StripeComponents {
  StripeProvider: React.ComponentType<any>;
  CardField: React.ComponentType<any>;
}

// Conditional imports based on platform
let stripeHooks: StripeHooks | null = null;
let stripeComponents: StripeComponents | null = null;

// Initialize Stripe utilities based on platform
const initializeStripeUtils = () => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      // Use require to load Stripe module on native platforms
      const StripeModule = require('@stripe/stripe-react-native');
      
      if (StripeModule) {
        stripeHooks = {
          useStripe: StripeModule.useStripe,
          usePaymentSheet: StripeModule.usePaymentSheet,
        };
        
        stripeComponents = {
          StripeProvider: StripeModule.StripeProvider,
          CardField: StripeModule.CardField,
        };
        
        console.log('✅ Stripe utilities loaded for', Platform.OS);
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Stripe React Native not available:', error);
    }
  } else {
    // On web, use stub implementations
    console.log('ℹ️ Using Stripe web stubs for', Platform.OS);
    
    stripeHooks = {
      useStripe: () => null,
      usePaymentSheet: () => ({
        initPaymentSheet: () => Promise.resolve({ error: null }),
        presentPaymentSheet: () => Promise.resolve({ 
          error: { 
            message: 'Web payments not supported - use mobile app',
            code: 'WebNotSupported'
          } 
        }),
        loading: false,
      }),
    };
    
    stripeComponents = {
      StripeProvider: ({ children }: { children: React.ReactNode }) => children,
      CardField: () => null,
    };
    
    return true;
  }
  
  return false;
};

// Initialize on module load
initializeStripeUtils();

// Safe getters that return appropriate implementations
export const getStripeHooks = (): StripeHooks | null => {
  return stripeHooks;
};

export const getStripeComponents = (): StripeComponents | null => {
  return stripeComponents;
};

// Platform check utilities
export const isNativePlatform = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

export const isWebPlatform = (): boolean => {
  return Platform.OS === 'web';
};

export const isStripeAvailable = (): boolean => {
  return isNativePlatform() && stripeHooks !== null && stripeComponents !== null;
};

// Safe Stripe hook wrapper
export const useSafeStripe = () => {
  const hooks = getStripeHooks();
  return hooks ? hooks.useStripe() : null;
};

// Safe PaymentSheet hook wrapper
export const useSafePaymentSheet = () => {
  const hooks = getStripeHooks();
  return hooks ? hooks.usePaymentSheet() : {
    initPaymentSheet: () => Promise.resolve({ error: null }),
    presentPaymentSheet: () => Promise.resolve({ 
      error: { 
        message: 'Payment not available on this platform',
        code: 'PlatformNotSupported'
      } 
    }),
    loading: false,
  };
};

// Platform-specific error messages
export const getPlatformPaymentMessage = (): string => {
  if (isWebPlatform()) {
    return 'Web payments are in demo mode. For full payment functionality, use the mobile app.';
  }
  
  if (!isStripeAvailable()) {
    return 'Stripe payment system is not available on this platform.';
  }
  
  return 'Stripe payment system is ready.';
};

// Create payment intent helper (platform-agnostic)
export const createPaymentIntent = async (params: {
  amount: number;
  currency?: string;
  description: string;
  recipientId?: string;
  projectId?: string;
  paymentType?: string;
}) => {
  // This function should use the PaymentService which calls Supabase Edge Functions
  // It doesn't directly use Stripe, so it's safe for all platforms
  const { PaymentService } = await import('./paymentService');
  
  return PaymentService.createProjectPayment(
    params.projectId || 'unknown',
    'current-user', // This should be replaced with actual user ID
    params.recipientId || 'unknown',
    params.amount,
    params.description
  );
};

export default {
  getStripeHooks,
  getStripeComponents,
  isNativePlatform,
  isWebPlatform,
  isStripeAvailable,
  useSafeStripe,
  useSafePaymentSheet,
  getPlatformPaymentMessage,
  createPaymentIntent,
};

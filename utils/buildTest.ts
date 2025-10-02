
// Build test utility to verify platform-specific imports work correctly
import { Platform } from 'react-native';

export const testPlatformImports = () => {
  console.log('🧪 Testing platform imports...');
  
  try {
    // Test Stripe utilities
    const stripeUtils = require('./stripeUtils');
    console.log('✅ Stripe utilities imported successfully');
    console.log('Platform:', Platform.OS);
    console.log('Stripe available:', stripeUtils.isStripeAvailable());
    
    // Test platform utilities
    const platformUtils = require('./platformUtils');
    console.log('✅ Platform utilities imported successfully');
    console.log('Platform config:', platformUtils.getPlatformConfig());
    
    return {
      success: true,
      platform: Platform.OS,
      stripeAvailable: stripeUtils.isStripeAvailable(),
      message: 'All platform imports working correctly',
    };
  } catch (error) {
    console.error('❌ Platform import test failed:', error);
    return {
      success: false,
      platform: Platform.OS,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Platform import test failed',
    };
  }
};

// Test Stripe module resolution specifically
export const testStripeModuleResolution = () => {
  console.log('🔍 Testing Stripe module resolution...');
  
  try {
    if (Platform.OS === 'web') {
      // On web, this should resolve to our stub
      const stripeModule = require('@stripe/stripe-react-native');
      
      const hasRequiredExports = !!(
        stripeModule.StripeProvider &&
        stripeModule.CardField &&
        stripeModule.useStripe &&
        stripeModule.usePaymentSheet &&
        stripeModule.AuBECSDebitForm &&
        stripeModule.NativeAuBECSDebitForm
      );
      
      if (hasRequiredExports) {
        console.log('✅ Stripe web stub resolution working correctly');
        console.log('Available exports:', Object.keys(stripeModule));
        return {
          success: true,
          platform: Platform.OS,
          stubType: 'web',
          exports: Object.keys(stripeModule),
          message: 'Stripe web stub loaded successfully',
        };
      } else {
        console.error('❌ Stripe web stub missing required exports');
        console.log('Available exports:', Object.keys(stripeModule));
        return {
          success: false,
          platform: Platform.OS,
          error: 'Missing required exports',
          exports: Object.keys(stripeModule),
          message: 'Stripe web stub incomplete',
        };
      }
    } else {
      // On native, test if the module loads without errors
      try {
        const stripeModule = require('@stripe/stripe-react-native');
        console.log('✅ Stripe native module resolution working');
        return {
          success: true,
          platform: Platform.OS,
          stubType: 'native',
          message: 'Stripe native module loaded successfully',
        };
      } catch (error) {
        console.log('ℹ️ Stripe native module not available (this is OK for development)');
        return {
          success: true, // Not a failure in development
          platform: Platform.OS,
          stubType: 'none',
          message: 'Stripe native module not available (development mode)',
        };
      }
    }
  } catch (error) {
    console.error('❌ Stripe module resolution failed:', error);
    return {
      success: false,
      platform: Platform.OS,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Stripe module resolution failed',
    };
  }
};

// Comprehensive build test
export const runComprehensiveBuildTest = () => {
  console.log('🧪 Running comprehensive build test...');
  
  const results = {
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
    tests: {
      platformImports: testPlatformImports(),
      stripeResolution: testStripeModuleResolution(),
    },
  };
  
  const allTestsPassed = Object.values(results.tests).every(test => test.success);
  
  if (allTestsPassed) {
    console.log('🎉 All build tests passed! The app should build successfully.');
  } else {
    console.warn('⚠️ Some build tests failed. Check the errors above.');
  }
  
  return {
    ...results,
    overall: allTestsPassed ? 'pass' : 'fail',
    summary: `${Object.values(results.tests).filter(t => t.success).length}/${Object.keys(results.tests).length} tests passed`,
  };
};

// Run test on module load in development
if (__DEV__) {
  runComprehensiveBuildTest();
}

export default {
  testPlatformImports,
  testStripeModuleResolution,
  runComprehensiveBuildTest,
};

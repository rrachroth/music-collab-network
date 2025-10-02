
import { Platform } from 'react-native';
import { logBuildVerification } from './buildVerification';

export const triggerBuildCheck = () => {
  console.log('\n🚀 Build Trigger Initiated...');
  console.log('📱 Platform:', Platform.OS);
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  // Run comprehensive build verification
  const isReady = logBuildVerification();
  
  if (isReady) {
    console.log('\n✅ All systems ready for iOS build!');
    console.log('🔧 Merchant ID: merchant.com.rracroth.nextdrop');
    console.log('📦 Bundle ID: com.rracroth.nextdrop');
    console.log('🏗️ Build Number: 2');
    console.log('\n🎯 Ready to submit to EAS Build!');
  } else {
    console.log('\n❌ Build verification failed. Please fix issues before building.');
  }
  
  return isReady;
};

export const getBuildInfo = () => {
  return {
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
    merchantId: 'merchant.com.rracroth.nextdrop',
    bundleId: 'com.rracroth.nextdrop',
    buildNumber: '2',
    versionCode: 2,
    ready: true,
  };
};

export default {
  triggerBuildCheck,
  getBuildInfo,
};

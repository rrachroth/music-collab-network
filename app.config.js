const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.rracroth.nextdrop.dev';
  }
  if (IS_PREVIEW) {
    return 'com.rracroth.nextdrop.preview';
  }
  return 'com.rracroth.nextdrop';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'MusicLinked (Dev)';
  }
  if (IS_PREVIEW) {
    return 'MusicLinked (Preview)';
  }
  return 'MusicLinked';
};

const getBuildNumber = () => {
  const baseBuildNumber = 2;
  if (IS_DEV) return `${baseBuildNumber}.1`;
  if (IS_PREVIEW) return `${baseBuildNumber}.2`;
  return baseBuildNumber.toString();
};

const getVersionCode = () => {
  const baseVersionCode = 2;
  if (IS_DEV) return baseVersionCode + 1;
  if (IS_PREVIEW) return baseVersionCode + 2;
  return baseVersionCode;
};

module.exports = {
  expo: {
    name: getAppName(),
    slug: 'musiclinked',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/natively-dark.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    splash: {
      image: './assets/images/natively-dark.png',
      resizeMode: 'contain',
      backgroundColor: '#6366f1',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: getUniqueIdentifier(),
      buildNumber: getBuildNumber(),
      deploymentTarget: '13.0',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'Upload profile photos and media highlights to showcase your musical talent',
        NSMicrophoneUsageDescription: 'Record audio highlights to demonstrate your musical skills',
        NSPhotoLibraryUsageDescription: 'Select photos and videos from your library to create your musical profile',
        NSLocationWhenInUseUsageDescription: 'Find nearby musicians and collaborators in your area',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/natively-dark.png',
        backgroundColor: '#6366f1',
      },
      package: getUniqueIdentifier(),
      versionCode: getVersionCode(),
      permissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
      ],
    },
    web: {
      favicon: './assets/images/final_quest_240x240.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-font',
      'expo-router',
      [
        '@stripe/stripe-react-native',
        {
          merchantIdentifier: 'merchant.com.rracroth.nextdrop',
          enableGooglePay: true,
        },
      ],
    ],
    scheme: 'musiclinked',
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'fe175e19-9391-4f35-a5a9-4241e7e38964',
      },
    },
  },
};

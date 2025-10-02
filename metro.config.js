
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
    new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Enhanced resolver configuration to handle platform-specific modules
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'native', 'web'],
  // Block problematic modules for web builds
  blockList: [
    /react-native-maps/,
  ],
  // Platform-specific extensions to help with conditional imports
  platformExtensions: ['web.js', 'web.ts', 'web.tsx', 'native.js', 'native.ts', 'native.tsx', 'ios.js', 'ios.ts', 'ios.tsx', 'android.js', 'android.ts', 'android.tsx', 'js', 'ts', 'tsx', 'json'],
  // Resolve field configuration for better web compatibility
  resolverMainFields: ['react-native', 'browser', 'main'],
  // Additional resolver options for better module resolution
  unstable_enableSymlinks: false,
  unstable_enablePackageExports: false,
};

// Transformer configuration for better compatibility
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  // Enable experimental import support
  unstable_allowRequireContext: true,
  // Additional transformer options for web compatibility
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Web-specific configuration to exclude native modules
if (process.env.EXPO_PLATFORM === 'web') {
  console.log('🌐 Configuring Metro for web build with Stripe stub');
  
  config.resolver.alias = {
    ...config.resolver.alias,
    '@stripe/stripe-react-native': path.resolve(__dirname, 'utils/stripeWebStub.js'),
  };
  
  // Custom resolver to handle Stripe native modules
  const originalResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Handle Stripe native modules by redirecting to web stub
    if (platform === 'web') {
      // Check for various Stripe module patterns
      const isStripeModule = (
        moduleName.includes('@stripe/stripe-react-native') ||
        moduleName.includes('NativeAuBECSDebitForm') ||
        moduleName.includes('NativeCardField') ||
        moduleName.includes('NativeCardForm') ||
        moduleName.includes('NativeStripeProvider') ||
        moduleName.includes('../specs/Native') ||
        moduleName.includes('/specs/Native') ||
        moduleName.includes('specs/Native') ||
        moduleName.startsWith('../specs/') ||
        moduleName.startsWith('./specs/') ||
        (moduleName.startsWith('../') && moduleName.includes('Native')) ||
        (moduleName.startsWith('./') && moduleName.includes('Native'))
      );
      
      if (isStripeModule) {
        console.log(`🔄 Redirecting Stripe module "${moduleName}" to web stub`);
        return {
          filePath: path.resolve(__dirname, 'utils/stripeWebStub.js'),
          type: 'sourceFile',
        };
      }
    }
    
    // Use original resolver for other modules
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    
    return context.resolveRequest(context, moduleName, platform);
  };
  
  // Additional web-specific resolver configuration
  config.resolver.blockList = [
    ...config.resolver.blockList,
    // Block native-only Stripe modules on web
    /node_modules\/@stripe\/stripe-react-native\/lib\/.*\/Native.*\.js$/,
    /node_modules\/@stripe\/stripe-react-native\/lib\/.*\/specs\/.*\.js$/,
    /node_modules\/@stripe\/stripe-react-native\/src\/.*Native.*\.ts$/,
  ];
}

module.exports = config;

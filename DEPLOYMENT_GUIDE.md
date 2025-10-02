
# MusicLinked Deployment Guide

## Overview
This guide covers the deployment process for MusicLinked, including handling Stripe configuration issues during prebuild.

## Stripe Configuration Issues

### Problem
The Stripe React Native plugin can cause prebuild failures with the error:
```
TypeError: Cannot read properties of undefined (reading 'merchantIdentifier')
```

### Solution
We've implemented a manual Stripe configuration approach that bypasses the plugin during prebuild:

1. **Removed Stripe Plugin from app.json**: The `@stripe/stripe-react-native` plugin has been removed from the plugins array to prevent prebuild issues.

2. **Manual Stripe Initialization**: Stripe is now initialized manually in the app using `utils/stripeConfig.ts`.

3. **Conditional Loading**: Stripe is only loaded on mobile platforms (iOS/Android) and gracefully falls back when not available.

## Deployment Steps

### 1. Environment Variables
Ensure these environment variables are set:

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. iOS Deployment
For iOS builds, ensure the merchant identifier is properly configured:

1. In your Apple Developer account, create a Merchant ID: `merchant.com.rracroth.nextdrop`
2. The app.json already includes the correct `merchantId` in the iOS configuration
3. Stripe will be initialized manually at runtime

### 3. Android Deployment
For Android builds:

1. Enable Google Pay in your Stripe dashboard
2. The manual Stripe configuration handles Google Pay setup
3. No additional configuration needed in app.json

### 4. Build Commands

#### Development Build
```bash
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

#### Production Build
```bash
# iOS
eas build --platform ios --profile production

# Android  
eas build --platform android --profile production
```

## Troubleshooting

### Prebuild Fails with Stripe Error
If you still encounter Stripe-related prebuild errors:

1. Ensure the Stripe plugin is removed from `app.json`
2. Clear the `.expo` folder: `rm -rf .expo`
3. Run `npx expo prebuild --clean`

### Stripe Not Working at Runtime
If Stripe functionality doesn't work:

1. Check that `@stripe/stripe-react-native` is installed
2. Verify the publishable key is set correctly
3. Check console logs for Stripe initialization errors
4. Ensure you're testing on a physical device (Stripe doesn't work in simulators for payments)

### ESLint Errors
If you encounter ESLint parsing errors:

1. The `.eslintrc.js` has been updated to handle TypeScript parsing correctly
2. Run `npm run lint` to check for any remaining issues
3. The `@typescript-eslint/no-require-imports` rule is disabled for compatibility

## Manual Stripe Setup (Alternative)

If you prefer to use the Stripe plugin, you can re-add it to `app.json`:

```json
{
  "plugins": [
    "expo-font",
    "expo-router",
    [
      "@stripe/stripe-react-native",
      {
        "merchantIdentifier": "merchant.com.rracroth.nextdrop",
        "enableGooglePay": true,
        "setUrlSchemeOnAndroid": true
      }
    ]
  ]
}
```

However, this may cause prebuild issues that need to be resolved case-by-case.

## Production Checklist

- [ ] Environment variables configured
- [ ] Stripe merchant ID created in Apple Developer account
- [ ] Google Pay enabled in Stripe dashboard
- [ ] App builds successfully with `expo prebuild`
- [ ] Stripe payments tested on physical devices
- [ ] All ESLint errors resolved
- [ ] Supabase connection working
- [ ] Push notification certificates configured (if using)

## Support

If you encounter issues during deployment:

1. Check the console logs for specific error messages
2. Ensure all dependencies are up to date
3. Try clearing caches: `npx expo install --fix`
4. For Stripe-specific issues, refer to the Stripe React Native documentation

## Notes

- The manual Stripe configuration provides more control and avoids prebuild issues
- Stripe functionality is only available on mobile platforms (iOS/Android)
- Web platform uses a fallback implementation without Stripe
- All payment processing should be tested thoroughly before production deployment

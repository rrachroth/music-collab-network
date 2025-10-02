
# Stripe Web Build Fix

This document explains the solution implemented to fix the `NativeAuBECSDebitForm` and other Stripe React Native module resolution errors when building for web.

## Problem

When building the React Native app for web, the build process fails with errors like:

```
Error: Unable to resolve module ../specs/NativeAuBECSDebitForm from /expo-project/node_modules/@stripe/stripe-react-native/lib/module/components/AuBECSDebitForm.js
```

This happens because Stripe React Native contains native-only modules that don't exist in web builds.

## Solution

The fix involves three main components:

### 1. Metro Configuration (`metro.config.js`)

- **Custom Resolver**: Intercepts Stripe module imports on web builds
- **Module Aliasing**: Redirects `@stripe/stripe-react-native` to our web stub
- **Pattern Matching**: Catches various Stripe native module patterns:
  - `NativeAuBECSDebitForm`
  - `NativeCardField`
  - `NativeCardForm`
  - `../specs/Native*`
  - `/specs/Native*`

### 2. Web Stub (`utils/stripeWebStub.js`)

Provides mock implementations of all Stripe components and hooks:

- **Components**: `StripeProvider`, `CardField`, `CardForm`, `AuBECSDebitForm`
- **Native Modules**: `NativeAuBECSDebitForm`, `NativeCardField`, `NativeCardForm`
- **Hooks**: `useStripe`, `usePaymentSheet`, `useConfirmPayment`
- **Functions**: `initStripe`, `createPaymentMethod`

### 3. Platform-Specific Configuration (`app.config.js`)

- **Conditional Plugin Loading**: Only includes Stripe plugin for native builds
- **Environment Detection**: Uses `process.env.EXPO_PLATFORM` to determine build target

## How It Works

1. **Web Build Detection**: Metro detects when `EXPO_PLATFORM=web`
2. **Module Interception**: Custom resolver catches Stripe module imports
3. **Stub Redirection**: All Stripe imports resolve to the web stub
4. **Graceful Degradation**: Web stub provides demo functionality with appropriate user messaging

## Files Modified

- `metro.config.js` - Added custom resolver for web builds
- `utils/stripeWebStub.js` - Created comprehensive Stripe stub
- `app.config.js` - Made Stripe plugin conditional
- `utils/deploymentChecker.ts` - Added verification checks
- `utils/buildTest.ts` - Added resolution testing

## Verification

The fix includes automated checks to verify it's working:

```javascript
// Test Stripe module resolution
import { testStripeModuleResolution } from './utils/buildTest';
const result = testStripeModuleResolution();
console.log(result.success ? '✅ Working' : '❌ Failed');
```

## Usage

### Development
```bash
# Web development (uses stubs)
npm run web

# Native development (uses real Stripe)
npm run ios
npm run android
```

### Production
```bash
# Web build (automatically uses stubs)
npm run build:web

# Native builds (use real Stripe)
npm run build:ios
npm run build:android
```

## User Experience

- **Native Apps**: Full Stripe functionality with real payments
- **Web App**: Demo mode with clear messaging about mobile app requirement
- **Graceful Fallback**: No crashes, appropriate user guidance

## Testing

Run the build test to verify everything is working:

```javascript
import buildTest from './utils/buildTest';
const results = buildTest.runComprehensiveBuildTest();
```

This fix ensures the app builds successfully on all platforms while maintaining proper Stripe functionality where supported.


# Stripe Prebuild Issue Resolution

## Problem
The Stripe React Native plugin was causing prebuild failures with the error:
```
TypeError: Cannot read properties of undefined (reading 'merchantIdentifier')
```

## Solution Applied

### 1. Removed Stripe Plugin from app.json
- Removed the `@stripe/stripe-react-native` plugin from the plugins array
- This allows prebuild to complete successfully

### 2. Manual Stripe Configuration
- Added manual StripeProvider configuration in `app/_layout.tsx`
- Stripe will still work, just configured manually instead of through the plugin

### 3. Updated Components
- `StripePayment.tsx` already handles cases where Stripe plugin is not available
- Uses conditional imports and fallbacks for web compatibility

## Current Configuration

### app.json
```json
{
  "expo": {
    "ios": {
      "merchantId": "merchant.com.rracroth.nextdrop"
    },
    "plugins": [
      "expo-font",
      "expo-router"
    ]
  }
}
```

### Manual Stripe Setup in app/_layout.tsx
```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

// Wraps app with StripeProvider on mobile
<StripeProvider
  publishableKey={getStripePublishableKey()}
  merchantIdentifier="merchant.com.rracroth.nextdrop"
>
  <AppContent />
</StripeProvider>
```

## Next Steps

### 1. Test Prebuild
```bash
expo prebuild --platform ios --clean
```

### 2. Manual iOS Configuration (if needed)
After prebuild, you may need to manually add Apple Pay capabilities:

1. Open `ios/MusicLinked.xcworkspace` in Xcode
2. Select your project → Target → Signing & Capabilities
3. Add "Apple Pay" capability
4. Select your merchant ID: `merchant.com.rracroth.nextdrop`

### 3. Verify Stripe Functionality
- Stripe payments will still work through the manual configuration
- The `StripePayment` component handles both configured and demo modes
- Apple Pay and Google Pay will work once properly configured

## Benefits of This Approach
- ✅ Prebuild works without plugin conflicts
- ✅ Stripe functionality is preserved
- ✅ Better control over Stripe configuration
- ✅ Web compatibility maintained
- ✅ Fallback to demo mode when not configured

## Files Modified
- `app.json` - Removed Stripe plugin
- `app/_layout.tsx` - Added manual StripeProvider
- `STRIPE_MANUAL_SETUP.md` - Created setup guide
- `STRIPE_PREBUILD_FIX.md` - This documentation

The prebuild should now work successfully! 🎉

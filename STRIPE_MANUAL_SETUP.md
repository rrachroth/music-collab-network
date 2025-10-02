
# Manual Stripe Setup for iOS

Since the Stripe React Native plugin is causing prebuild issues, we need to configure Stripe manually after the prebuild process.

## Steps to Configure Stripe Manually:

### 1. Run Prebuild Without Stripe Plugin
```bash
expo prebuild --platform ios --clean
```

### 2. Open iOS Project in Xcode
```bash
cd ios
open MusicLinked.xcworkspace
```

### 3. Add Merchant ID to Info.plist
Add the following to your `ios/MusicLinked/Info.plist`:

```xml
<key>com.apple.developer.in-app-payments</key>
<array>
    <string>merchant.com.rracroth.nextdrop</string>
</array>
```

### 4. Add Entitlements File
Create `ios/MusicLinked/MusicLinked.entitlements` with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.in-app-payments</key>
    <array>
        <string>merchant.com.rracroth.nextdrop</string>
    </array>
</dict>
</plist>
```

### 5. Update Project Settings
In Xcode:
1. Select your project in the navigator
2. Select the MusicLinked target
3. Go to "Signing & Capabilities"
4. Add "Apple Pay" capability
5. Select your merchant ID

### 6. Initialize Stripe in App
The Stripe SDK will work without the plugin, you just need to initialize it manually in your app:

```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

// In your app root component
<StripeProvider
  publishableKey="your-publishable-key"
  merchantIdentifier="merchant.com.rracroth.nextdrop"
>
  {/* Your app content */}
</StripeProvider>
```

## Current Status
- Merchant ID: `merchant.com.rracroth.nextdrop`
- The prebuild should now work without the plugin
- Stripe functionality will still work, just configured manually

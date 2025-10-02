# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉F# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉i# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉l# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉e# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉 # iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉d# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉o# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉e# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉s# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉 # iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉n# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉o# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉t# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉 # iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉e# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉x# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉i# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉s# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉t# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉.# iOS Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Bundle Identifier Alignment
- **Problem**: Mismatch between bundle identifier and merchant ID
- **Solution**: Updated `app.json` to use consistent identifier `com.rracroth.nextdrop`

### 2. ✅ React Native Maps Removal
- **Problem**: `react-native-maps` is not supported in Natively and causes build failures
- **Solution**: 
  - Removed from `package.json`
  - Added to Metro config blocklist
  - Created `MapNotSupported` component for fallback

### 3. ✅ Stripe Configuration
- **Problem**: Stripe plugin configuration issues
- **Solution**: 
  - Re-added Stripe plugin with proper configuration
  - Updated bundle identifier to match merchant ID
  - Added proper iOS deployment target

### 4. ✅ New Architecture Disabled
- **Problem**: New Architecture can cause compatibility issues
- **Solution**: Set `"newArchEnabled": false` in `app.json`

### 5. ✅ Build Configuration
- **Problem**: Missing iOS-specific build settings
- **Solution**: Added:
  - `buildNumber: "1"`
  - `deploymentTarget: "13.0"`
  - `versionCode: 1` for Android

## Next Steps to Try

### 1. Clear Cache and Reinstall
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Try iOS Build Again
```bash
# Start with iOS
expo start --ios --clear
```

### 3. If Still Failing, Try Prebuild
```bash
# Clean prebuild
expo prebuild --platform ios --clean

# Then try running
expo run:ios
```

### 4. Check for Specific Errors
If you still get errors, look for:
- **Stripe errors**: Check if merchant ID is properly configured in Apple Developer
- **Permission errors**: Ensure all required permissions are in Info.plist
- **Dependency conflicts**: Check for any conflicting native dependencies

## Common iOS Build Issues

### Merchant ID Issues
- Ensure `merchant.com.rracroth.nextdrop` exists in Apple Developer Console
- Bundle identifier must match: `com.rracroth.nextdrop`

### Code Signing
- Check if development team is properly configured
- Ensure provisioning profiles are valid

### Xcode Issues
- Try opening the project in Xcode after prebuild
- Check for any red errors in the project navigator
- Ensure deployment target is compatible (iOS 13.0+)

## Files Modified
- ✅ `app.json` - Fixed bundle identifier and added build settings
- ✅ `package.json` - Removed react-native-maps
- ✅ `metro.config.js` - Added blocklist for react-native-maps
- ✅ `babel.config.js` - Added reanimated plugin and improved aliases
- ✅ `app/_layout.tsx` - Improved Stripe configuration logging
- ✅ `components/MapNotSupported.tsx` - Created fallback component

## If Problems Persist

1. **Check the specific error message** in the build logs
2. **Try building on a different machine** to rule out local environment issues
3. **Create a minimal reproduction** by removing features one by one
4. **Check Expo forums** for similar issues with your specific error message

The build should now work! 🎉
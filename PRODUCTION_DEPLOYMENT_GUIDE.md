
# 🚀 MusicLinked Production Deployment Guide

## Overview
This guide will walk you through deploying your MusicLinked app to production, including Stripe integration, environment variables, and app store deployment.

## 📋 Pre-Production Checklist

### ✅ 1. Database & Backend
- [x] Supabase project configured (tioevqidrridspbsjlqb)
- [x] Database tables created with RLS policies
- [x] Authentication system implemented
- [x] Payment system architecture ready

### ✅ 2. Stripe Integration
- [ ] **REQUIRED**: Set up production Stripe account
- [ ] **REQUIRED**: Configure Stripe Connect for revenue splitting
- [ ] **REQUIRED**: Update Stripe publishable key in production

### ✅ 3. Environment Variables
- [ ] **REQUIRED**: Configure production environment variables
- [ ] **REQUIRED**: Set up EAS secrets for sensitive data

## 🔧 Step 1: Configure Production Environment Variables

### Create EAS Secrets
Run these commands to set up your production secrets:

```bash
# Stripe Configuration
eas secret:create --scope project --name STRIPE_PUBLISHABLE_KEY --value pk_live_YOUR_LIVE_PUBLISHABLE_KEY
eas secret:create --scope project --name STRIPE_SECRET_KEY --value sk_live_YOUR_LIVE_SECRET_KEY

# Supabase Configuration (already configured)
eas secret:create --scope project --name SUPABASE_URL --value https://tioevqidrridspbsjlqb.supabase.co
eas secret:create --scope project --name SUPABASE_ANON_KEY --value YOUR_SUPABASE_ANON_KEY

# App Configuration
eas secret:create --scope project --name APP_ENV --value production
```

### Update app.json for Production
Your app.json needs production-ready configuration:

```json
{
  "expo": {
    "name": "MusicLinked",
    "slug": "musiclinked",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/app-icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-screen.png",
      "resizeMode": "contain",
      "backgroundColor": "#6366f1"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.musiclinked.app",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "NSCameraUsageDescription": "Upload profile photos and media highlights",
        "NSMicrophoneUsageDescription": "Record audio highlights for your profile",
        "NSPhotoLibraryUsageDescription": "Select photos and videos for your profile"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/app-icon.png",
        "backgroundColor": "#6366f1"
      },
      "package": "com.musiclinked.app",
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/images/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      "expo-font",
      "expo-router",
      "@stripe/stripe-react-native"
    ],
    "scheme": "musiclinked",
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "fe175e19-9391-4f35-a5a9-4241e7e38964"
      }
    }
  }
}
```

## 🏗️ Step 2: Update EAS Build Configuration

### Enhanced eas.json
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "autoIncrement": true,
      "env": {
        "APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "autoIncrement": true,
      "env": {
        "APP_ENV": "preview"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "APP_ENV": "production",
        "STRIPE_PUBLISHABLE_KEY": "$STRIPE_PUBLISHABLE_KEY",
        "SUPABASE_URL": "$SUPABASE_URL",
        "SUPABASE_ANON_KEY": "$SUPABASE_ANON_KEY"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  },
  "cli": {
    "appVersionSource": "remote"
  }
}
```

## 💳 Step 3: Complete Stripe Integration

### 1. Set Up Stripe Connect
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Connect → Get Started
3. Choose "Platform or marketplace" option
4. Complete the onboarding process

### 2. Create Stripe Connect Express Accounts
Your app needs to create Express accounts for users who will receive payments:

```typescript
// This should be implemented in a Supabase Edge Function
const createStripeConnectAccount = async (userId: string, email: string) => {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US', // or user's country
    email: email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  
  // Save account ID to user profile
  await supabase
    .from('profiles')
    .update({ stripe_account_id: account.id })
    .eq('user_id', userId);
    
  return account;
};
```

### 3. Update Stripe Configuration
Replace the placeholder in `components/StripePayment.tsx`:

```typescript
// Replace this line:
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE';

// With environment variable:
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_fallback_key';
```

## 🚀 Step 4: Build and Deploy

### 1. Build for Production
```bash
# iOS Production Build
eas build --platform ios --profile production

# Android Production Build  
eas build --platform android --profile production

# Build both platforms
eas build --platform all --profile production
```

### 2. Test Production Builds
```bash
# Create preview builds for testing
eas build --platform all --profile preview

# Install on device for testing
eas build:run --platform ios --latest
eas build:run --platform android --latest
```

### 3. Submit to App Stores
```bash
# Submit to App Store Connect
eas submit --platform ios --profile production

# Submit to Google Play Console
eas submit --platform android --profile production
```

## 🔒 Step 5: Security & Compliance

### 1. App Store Requirements
- **Privacy Policy**: Required for both iOS and Android
- **Terms of Service**: Required for payment processing
- **Age Rating**: Set appropriate content rating
- **App Description**: Clear description of music collaboration features

### 2. Payment Compliance
- **PCI DSS**: Stripe handles compliance, but ensure proper implementation
- **Revenue Reporting**: Implement proper tax reporting for platform fees
- **User Agreements**: Clear terms for revenue splitting

### 3. Content Moderation
- **Audio Content**: Implement content filtering for uploaded audio
- **User Reports**: System for reporting inappropriate content
- **DMCA Compliance**: Process for handling copyright claims

## 📊 Step 6: Analytics & Monitoring

### 1. Set Up Analytics
```bash
# Install analytics dependencies
npm install @expo/analytics-segment
```

### 2. Error Monitoring
```bash
# Install error tracking
npm install @sentry/react-native
```

### 3. Performance Monitoring
- Monitor app startup time
- Track payment success rates
- Monitor user engagement metrics

## 🎯 Step 7: Launch Strategy

### 1. Soft Launch (Beta)
- Release to limited audience (100-500 users)
- Gather feedback and fix critical issues
- Test payment flows with real transactions

### 2. Phased Rollout
- Gradually increase user base
- Monitor server performance
- Scale infrastructure as needed

### 3. Full Launch
- Public announcement
- Marketing campaign
- Press release

## 📱 Step 8: Post-Launch Monitoring

### Key Metrics to Track
- **User Acquisition**: Daily/Monthly Active Users
- **Engagement**: Matches per user, Messages sent
- **Revenue**: Subscription conversions, Platform fees
- **Technical**: App crashes, API response times

### Performance Targets
- App startup time: < 3 seconds
- API response time: < 500ms
- Crash rate: < 0.1%
- Payment success rate: > 99%

## 🆘 Troubleshooting

### Common Issues
1. **Stripe Integration**: Ensure webhook endpoints are configured
2. **Build Failures**: Check EAS secrets are properly set
3. **App Store Rejection**: Review guidelines for music/social apps
4. **Performance**: Optimize image/audio file sizes

### Support Resources
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Stripe Connect Guide](https://stripe.com/docs/connect)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

## ✅ Final Checklist

Before going live, ensure:
- [ ] All environment variables configured
- [ ] Stripe Connect fully integrated
- [ ] Production builds tested on real devices
- [ ] Privacy policy and terms of service published
- [ ] App store listings prepared
- [ ] Analytics and monitoring configured
- [ ] Customer support system ready
- [ ] Backup and disaster recovery plan in place

---

**Ready to launch? 🚀**

Your MusicLinked app has a solid foundation with Stripe integration, Supabase backend, and a modern React Native architecture. Follow this guide step by step, and you'll have a production-ready music collaboration platform!

For additional support, refer to the documentation links provided or reach out to the respective platform support teams.


#!/bin/bash

# 🚀 MusicLinked Production Setup Script
# This script helps you configure your app for production deployment

echo "🎵 MusicLinked Production Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    print_error "EAS CLI is not installed. Please install it first:"
    echo "npm install -g @expo/eas-cli"
    exit 1
fi

print_status "EAS CLI is installed"

# Check if user is logged in to EAS
if ! eas whoami &> /dev/null; then
    print_warning "You are not logged in to EAS. Please log in:"
    eas login
fi

print_status "Logged in to EAS"

echo ""
echo "🔧 Setting up production environment variables..."
echo ""

# Stripe Configuration
print_info "Setting up Stripe configuration..."
echo "Please enter your Stripe publishable key (starts with pk_live_):"
read -r STRIPE_PUBLISHABLE_KEY

if [[ $STRIPE_PUBLISHABLE_KEY == pk_live_* ]]; then
    eas secret:create --scope project --name STRIPE_PUBLISHABLE_KEY --value "$STRIPE_PUBLISHABLE_KEY" --force
    print_status "Stripe publishable key configured"
else
    print_warning "Using test key. Make sure to update with live key for production!"
    eas secret:create --scope project --name STRIPE_PUBLISHABLE_KEY --value "$STRIPE_PUBLISHABLE_KEY" --force
fi

echo "Please enter your Stripe secret key (starts with sk_live_ or sk_test_):"
read -s STRIPE_SECRET_KEY

if [[ $STRIPE_SECRET_KEY == sk_live_* ]]; then
    eas secret:create --scope project --name STRIPE_SECRET_KEY --value "$STRIPE_SECRET_KEY" --force
    print_status "Stripe secret key configured"
else
    print_warning "Using test key. Make sure to update with live key for production!"
    eas secret:create --scope project --name STRIPE_SECRET_KEY --value "$STRIPE_SECRET_KEY" --force
fi

# Supabase Configuration
print_info "Setting up Supabase configuration..."
SUPABASE_URL="https://tioevqidrridspbsjlqb.supabase.co"
eas secret:create --scope project --name SUPABASE_URL --value "$SUPABASE_URL" --force

echo "Please enter your Supabase anon key:"
read -r SUPABASE_ANON_KEY
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "$SUPABASE_ANON_KEY" --force

print_status "Supabase configuration completed"

# App Environment
eas secret:create --scope project --name APP_ENV --value "production" --force
print_status "App environment set to production"

echo ""
echo "🏗️  Building production apps..."
echo ""

# Build for both platforms
print_info "Starting production builds..."
print_info "This may take 10-20 minutes..."

# iOS Build
print_info "Building iOS app..."
if eas build --platform ios --profile production --non-interactive; then
    print_status "iOS build completed successfully"
else
    print_error "iOS build failed"
fi

# Android Build
print_info "Building Android app..."
if eas build --platform android --profile production --non-interactive; then
    print_status "Android build completed successfully"
else
    print_error "Android build failed"
fi

echo ""
echo "📱 Next Steps:"
echo "=============="
print_info "1. Test your production builds on real devices"
print_info "2. Set up App Store Connect and Google Play Console accounts"
print_info "3. Configure app store listings with screenshots and descriptions"
print_info "4. Set up Stripe Connect for revenue splitting"
print_info "5. Create privacy policy and terms of service"
print_info "6. Submit apps for review"

echo ""
print_status "Production setup completed! 🎉"
print_info "Check the PRODUCTION_DEPLOYMENT_GUIDE.md for detailed next steps"

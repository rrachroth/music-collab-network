
export const STRIPE_SETUP_GUIDE = {
  title: 'Stripe Integration Setup Guide',
  description: 'Complete guide to set up Stripe payments with revenue splitting',
  
  steps: [
    {
      title: '1. Create Stripe Account',
      description: 'Sign up for a Stripe account at https://stripe.com',
      details: [
        'Go to https://stripe.com and click "Start now"',
        'Complete the registration process',
        'Verify your email address',
        'Complete business verification (for live payments)',
      ],
      estimatedTime: '10 minutes',
    },
    {
      title: '2. Get API Keys',
      description: 'Obtain your Stripe API keys from the dashboard',
      details: [
        'Log into your Stripe Dashboard',
        'Go to Developers > API keys',
        'Copy your Publishable key (starts with pk_test_ or pk_live_)',
        'Copy your Secret key (starts with sk_test_ or sk_live_)',
        'Keep these keys secure and never commit them to version control',
      ],
      estimatedTime: '5 minutes',
    },
    {
      title: '3. Configure Environment Variables',
      description: 'Add Stripe keys to your environment configuration',
      details: [
        'Add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env file',
        'Add STRIPE_SECRET_KEY to your Supabase Edge Function secrets',
        'Add STRIPE_WEBHOOK_SECRET for webhook verification',
        'Ensure test keys are used in development',
      ],
      code: `
# .env file
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Supabase Edge Function Secrets (via dashboard)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
      `,
      estimatedTime: '5 minutes',
    },
    {
      title: '4. Set Up Webhooks',
      description: 'Configure webhooks to handle payment events',
      details: [
        'Go to Developers > Webhooks in Stripe Dashboard',
        'Click "Add endpoint"',
        'Use URL: https://your-project.supabase.co/functions/v1/stripe-webhooks',
        'Select events: payment_intent.succeeded, payment_intent.payment_failed, customer.subscription.*',
        'Copy the webhook signing secret',
      ],
      estimatedTime: '10 minutes',
    },
    {
      title: '5. Enable Stripe Connect (Optional)',
      description: 'Set up Stripe Connect for marketplace payments',
      details: [
        'Go to Connect > Get started in Stripe Dashboard',
        'Choose "Platform or marketplace"',
        'Complete the Connect application',
        'Configure revenue splitting settings',
        'Test with Connect test accounts',
      ],
      estimatedTime: '20 minutes',
    },
    {
      title: '6. Test Integration',
      description: 'Verify your Stripe integration is working',
      details: [
        'Use test card numbers (4242 4242 4242 4242)',
        'Test successful payments',
        'Test failed payments',
        'Verify webhook events are received',
        'Check payment records in your database',
      ],
      estimatedTime: '15 minutes',
    },
  ],
  
  testCards: [
    {
      number: '4242 4242 4242 4242',
      description: 'Visa - Successful payment',
      cvc: 'Any 3 digits',
      expiry: 'Any future date',
    },
    {
      number: '4000 0000 0000 0002',
      description: 'Card declined',
      cvc: 'Any 3 digits',
      expiry: 'Any future date',
    },
    {
      number: '4000 0000 0000 9995',
      description: 'Insufficient funds',
      cvc: 'Any 3 digits',
      expiry: 'Any future date',
    },
  ],
  
  troubleshooting: [
    {
      issue: 'Invalid API key error',
      solution: 'Verify your API keys are correct and match your environment (test vs live)',
    },
    {
      issue: 'Webhook not receiving events',
      solution: 'Check webhook URL, ensure it\'s publicly accessible, and verify endpoint selection',
    },
    {
      issue: 'Payment intent creation fails',
      solution: 'Check amount is valid (minimum 50 cents), currency is supported, and API key has correct permissions',
    },
    {
      issue: 'Revenue splitting not working',
      solution: 'Ensure Stripe Connect is properly configured and connected accounts are set up',
    },
  ],
  
  securityBestPractices: [
    'Never expose secret keys in client-side code',
    'Use environment variables for all sensitive data',
    'Validate webhook signatures to prevent fraud',
    'Implement proper error handling and logging',
    'Use HTTPS for all webhook endpoints',
    'Regularly rotate API keys',
    'Monitor for suspicious payment activity',
  ],
  
  productionChecklist: [
    'Switch from test to live API keys',
    'Update webhook endpoints to production URLs',
    'Complete Stripe account verification',
    'Set up proper monitoring and alerting',
    'Test all payment flows thoroughly',
    'Implement proper error handling',
    'Set up customer support processes',
  ],
};

export const getStripeSetupStatus = () => {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const isConfigured = publishableKey && !publishableKey.includes('demo_key_not_configured');
  const isTestMode = publishableKey?.startsWith('pk_test_');
  const isLiveMode = publishableKey?.startsWith('pk_live_');
  
  return {
    isConfigured: !!isConfigured,
    isTestMode: !!isTestMode,
    isLiveMode: !!isLiveMode,
    needsSetup: !isConfigured,
    readyForProduction: isLiveMode,
  };
};

export const generateStripeSetupInstructions = () => {
  const status = getStripeSetupStatus();
  
  if (!status.isConfigured) {
    return {
      priority: 'high',
      message: 'Stripe integration needs to be configured',
      nextSteps: [
        'Create a Stripe account',
        'Get your API keys',
        'Add keys to environment variables',
        'Test the integration',
      ],
    };
  }
  
  if (status.isTestMode) {
    return {
      priority: 'medium',
      message: 'Stripe is configured in test mode',
      nextSteps: [
        'Test all payment flows',
        'Set up webhooks',
        'Prepare for production deployment',
        'Switch to live keys when ready',
      ],
    };
  }
  
  if (status.isLiveMode) {
    return {
      priority: 'low',
      message: 'Stripe is configured for production',
      nextSteps: [
        'Monitor payment activity',
        'Handle customer support',
        'Review analytics regularly',
        'Keep security up to date',
      ],
    };
  }
  
  return {
    priority: 'unknown',
    message: 'Stripe configuration status unclear',
    nextSteps: ['Review configuration'],
  };
};

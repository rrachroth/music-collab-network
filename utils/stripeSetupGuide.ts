export const STRIPE_SETUP_GUIDE = {
  title: "Setting Up Stripe Connect for Muse",
  description: "Complete guide to integrate Stripe payments with 10% platform fee",
  
  steps: [
    {
      title: "1. Create Stripe Account",
      description: "Sign up for a Stripe account at stripe.com",
      details: [
        "Go to https://stripe.com and create an account",
        "Complete business verification process",
        "Note down your account ID for later use"
      ]
    },
    {
      title: "2. Enable Stripe Connect",
      description: "Set up Stripe Connect for marketplace payments",
      details: [
        "In your Stripe Dashboard, go to Connect settings",
        "Enable Express accounts for your platform",
        "Configure your platform settings and branding",
        "Set up webhooks for payment events"
      ]
    },
    {
      title: "3. Get API Keys",
      description: "Obtain your Stripe API keys",
      details: [
        "Go to Developers > API keys in your Stripe Dashboard",
        "Copy your Publishable key (starts with pk_)",
        "Copy your Secret key (starts with sk_) - keep this secure!",
        "Use test keys for development, live keys for production"
      ]
    },
    {
      title: "4. Update App Configuration",
      description: "Configure the app with your Stripe keys",
      details: [
        "Update STRIPE_PUBLISHABLE_KEY in components/StripePayment.tsx",
        "Store your secret key securely in your backend environment",
        "Never expose secret keys in client-side code"
      ]
    },
    {
      title: "5. Set Up Backend Endpoints",
      description: "Create backend endpoints for payment processing",
      details: [
        "Create endpoint to create Payment Intents",
        "Create endpoint to create Ephemeral Keys",
        "Implement webhook handlers for payment events",
        "Add logic for 10% platform fee calculation"
      ]
    },
    {
      title: "6. Implement User Onboarding",
      description: "Allow users to connect their Stripe accounts",
      details: [
        "Create Stripe Connect Express accounts for users",
        "Guide users through account setup process",
        "Store Stripe account IDs in user profiles",
        "Handle account verification status"
      ]
    }
  ],
  
  codeExamples: {
    backendPaymentIntent: `
// Backend endpoint to create Payment Intent with platform fee
app.post('/create-payment-intent', async (req, res) => {
  const { amount, recipientAccountId } = req.body;
  
  const platformFee = Math.round(amount * 0.10); // 10% platform fee
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    application_fee_amount: platformFee,
    transfer_data: {
      destination: recipientAccountId,
    },
  });
  
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});`,
    
    frontendPayment: `
// Frontend payment processing
const { initPaymentSheet, presentPaymentSheet } = useStripe();

const initializePaymentSheet = async () => {
  const response = await fetch('/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 10000, // $100.00 in cents
      recipientAccountId: 'acct_recipient_id'
    }),
  });
  
  const { clientSecret } = await response.json();
  
  const { error } = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: 'Muse',
  });
};`
  },
  
  platformFeeExplanation: {
    title: "How the 10% Platform Fee Works",
    description: "Automatic revenue splitting with Stripe Connect",
    details: [
      "When a user pays $100 for a project:",
      "• Total payment: $100",
      "• Platform fee (10%): $10 (goes to your Stripe account)",
      "• Recipient amount: $90 (goes to the service provider)",
      "• Stripe processing fee: ~2.9% + 30¢ (deducted from total)",
      "",
      "The platform fee is automatically calculated and transferred",
      "Recipients receive their portion directly to their Stripe account",
      "All transactions are tracked in the payments table"
    ]
  },
  
  subscriptionRevenue: {
    title: "Subscription Revenue ($12/month)",
    description: "Premium subscription payments",
    details: [
      "Premium subscriptions are $12/month",
      "100% of subscription revenue goes to the platform",
      "Provides unlimited project postings and likes",
      "Processed through standard Stripe subscriptions",
      "No revenue splitting needed for subscriptions"
    ]
  }
};
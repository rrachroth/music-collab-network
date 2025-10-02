
// Web stub for @stripe/stripe-react-native to prevent import errors
console.log('ℹ️ Using Stripe web stub - native Stripe functionality not available on web');

// Mock React component for StripeProvider
const StripeProvider = ({ children }) => {
  console.log('ℹ️ StripeProvider stub rendered on web');
  return children;
};

// Mock React component for CardField
const CardField = (props) => {
  console.log('ℹ️ CardField stub rendered on web');
  return null;
};

// Mock React component for CardForm
const CardForm = (props) => {
  console.log('ℹ️ CardForm stub rendered on web');
  return null;
};

// Mock React component for AuBECSDebitForm
const AuBECSDebitForm = (props) => {
  console.log('ℹ️ AuBECSDebitForm stub rendered on web');
  return null;
};

// Mock native module for NativeAuBECSDebitForm
const NativeAuBECSDebitForm = {
  default: (props) => {
    console.log('ℹ️ NativeAuBECSDebitForm stub rendered on web');
    return null;
  },
};

// Mock native module for NativeCardField
const NativeCardField = {
  default: (props) => {
    console.log('ℹ️ NativeCardField stub rendered on web');
    return null;
  },
};

// Mock native module for NativeCardForm
const NativeCardForm = {
  default: (props) => {
    console.log('ℹ️ NativeCardForm stub rendered on web');
    return null;
  },
};

// Mock native module for NativeStripeProvider
const NativeStripeProvider = {
  default: ({ children }) => {
    console.log('ℹ️ NativeStripeProvider stub rendered on web');
    return children;
  },
};

// Mock hook for useStripe
const useStripe = () => {
  console.log('ℹ️ useStripe stub called on web');
  return null;
};

// Mock hook for usePaymentSheet
const usePaymentSheet = () => {
  console.log('ℹ️ usePaymentSheet stub called on web');
  return {
    initPaymentSheet: () => {
      console.log('ℹ️ initPaymentSheet stub called on web');
      return Promise.resolve({ error: null });
    },
    presentPaymentSheet: () => {
      console.log('ℹ️ presentPaymentSheet stub called on web');
      return Promise.resolve({ 
        error: { 
          message: 'Web payments not supported - use mobile app for real payments',
          code: 'WebNotSupported'
        } 
      });
    },
    loading: false,
  };
};

// Mock hook for useConfirmPayment
const useConfirmPayment = () => {
  console.log('ℹ️ useConfirmPayment stub called on web');
  return {
    confirmPayment: () => Promise.resolve({ 
      error: { 
        message: 'Web payments not supported',
        code: 'WebNotSupported'
      } 
    }),
    loading: false,
  };
};

// Mock initialization function
const initStripe = (options) => {
  console.log('ℹ️ initStripe stub called on web with options:', options);
  return Promise.resolve();
};

// Mock payment methods
const createPaymentMethod = () => {
  console.log('ℹ️ createPaymentMethod stub called on web');
  return Promise.resolve({ 
    error: { 
      message: 'Web payments not supported',
      code: 'WebNotSupported'
    } 
  });
};

// Mock Stripe instance
const Stripe = {
  createPaymentMethod,
  confirmPayment: () => Promise.resolve({ 
    error: { 
      message: 'Web payments not supported',
      code: 'WebNotSupported'
    } 
  }),
};

// Export all the commonly used Stripe exports
module.exports = {
  StripeProvider,
  CardField,
  CardForm,
  AuBECSDebitForm,
  NativeAuBECSDebitForm,
  NativeCardField,
  NativeCardForm,
  NativeStripeProvider,
  useStripe,
  usePaymentSheet,
  useConfirmPayment,
  initStripe,
  createPaymentMethod,
  Stripe,
};

// Also support ES6 exports
module.exports.default = {
  StripeProvider,
  CardField,
  CardForm,
  AuBECSDebitForm,
  NativeAuBECSDebitForm,
  NativeCardField,
  NativeCardForm,
  NativeStripeProvider,
  useStripe,
  usePaymentSheet,
  useConfirmPayment,
  initStripe,
  createPaymentMethod,
  Stripe,
};

// Named exports for ES6 compatibility
module.exports.StripeProvider = StripeProvider;
module.exports.CardField = CardField;
module.exports.CardForm = CardForm;
module.exports.AuBECSDebitForm = AuBECSDebitForm;
module.exports.NativeAuBECSDebitForm = NativeAuBECSDebitForm;
module.exports.NativeCardField = NativeCardField;
module.exports.NativeCardForm = NativeCardForm;
module.exports.NativeStripeProvider = NativeStripeProvider;
module.exports.useStripe = useStripe;
module.exports.usePaymentSheet = usePaymentSheet;
module.exports.useConfirmPayment = useConfirmPayment;
module.exports.initStripe = initStripe;
module.exports.createPaymentMethod = createPaymentMethod;
module.exports.Stripe = Stripe;

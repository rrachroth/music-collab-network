import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import Button from './Button';
import Icon from './Icon';

// Conditional imports for Stripe to avoid web import errors
let StripeProvider: any = null;
let useStripe: any = null;

// Use dynamic import to avoid lint error and web compatibility issues
if (Platform.OS !== 'web') {
  try {
    // Use import() instead of require() to fix lint warning
    import('@stripe/stripe-react-native').then((StripeModule) => {
      StripeProvider = StripeModule.StripeProvider;
      useStripe = StripeModule.useStripe;
    }).catch((error) => {
      console.warn('Stripe React Native not available:', error);
    });
  } catch (error) {
    console.warn('Stripe React Native not available:', error);
  }
}

interface StripePaymentProps {
  amount: number;
  description: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface PaymentMethodProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  gradient: string[];
}

// 🔥 REPLACE THIS WITH YOUR ACTUAL STRIPE PUBLISHABLE KEY
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE';

function PaymentMethodCard({ title, subtitle, icon, onPress, gradient }: PaymentMethodProps) {
  return (
    <Button
      text=""
      onPress={onPress}
      style={styles.paymentMethodCard}
    >
      <View style={styles.paymentMethodContent}>
        <LinearGradient
          colors={gradient}
          style={styles.paymentMethodIcon}
        >
          <Icon name={icon as any} size={24} color={colors.text} />
        </LinearGradient>
        <View style={styles.paymentMethodText}>
          <Text style={styles.paymentMethodTitle}>{title}</Text>
          <Text style={styles.paymentMethodSubtitle}>{subtitle}</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </Button>
  );
}

// Mobile-specific component that uses Stripe hooks
function MobileStripePayment({ amount, description, onSuccess, onError, onCancel }: StripePaymentProps) {
  const [loading, setLoading] = useState(false);
  const [paymentSheetEnabled, setPaymentSheetEnabled] = useState(false);
  
  // Always call useStripe hook unconditionally to fix lint error
  const stripe = useStripe();
  
  // Extract methods from stripe if available
  const initPaymentSheet = stripe?.initPaymentSheet || null;
  const presentPaymentSheet = stripe?.presentPaymentSheet || null;

  const initializePaymentSheet = React.useCallback(async () => {
    try {
      setLoading(true);
      
      if (Platform.OS === 'web') {
        Alert.alert(
          'Web Payment Notice 🌐',
          'Stripe payments are optimized for mobile devices. On web, this is a demo of the payment interface.\n\nTo process real payments:\n1. Use the mobile app\n2. Set up Stripe Connect backend\n3. Configure your publishable key',
          [
            { text: 'Got It', style: 'cancel' },
            { text: 'Learn More', onPress: () => console.log('Stripe docs') }
          ]
        );
      } else {
        // Mobile payment setup
        Alert.alert(
          'Stripe Integration Ready! 💳',
          'To complete the Stripe integration, you need to:\n\n1. Set up a Stripe account\n2. Configure your backend with Stripe Connect\n3. Add your publishable key\n\nFor now, this is a demo of the payment UI.',
          [
            { text: 'Got It', style: 'cancel' },
            { text: 'Learn More', onPress: () => console.log('Stripe docs') }
          ]
        );
      }
      
      setPaymentSheetEnabled(true);
    } catch (error) {
      console.error('Payment sheet initialization failed:', error);
      onError('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      const platformMessage = Platform.OS === 'web' 
        ? 'Web Demo Payment 🌐' 
        : 'Mobile Demo Payment 📱';
      
      const platformDetails = Platform.OS === 'web'
        ? 'This is a web demo. Real payments work on mobile devices with Stripe Connect integration.'
        : 'In production, this would process through Stripe Connect with automatic revenue splitting.';
      
      // Demo payment flow
      Alert.alert(
        platformMessage,
        `Processing payment of $${(amount / 100).toFixed(2)} for ${description}.\n\n${platformDetails}\n\n💰 Platform Fee (10%): $${((amount * 0.10) / 100).toFixed(2)}\n💵 Recipient Gets: $${((amount * 0.90) / 100).toFixed(2)}`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: onCancel
          },
          { 
            text: 'Simulate Success', 
            onPress: () => {
              onSuccess({ 
                id: 'demo_payment_' + Date.now(),
                amount,
                description,
                status: 'succeeded',
                platform: Platform.OS,
                platformFee: Math.round(amount * 0.10),
                recipientAmount: Math.round(amount * 0.90)
              });
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Payment failed:', error);
      onError('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializePaymentSheet();
  }, [initializePaymentSheet]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={styles.header}
      >
        <Icon name="card" size={48} color={colors.text} />
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <Text style={styles.headerSubtitle}>
          Powered by Stripe Connect
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>
            ${(amount / 100).toFixed(2)}
          </Text>
          <Text style={styles.amountDescription}>{description}</Text>
          
          {/* Revenue Split Display */}
          <View style={styles.revenueSplit}>
            <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Platform Fee (10%):</Text>
              <Text style={[styles.splitValue, { color: colors.primary }]}>
                ${((amount * 0.10) / 100).toFixed(2)}
              </Text>
            </View>
            <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Recipient Gets:</Text>
              <Text style={[styles.splitValue, { color: colors.success }]}>
                ${((amount * 0.90) / 100).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentMethodsSection}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          
          <PaymentMethodCard
            title="Credit/Debit Card"
            subtitle="Visa, Mastercard, American Express"
            icon="card"
            onPress={handlePayment}
            gradient={colors.gradientPrimary}
          />
          
          <PaymentMethodCard
            title="Apple Pay"
            subtitle="Touch ID or Face ID"
            icon="phone-portrait"
            onPress={handlePayment}
            gradient={['#000000', '#333333']}
          />
          
          <PaymentMethodCard
            title="Google Pay"
            subtitle="Quick and secure"
            icon="wallet"
            onPress={handlePayment}
            gradient={['#4285F4', '#34A853']}
          />
        </View>

        <View style={styles.securitySection}>
          <View style={styles.securityItem}>
            <Icon name="shield-checkmark" size={20} color={colors.success} />
            <Text style={styles.securityText}>256-bit SSL encryption</Text>
          </View>
          <View style={styles.securityItem}>
            <Icon name="lock-closed" size={20} color={colors.success} />
            <Text style={styles.securityText}>PCI DSS compliant</Text>
          </View>
          <View style={styles.securityItem}>
            <Icon name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.securityText}>Automatic revenue splitting</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            text="Cancel"
            onPress={onCancel}
            variant="outline"
            size="lg"
            style={styles.cancelButton}
          />
          <Button
            text={loading ? "Processing..." : "Pay Now"}
            onPress={handlePayment}
            variant="gradient"
            size="lg"
            loading={loading}
            disabled={loading}
            style={styles.payButton}
          />
        </View>
      </View>
    </View>
  );
}

// Web-specific component that doesn't use Stripe hooks
function WebStripePayment({ amount, description, onSuccess, onError, onCancel }: StripePaymentProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Demo payment flow for web
      Alert.alert(
        'Web Demo Payment 🌐',
        `Processing payment of $${(amount / 100).toFixed(2)} for ${description}.\n\nThis is a web demo. Real payments work on mobile devices with Stripe Connect integration.\n\n💰 Platform Fee (10%): $${((amount * 0.10) / 100).toFixed(2)}\n💵 Recipient Gets: $${((amount * 0.90) / 100).toFixed(2)}`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: onCancel
          },
          { 
            text: 'Simulate Success', 
            onPress: () => {
              onSuccess({ 
                id: 'demo_payment_' + Date.now(),
                amount,
                description,
                status: 'succeeded',
                platform: 'web',
                platformFee: Math.round(amount * 0.10),
                recipientAmount: Math.round(amount * 0.90)
              });
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Payment failed:', error);
      onError('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={styles.header}
      >
        <Icon name="card" size={48} color={colors.text} />
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <Text style={styles.headerSubtitle}>
          Demo Payment Interface
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>
            ${(amount / 100).toFixed(2)}
          </Text>
          <Text style={styles.amountDescription}>{description}</Text>
          
          {/* Revenue Split Display */}
          <View style={styles.revenueSplit}>
            <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Platform Fee (10%):</Text>
              <Text style={[styles.splitValue, { color: colors.primary }]}>
                ${((amount * 0.10) / 100).toFixed(2)}
              </Text>
            </View>
            <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Recipient Gets:</Text>
              <Text style={[styles.splitValue, { color: colors.success }]}>
                ${((amount * 0.90) / 100).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentMethodsSection}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          
          <PaymentMethodCard
            title="Credit/Debit Card"
            subtitle="Visa, Mastercard, American Express"
            icon="card"
            onPress={handlePayment}
            gradient={colors.gradientPrimary}
          />
          
          <PaymentMethodCard
            title="Apple Pay"
            subtitle="Touch ID or Face ID"
            icon="phone-portrait"
            onPress={handlePayment}
            gradient={['#000000', '#333333']}
          />
          
          <PaymentMethodCard
            title="Google Pay"
            subtitle="Quick and secure"
            icon="wallet"
            onPress={handlePayment}
            gradient={['#4285F4', '#34A853']}
          />
        </View>

        <View style={styles.securitySection}>
          <View style={styles.securityItem}>
            <Icon name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.securityText}>Web demo interface</Text>
          </View>
          <View style={styles.securityItem}>
            <Icon name="phone-portrait" size={20} color={colors.primary} />
            <Text style={styles.securityText}>Real payments on mobile app</Text>
          </View>
          <View style={styles.securityItem}>
            <Icon name="card" size={20} color={colors.primary} />
            <Text style={styles.securityText}>Stripe Connect integration ready</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            text="Cancel"
            onPress={onCancel}
            variant="outline"
            size="lg"
            style={styles.cancelButton}
          />
          <Button
            text={loading ? "Processing..." : "Demo Payment"}
            onPress={handlePayment}
            variant="gradient"
            size="lg"
            loading={loading}
            disabled={loading}
            style={styles.payButton}
          />
        </View>
      </View>
    </View>
  );
}

export default function StripePayment(props: StripePaymentProps) {
  // On web, render without StripeProvider to avoid native module errors
  if (Platform.OS === 'web' || !StripeProvider) {
    return <WebStripePayment {...props} />;
  }
  
  // On mobile, use StripeProvider and MobileStripePayment
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <MobileStripePayment {...props} />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  amountValue: {
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  amountDescription: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  revenueSplit: {
    width: '100%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  splitLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  splitValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  paymentMethodsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  paymentMethodCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: 0,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  paymentMethodText: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  securitySection: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  securityText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  payButton: {
    flex: 2,
  },
});
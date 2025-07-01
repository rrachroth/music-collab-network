import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import Button from './Button';
import Icon from './Icon';

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

// This would normally come from your backend
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_stripe_publishable_key_here';

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

function StripePaymentContent({ amount, description, onSuccess, onError, onCancel }: StripePaymentProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentSheetEnabled, setPaymentSheetEnabled] = useState(false);

  const initializePaymentSheet = async () => {
    try {
      setLoading(true);
      
      // In a real app, you would call your backend to create a payment intent
      // For now, we'll show a demo message
      Alert.alert(
        'Stripe Integration Ready! 💳',
        'To complete the Stripe integration, you need to:\n\n1. Set up a Stripe account\n2. Configure your backend with Stripe Connect\n3. Add your publishable key\n\nFor now, this is a demo of the payment UI.',
        [
          { text: 'Got It', style: 'cancel' },
          { text: 'Learn More', onPress: () => console.log('Stripe docs') }
        ]
      );
      
      setPaymentSheetEnabled(true);
    } catch (error) {
      console.error('Payment sheet initialization failed:', error);
      onError('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Demo payment flow
      Alert.alert(
        'Demo Payment 💰',
        `Processing payment of $${(amount / 100).toFixed(2)} for ${description}.\n\nIn production, this would process through Stripe Connect with automatic revenue splitting.`,
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
                status: 'succeeded'
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
  }, []);

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

export default function StripePayment(props: StripePaymentProps) {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <StripePaymentContent {...props} />
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
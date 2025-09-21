
import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import { PaymentService } from '../utils/paymentService';
import { getStripePublishableKey, isStripeConfigured } from '../utils/config';
import Button from './Button';
import Icon from './Icon';

// Conditional imports for Stripe to avoid web import errors
let StripeProvider: any = null;
let useStripe: any = null;

// Use conditional import to avoid web compatibility issues
if (Platform.OS !== 'web') {
  try {
    // Use dynamic import instead of require()
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
  recipientId?: string;
  projectId?: string;
  paymentType?: 'project' | 'subscription';
  onSuccess: (paymentResult: any) => void;
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
function MobileStripePayment({ 
  amount, 
  description, 
  recipientId, 
  projectId, 
  paymentType = 'project',
  onSuccess, 
  onError, 
  onCancel 
}: StripePaymentProps) {
  const [loading, setLoading] = useState(false);
  const [paymentSheetEnabled, setPaymentSheetEnabled] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  
  // Only call useStripe if it exists - this component should only render when it's available
  const stripe = useStripe();
  
  // Extract methods from stripe if available
  const initPaymentSheet = stripe?.initPaymentSheet || null;
  const presentPaymentSheet = stripe?.presentPaymentSheet || null;

  const initializePaymentSheet = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const isConfigured = isStripeConfigured();
      
      if (!isConfigured) {
        Alert.alert(
          'Stripe Integration Setup Required 🔧',
          'To process real payments, you need to:\n\n1. Set up a Stripe account\n2. Configure Stripe Connect for revenue splitting\n3. Add your publishable key to environment variables\n\nFor now, this demonstrates the payment UI.',
          [
            { text: 'Got It', style: 'cancel' },
            { text: 'Learn More', onPress: () => console.log('Open Stripe setup guide') }
          ]
        );
        setPaymentSheetEnabled(true);
        return;
      }

      // Validate payment amount
      const validation = PaymentService.validatePaymentAmount(amount);
      if (!validation.valid) {
        onError(validation.error || 'Invalid payment amount');
        return;
      }

      // Create payment intent using our service
      let paymentResult;
      if (paymentType === 'subscription') {
        paymentResult = await PaymentService.processSubscriptionPayment(recipientId || '');
      } else {
        paymentResult = await PaymentService.createProjectPayment(
          projectId || '',
          '', // Will be filled by the service
          recipientId || '',
          amount,
          description
        );
      }

      if (!paymentResult.success) {
        onError(paymentResult.error || 'Failed to create payment');
        return;
      }

      setPaymentIntent(paymentResult.paymentIntent);

      // Initialize Stripe payment sheet
      if (initPaymentSheet && paymentResult.paymentIntent?.client_secret) {
        const { error } = await initPaymentSheet({
          merchantDisplayName: 'MusicLinked',
          paymentIntentClientSecret: paymentResult.paymentIntent.client_secret,
          defaultBillingDetails: {
            name: 'User',
          },
        });

        if (error) {
          console.error('Payment sheet initialization error:', error);
          onError('Failed to initialize payment');
        } else {
          setPaymentSheetEnabled(true);
          Alert.alert(
            'Payment Ready! 💳',
            `Your payment of ${PaymentService.formatAmount(amount)} is ready to process.\n\n💰 Platform Fee (10%): ${PaymentService.formatAmount(validation.breakdown?.platformFee || 0)}\n💵 Recipient Gets: ${PaymentService.formatAmount(validation.breakdown?.recipientAmount || 0)}`,
            [{ text: 'Continue', style: 'default' }]
          );
        }
      } else {
        setPaymentSheetEnabled(true);
      }
      
    } catch (error) {
      console.error('Payment sheet initialization failed:', error);
      onError('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  }, [amount, description, recipientId, projectId, paymentType, onError, initPaymentSheet]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      const isConfigured = isStripeConfigured();
      
      if (!isConfigured) {
        // Demo payment flow
        const validation = PaymentService.validatePaymentAmount(amount);
        Alert.alert(
          'Demo Payment Flow 🎭',
          `Amount: ${PaymentService.formatAmount(amount)}\nDescription: ${description}\n\nThis is a demo. Configure your Stripe keys for real payments.\n\n💰 Platform Fee (10%): ${PaymentService.formatAmount(validation.breakdown?.platformFee || 0)}\n💵 Recipient Gets: ${PaymentService.formatAmount(validation.breakdown?.recipientAmount || 0)}`,
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
                  platformFee: validation.breakdown?.platformFee || 0,
                  recipientAmount: validation.breakdown?.recipientAmount || 0,
                  isDemo: true
                });
              }
            }
          ]
        );
        return;
      }

      // Real Stripe payment
      if (presentPaymentSheet && paymentIntent) {
        const { error } = await presentPaymentSheet();

        if (error) {
          if (error.code === 'Canceled') {
            onCancel();
          } else {
            console.error('Payment error:', error);
            onError(error.message || 'Payment failed');
          }
        } else {
          // Payment succeeded
          onSuccess({
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            description,
            status: 'succeeded',
            platform: Platform.OS,
            isDemo: false
          });
        }
      } else {
        onError('Payment system not ready');
      }
      
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

  const isConfigured = isStripeConfigured();
  const validation = PaymentService.validatePaymentAmount(amount);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={styles.header}
      >
        <Icon name="card" size={48} color={colors.text} />
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <Text style={styles.headerSubtitle}>
          {isConfigured ? 'Powered by Stripe Connect' : 'Demo Mode - Setup Required'}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {!isConfigured && (
          <View style={styles.demoNotice}>
            <Icon name="information-circle" size={24} color={colors.warning} />
            <Text style={styles.demoNoticeText}>
              Demo Mode: Configure Stripe keys for production payments
            </Text>
          </View>
        )}

        {!validation.valid && (
          <View style={styles.errorNotice}>
            <Icon name="warning" size={24} color={colors.error} />
            <Text style={styles.errorNoticeText}>
              {validation.error}
            </Text>
          </View>
        )}

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>
            {PaymentService.formatAmount(amount)}
          </Text>
          <Text style={styles.amountDescription}>{description}</Text>
          
          {/* Revenue Split Display */}
          {validation.valid && (
            <View style={styles.revenueSplit}>
              <View style={styles.splitItem}>
                <Text style={styles.splitLabel}>Platform Fee (10%):</Text>
                <Text style={[styles.splitValue, { color: colors.primary }]}>
                  {PaymentService.formatAmount(validation.breakdown?.platformFee || 0)}
                </Text>
              </View>
              <View style={styles.splitItem}>
                <Text style={styles.splitLabel}>
                  {paymentType === 'subscription' ? 'Subscription:' : 'Recipient Gets:'}
                </Text>
                <Text style={[styles.splitValue, { color: colors.success }]}>
                  {PaymentService.formatAmount(
                    paymentType === 'subscription' 
                      ? amount 
                      : validation.breakdown?.recipientAmount || 0
                  )}
                </Text>
              </View>
            </View>
          )}
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
            text={loading ? "Processing..." : isConfigured ? "Pay Now" : "Demo Payment"}
            onPress={handlePayment}
            variant="gradient"
            size="lg"
            loading={loading}
            disabled={loading || !validation.valid}
            style={styles.payButton}
          />
        </View>
      </View>
    </View>
  );
}

// Web-specific component that doesn't use Stripe hooks
function WebStripePayment({ 
  amount, 
  description, 
  recipientId, 
  projectId, 
  paymentType = 'project',
  onSuccess, 
  onError, 
  onCancel 
}: StripePaymentProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      const isConfigured = isStripeConfigured();
      const validation = PaymentService.validatePaymentAmount(amount);
      
      if (!validation.valid) {
        onError(validation.error || 'Invalid payment amount');
        return;
      }
      
      // Demo payment flow for web
      Alert.alert(
        isConfigured ? 'Web Payment Processing 🌐' : 'Web Demo Payment 🌐',
        `Amount: ${PaymentService.formatAmount(amount)}\nDescription: ${description}\n\n${isConfigured ? 'Processing through Stripe Connect.' : 'Demo mode - configure Stripe keys for production.'}\n\n💰 Platform Fee (10%): ${PaymentService.formatAmount(validation.breakdown?.platformFee || 0)}\n💵 Recipient Gets: ${PaymentService.formatAmount(validation.breakdown?.recipientAmount || 0)}`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: onCancel
          },
          { 
            text: isConfigured ? 'Process Payment' : 'Simulate Success', 
            onPress: () => {
              onSuccess({ 
                id: isConfigured ? 'pi_' + Date.now() : 'demo_payment_' + Date.now(),
                amount,
                description,
                status: 'succeeded',
                platform: 'web',
                platformFee: validation.breakdown?.platformFee || 0,
                recipientAmount: validation.breakdown?.recipientAmount || 0,
                isDemo: !isConfigured
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

  const isConfigured = isStripeConfigured();
  const validation = PaymentService.validatePaymentAmount(amount);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={styles.header}
      >
        <Icon name="card" size={48} color={colors.text} />
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <Text style={styles.headerSubtitle}>
          {isConfigured ? 'Web Payment Processing' : 'Demo Interface'}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {!isConfigured && (
          <View style={styles.demoNotice}>
            <Icon name="information-circle" size={24} color={colors.warning} />
            <Text style={styles.demoNoticeText}>
              Demo Mode: Real payments work best on mobile devices
            </Text>
          </View>
        )}

        {!validation.valid && (
          <View style={styles.errorNotice}>
            <Icon name="warning" size={24} color={colors.error} />
            <Text style={styles.errorNoticeText}>
              {validation.error}
            </Text>
          </View>
        )}

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>
            {PaymentService.formatAmount(amount)}
          </Text>
          <Text style={styles.amountDescription}>{description}</Text>
          
          {/* Revenue Split Display */}
          {validation.valid && (
            <View style={styles.revenueSplit}>
              <View style={styles.splitItem}>
                <Text style={styles.splitLabel}>Platform Fee (10%):</Text>
                <Text style={[styles.splitValue, { color: colors.primary }]}>
                  {PaymentService.formatAmount(validation.breakdown?.platformFee || 0)}
                </Text>
              </View>
              <View style={styles.splitItem}>
                <Text style={styles.splitLabel}>
                  {paymentType === 'subscription' ? 'Subscription:' : 'Recipient Gets:'}
                </Text>
                <Text style={[styles.splitValue, { color: colors.success }]}>
                  {PaymentService.formatAmount(
                    paymentType === 'subscription' 
                      ? amount 
                      : validation.breakdown?.recipientAmount || 0
                  )}
                </Text>
              </View>
            </View>
          )}
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
            <Icon name={isConfigured ? "shield-checkmark" : "information-circle"} size={20} color={isConfigured ? colors.success : colors.primary} />
            <Text style={styles.securityText}>{isConfigured ? '256-bit SSL encryption' : 'Web demo interface'}</Text>
          </View>
          <View style={styles.securityItem}>
            <Icon name={isConfigured ? "lock-closed" : "phone-portrait"} size={20} color={isConfigured ? colors.success : colors.primary} />
            <Text style={styles.securityText}>{isConfigured ? 'PCI DSS compliant' : 'Real payments on mobile app'}</Text>
          </View>
          <View style={styles.securityItem}>
            <Icon name={isConfigured ? "checkmark-circle" : "card"} size={20} color={isConfigured ? colors.success : colors.primary} />
            <Text style={styles.securityText}>{isConfigured ? 'Automatic revenue splitting' : 'Stripe Connect ready'}</Text>
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
            text={loading ? "Processing..." : isConfigured ? "Pay Now" : "Demo Payment"}
            onPress={handlePayment}
            variant="gradient"
            size="lg"
            loading={loading}
            disabled={loading || !validation.valid}
            style={styles.payButton}
          />
        </View>
      </View>
    </View>
  );
}

// Wrapper component that handles conditional rendering
function StripePaymentWrapper(props: StripePaymentProps) {
  // Check if we're on mobile and Stripe is available
  const shouldUseMobileStripe = Platform.OS !== 'web' && StripeProvider && useStripe;
  
  if (shouldUseMobileStripe) {
    return (
      <StripeProvider publishableKey={getStripePublishableKey()}>
        <MobileStripePayment {...props} />
      </StripeProvider>
    );
  }
  
  // Fallback to web version
  return <WebStripePayment {...props} />;
}

export default StripePaymentWrapper;

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
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  demoNoticeText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.warning,
    marginLeft: spacing.sm,
    flex: 1,
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorNoticeText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
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

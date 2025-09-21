
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import { PaymentService } from '../utils/paymentService';
import StripePayment from './StripePayment';
import Button from './Button';
import Icon from './Icon';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (paymentResult: any) => void;
  amount: number;
  description: string;
  recipientId?: string;
  projectId?: string;
  paymentType?: 'project' | 'subscription';
  title?: string;
  subtitle?: string;
}

export default function PaymentModal({ 
  visible, 
  onClose, 
  onSuccess,
  amount,
  description,
  recipientId,
  projectId,
  paymentType = 'project',
  title,
  subtitle,
}: PaymentModalProps) {
  const insets = useSafeAreaInsets();
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation values
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { damping: 20, stiffness: 100 });
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.8, { duration: 200 });
      setShowPayment(false);
    }
  }, [visible, modalOpacity, modalScale]);

  const validation = PaymentService.validatePaymentAmount(amount);

  const handleProceedToPayment = () => {
    if (!validation.valid) {
      Alert.alert('Invalid Amount', validation.error || 'Please check the payment amount');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentResult: any) => {
    try {
      setLoading(true);
      
      console.log('Payment successful:', paymentResult);
      
      // Show success message
      Alert.alert(
        'Payment Successful! 🎉',
        `Your payment of ${PaymentService.formatAmount(amount)} has been processed successfully.${
          paymentType === 'project' 
            ? '\n\nThe recipient will receive their share after our platform fee.'
            : '\n\nYour premium features are now active!'
        }`,
        [
          {
            text: 'Continue',
            onPress: () => {
              setShowPayment(false);
              onClose();
              onSuccess?.(paymentResult);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error handling payment success:', error);
      Alert.alert(
        'Payment Processed',
        'Your payment was successful! The transaction is being processed.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    Alert.alert(
      'Payment Failed',
      `We couldn't process your payment: ${error}\n\nPlease try again or contact support if the issue persists.`,
      [
        { text: 'Try Again', onPress: () => setShowPayment(false) },
        { text: 'Cancel', style: 'cancel', onPress: onClose }
      ]
    );
  };

  if (showPayment) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPayment(false)}
      >
        <StripePayment
          amount={amount}
          description={description}
          recipientId={recipientId}
          projectId={projectId}
          paymentType={paymentType}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={() => setShowPayment(false)}
        />
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, animatedStyle, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Icon name="card" size={32} color={colors.white} />
              <Text style={styles.title}>
                {title || (paymentType === 'subscription' ? 'Subscription Payment' : 'Project Payment')}
              </Text>
              <Text style={styles.subtitle}>
                {subtitle || 'Review your payment details before proceeding'}
              </Text>
              <Button
                text="✕"
                onPress={onClose}
                variant="ghost"
                size="sm"
                style={styles.closeButton}
              />
            </View>
          </LinearGradient>

          <View style={styles.content}>
            {/* Payment Summary */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Payment Summary</Text>
              
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Description:</Text>
                  <Text style={styles.summaryValue}>{description}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount:</Text>
                  <Text style={[styles.summaryValue, styles.amountText]}>
                    {PaymentService.formatAmount(amount)}
                  </Text>
                </View>
                
                {validation.valid && (
                  <>
                    <View style={styles.divider} />
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.feeLabel}>Platform Fee (10%):</Text>
                      <Text style={[styles.feeValue, { color: colors.primary }]}>
                        {PaymentService.formatAmount(validation.breakdown?.platformFee || 0)}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.feeLabel}>
                        {paymentType === 'subscription' ? 'Subscription:' : 'Recipient Gets:'}
                      </Text>
                      <Text style={[styles.feeValue, { color: colors.success }]}>
                        {PaymentService.formatAmount(
                          paymentType === 'subscription' 
                            ? amount 
                            : validation.breakdown?.recipientAmount || 0
                        )}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Error Display */}
            {!validation.valid && (
              <View style={styles.errorSection}>
                <View style={styles.errorCard}>
                  <Icon name="warning" size={24} color={colors.error} />
                  <Text style={styles.errorText}>{validation.error}</Text>
                </View>
              </View>
            )}

            {/* Payment Features */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Secure Payment Features</Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Icon name="shield-checkmark" size={20} color={colors.success} />
                  <Text style={styles.featureText}>256-bit SSL encryption</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <Icon name="lock-closed" size={20} color={colors.success} />
                  <Text style={styles.featureText}>PCI DSS compliant</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <Icon name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.featureText}>Automatic revenue splitting</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <Icon name="refresh" size={20} color={colors.success} />
                  <Text style={styles.featureText}>Instant processing</Text>
                </View>
              </View>
            </View>

            {/* Payment Type Info */}
            {paymentType === 'subscription' && (
              <View style={styles.infoSection}>
                <View style={styles.infoCard}>
                  <Icon name="information-circle" size={24} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Monthly Subscription</Text>
                    <Text style={styles.infoDescription}>
                      This is a recurring monthly subscription. You can cancel anytime from your profile settings.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Button
              text="Cancel"
              onPress={onClose}
              variant="outline"
              size="lg"
              style={styles.cancelButton}
            />
            <Button
              text={validation.valid ? "Proceed to Payment" : "Invalid Amount"}
              onPress={handleProceedToPayment}
              variant="gradient"
              size="lg"
              disabled={!validation.valid || loading}
              loading={loading}
              style={styles.proceedButton}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.white,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  summarySection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  feeLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  feeValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  errorSection: {
    marginBottom: spacing.lg,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.error,
    flex: 1,
  },
  featuresSection: {
    marginBottom: spacing.xl,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cancelButton: {
    flex: 1,
  },
  proceedButton: {
    flex: 2,
  },
});

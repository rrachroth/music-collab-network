import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import Button from './Button';
import Icon from './Icon';
import StripePayment from './StripePayment';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  recipientName?: string;
  onSuccess?: (paymentResult: any) => void;
}

export default function PaymentModal({ 
  visible, 
  onClose, 
  amount, 
  description, 
  recipientName,
  onSuccess 
}: PaymentModalProps) {
  const insets = useSafeAreaInsets();
  const [showStripePayment, setShowStripePayment] = useState(false);
  
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.9);

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
      transform: [{ scale: modalScale.value }],
    };
  });

  React.useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { damping: 15 });
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible]);

  const handlePaymentSuccess = (paymentResult: any) => {
    console.log('✅ Payment successful:', paymentResult);
    
    Alert.alert(
      'Payment Successful! 🎉',
      `Your payment of $${(amount / 100).toFixed(2)} has been processed successfully.${recipientName ? ` ${recipientName} will receive their share automatically.` : ''}`,
      [
        {
          text: 'Great!',
          onPress: () => {
            onSuccess?.(paymentResult);
            onClose();
          }
        }
      ]
    );
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Payment error:', error);
    Alert.alert('Payment Failed', error);
  };

  if (showStripePayment) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <StripePayment
            amount={amount}
            description={description}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={() => setShowStripePayment(false)}
          />
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, modalAnimatedStyle]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Icon name="card" size={32} color={colors.primary} />
              </View>
              <Text style={styles.title}>Payment Required</Text>
              <Text style={styles.subtitle}>
                Secure payment powered by Stripe
              </Text>
            </View>

            {/* Payment Details */}
            <View style={styles.paymentDetails}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Amount:</Text>
                <Text style={styles.amountValue}>
                  ${(amount / 100).toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.descriptionRow}>
                <Text style={styles.descriptionLabel}>For:</Text>
                <Text style={styles.descriptionValue}>{description}</Text>
              </View>

              {recipientName && (
                <View style={styles.recipientRow}>
                  <Text style={styles.recipientLabel}>Recipient:</Text>
                  <Text style={styles.recipientValue}>{recipientName}</Text>
                </View>
              )}
            </View>

            {/* Revenue Split Info */}
            <View style={styles.revenueSplitInfo}>
              <View style={styles.revenueSplitHeader}>
                <Icon name="pie-chart" size={20} color={colors.primary} />
                <Text style={styles.revenueSplitTitle}>Automatic Revenue Split</Text>
              </View>
              <Text style={styles.revenueSplitText}>
                Platform fee: 15% • Artist share: 85%
              </Text>
              <Text style={styles.revenueSplitSubtext}>
                Payments are processed securely and split automatically
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                text="Cancel"
                onPress={onClose}
                variant="outline"
                size="lg"
                style={styles.cancelButton}
              />
              <Button
                text="Pay with Stripe"
                onPress={() => setShowStripePayment(true)}
                variant="gradient"
                size="lg"
                style={styles.payButton}
                icon={<Icon name="card" size={20} color={colors.text} />}
                iconPosition="left"
              />
            </View>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Icon name="shield-checkmark" size={16} color={colors.success} />
              <Text style={styles.securityText}>
                Your payment information is encrypted and secure
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  modalContent: {
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
  paymentDetails: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  amountLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  amountValue: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  descriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  descriptionLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    marginRight: spacing.md,
  },
  descriptionValue: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  recipientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipientLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  recipientValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  revenueSplitInfo: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  revenueSplitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  revenueSplitTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  revenueSplitText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  revenueSplitSubtext: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  payButton: {
    flex: 2,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});
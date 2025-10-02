
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, Platform } from 'react-native';
import { useSafePaymentSheet, isStripeAvailable, getPlatformPaymentMessage } from '../utils/stripeUtils';
import { PaymentService } from '../utils/paymentService';
import Button from './Button';
import { commonStyles, colors, spacing, borderRadius } from '../styles/commonStyles';

interface StripePaymentProps {
  amount: number;
  description: string;
  recipientId: string;
  projectId?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const StripePayment: React.FC<StripePaymentProps> = ({
  amount,
  description,
  recipientId,
  projectId,
  onSuccess,
  onError,
  onCancel,
}) => {
  const { initPaymentSheet, presentPaymentSheet, loading } = useSafePaymentSheet();
  const [isReady, setIsReady] = useState(false);
  const [platformMessage, setPlatformMessage] = useState('');

  useEffect(() => {
    setPlatformMessage(getPlatformPaymentMessage());
    
    if (isStripeAvailable()) {
      initializePaymentSheet();
    } else {
      console.log('ℹ️ Stripe not available, using platform message');
    }
  }, [amount, recipientId, projectId]);

  const initializePaymentSheet = useCallback(async () => {
    try {
      console.log('🔧 Initializing payment sheet for amount:', amount);
      
      // Create payment intent via our payment service
      const paymentIntent = await PaymentService.createProjectPayment(
        projectId || 'unknown',
        'current-user', // This should be replaced with actual current user ID
        recipientId,
        amount,
        description
      );

      if (!paymentIntent.success || !paymentIntent.clientSecret) {
        throw new Error(paymentIntent.error || 'Failed to create payment intent');
      }

      // Initialize the payment sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'MusicLinked',
        paymentIntentClientSecret: paymentIntent.clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'MusicLinked User',
        },
      });

      if (error) {
        console.error('❌ Payment sheet initialization error:', error);
        onError?.(error.message);
      } else {
        console.log('✅ Payment sheet initialized successfully');
        setIsReady(true);
      }
    } catch (error) {
      console.error('❌ Payment initialization error:', error);
      onError?.(error instanceof Error ? error.message : 'Payment initialization failed');
    }
  }, [amount, recipientId, projectId, description, initPaymentSheet, onError]);

  const handlePayment = useCallback(async () => {
    if (!isStripeAvailable()) {
      Alert.alert(
        'Payment Not Available',
        platformMessage,
        [{ text: 'OK', onPress: onCancel }]
      );
      return;
    }

    if (!isReady) {
      Alert.alert('Payment Not Ready', 'Please wait for payment to initialize.');
      return;
    }

    try {
      console.log('💳 Presenting payment sheet...');
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          console.log('ℹ️ Payment cancelled by user');
          onCancel?.();
        } else {
          console.error('❌ Payment error:', error);
          onError?.(error.message);
        }
      } else {
        console.log('✅ Payment completed successfully');
        onSuccess?.({ success: true });
      }
    } catch (error) {
      console.error('❌ Payment presentation error:', error);
      onError?.(error instanceof Error ? error.message : 'Payment failed');
    }
  }, [isReady, presentPaymentSheet, onSuccess, onError, onCancel, platformMessage]);

  if (!isStripeAvailable()) {
    return (
      <View style={styles.container}>
        <Text style={styles.platformMessage}>{platformMessage}</Text>
        <Button
          title="OK"
          onPress={onCancel}
          variant="secondary"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.paymentInfo}>
        <Text style={styles.amountText}>${(amount / 100).toFixed(2)}</Text>
        <Text style={styles.descriptionText}>{description}</Text>
      </View>
      
      <Button
        title={loading ? 'Processing...' : 'Pay Now'}
        onPress={handlePayment}
        disabled={loading || !isReady}
        variant="primary"
      />
      
      {onCancel && (
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="secondary"
          style={styles.cancelButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  paymentInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  platformMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
});

export default StripePayment;

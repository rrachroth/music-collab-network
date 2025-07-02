import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from './Button';
import Icon from './Icon';
import StripePayment from './StripePayment';
import { SubscriptionService, SUBSCRIPTION_PLANS } from '../utils/subscriptionService';
import { PaymentService } from '../utils/paymentService';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FeatureComparisonProps {
  feature: string;
  free: string | boolean;
  premium: string | boolean;
  icon: string;
}

function FeatureComparison({ feature, free, premium, icon }: FeatureComparisonProps) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureInfo}>
        <Icon name={icon as any} size={20} color={colors.primary} />
        <Text style={styles.featureText}>{feature}</Text>
      </View>
      <View style={styles.featureValues}>
        <Text style={styles.freeValue}>
          {typeof free === 'boolean' ? (free ? '✓' : '✗') : free}
        </Text>
        <Text style={styles.premiumValue}>
          {typeof premium === 'boolean' ? (premium ? '✓' : '✗') : premium}
        </Text>
      </View>
    </View>
  );
}

export default function SubscriptionModal({ visible, onClose, onSuccess }: SubscriptionModalProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const insets = useSafeAreaInsets();

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { damping: 20, stiffness: 300 });
      loadSubscriptionStatus();
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible, modalOpacity, modalScale]); // Added missing dependencies

  const loadSubscriptionStatus = async () => {
    try {
      const status = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  const handleUpgrade = () => {
    if (subscriptionStatus?.isPremium) {
      Alert.alert(
        'Already Premium! 🎉',
        'You already have an active Premium subscription with unlimited features.',
        [{ text: 'Got It', style: 'default' }]
      );
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentResult: any) => {
    try {
      setLoading(true);
      
      // In a real implementation, you would:
      // 1. Verify the payment with your backend
      // 2. Update the user's subscription status
      // 3. Handle Stripe Connect setup for revenue splitting
      
      // For demo purposes, we'll simulate the upgrade
      Alert.alert(
        'Upgrade Successful! 🎉',
        'Welcome to Muse Premium! You now have unlimited project postings and likes. Your subscription will be processed through Stripe Connect.',
        [
          {
            text: 'Awesome!',
            onPress: () => {
              setShowPayment(false);
              onSuccess?.();
              onClose();
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error processing upgrade:', error);
      Alert.alert('Error', 'Failed to process upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    Alert.alert('Payment Error', error);
    setShowPayment(false);
  };

  if (showPayment) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <StripePayment
          amount={SUBSCRIPTION_PLANS.PREMIUM.price}
          description="Muse Premium Subscription - Monthly"
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
        <Animated.View style={[styles.modal, modalStyle, { paddingTop: insets.top }]}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.header}
            >
              <View style={styles.headerTop}>
                <Text style={styles.headerTitle}>Upgrade to Premium</Text>
                <Button
                  text=""
                  onPress={onClose}
                  style={styles.closeButton}
                  variant="ghost"
                >
                  <Icon name="close" size={24} color={colors.text} />
                </Button>
              </View>
              <Text style={styles.headerSubtitle}>
                Unlock unlimited features and support independent musicians
              </Text>
            </LinearGradient>

            {/* Current Status */}
            {subscriptionStatus && (
              <View style={styles.statusSection}>
                <View style={styles.statusCard}>
                  <View style={styles.statusHeader}>
                    <Icon 
                      name={subscriptionStatus.isPremium ? "diamond" : "person"} 
                      size={24} 
                      color={subscriptionStatus.isPremium ? colors.warning : colors.primary} 
                    />
                    <Text style={styles.statusTitle}>
                      Current Plan: {subscriptionStatus.plan}
                    </Text>
                  </View>
                  
                  {subscriptionStatus.usage && (
                    <View style={styles.usageStats}>
                      <View style={styles.usageStat}>
                        <Text style={styles.usageLabel}>Projects this month</Text>
                        <Text style={styles.usageValue}>
                          {subscriptionStatus.isPremium 
                            ? 'Unlimited' 
                            : `${subscriptionStatus.usage.projectsPostedThisMonth}/${subscriptionStatus.limits.projectsPerMonth}`
                          }
                        </Text>
                      </View>
                      <View style={styles.usageStat}>
                        <Text style={styles.usageLabel}>Likes today</Text>
                        <Text style={styles.usageValue}>
                          {subscriptionStatus.isPremium 
                            ? 'Unlimited' 
                            : `${subscriptionStatus.usage.likesUsedToday}/${subscriptionStatus.limits.likesPerDay}`
                          }
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Pricing */}
            <View style={styles.pricingSection}>
              <View style={styles.priceCard}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.priceHeader}
                >
                  <Icon name="diamond" size={32} color="#000" />
                  <Text style={styles.priceTitle}>Premium</Text>
                  <Text style={styles.priceAmount}>$12/month</Text>
                </LinearGradient>
                
                <View style={styles.priceFeatures}>
                  <View style={styles.priceFeature}>
                    <Icon name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.priceFeatureText}>Unlimited project postings</Text>
                  </View>
                  <View style={styles.priceFeature}>
                    <Icon name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.priceFeatureText}>Unlimited likes & matches</Text>
                  </View>
                  <View style={styles.priceFeature}>
                    <Icon name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.priceFeatureText}>Priority support</Text>
                  </View>
                  <View style={styles.priceFeature}>
                    <Icon name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.priceFeatureText}>Advanced analytics</Text>
                  </View>
                  <View style={styles.priceFeature}>
                    <Icon name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.priceFeatureText}>Revenue splitting tools</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Feature Comparison */}
            <View style={styles.comparisonSection}>
              <Text style={styles.comparisonTitle}>Feature Comparison</Text>
              
              <View style={styles.comparisonHeader}>
                <Text style={styles.comparisonFeatureHeader}>Feature</Text>
                <Text style={styles.comparisonPlanHeader}>Free</Text>
                <Text style={styles.comparisonPlanHeader}>Premium</Text>
              </View>

              <FeatureComparison
                feature="Project Postings"
                free="1/month"
                premium="Unlimited"
                icon="briefcase"
              />
              <FeatureComparison
                feature="Daily Likes"
                free="3/day"
                premium="Unlimited"
                icon="heart"
              />
              <FeatureComparison
                feature="Revenue Splitting"
                free={true}
                premium={true}
                icon="card"
              />
              <FeatureComparison
                feature="Analytics Dashboard"
                free={false}
                premium={true}
                icon="analytics"
              />
              <FeatureComparison
                feature="Priority Support"
                free={false}
                premium={true}
                icon="headset"
              />
              <FeatureComparison
                feature="Advanced Matching"
                free={false}
                premium={true}
                icon="people"
              />
            </View>

            {/* Revenue Info */}
            <View style={styles.revenueSection}>
              <LinearGradient
                colors={colors.gradientBackground}
                style={styles.revenueCard}
              >
                <Icon name="information-circle" size={24} color={colors.primary} />
                <Text style={styles.revenueTitle}>How Revenue Splitting Works</Text>
                <Text style={styles.revenueText}>
                  When you get paid for projects on Muse, we automatically handle the payment processing and take a 10% platform fee. The remaining 90% goes directly to you through Stripe Connect.
                </Text>
                <View style={styles.revenueExample}>
                  <Text style={styles.revenueExampleTitle}>Example:</Text>
                  <Text style={styles.revenueExampleText}>
                    • Project payment: $100{'\n'}
                    • Platform fee (10%): $10{'\n'}
                    • You receive: $90
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                text="Maybe Later"
                onPress={onClose}
                variant="outline"
                size="lg"
                style={styles.laterButton}
              />
              <Button
                text={subscriptionStatus?.isPremium ? "Already Premium!" : "Upgrade Now"}
                onPress={handleUpgrade}
                variant="gradient"
                size="lg"
                loading={loading}
                disabled={loading || subscriptionStatus?.isPremium}
                style={styles.upgradeButton}
              />
            </View>
          </ScrollView>
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
    maxHeight: '90%',
    ...shadows.lg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.xl,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    opacity: 0.9,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusSection: {
    padding: spacing.lg,
  },
  statusCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageStat: {
    flex: 1,
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  usageValue: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  pricingSection: {
    padding: spacing.lg,
  },
  priceCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  priceHeader: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  priceTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginTop: spacing.sm,
  },
  priceAmount: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginTop: spacing.xs,
  },
  priceFeatures: {
    padding: spacing.lg,
  },
  priceFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceFeatureText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  comparisonSection: {
    padding: spacing.lg,
  },
  comparisonTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  comparisonFeatureHeader: {
    flex: 2,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  comparisonPlanHeader: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  featureInfo: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  featureValues: {
    flex: 1,
    flexDirection: 'row',
  },
  freeValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    textAlign: 'center',
  },
  premiumValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.success,
    textAlign: 'center',
  },
  revenueSection: {
    padding: spacing.lg,
  },
  revenueCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  revenueTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  revenueText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  revenueExample: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    width: '100%',
  },
  revenueExampleTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  revenueExampleText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  laterButton: {
    flex: 1,
  },
  upgradeButton: {
    flex: 2,
  },
});
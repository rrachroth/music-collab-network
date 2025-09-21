
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Alert, ScrollView } from 'react-native';
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
import { SubscriptionService, SUBSCRIPTION_PLANS } from '../utils/subscriptionService';
import StripePayment from './StripePayment';
import Button from './Button';
import Icon from './Icon';

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
  const insets = useSafeAreaInsets();
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

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
      loadSubscriptionStatus();
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.8, { duration: 200 });
      setShowPayment(false);
    }
  }, [visible, modalOpacity, modalScale]);

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
        'Already Premium! 🌟',
        'You already have a premium subscription. Enjoy unlimited access to all features!',
        [{ text: 'Got it!' }]
      );
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentResult: any) => {
    try {
      setLoading(true);
      
      console.log('Subscription payment successful:', paymentResult);
      
      // The webhook will handle updating the subscription status
      // For now, we'll show a success message
      Alert.alert(
        'Welcome to Premium! 🎉',
        'Your subscription has been activated successfully. You now have unlimited access to all features!\n\n• Unlimited projects\n• Unlimited likes\n• Unlimited applications\n• Priority support',
        [
          {
            text: 'Start Using Premium',
            onPress: () => {
              setShowPayment(false);
              onClose();
              onSuccess?.();
            }
          }
        ]
      );

      // Refresh subscription status
      await loadSubscriptionStatus();
      
    } catch (error) {
      console.error('Error handling payment success:', error);
      Alert.alert(
        'Payment Processed',
        'Your payment was successful! Your premium features will be activated shortly.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Subscription payment error:', error);
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
          amount={SUBSCRIPTION_PLANS.PREMIUM.price}
          description="MusicLinked Premium Subscription - Monthly"
          paymentType="subscription"
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
              <Text style={styles.title}>Upgrade to Premium</Text>
              <Text style={styles.subtitle}>
                Unlock unlimited features and take your music career to the next level
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

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Current Status */}
            {subscriptionStatus && (
              <View style={styles.statusSection}>
                <View style={styles.statusCard}>
                  <Icon 
                    name={subscriptionStatus.isPremium ? "star" : "person"} 
                    size={24} 
                    color={subscriptionStatus.isPremium ? colors.warning : colors.primary} 
                  />
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusTitle}>
                      Current Plan: {subscriptionStatus.plan}
                    </Text>
                    {subscriptionStatus.isPremium && subscriptionStatus.expiresAt && (
                      <Text style={styles.statusExpiry}>
                        Expires: {new Date(subscriptionStatus.expiresAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Pricing */}
            <View style={styles.pricingSection}>
              <View style={styles.priceCard}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.priceHeader}
                >
                  <Icon name="star" size={32} color={colors.white} />
                  <Text style={styles.planName}>Premium</Text>
                  <Text style={styles.planPrice}>
                    {PaymentService.formatAmount(SUBSCRIPTION_PLANS.PREMIUM.price)}/month
                  </Text>
                </LinearGradient>
                
                <View style={styles.priceFeatures}>
                  <View style={styles.priceFeature}>
                    <Icon name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.priceFeatureText}>Unlimited projects</Text>
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
                </View>
              </View>
            </View>

            {/* Feature Comparison */}
            <View style={styles.comparisonSection}>
              <Text style={styles.comparisonTitle}>Feature Comparison</Text>
              
              <View style={styles.comparisonHeader}>
                <Text style={styles.featureHeaderText}>Feature</Text>
                <View style={styles.planHeaders}>
                  <Text style={styles.planHeaderText}>Free</Text>
                  <Text style={styles.planHeaderText}>Premium</Text>
                </View>
              </View>

              <FeatureComparison
                feature="Projects per month"
                free="1"
                premium="Unlimited"
                icon="folder"
              />
              
              <FeatureComparison
                feature="Likes per day"
                free="5"
                premium="Unlimited"
                icon="heart"
              />
              
              <FeatureComparison
                feature="Applications per month"
                free="1"
                premium="Unlimited"
                icon="paper-plane"
              />
              
              <FeatureComparison
                feature="Priority support"
                free={false}
                premium={true}
                icon="headset"
              />
              
              <FeatureComparison
                feature="Advanced analytics"
                free={false}
                premium={true}
                icon="analytics"
              />
              
              <FeatureComparison
                feature="Custom branding"
                free={false}
                premium="Coming soon"
                icon="brush"
              />
            </View>

            {/* Usage Stats */}
            {subscriptionStatus?.usage && !subscriptionStatus.isPremium && (
              <View style={styles.usageSection}>
                <Text style={styles.usageTitle}>Your Current Usage</Text>
                
                <View style={styles.usageCard}>
                  <View style={styles.usageItem}>
                    <Icon name="folder" size={20} color={colors.primary} />
                    <Text style={styles.usageText}>
                      Projects: {subscriptionStatus.usage.projectsPostedThisMonth}/1 this month
                    </Text>
                  </View>
                  
                  <View style={styles.usageItem}>
                    <Icon name="heart" size={20} color={colors.primary} />
                    <Text style={styles.usageText}>
                      Likes: {subscriptionStatus.usage.likesUsedToday}/5 today
                    </Text>
                  </View>
                  
                  <View style={styles.usageItem}>
                    <Icon name="paper-plane" size={20} color={colors.primary} />
                    <Text style={styles.usageText}>
                      Applications: {subscriptionStatus.usage.applicationsThisMonth}/1 this month
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Benefits */}
            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>Why Upgrade?</Text>
              
              <View style={styles.benefitCard}>
                <Icon name="rocket" size={24} color={colors.primary} />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Accelerate Your Career</Text>
                  <Text style={styles.benefitDescription}>
                    Connect with more artists, apply to unlimited projects, and build your network faster
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitCard}>
                <Icon name="trending-up" size={24} color={colors.success} />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Track Your Growth</Text>
                  <Text style={styles.benefitDescription}>
                    Get detailed analytics on your profile views, match rates, and collaboration success
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitCard}>
                <Icon name="shield-checkmark" size={24} color={colors.warning} />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Priority Support</Text>
                  <Text style={styles.benefitDescription}>
                    Get faster response times and dedicated support for all your questions
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Button
              text="Maybe Later"
              onPress={onClose}
              variant="outline"
              size="lg"
              style={styles.laterButton}
            />
            <Button
              text={subscriptionStatus?.isPremium ? "Already Premium ✓" : "Upgrade Now"}
              onPress={handleUpgrade}
              variant="gradient"
              size="lg"
              disabled={subscriptionStatus?.isPremium || loading}
              loading={loading}
              style={styles.upgradeButton}
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
    maxHeight: '90%',
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
  },
  statusSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  statusInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  statusExpiry: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  pricingSection: {
    marginBottom: spacing.xl,
  },
  priceCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  priceHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  planName: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.white,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  planPrice: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: colors.white,
  },
  priceFeatures: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  priceFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priceFeatureText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
  },
  comparisonSection: {
    marginBottom: spacing.xl,
  },
  comparisonTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  featureHeaderText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  planHeaders: {
    flexDirection: 'row',
    width: 120,
  },
  planHeaderText: {
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
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  featureInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
  },
  featureValues: {
    flexDirection: 'row',
    width: 120,
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
    color: colors.primary,
    textAlign: 'center',
  },
  usageSection: {
    marginBottom: spacing.xl,
  },
  usageTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  usageCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  usageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  usageText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
  },
  benefitsSection: {
    marginBottom: spacing.xl,
  },
  benefitsTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  benefitDescription: {
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
  laterButton: {
    flex: 1,
  },
  upgradeButton: {
    flex: 2,
  },
});

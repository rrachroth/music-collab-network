import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from './Button';
import Icon from './Icon';
import { STRIPE_SETUP_GUIDE } from '../utils/stripeSetupGuide';

interface PaymentInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

interface StepCardProps {
  step: any;
  index: number;
}

function StepCard({ step, index }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.stepCard}>
      <TouchableOpacity 
        style={styles.stepHeader} 
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.stepInfo}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>
        <Icon 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.textMuted} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.stepDetails}>
          {step.details.map((detail: string, detailIndex: number) => (
            <View key={detailIndex} style={styles.stepDetailItem}>
              <Icon name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.stepDetailText}>{detail}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function PaymentInfoModal({ visible, onClose }: PaymentInfoModalProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'setup' | 'revenue' | 'subscription'>('setup');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Stripe Payment Setup</Text>
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
            Complete guide to integrate payments with 10% platform fee
          </Text>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'setup' && styles.tabActive]}
            onPress={() => setActiveTab('setup')}
          >
            <Text style={[styles.tabText, activeTab === 'setup' && styles.tabTextActive]}>
              Setup Guide
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'revenue' && styles.tabActive]}
            onPress={() => setActiveTab('revenue')}
          >
            <Text style={[styles.tabText, activeTab === 'revenue' && styles.tabTextActive]}>
              Revenue Split
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'subscription' && styles.tabActive]}
            onPress={() => setActiveTab('subscription')}
          >
            <Text style={[styles.tabText, activeTab === 'subscription' && styles.tabTextActive]}>
              Subscriptions
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'setup' && (
            <View>
              <Text style={styles.sectionTitle}>Setup Steps</Text>
              <Text style={styles.sectionDescription}>
                Follow these steps to integrate Stripe Connect with your NextDrop app
              </Text>
              
              {STRIPE_SETUP_GUIDE.steps.map((step, index) => (
                <StepCard key={index} step={step} index={index} />
              ))}

              <View style={styles.codeSection}>
                <Text style={styles.codeTitle}>Backend Example (Node.js)</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {STRIPE_SETUP_GUIDE.codeExamples.backendPaymentIntent}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'revenue' && (
            <View>
              <Text style={styles.sectionTitle}>
                {STRIPE_SETUP_GUIDE.platformFeeExplanation.title}
              </Text>
              <Text style={styles.sectionDescription}>
                {STRIPE_SETUP_GUIDE.platformFeeExplanation.description}
              </Text>

              <View style={styles.revenueCard}>
                <LinearGradient
                  colors={colors.gradientBackground}
                  style={styles.revenueCardGradient}
                >
                  <Icon name="card" size={32} color={colors.primary} />
                  <Text style={styles.revenueCardTitle}>Revenue Split Example</Text>
                  
                  <View style={styles.revenueExample}>
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>Project Payment:</Text>
                      <Text style={styles.revenueValue}>$100.00</Text>
                    </View>
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>Platform Fee (10%):</Text>
                      <Text style={[styles.revenueValue, { color: colors.primary }]}>$10.00</Text>
                    </View>
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>Artist Receives:</Text>
                      <Text style={[styles.revenueValue, { color: colors.success }]}>$90.00</Text>
                    </View>
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>Stripe Fee (~2.9%):</Text>
                      <Text style={[styles.revenueValue, { color: colors.textMuted }]}>~$3.20</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.detailsList}>
                {STRIPE_SETUP_GUIDE.platformFeeExplanation.details.map((detail, index) => (
                  <Text key={index} style={styles.detailText}>{detail}</Text>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'subscription' && (
            <View>
              <Text style={styles.sectionTitle}>
                {STRIPE_SETUP_GUIDE.subscriptionRevenue.title}
              </Text>
              <Text style={styles.sectionDescription}>
                {STRIPE_SETUP_GUIDE.subscriptionRevenue.description}
              </Text>

              <View style={styles.subscriptionCard}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.subscriptionCardGradient}
                >
                  <Icon name="diamond" size={32} color="#000" />
                  <Text style={styles.subscriptionCardTitle}>Premium Subscription</Text>
                  <Text style={styles.subscriptionPrice}>$12/month</Text>
                  
                  <View style={styles.subscriptionFeatures}>
                    <View style={styles.subscriptionFeature}>
                      <Icon name="checkmark-circle" size={16} color="#000" />
                      <Text style={styles.subscriptionFeatureText}>Unlimited project postings</Text>
                    </View>
                    <View style={styles.subscriptionFeature}>
                      <Icon name="checkmark-circle" size={16} color="#000" />
                      <Text style={styles.subscriptionFeatureText}>Unlimited likes & matches</Text>
                    </View>
                    <View style={styles.subscriptionFeature}>
                      <Icon name="checkmark-circle" size={16} color="#000" />
                      <Text style={styles.subscriptionFeatureText}>100% revenue to platform</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.detailsList}>
                {STRIPE_SETUP_GUIDE.subscriptionRevenue.details.map((detail, index) => (
                  <Text key={index} style={styles.detailText}>{detail}</Text>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            text="Got It!"
            onPress={onClose}
            variant="gradient"
            size="lg"
            style={styles.footerButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  stepCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  stepDetails: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  stepDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  stepDetailText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  codeSection: {
    marginTop: spacing.xl,
  },
  codeTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  codeBlock: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  revenueCard: {
    marginBottom: spacing.lg,
  },
  revenueCardGradient: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  revenueCardTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  revenueExample: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  revenueLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
  },
  revenueValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  subscriptionCard: {
    marginBottom: spacing.lg,
  },
  subscriptionCardGradient: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  subscriptionCardTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
    marginTop: spacing.sm,
  },
  subscriptionPrice: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: spacing.lg,
  },
  subscriptionFeatures: {
    width: '100%',
  },
  subscriptionFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subscriptionFeatureText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#000',
    marginLeft: spacing.sm,
  },
  detailsList: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerButton: {
    width: '100%',
  },
});
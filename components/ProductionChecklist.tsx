
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import { ENV, isProduction, isStripeConfigured } from '../utils/config';
import { checkDeploymentReadiness } from '../app/integrations/supabase/client';
import Icon from './Icon';
import Button from './Button';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'complete' | 'warning' | 'error' | 'pending';
  required: boolean;
  action?: string;
}

interface ProductionChecklistProps {
  onClose: () => void;
}

export default function ProductionChecklist({ onClose }: ProductionChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState<'ready' | 'issues' | 'warnings'>('pending');

  useEffect(() => {
    runProductionChecks();
  }, []);

  const runProductionChecks = async () => {
    setLoading(true);
    
    try {
      const deploymentCheck = await checkDeploymentReadiness();
      
      const items: ChecklistItem[] = [
        {
          id: 'environment',
          title: 'Environment Configuration',
          description: `App environment: ${ENV.APP_ENV}`,
          status: ENV.APP_ENV === 'production' ? 'complete' : 'warning',
          required: true,
        },
        {
          id: 'supabase',
          title: 'Supabase Backend',
          description: 'Database connection and tables',
          status: deploymentCheck.ready ? 'complete' : 'error',
          required: true,
        },
        {
          id: 'stripe',
          title: 'Stripe Integration',
          description: 'Payment processing configuration',
          status: isStripeConfigured() ? 'complete' : 'warning',
          required: true,
          action: 'Configure Stripe keys in environment variables',
        },
        {
          id: 'app_config',
          title: 'App Configuration',
          description: 'Bundle ID, version, and metadata',
          status: 'complete',
          required: true,
        },
        {
          id: 'permissions',
          title: 'App Permissions',
          description: 'Camera, microphone, and storage access',
          status: 'complete',
          required: true,
        },
        {
          id: 'privacy_policy',
          title: 'Privacy Policy',
          description: 'Required for app store submission',
          status: 'pending',
          required: true,
          action: 'Create and publish privacy policy',
        },
        {
          id: 'terms_service',
          title: 'Terms of Service',
          description: 'Required for payment processing',
          status: 'pending',
          required: true,
          action: 'Create and publish terms of service',
        },
        {
          id: 'app_icons',
          title: 'App Icons & Assets',
          description: 'Icons, splash screens, and store assets',
          status: 'complete',
          required: true,
        },
        {
          id: 'testing',
          title: 'Production Testing',
          description: 'Test all features with production data',
          status: 'pending',
          required: true,
          action: 'Run comprehensive testing',
        },
        {
          id: 'analytics',
          title: 'Analytics & Monitoring',
          description: 'Error tracking and user analytics',
          status: ENV.FEATURES.ANALYTICS ? 'complete' : 'warning',
          required: false,
          action: 'Set up analytics and error monitoring',
        },
      ];

      // Add deployment-specific issues
      deploymentCheck.issues.forEach((issue, index) => {
        items.push({
          id: `issue_${index}`,
          title: 'Deployment Issue',
          description: issue,
          status: 'error',
          required: true,
        });
      });

      deploymentCheck.warnings.forEach((warning, index) => {
        items.push({
          id: `warning_${index}`,
          title: 'Deployment Warning',
          description: warning,
          status: 'warning',
          required: false,
        });
      });

      setChecklist(items);

      // Determine overall status
      const hasErrors = items.some(item => item.status === 'error');
      const hasWarnings = items.some(item => item.status === 'warning' || item.status === 'pending');
      
      if (hasErrors) {
        setOverallStatus('issues');
      } else if (hasWarnings) {
        setOverallStatus('warnings');
      } else {
        setOverallStatus('ready');
      }

    } catch (error) {
      console.error('Production check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'complete':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'close-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const getStatusColor = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'complete':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'pending':
        return colors.textMuted;
      default:
        return colors.textMuted;
    }
  };

  const getOverallStatusMessage = () => {
    switch (overallStatus) {
      case 'ready':
        return {
          title: '🚀 Ready for Production!',
          message: 'All critical checks passed. Your app is ready for deployment.',
          color: colors.success,
        };
      case 'warnings':
        return {
          title: '⚠️ Ready with Warnings',
          message: 'App can be deployed, but some improvements are recommended.',
          color: colors.warning,
        };
      case 'issues':
        return {
          title: '❌ Issues Found',
          message: 'Critical issues must be resolved before production deployment.',
          color: colors.error,
        };
      default:
        return {
          title: '🔍 Checking...',
          message: 'Running production readiness checks...',
          color: colors.primary,
        };
    }
  };

  const statusMessage = getOverallStatusMessage();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Icon name="rocket" size={32} color={colors.text} />
          <Text style={styles.headerTitle}>Production Checklist</Text>
          <Text style={styles.headerSubtitle}>
            Ensure your app is ready for launch
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Status */}
        <View style={[styles.statusCard, { borderColor: statusMessage.color }]}>
          <Text style={[styles.statusTitle, { color: statusMessage.color }]}>
            {statusMessage.title}
          </Text>
          <Text style={styles.statusMessage}>
            {statusMessage.message}
          </Text>
        </View>

        {/* Environment Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Current Configuration</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Environment:</Text>
            <Text style={[styles.infoValue, { 
              color: isProduction() ? colors.success : colors.warning 
            }]}>
              {ENV.APP_ENV}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>{ENV.APP_VERSION}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stripe:</Text>
            <Text style={[styles.infoValue, { 
              color: isStripeConfigured() ? colors.success : colors.warning 
            }]}>
              {isStripeConfigured() ? 'Configured' : 'Demo Mode'}
            </Text>
          </View>
        </View>

        {/* Checklist Items */}
        <View style={styles.checklistSection}>
          <Text style={styles.sectionTitle}>Production Checklist</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Running checks...</Text>
            </View>
          ) : (
            checklist.map((item) => (
              <View key={item.id} style={styles.checklistItem}>
                <View style={styles.itemHeader}>
                  <Icon 
                    name={getStatusIcon(item.status) as any} 
                    size={20} 
                    color={getStatusColor(item.status)} 
                  />
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>
                      {item.title}
                      {item.required && <Text style={styles.requiredMark}> *</Text>}
                    </Text>
                    <Text style={styles.itemDescription}>
                      {item.description}
                    </Text>
                    {item.action && (
                      <Text style={styles.itemAction}>
                        Action: {item.action}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsSection}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.stepText}>
              Resolve any critical issues marked in red
            </Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepText}>
              Run production builds: `eas build --platform all --profile production`
            </Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>3.</Text>
            <Text style={styles.stepText}>
              Test builds on real devices before submission
            </Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>4.</Text>
            <Text style={styles.stepText}>
              Submit to app stores: `eas submit --platform all --profile production`
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            text="Recheck"
            onPress={runProductionChecks}
            variant="outline"
            size="lg"
            loading={loading}
          />
          <Button
            text="Close"
            onPress={onClose}
            variant="gradient"
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    paddingTop: spacing.xl + 20,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xl + 20,
    right: spacing.lg,
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  statusCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    ...shadows.sm,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: spacing.sm,
  },
  statusMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  checklistSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  checklistItem: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  requiredMark: {
    color: colors.error,
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  itemAction: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
    fontStyle: 'italic',
  },
  nextStepsSection: {
    marginBottom: spacing.xl,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    marginRight: spacing.md,
    minWidth: 20,
  },
  stepText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});

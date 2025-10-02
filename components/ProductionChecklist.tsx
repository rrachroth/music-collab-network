
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import { ENV, isProduction, isStripeConfigured } from '../utils/config';
import { checkDeploymentReadiness } from '../app/integrations/supabase/client';
import { runDeploymentChecks, DeploymentReport } from '../utils/deploymentChecker';
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
      // Run comprehensive deployment checks
      const deploymentReport = runDeploymentChecks();
      const supabaseCheck = await checkDeploymentReadiness();
      
      // Convert deployment checks to checklist items
      const items: ChecklistItem[] = deploymentReport.checks.map(check => ({
        id: check.id,
        title: check.name,
        description: check.message + (check.details ? ` (${check.details})` : ''),
        status: check.status === 'pass' ? 'complete' : 
                check.status === 'warning' ? 'warning' : 'error',
        required: check.required,
      }));

      // Add additional production-specific checks
      const additionalChecks: ChecklistItem[] = [
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
          id: 'production_testing',
          title: 'Production Testing',
          description: 'Test all features with production data',
          status: 'pending',
          required: true,
          action: 'Run comprehensive testing on real devices',
        },
        {
          id: 'app_store_assets',
          title: 'App Store Assets',
          description: 'Screenshots, descriptions, and metadata',
          status: 'pending',
          required: true,
          action: 'Prepare app store listings',
        },
      ];

      const allItems = [...items, ...additionalChecks];
      setChecklist(allItems);

      // Determine overall status based on deployment report
      if (deploymentReport.overall === 'ready') {
        setOverallStatus('ready');
      } else if (deploymentReport.overall === 'warning') {
        setOverallStatus('warnings');
      } else {
        setOverallStatus('issues');
      }

      // Show deployment summary
      console.log('🎯 Deployment Summary:', {
        overall: deploymentReport.overall,
        score: `${deploymentReport.score}%`,
        passed: deploymentReport.passedChecks,
        failed: deploymentReport.failedChecks,
        warnings: deploymentReport.warningChecks,
        total: deploymentReport.totalChecks,
      });

      // Show alert with results
      if (deploymentReport.overall === 'ready') {
        Alert.alert(
          '🎉 Deployment Ready!',
          `Your app scored ${deploymentReport.score}% and is ready for production deployment. All critical systems are properly configured.`,
          [{ text: 'Excellent!', style: 'default' }]
        );
      } else if (deploymentReport.overall === 'warning') {
        Alert.alert(
          '⚠️ Ready with Warnings',
          `Your app scored ${deploymentReport.score}% and can be deployed, but ${deploymentReport.warningChecks} warnings should be addressed for optimal performance.`,
          [{ text: 'Got it', style: 'default' }]
        );
      } else {
        Alert.alert(
          '❌ Issues Found',
          `Your app scored ${deploymentReport.score}%. ${deploymentReport.failedChecks} critical issues must be resolved before production deployment.`,
          [{ text: 'Fix Issues', style: 'default' }]
        );
      }

    } catch (error) {
      console.error('Production check failed:', error);
      Alert.alert(
        'Check Failed',
        'Unable to run production checks. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
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

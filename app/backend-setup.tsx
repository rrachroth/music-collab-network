
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { supabase, checkDeploymentReadiness } from './integrations/supabase/client';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import React, { useState, useEffect, useCallback } from 'react';
import Button from '../components/Button';
import { PaymentService } from '../utils/paymentService';
import Icon from '../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { runDeploymentChecks, DeploymentReport, DeploymentCheck } from '../utils/deploymentChecker';

interface DiagnosticResult {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  action?: string;
}

interface InitializationStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  progress: number;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  checkIcon: {
    marginRight: spacing.md,
  },
  checkContent: {
    flex: 1,
  },
  checkName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  checkMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  checkDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  scoreCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...shadows.medium,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  recommendationsCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  deployButton: {
    backgroundColor: colors.success,
  },
  warningButton: {
    backgroundColor: colors.warning,
  },
  errorButton: {
    backgroundColor: colors.error,
  },
});

export default function BackendSetupScreen() {
  const [deploymentReport, setDeploymentReport] = useState<DeploymentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [deploymentReady, setDeploymentReady] = useState(false);
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  
  const insets = useSafeAreaInsets();

  const runDiagnostics = useCallback(async () => {
    setLoading(true);
    
    try {
      console.log('🔍 Running deployment diagnostics...');
      
      // Run deployment checks
      const report = runDeploymentChecks();
      setDeploymentReport(report);
      setDeploymentReady(report.overall === 'ready');
      
      console.log('✅ Deployment diagnostics completed');
    } catch (error) {
      console.error('❌ Deployment diagnostics failed:', error);
      Alert.alert(
        'Diagnostic Error',
        'Failed to run deployment diagnostics. Please check your configuration.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 800 });
    slideUp.value = withSpring(0, { damping: 20, stiffness: 100 });
    runDiagnostics();
  }, [fadeIn, slideUp, runDiagnostics]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const getStatusIcon = (status: DeploymentCheck['status']) => {
    switch (status) {
      case 'pass':
        return 'checkmark-circle';
      case 'fail':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'help-circle';
    }
  };

  const getStatusColor = (status: DeploymentCheck['status']) => {
    switch (status) {
      case 'pass':
        return colors.success;
      case 'fail':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return colors.success;
    if (score >= 70) return colors.warning;
    return colors.error;
  };

  const handleDeploy = () => {
    if (!deploymentReport) return;

    if (deploymentReport.overall === 'not_ready') {
      Alert.alert(
        'Not Ready for Deployment',
        'Your app has critical issues that must be fixed before deployment. Please address the failed checks.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Deployment Ready',
      deploymentReport.overall === 'ready' 
        ? 'Your app appears ready for deployment! You can proceed with building and deploying your app.'
        : 'Your app can be deployed but has some warnings. Consider addressing them for the best experience.',
      [
        { text: 'View Guide', onPress: () => openSupabaseDashboard() },
        { text: 'Continue', style: 'default' },
      ]
    );
  };

  const openSupabaseDashboard = () => {
    Linking.openURL('https://supabase.com/dashboard/project/tioevqidrridspbsjlqb');
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Running Diagnostics</Text>
            <Text style={styles.subtitle}>Checking deployment readiness...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={animatedStyle}>
          <View style={styles.header}>
            <Text style={styles.title}>Deployment Status</Text>
            <Text style={styles.subtitle}>
              Comprehensive check of your app's deployment readiness
            </Text>
          </View>

          {deploymentReport && (
            <>
              {/* Score Card */}
              <View style={styles.scoreCard}>
                <Text style={styles.scoreTitle}>Deployment Score</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(deploymentReport.score) }]}>
                  {deploymentReport.score}%
                </Text>
                <Text style={styles.scoreLabel}>
                  {deploymentReport.passedChecks}/{deploymentReport.totalChecks} checks passed
                </Text>
              </View>

              {/* Deployment Checks */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>System Checks</Text>
                {deploymentReport.checks.map((check, index) => (
                  <Animated.View
                    key={check.id}
                    style={[
                      styles.checkItem,
                      animatedStyle,
                    ]}
                  >
                    <View style={styles.checkIcon}>
                      <Icon
                        name={getStatusIcon(check.status)}
                        size={24}
                        color={getStatusColor(check.status)}
                      />
                    </View>
                    <View style={styles.checkContent}>
                      <Text style={styles.checkName}>{check.name}</Text>
                      <Text style={styles.checkMessage}>{check.message}</Text>
                      {check.details && (
                        <Text style={styles.checkDetails}>{check.details}</Text>
                      )}
                    </View>
                  </Animated.View>
                ))}
              </View>

              {/* Recommendations */}
              {deploymentReport.recommendations.length > 0 && (
                <View style={styles.recommendationsCard}>
                  <Text style={styles.sectionTitle}>Recommendations</Text>
                  {deploymentReport.recommendations.map((recommendation, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Icon
                        name="arrow-forward"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.recommendationText}>
                        {recommendation}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  title={
                    deploymentReport.overall === 'ready'
                      ? '🚀 Ready to Deploy'
                      : deploymentReport.overall === 'warning'
                      ? '⚠️ Deploy with Warnings'
                      : '❌ Fix Issues First'
                  }
                  onPress={handleDeploy}
                  style={[
                    deploymentReport.overall === 'ready' && styles.deployButton,
                    deploymentReport.overall === 'warning' && styles.warningButton,
                    deploymentReport.overall === 'not_ready' && styles.errorButton,
                  ]}
                />
                
                <Button
                  title="Refresh Diagnostics"
                  onPress={runDiagnostics}
                  variant="outline"
                />
                
                <Button
                  title="Open Supabase Dashboard"
                  onPress={openSupabaseDashboard}
                  variant="outline"
                />
                
                <Button
                  title="Back to App"
                  onPress={() => router.back()}
                  variant="ghost"
                />
              </View>
            </>
          )}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

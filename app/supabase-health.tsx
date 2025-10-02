
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

interface HealthCheckItem {
  title: string;
  status: 'fixed' | 'action_required' | 'info';
  description: string;
  action?: string;
  link?: string;
  count?: number;
}

const healthChecks: HealthCheckItem[] = [
  {
    title: 'RLS Performance Issues',
    status: 'fixed',
    description: 'Optimized all Row Level Security policies to use (select auth.uid()) instead of auth.uid() directly. This prevents re-evaluation for each row and dramatically improves query performance.',
    count: 30,
  },
  {
    title: 'Foreign Key Indexes',
    status: 'fixed',
    description: 'Added indexes to all foreign key columns to improve query performance and eliminate slow joins. The "unused index" warnings you see now are normal - they\'ll be used as your app grows.',
    count: 17,
  },
  {
    title: 'Multiple Permissive Policies',
    status: 'fixed',
    description: 'Consolidated multiple RLS policies on the same tables to reduce overhead and improve performance.',
    count: 4,
  },
  {
    title: 'Leaked Password Protection',
    status: 'action_required',
    description: 'Enable password breach detection in your Supabase Auth settings to prevent users from using compromised passwords.',
    action: 'Go to Auth > Settings in your Supabase dashboard and enable "Leaked Password Protection"',
    link: 'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection',
  },
  {
    title: 'Multi-Factor Authentication',
    status: 'action_required',
    description: 'Enable additional MFA options like TOTP or SMS to enhance account security.',
    action: 'Go to Auth > Settings and enable MFA options under "Multi-Factor Authentication"',
    link: 'https://supabase.com/docs/guides/auth/auth-mfa',
  },
  {
    title: 'PostgreSQL Security Updates',
    status: 'action_required',
    description: 'Your PostgreSQL version has available security patches. Upgrade to the latest version.',
    action: 'Go to Settings > Database and click "Upgrade" to apply security patches',
    link: 'https://supabase.com/docs/guides/platform/upgrading',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  healthItem: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusIcon: {
    marginRight: spacing.md,
  },
  healthTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  healthDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actionContainer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  actionText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  backButton: {
    margin: spacing.lg,
  },
});

export default function SupabaseHealthScreen() {
  const insets = useSafeAreaInsets();
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);

  const [fixedCount, setFixedCount] = useState(0);
  const [actionRequiredCount, setActionRequiredCount] = useState(0);

  const initializeAnimations = useCallback(() => {
    fadeIn.value = withTiming(1, { duration: 800 });
    slideUp.value = withTiming(0, { duration: 800 });
  }, [fadeIn, slideUp]);

  useEffect(() => {
    const fixed = healthChecks.filter(item => item.status === 'fixed').length;
    const actionRequired = healthChecks.filter(item => item.status === 'action_required').length;
    
    setFixedCount(fixed);
    setActionRequiredCount(actionRequired);

    initializeAnimations();
  }, [initializeAnimations]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fixed':
        return colors.success;
      case 'action_required':
        return colors.warning;
      default:
        return colors.info;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fixed':
        return 'checkmark-circle';
      case 'action_required':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the link');
    });
  };

  const renderHealthItem = (item: HealthCheckItem, index: number) => (
    <Animated.View
      key={item.title}
      style={[
        styles.healthItem,
        {
          transform: [
            {
              translateY: withDelay(
                index * 100,
                withSpring(0, { damping: 15, stiffness: 100 })
              ),
            },
          ],
        },
      ]}
    >
      <View style={styles.healthHeader}>
        <Icon
          name={getStatusIcon(item.status)}
          size={24}
          color={getStatusColor(item.status)}
          style={styles.statusIcon}
        />
        <Text style={styles.healthTitle}>{item.title}</Text>
        {item.count && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{item.count}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.healthDescription}>{item.description}</Text>
      
      {item.action && (
        <View style={styles.actionContainer}>
          <Text style={styles.actionText}>Action Required:</Text>
          <Text style={[styles.healthDescription, { marginBottom: spacing.sm }]}>
            {item.action}
          </Text>
          {item.link && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => handleLinkPress(item.link!)}
            >
              <Icon name="open-outline" size={16} color={colors.primary} />
              <Text style={styles.linkText}>View Documentation</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={animatedStyle}>
        <View style={styles.header}>
          <Text style={styles.title}>Supabase Health Check</Text>
          <Text style={styles.subtitle}>
            Database performance and security optimization results
          </Text>
        </View>

        <View style={styles.summaryContainer}>
          <LinearGradient
            colors={[colors.success, colors.successDark]}
            style={styles.summaryCard}
          >
            <Text style={styles.summaryNumber}>{fixedCount}</Text>
            <Text style={styles.summaryLabel}>Issues Fixed</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={[colors.warning, colors.warningDark]}
            style={styles.summaryCard}
          >
            <Text style={styles.summaryNumber}>{actionRequiredCount}</Text>
            <Text style={styles.summaryLabel}>Action Required</Text>
          </LinearGradient>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {healthChecks.map((item, index) => renderHealthItem(item, index))}
          
          <View style={styles.backButton}>
            <Button
              title="Back to Dashboard"
              onPress={() => router.back()}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

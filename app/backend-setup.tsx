
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../components/Icon';
import Button from '../components/Button';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import { supabase } from './integrations/supabase/client';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

interface DiagnosticResult {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  action?: string;
}

const BackendSetupScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'complete'>('idle');

  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 800 });
    slideUp.value = withSpring(0, { damping: 20, stiffness: 100 });
  }, [fadeIn, slideUp]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    setDiagnostics([]);

    const results: DiagnosticResult[] = [];

    // Test 1: Basic connectivity
    results.push({
      name: 'Internet Connectivity',
      status: 'checking',
      message: 'Testing internet connection...',
    });
    setDiagnostics([...results]);

    try {
      const response = await fetch('https://www.google.com', { method: 'HEAD' });
      results[0] = {
        name: 'Internet Connectivity',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'Internet connection is working' : 'Internet connection failed',
        details: response.ok ? undefined : `Status: ${response.status}`,
      };
    } catch (error) {
      results[0] = {
        name: 'Internet Connectivity',
        status: 'error',
        message: 'Internet connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    setDiagnostics([...results]);

    // Test 2: Supabase URL accessibility
    results.push({
      name: 'Supabase URL Access',
      status: 'checking',
      message: 'Testing Supabase endpoint...',
    });
    setDiagnostics([...results]);

    try {
      const response = await fetch('https://tioevqidrridspbsjlqb.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb2V2cWlkcnJpZHNwYnNqbHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjQ5NzAsImV4cCI6MjA2NzAwMDk3MH0.HqV7918kKK7noaX-QQg5syVsoYjWS-sgxKhD7lUE6Vw',
        },
      });

      if (response.ok) {
        results[1] = {
          name: 'Supabase URL Access',
          status: 'success',
          message: 'Supabase endpoint is accessible',
        };
      } else if (response.status === 503) {
        results[1] = {
          name: 'Supabase URL Access',
          status: 'error',
          message: 'Supabase project appears to be paused or inactive',
          details: 'Status 503: Service Unavailable',
          action: 'Go to your Supabase dashboard and restore/unpause the project',
        };
      } else {
        results[1] = {
          name: 'Supabase URL Access',
          status: 'error',
          message: `Supabase endpoint returned error ${response.status}`,
          details: `HTTP Status: ${response.status}`,
        };
      }
    } catch (error) {
      results[1] = {
        name: 'Supabase URL Access',
        status: 'error',
        message: 'Cannot reach Supabase endpoint',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    setDiagnostics([...results]);

    // Test 3: Supabase Auth
    results.push({
      name: 'Supabase Authentication',
      status: 'checking',
      message: 'Testing authentication service...',
    });
    setDiagnostics([...results]);

    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        results[2] = {
          name: 'Supabase Authentication',
          status: 'error',
          message: 'Authentication service error',
          details: error.message,
        };
      } else {
        results[2] = {
          name: 'Supabase Authentication',
          status: 'success',
          message: 'Authentication service is working',
          details: data.session ? 'Active session found' : 'No active session (normal)',
        };
      }
    } catch (error) {
      results[2] = {
        name: 'Supabase Authentication',
        status: 'error',
        message: 'Authentication service failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    setDiagnostics([...results]);

    // Test 4: Database access
    results.push({
      name: 'Database Access',
      status: 'checking',
      message: 'Testing database connection...',
    });
    setDiagnostics([...results]);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (error) {
        results[3] = {
          name: 'Database Access',
          status: 'error',
          message: 'Database query failed',
          details: error.message,
        };
      } else {
        results[3] = {
          name: 'Database Access',
          status: 'success',
          message: 'Database is accessible',
          details: `Profiles table exists`,
        };
      }
    } catch (error) {
      results[3] = {
        name: 'Database Access',
        status: 'error',
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    setDiagnostics([...results]);

    setIsRunning(false);
    setOverallStatus('complete');

    // Show summary
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;

    if (errorCount === 0 && warningCount === 0) {
      Alert.alert(
        'Diagnostics Complete',
        'All tests passed! Your backend connection should be working properly.',
        [{ text: 'Great!', onPress: () => router.back() }]
      );
    } else {
      Alert.alert(
        'Issues Found',
        `Found ${errorCount} error(s) and ${warningCount} warning(s). Check the results below for details.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking':
        return 'refresh';
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'help-circle';
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking':
        return colors.primary;
      case 'success':
        return colors.success || '#10B981';
      case 'error':
        return colors.error || '#EF4444';
      case 'warning':
        return colors.warning || '#F59E0B';
      default:
        return colors.textSecondary;
    }
  };

  const openSupabaseDashboard = () => {
    Linking.openURL('https://supabase.com/dashboard/project/tioevqidrridspbsjlqb');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xl,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Icon name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            
            <Text style={styles.title}>Backend Diagnostics</Text>
            <Text style={styles.subtitle}>
              Let's check what's causing the connection issues
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={openSupabaseDashboard}
              activeOpacity={0.8}
            >
              <Icon name="open" size={20} color={colors.white} />
              <Text style={styles.quickActionText}>Open Supabase Dashboard</Text>
            </TouchableOpacity>
          </View>

          {/* Diagnostics */}
          <View style={styles.diagnosticsContainer}>
            <Button
              text={isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
              onPress={runDiagnostics}
              variant="primary"
              size="large"
              disabled={isRunning}
              style={styles.runButton}
            />

            {diagnostics.length > 0 && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Diagnostic Results</Text>
                
                {diagnostics.map((result, index) => (
                  <View key={index} style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <Icon
                        name={getStatusIcon(result.status) as any}
                        size={24}
                        color={getStatusColor(result.status)}
                      />
                      <Text style={styles.resultName}>{result.name}</Text>
                    </View>
                    
                    <Text style={styles.resultMessage}>{result.message}</Text>
                    
                    {result.details && (
                      <Text style={styles.resultDetails}>{result.details}</Text>
                    )}
                    
                    {result.action && (
                      <View style={styles.actionContainer}>
                        <Icon name="information-circle" size={16} color={colors.warning || '#F59E0B'} />
                        <Text style={styles.actionText}>{result.action}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Common Solutions */}
          <View style={styles.solutionsContainer}>
            <Text style={styles.solutionsTitle}>Common Solutions</Text>
            
            <View style={styles.solutionCard}>
              <Icon name="pause" size={24} color={colors.warning || '#F59E0B'} />
              <View style={styles.solutionContent}>
                <Text style={styles.solutionTitle}>Project Paused</Text>
                <Text style={styles.solutionDescription}>
                  If your Supabase project is paused, go to your dashboard and click "Restore project"
                </Text>
              </View>
            </View>
            
            <View style={styles.solutionCard}>
              <Icon name="wifi-off" size={24} color={colors.error || '#EF4444'} />
              <View style={styles.solutionContent}>
                <Text style={styles.solutionTitle}>Network Issues</Text>
                <Text style={styles.solutionDescription}>
                  Check your internet connection and try switching between WiFi and mobile data
                </Text>
              </View>
            </View>
            
            <View style={styles.solutionCard}>
              <Icon name="key" size={24} color={colors.primary} />
              <View style={styles.solutionContent}>
                <Text style={styles.solutionTitle}>API Key Issues</Text>
                <Text style={styles.solutionDescription}>
                  Verify that your Supabase URL and API key are correct in the app configuration
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Button
              text="Continue Anyway"
              onPress={() => router.back()}
              variant="secondary"
              size="large"
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  quickActions: {
    marginBottom: spacing.xl,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  quickActionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  diagnosticsContainer: {
    marginBottom: spacing.xl,
  },
  runButton: {
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },
  resultsContainer: {
    gap: spacing.md,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
    fontFamily: 'Poppins_600SemiBold',
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    fontFamily: 'Inter_600SemiBold',
  },
  resultMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter_400Regular',
  },
  resultDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: borderRadius.md,
  },
  actionText: {
    fontSize: 12,
    color: colors.white,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  solutionsContainer: {
    marginBottom: spacing.xl,
  },
  solutionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
    fontFamily: 'Poppins_600SemiBold',
  },
  solutionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  solutionContent: {
    flex: 1,
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xs,
    fontFamily: 'Inter_600SemiBold',
  },
  solutionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  actionsContainer: {
    gap: spacing.md,
  },
});

export default BackendSetupScreen;

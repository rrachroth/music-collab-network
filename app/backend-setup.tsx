
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
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

interface CheckResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

const BackendSetupScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [checks, setChecks] = useState<CheckResult[]>([
    { name: 'Database Connection', status: 'pending', message: 'Testing connection...' },
    { name: 'Profiles Table', status: 'pending', message: 'Checking table...' },
    { name: 'Projects Table', status: 'pending', message: 'Checking table...' },
    { name: 'User Limits Table', status: 'pending', message: 'Checking table...' },
    { name: 'Authentication', status: 'pending', message: 'Testing auth...' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

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
  }, []);

  const updateCheck = (index: number, status: 'success' | 'error', message: string) => {
    setChecks(prev => prev.map((check, i) => 
      i === index ? { ...check, status, message } : check
    ));
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setAllPassed(false);
    
    // Reset all checks
    setChecks(prev => prev.map(check => ({ ...check, status: 'pending' as const })));

    try {
      // 1. Test database connection
      console.log('🔍 Testing database connection...');
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
          updateCheck(0, 'error', `Connection failed: ${error.message}`);
        } else {
          updateCheck(0, 'success', 'Database connection successful');
        }
      } catch (error) {
        updateCheck(0, 'error', `Connection error: ${error}`);
      }

      // 2. Test profiles table
      console.log('🔍 Testing profiles table...');
      try {
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        if (error) {
          updateCheck(1, 'error', `Profiles table error: ${error.message}`);
        } else {
          updateCheck(1, 'success', 'Profiles table accessible');
        }
      } catch (error) {
        updateCheck(1, 'error', `Profiles table error: ${error}`);
      }

      // 3. Test projects table
      console.log('🔍 Testing projects table...');
      try {
        const { data, error } = await supabase.from('projects').select('*').limit(1);
        if (error) {
          updateCheck(2, 'error', `Projects table error: ${error.message}`);
        } else {
          updateCheck(2, 'success', 'Projects table accessible');
        }
      } catch (error) {
        updateCheck(2, 'error', `Projects table error: ${error}`);
      }

      // 4. Test user_limits table
      console.log('🔍 Testing user_limits table...');
      try {
        const { data, error } = await supabase.from('user_limits').select('*').limit(1);
        if (error) {
          updateCheck(3, 'error', `User limits table error: ${error.message}`);
        } else {
          updateCheck(3, 'success', 'User limits table accessible');
        }
      } catch (error) {
        updateCheck(3, 'error', `User limits table error: ${error}`);
      }

      // 5. Test authentication
      console.log('🔍 Testing authentication...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          updateCheck(4, 'error', `Auth error: ${error.message}`);
        } else {
          updateCheck(4, 'success', session ? 'User authenticated' : 'Auth system working');
        }
      } catch (error) {
        updateCheck(4, 'error', `Auth error: ${error}`);
      }

      // Check if all passed
      setTimeout(() => {
        setChecks(current => {
          const allSuccess = current.every(check => check.status === 'success');
          setAllPassed(allSuccess);
          return current;
        });
      }, 1000);

    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      Alert.alert('Diagnostics Failed', 'An unexpected error occurred during diagnostics.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleContinueAnyway = () => {
    Alert.alert(
      'Continue with Limited Functionality?',
      'Some backend features may not work properly. The app will use local storage as a fallback.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => router.replace('/auth/login'),
          style: 'destructive'
        }
      ]
    );
  };

  const handleRetrySetup = () => {
    Alert.alert(
      'Database Setup Required',
      'It looks like the database tables need to be created. Please contact support or check the setup documentation.',
      [
        { text: 'OK' },
        { 
          text: 'Continue Anyway', 
          onPress: handleContinueAnyway,
          style: 'destructive'
        }
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return colors.success || '#10B981';
      case 'error':
        return colors.error || '#EF4444';
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Backend Setup</Text>
            <Text style={styles.subtitle}>
              Let&apos;s check if everything is working properly
            </Text>
          </View>

          {/* Diagnostics */}
          <View style={styles.diagnosticsContainer}>
            {checks.map((check, index) => (
              <View key={index} style={styles.checkItem}>
                <Icon
                  name={getStatusIcon(check.status) as any}
                  size={24}
                  color={getStatusColor(check.status)}
                />
                <View style={styles.checkContent}>
                  <Text style={styles.checkName}>{check.name}</Text>
                  <Text style={[
                    styles.checkMessage,
                    { color: getStatusColor(check.status) }
                  ]}>
                    {check.message}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Button
              text={isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
              onPress={runDiagnostics}
              disabled={isRunning}
              style={styles.diagnosticsButton}
            />

            {allPassed && (
              <Button
                text="Continue to App"
                onPress={() => router.replace('/auth/login')}
                style={styles.continueButton}
              />
            )}

            {!isRunning && !allPassed && checks.some(c => c.status === 'error') && (
              <>
                <Button
                  text="Setup Database"
                  onPress={handleRetrySetup}
                  style={styles.setupButton}
                  variant="outline"
                />
                
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleContinueAnyway}
                >
                  <Text style={styles.skipText}>Continue with Limited Features</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  diagnosticsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  checkName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  checkMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: spacing.lg,
  },
  diagnosticsButton: {
    backgroundColor: colors.primary,
  },
  continueButton: {
    backgroundColor: colors.success || '#10B981',
  },
  setupButton: {
    borderColor: colors.white,
    borderWidth: 2,
  },
  skipButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'underline',
  },
});

export default BackendSetupScreen;

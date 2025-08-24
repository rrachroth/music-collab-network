
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../components/Icon';
import Button from '../components/Button';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import { getCurrentUser } from '../utils/storage';
import { supabase } from './integrations/supabase/client';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface FeatureCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
  onPress: () => void;
  delay: number;
}

const LandingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ready' | 'error'>('checking');

  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    try {
      console.log('🔍 Checking initial app state...');
      
      // Quick backend health check
      try {
        const healthPromise = supabase.from('profiles').select('count', { count: 'exact', head: true });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        );
        
        const { error } = await Promise.race([healthPromise, timeoutPromise]);
        
        if (error) {
          console.warn('⚠️ Backend health check failed:', error.message);
          setBackendStatus('error');
        } else {
          console.log('✅ Backend health check passed');
          setBackendStatus('ready');
        }
      } catch (healthError) {
        console.warn('⚠️ Backend health check error:', healthError);
        setBackendStatus('error');
      }

      // Start animations
      fadeIn.value = withTiming(1, { duration: 1000 });
      slideUp.value = withSpring(0, { damping: 20, stiffness: 100 });
      
    } catch (error) {
      console.error('❌ Initial state check failed:', error);
      setBackendStatus('error');
      
      // Still show the landing page
      fadeIn.value = withTiming(1, { duration: 1000 });
      slideUp.value = withSpring(0, { damping: 20, stiffness: 100 });
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleGetStarted = () => {
    if (backendStatus === 'error') {
      Alert.alert(
        'Backend Issues Detected',
        'Some features may not work properly. Would you like to run diagnostics first?',
        [
          { text: 'Run Diagnostics', onPress: () => router.push('/backend-setup') },
          { text: 'Continue Anyway', onPress: () => router.push('/auth/login'), style: 'destructive' }
        ]
      );
    } else {
      router.push('/auth/login');
    }
  };

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  const handleCreateAccount = () => {
    router.push('/auth/register');
  };

  const handleBackendSetup = () => {
    router.push('/backend-setup');
  };

  if (isCheckingAuth) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🎵</Text>
          <Text style={styles.loadingSubtext}>Loading NextDrop...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎵</Text>
          <Text style={styles.appName}>NextDrop</Text>
          <Text style={styles.tagline}>
            The professional network for musicians, producers, and music industry collaborators
          </Text>
          
          {backendStatus === 'error' && (
            <TouchableOpacity
              style={styles.warningBanner}
              onPress={handleBackendSetup}
            >
              <Icon name="warning" size={20} color={colors.warning || '#F59E0B'} />
              <Text style={styles.warningText}>
                Backend issues detected - Tap to diagnose
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <FeatureCard
            icon="people"
            title="Discover Talent"
            description="Swipe through profiles of musicians and find your perfect collaborator"
            gradient={['#FF6B6B', '#FF8E53']}
            onPress={() => {}}
            delay={0}
          />
          
          <FeatureCard
            icon="musical-notes"
            title="Collaborate"
            description="Work on projects together and split revenue automatically"
            gradient={['#4ECDC4', '#44A08D']}
            onPress={() => {}}
            delay={200}
          />
          
          <FeatureCard
            icon="trending-up"
            title="Grow Your Career"
            description="Build your reputation and connect with industry professionals"
            gradient={['#A8E6CF', '#7FCDCD']}
            onPress={() => {}}
            delay={400}
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            text="Get Started"
            onPress={handleGetStarted}
            style={styles.primaryButton}
          />
          
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSignIn}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCreateAccount}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
          
          {backendStatus === 'error' && (
            <TouchableOpacity
              style={styles.diagnosticsButton}
              onPress={handleBackendSetup}
            >
              <Icon name="settings" size={16} color={colors.white} />
              <Text style={styles.diagnosticsButtonText}>Run Diagnostics</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  gradient,
  onPress,
  delay,
}) => {
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 20, stiffness: 100 }));
  }, [delay]);

  return (
    <Animated.View style={[cardAnimatedStyle]}>
      <TouchableOpacity
        style={styles.featureCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradient}
          style={styles.featureCardGradient}
        >
          <Icon name={icon} size={32} color={colors.white} />
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  loadingSubtext: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  logo: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: colors.warning || '#F59E0B',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  warningText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  featuresContainer: {
    flex: 1,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  featureCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  featureCardGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsContainer: {
    gap: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.white,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  diagnosticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: colors.error || '#EF4444',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  diagnosticsButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LandingScreen;

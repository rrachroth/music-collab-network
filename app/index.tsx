
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
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
  const [errorDetails, setErrorDetails] = useState<string>('');

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
      
      // Enhanced backend health check with better error reporting
      try {
        console.log('🏥 Running backend health check...');
        
        const healthPromise = fetch('https://tioevqidrridspbsjlqb.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb2V2cWlkcnJpZHNwYnNqbHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjQ5NzAsImV4cCI6MjA2NzAwMDk3MH0.HqV7918kKK7noaX-QQg5syVsoYjWS-sgxKhD7lUE6Vw',
          },
        });
        
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout after 8 seconds')), 8000)
        );
        
        const response = await Promise.race([healthPromise, timeoutPromise]);
        
        if (response.ok) {
          console.log('✅ Backend health check passed');
          setBackendStatus('ready');
          setErrorDetails('');
        } else {
          const errorMsg = `Backend returned status ${response.status}`;
          console.warn('⚠️ Backend health check failed:', errorMsg);
          setBackendStatus('error');
          
          if (response.status === 503) {
            setErrorDetails('The database service is temporarily unavailable. It may be paused or under maintenance.');
          } else if (response.status === 404) {
            setErrorDetails('The database service could not be found. Please check the configuration.');
          } else {
            setErrorDetails(`Backend service error (Status: ${response.status}). Please try again later.`);
          }
        }
      } catch (healthError) {
        console.warn('⚠️ Backend health check error:', healthError);
        setBackendStatus('error');
        
        if (healthError instanceof Error) {
          if (healthError.message.includes('timeout')) {
            setErrorDetails('Connection timeout. The database service may be paused or unreachable.');
          } else if (healthError.message.includes('Network request failed')) {
            setErrorDetails('Network connection failed. Please check your internet connection.');
          } else {
            setErrorDetails(`Connection error: ${healthError.message}`);
          }
        } else {
          setErrorDetails('Unknown connection error occurred.');
        }
      }

      // Start animations regardless of backend status
      fadeIn.value = withTiming(1, { duration: 1000 });
      slideUp.value = withSpring(0, { damping: 20, stiffness: 100 });
      
    } catch (error) {
      console.error('❌ Initial state check failed:', error);
      setBackendStatus('error');
      setErrorDetails('App initialization failed. Please restart the app.');
      
      // Still show the landing page
      fadeIn.value = withTiming(1, { duration: 1000 });
      slideUp.value = withSpring(0, { damping: 20, stiffness: 100 });
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleGetStarted = () => {
    console.log('🚀 Get Started button pressed');
    if (backendStatus === 'error') {
      Alert.alert(
        'Project Initialization Required',
        'Your NextDrop project needs to be initialized before you can start using it. This is a one-time setup process.\n\nWould you like to:',
        [
          { text: 'Initialize Now', onPress: () => router.push('/backend-setup') },
          { text: 'Learn More', onPress: () => showInitializationInfo() },
          { text: 'Skip for Now', onPress: () => router.push('/auth/register'), style: 'destructive' }
        ]
      );
    } else {
      router.push('/auth/register');
    }
  };

  const showInitializationInfo = () => {
    Alert.alert(
      'About Project Initialization',
      'NextDrop requires a one-time setup to:\n\n• Verify your database connection\n• Check all required tables exist\n• Validate security policies\n• Prepare for deployment\n\nThis ensures your app works perfectly for users!',
      [
        { text: 'Initialize Now', onPress: () => router.push('/backend-setup') },
        { text: 'Maybe Later', style: 'cancel' }
      ]
    );
  };

  const handleSignIn = () => {
    console.log('🔑 Sign In button pressed');
    if (backendStatus === 'error') {
      Alert.alert(
        'Connection Issues',
        `${errorDetails}\n\nYou can still try to sign in, but some features may not work properly.`,
        [
          { text: 'Try Anyway', onPress: () => router.push('/auth/login') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      router.push('/auth/login');
    }
  };

  const handleCreateAccount = () => {
    console.log('📝 Create Account button pressed');
    router.push('/auth/register');
  };

  const handleBackendSetup = () => {
    router.push('/backend-setup');
  };

  const retryConnection = () => {
    console.log('🔄 Retrying connection...');
    setIsCheckingAuth(true);
    setBackendStatus('checking');
    setErrorDetails('');
    checkInitialState();
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
          <Text style={styles.loadingDetails}>Checking backend connection...</Text>
        </View>
      </View>
    );
  }

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
            <Text style={styles.logo}>🎵</Text>
            <Text style={styles.appName}>NextDrop</Text>
            <Text style={styles.tagline}>
              The professional network for musicians, producers, and music industry collaborators
            </Text>
            
            {backendStatus === 'error' && (
              <View style={styles.errorContainer}>
                <TouchableOpacity
                  style={styles.warningBanner}
                  onPress={handleBackendSetup}
                >
                  <Icon name="warning" size={20} color={colors.warning || '#F59E0B'} />
                  <Text style={styles.warningText}>
                    Project Initialization Required
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.errorDetails}>
                  {errorDetails || 'Your project needs to be initialized before deployment. This is normal for new projects.'}
                </Text>
                
                <TouchableOpacity
                  style={styles.setupButton}
                  onPress={handleBackendSetup}
                  activeOpacity={0.8}
                >
                  <Icon name="settings" size={16} color={colors.white} />
                  <Text style={styles.setupButtonText}>Initialize Project</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {backendStatus === 'ready' && (
              <View style={styles.successBanner}>
                <Icon name="checkmark-circle" size={20} color={colors.success || '#10B981'} />
                <Text style={styles.successText}>
                  Ready for deployment! 🚀
                </Text>
              </View>
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
              variant="primary"
              size="large"
              style={styles.primaryButton}
            />
            
            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSignIn}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Sign In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCreateAccount}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
            
            {backendStatus === 'error' && (
              <TouchableOpacity
                style={styles.diagnosticsButton}
                onPress={handleBackendSetup}
                activeOpacity={0.8}
              >
                <Icon name="settings" size={16} color={colors.white} />
                <Text style={styles.diagnosticsButtonText}>Run Full Diagnostics</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>
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
  }, [delay, cardOpacity, cardScale]);

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
    backgroundColor: '#667eea',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: spacing.sm,
  },
  loadingDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
    fontFamily: 'Poppins_700Bold',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
    fontFamily: 'Inter_400Regular',
  },
  errorContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: colors.warning || '#F59E0B',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  warningText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  errorDetails: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
    fontFamily: 'Inter_400Regular',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  setupButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: colors.success || '#10B981',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  successText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  featuresContainer: {
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
    fontFamily: 'Poppins_600SemiBold',
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  actionsContainer: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
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
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
    fontFamily: 'Inter_600SemiBold',
  },
});

export default LandingScreen;

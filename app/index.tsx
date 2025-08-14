
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { getCurrentUser, initializeSampleData } from '../utils/storage';
import SupabaseService from '../utils/supabaseService';
import AuthService from '../utils/authService';
import { commonStyles, colors, spacing, borderRadius } from '../styles/commonStyles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

const WelcomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const logoScale = useSharedValue(0.8);

  useEffect(() => {
    // Start animations
    fadeIn.value = withTiming(1, { duration: 1000 });
    slideUp.value = withSpring(0, { damping: 20, stiffness: 100 });
    logoScale.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 100 }));

    // Initialize app
    initializeApp();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing MusicLinked app...');
      
      // Test backend connection
      const isConnected = await SupabaseService.testConnection();
      setBackendStatus(isConnected ? 'connected' : 'error');

      // Check if user is already authenticated
      const authUser = await AuthService.getCurrentAuthUser();
      
      if (authUser && authUser.emailConfirmed) {
        console.log('👤 User is authenticated, checking profile...');
        
        if (authUser.profile) {
          console.log('✅ User has profile, redirecting to main app');
          router.replace('/(tabs)');
          return;
        } else {
          console.log('⚠️ User needs onboarding');
          router.replace('/onboarding');
          return;
        }
      }

      // Initialize sample data for development (only if no auth user)
      if (!authUser) {
        await initializeSampleData();
        
        // Check local storage for existing user
        const currentUser = await getCurrentUser();
        
        if (currentUser?.isOnboarded) {
          console.log('👤 Local user found, redirecting to main app');
          router.replace('/(tabs)');
          return;
        }
      }

      console.log('👋 New user, showing welcome screen');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ App initialization error:', error);
      setBackendStatus('error');
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (backendStatus === 'error') {
      Alert.alert(
        'Backend Setup Required',
        'The backend connection failed. Would you like to run the setup wizard?',
        [
          {
            text: 'Setup Backend',
            onPress: () => router.push('/backend-setup'),
          },
          {
            text: 'Continue Anyway',
            onPress: () => router.push('/onboarding'),
            style: 'destructive',
          },
        ]
      );
    } else {
      router.push('/onboarding');
    }
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleBackendSetup = () => {
    router.push('/backend-setup');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <Animated.View style={logoAnimatedStyle}>
            <Text style={styles.logo}>🎵</Text>
          </Animated.View>
          <Text style={styles.loadingText}>Initializing MusicLinked...</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Backend: {backendStatus === 'checking' ? 'Checking...' : 
                       backendStatus === 'connected' ? '✅ Connected' : '❌ Error'}
            </Text>
          </View>
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
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Text style={styles.logo}>🎵</Text>
          <Text style={styles.title}>MusicLinked</Text>
          <Text style={styles.subtitle}>
            The professional network for musicians, producers, and music industry collaborators
          </Text>
        </Animated.View>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎤</Text>
            <Text style={styles.featureText}>Connect with talented musicians</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎹</Text>
            <Text style={styles.featureText}>Collaborate on amazing projects</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureText}>Earn money from your skills</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Backend Status: {backendStatus === 'connected' ? '✅ Connected' : '❌ Error'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            style={styles.primaryButton}
          />
          
          <Button
            title="Sign In"
            onPress={handleLogin}
            variant="outline"
            style={styles.secondaryButton}
          />
          
          <Button
            title="Backend Setup"
            onPress={handleBackendSetup}
            variant="outline"
            style={styles.tertiaryButton}
          />
        </View>
      </Animated.View>
    </View>
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
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  logo: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: spacing.xl * 2,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    minWidth: 280,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: 16,
    color: colors.white,
    flex: 1,
  },
  statusContainer: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.white,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  primaryButton: {
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: colors.white,
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  tertiaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'transparent',
    borderWidth: 0,
  },
});

export default WelcomeScreen;

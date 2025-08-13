
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { getCurrentUser } from '../utils/storage';
import { commonStyles, colors, spacing, borderRadius } from '../styles/commonStyles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const logoScale = useSharedValue(0.8);

  useEffect(() => {
    console.log('🏠 NextDrop Landing Page Loading...');
    
    // Start animations
    fadeIn.value = withTiming(1, { duration: 1000 });
    slideUp.value = withSpring(0, { damping: 20, stiffness: 100 });
    logoScale.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 100 }));

    // Check if user is already logged in
    checkUserStatus();
  }, [fadeIn, slideUp, logoScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const checkUserStatus = async () => {
    try {
      console.log('🏠 Checking user status...');
      
      const currentUser = await getCurrentUser();
      
      if (currentUser?.isOnboarded) {
        console.log('✅ User is onboarded, redirecting to main app');
        router.replace('/(tabs)');
        return;
      }

      console.log('👋 New user, showing landing page');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error checking user status:', error);
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    console.log('🚀 Get Started pressed');
    router.push('/auth/login');
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
          <Text style={styles.loadingText}>Loading NextDrop...</Text>
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
          <Text style={styles.title}>NextDrop</Text>
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

        <View style={styles.buttonContainer}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            style={styles.primaryButton}
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
    fontSize: 42,
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
});

export default HomeScreen;

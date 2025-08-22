
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { getCurrentUser } from '../utils/storage';
import { commonStyles, colors, spacing, borderRadius } from '../styles/commonStyles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
} from 'react-native-reanimated';

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const logoScale = useSharedValue(0.8);
  const buttonOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const initializeAnimations = useCallback(() => {
    // Sequence the animations for a more polished feel
    fadeIn.value = withTiming(1, { duration: 1000 });
    slideUp.value = withSpring(0, { damping: 20, stiffness: 100 });
    logoScale.value = withDelay(300, withSequence(
      withSpring(1.1, { damping: 15, stiffness: 100 }),
      withSpring(1, { damping: 15, stiffness: 100 })
    ));
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
  }, [fadeIn, slideUp, logoScale, buttonOpacity]);

  const checkUserStatus = useCallback(async () => {
    try {
      console.log('🏠 Checking user status for automatic navigation...');
      
      const currentUser = await getCurrentUser();
      
      if (currentUser?.isOnboarded) {
        console.log('✅ User is onboarded, automatically redirecting to home screen');
        // Immediate redirect without delay
        router.replace('/(tabs)');
        return;
      }

      console.log('👋 New user, showing landing page');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error checking user status:', error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🏠 NextDrop Landing Page Loading...');
    
    // Start animations
    initializeAnimations();

    // Check if user is already logged in
    checkUserStatus();
  }, [initializeAnimations, checkUserStatus]);

  const handleGetStarted = () => {
    console.log('🚀 Get Started pressed - going to login');
    router.push('/auth/login');
  };

  const handleCreateAccount = () => {
    console.log('📝 Create Account pressed - going to registration');
    router.push('/auth/register');
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
        {/* Logo Section */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Text style={styles.logo}>🎵</Text>
          <Text style={styles.title}>NextDrop</Text>
          <Text style={styles.subtitle}>
            Connect. Collaborate. Create.
          </Text>
          <Text style={styles.description}>
            The professional network for musicians, producers, and music industry collaborators
          </Text>
        </Animated.View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <FeatureItem 
            icon="people-outline" 
            text="Connect with talented musicians worldwide" 
            delay={1000}
          />
          <FeatureItem 
            icon="musical-notes-outline" 
            text="Collaborate on amazing projects" 
            delay={1200}
          />
          <FeatureItem 
            icon="trending-up-outline" 
            text="Grow your music career" 
            delay={1400}
          />
          <FeatureItem 
            icon="cash-outline" 
            text="Earn money from your skills" 
            delay={1600}
          />
        </View>

        {/* Action Buttons */}
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <Button
            text="Sign In"
            onPress={handleGetStarted}
            style={styles.primaryButton}
          />
          
          <Button
            text="Create New Account"
            onPress={handleCreateAccount}
            variant="outline"
            style={styles.secondaryButton}
          />
          
          <TouchableOpacity style={styles.learnMoreButton}>
            <Text style={styles.learnMoreText}>Learn More About NextDrop</Text>
            <Icon name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

interface FeatureItemProps {
  icon: string;
  text: string;
  delay: number;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, text, delay }) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateX.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 100 }));
  }, [delay, opacity, translateX]);

  return (
    <Animated.View style={[styles.feature, animatedStyle]}>
      <View style={styles.featureIconContainer}>
        <Icon name={icon as any} size={24} color={colors.white} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
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
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  logo: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: colors.white,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: spacing.md,
    opacity: 0.9,
  },
  description: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
    maxWidth: 300,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 320,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: 16,
    color: colors.white,
    flex: 1,
    fontWeight: '500',
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
    marginBottom: spacing.xl,
  },
  primaryButton: {
    marginBottom: spacing.md,
  },
  secondaryButton: {
    marginBottom: spacing.lg,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  learnMoreText: {
    fontSize: 14,
    color: colors.white,
    marginRight: spacing.sm,
    textDecorationLine: 'underline',
  },
});

export default HomeScreen;

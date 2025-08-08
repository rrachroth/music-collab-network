
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { getCurrentUser, initializeSampleData, User } from '../../utils/storage';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';

interface FeatureCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
  onPress: () => void;
  delay: number;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

  const initializeApp = useCallback(async () => {
    try {
      console.log('🏠 Initializing home screen...');
      await initializeSampleData();
      
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('❌ Error initializing app:', error);
    }
  }, []);

  useEffect(() => {
    initializeApp();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [fadeIn, slideUp, initializeApp]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeApp();
    setRefreshing(false);
  }, [initializeApp]);

  const handleDiscover = () => {
    router.push('/(tabs)/discover');
  };

  const handleProjects = () => {
    router.push('/(tabs)/projects');
  };

  const handleMatches = () => {
    router.push('/(tabs)/matches');
  };

  const handleProfile = () => {
    router.push('/(tabs)/profile');
  };

  if (!user) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Text style={commonStyles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.welcomeTitle}>
              Welcome to MusicLinked
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Connect, collaborate, and create amazing music together
            </Text>
          </View>
        </View>

        <Animated.View style={animatedStyle}>
          {/* Main Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Started</Text>
            
            <FeatureCard
              icon="search"
              title="Discover Artists"
              description="Find musicians and producers to collaborate with"
              gradient={colors.gradientPrimary}
              onPress={handleDiscover}
              delay={0}
            />
            
            <FeatureCard
              icon="folder"
              title="Browse Projects"
              description="Join exciting music collaboration projects"
              gradient={colors.gradientSecondary}
              onPress={handleProjects}
              delay={100}
            />
            
            <FeatureCard
              icon="heart"
              title="Your Matches"
              description="Connect with artists you've matched with"
              gradient={['#10B981', '#059669']}
              onPress={handleMatches}
              delay={200}
            />
            
            <FeatureCard
              icon="person"
              title="Your Profile"
              description="Manage your profile and showcase your music"
              gradient={['#F59E0B', '#D97706']}
              onPress={handleProfile}
              delay={300}
            />
          </View>

          {/* Call to Action */}
          <View style={styles.ctaSection}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.ctaCard}
            >
              <Text style={styles.ctaTitle}>Ready to collaborate?</Text>
              <Text style={styles.ctaSubtitle}>
                Start discovering amazing artists and create music together
              </Text>
              <Button
                text="Start Discovering"
                onPress={handleDiscover}
                variant="secondary"
                size="lg"
                style={styles.ctaButton}
              />
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function FeatureCard({ icon, title, description, gradient, onPress, delay }: FeatureCardProps) {
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ scale: cardScale.value }],
    };
  });

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15 }));
  }, [delay, cardOpacity, cardScale]);

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity style={styles.featureCard} onPress={onPress}>
        <LinearGradient
          colors={gradient}
          style={styles.featureIcon}
        >
          <Icon name={icon} size={28} color={colors.text} />
        </LinearGradient>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    lineHeight: 20,
  },
  ctaSection: {
    marginBottom: spacing.xl,
  },
  ctaCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  ctaTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ctaSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: colors.text,
    minWidth: 200,
  },
});

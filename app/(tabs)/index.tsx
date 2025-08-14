
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, StyleSheet, Dimensions } from 'react-native';
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

const { height: screenHeight } = Dimensions.get('window');

interface FeatureCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
  onPress: () => void;
  delay: number;
}

export default function HomeScreen() {
  console.log('🏠 NextDrop Home Screen rendering...');
  
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
      console.log('🏠 Initializing NextDrop home screen...');
      await initializeSampleData();
      
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        console.log('✅ User loaded:', currentUser.name);
      }
    } catch (error) {
      console.error('❌ Error initializing NextDrop app:', error);
    }
  }, []);

  useEffect(() => {
    initializeApp();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [fadeIn, slideUp, initializeApp]);

  const onRefresh = useCallback(async () => {
    console.log('🔄 Refreshing NextDrop home screen...');
    setRefreshing(true);
    await initializeApp();
    setRefreshing(false);
  }, [initializeApp]);

  const handleDiscover = () => {
    console.log('🔍 Navigating to Discover');
    router.push('/(tabs)/discover');
  };

  const handleProjects = () => {
    console.log('📁 Navigating to Projects');
    router.push('/(tabs)/projects');
  };

  const handleMatches = () => {
    console.log('💖 Navigating to Matches');
    router.push('/(tabs)/matches');
  };

  const handleProfile = () => {
    console.log('👤 Navigating to Profile');
    router.push('/(tabs)/profile');
  };

  if (!user) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="musical-note" size={80} color={colors.primary} />
        <Text style={[commonStyles.text, { marginTop: spacing.lg }]}>Loading NextDrop...</Text>
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
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xl * 2,
          }
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={true}
        alwaysBounceVertical={true}
        nestedScrollEnabled={false}
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
              Welcome to NextDrop
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
                title="Start Discovering"
                onPress={handleDiscover}
                style={styles.ctaButton}
              />
            </LinearGradient>
          </View>

          {/* About NextDrop Section */}
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>About NextDrop</Text>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>
                NextDrop is the professional network for musicians, producers, and music industry collaborators.
                Join thousands of artists already creating amazing music together.
              </Text>
            </View>
            
            <View style={styles.aboutCard}>
              <Text style={styles.aboutSubtitle}>🎵 For Musicians</Text>
              <Text style={styles.aboutText}>
                Showcase your talent, find collaborators, and build your professional network in the music industry.
              </Text>
            </View>
            
            <View style={styles.aboutCard}>
              <Text style={styles.aboutSubtitle}>🎹 For Producers</Text>
              <Text style={styles.aboutText}>
                Connect with vocalists, instrumentalists, and other producers to bring your musical visions to life.
              </Text>
            </View>
            
            <View style={styles.aboutCard}>
              <Text style={styles.aboutSubtitle}>💼 For Industry Professionals</Text>
              <Text style={styles.aboutText}>
                Discover new talent, manage projects, and expand your professional network in the music business.
              </Text>
            </View>
          </View>

          {/* Features Overview */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Why Choose NextDrop?</Text>
            
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>🔍</Text>
                <Text style={styles.featureItemTitle}>Smart Discovery</Text>
                <Text style={styles.featureItemText}>AI-powered matching based on your musical style and preferences</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>💬</Text>
                <Text style={styles.featureItemTitle}>Direct Messaging</Text>
                <Text style={styles.featureItemText}>Connect instantly with potential collaborators</Text>
              </View>
            </View>
            
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>📁</Text>
                <Text style={styles.featureItemTitle}>Project Management</Text>
                <Text style={styles.featureItemText}>Organize and manage your music collaborations</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>🎯</Text>
                <Text style={styles.featureItemTitle}>Professional Network</Text>
                <Text style={styles.featureItemText}>Build meaningful connections in the music industry</Text>
              </View>
            </View>
          </View>

          {/* Final CTA */}
          <View style={styles.finalCta}>
            <Text style={styles.finalCtaTitle}>Ready to make music?</Text>
            <Text style={styles.finalCtaText}>
              Join NextDrop today and start collaborating with talented musicians from around the world.
            </Text>
            <Button
              title="Explore Now"
              onPress={handleDiscover}
              style={styles.finalCtaButton}
            />
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
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
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
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: 14,
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
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ctaSubtitle: {
    fontSize: 16,
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
  aboutSection: {
    marginBottom: spacing.xl,
  },
  aboutTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  aboutCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  aboutSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  aboutText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: spacing.xl,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  featureItem: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  featureItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  featureItemText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  finalCta: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  finalCtaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  finalCtaText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  finalCtaButton: {
    backgroundColor: colors.primary,
    minWidth: 150,
  },
});

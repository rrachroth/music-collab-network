import { Text, View, ScrollView, TouchableOpacity, Alert, Dimensions, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay,
  interpolate,
  useAnimatedScrollHandler,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { getCurrentUser, initializeSampleData, User, getAllUsers, getMatches, getProjects } from '../../utils/storage';

interface FeatureCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
  onPress: () => void;
  delay: number;
}

interface StatCardProps {
  number: string;
  label: string;
}

interface QuickActionCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  gradient: string[];
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: '0',
    activeProjects: '0',
    matches: '0',
    collaborations: '0',
  });

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);
  const pulseScale = useSharedValue(1);
  const scrollY = useSharedValue(0);

  const initializeApp = useCallback(async () => {
    try {
      console.log('🚀 Initializing app...');
      setLoading(true);
      
      await initializeSampleData();
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        await loadStats();
      }
      
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize app. Please restart.');
    } finally {
      setLoading(false);
    }
  }, []);

  const startPulseAnimation = useCallback(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, [pulseScale]);

  useEffect(() => {
    initializeApp();
    startPulseAnimation();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 800 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [initializeApp, startPulseAnimation, fadeIn, slideUp]);

  const loadStats = async () => {
    try {
      const [allUsers, matches, projects] = await Promise.all([
        getAllUsers(),
        getMatches(),
        getProjects(),
      ]);

      setStats({
        totalUsers: allUsers.length.toString(),
        activeProjects: projects.filter(p => p.status === 'open').length.toString(),
        matches: matches.length.toString(),
        collaborations: projects.filter(p => p.status === 'completed').length.toString(),
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeApp();
    setRefreshing(false);
  };

  const handleGetStarted = () => {
    console.log('🚀 Getting started');
    if (!user) {
      router.push('/onboarding');
    } else {
      router.push('/(tabs)/discover');
    }
  };

  const handleExplore = () => {
    console.log('🔍 Exploring');
    router.push('/(tabs)/discover');
  };

  const handleProfile = () => {
    console.log('👤 Opening profile');
    router.push('/(tabs)/profile');
  };

  const handleProjects = () => {
    console.log('📋 Opening projects');
    router.push('/(tabs)/projects');
  };

  const handleMatches = () => {
    console.log('💕 Opening matches');
    router.push('/(tabs)/matches');
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.8]);
    const scale = interpolate(scrollY.value, [0, 100], [1, 0.95]);
    
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[pulseAnimatedStyle, { alignItems: 'center' }]}>
          <Icon name="musical-notes" size={80} color={colors.primary} />
          <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
            Muse
          </Text>
          <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
            Connecting musicians worldwide
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={animatedStyle}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
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
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>
                {user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Welcome to Muse'}
              </Text>
              <Text style={styles.subtitle}>
                {user ? 'Ready to create something amazing?' : 'Connect with musicians worldwide'}
              </Text>
            </View>
            
            <TouchableOpacity onPress={handleProfile} style={styles.profileButton}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.profileGradient}
              >
                <Text style={styles.profileInitial}>
                  {user ? user.name.charAt(0) : 'M'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Platform Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard number={stats.totalUsers} label="Musicians" />
            <StatCard number={stats.activeProjects} label="Active Projects" />
            <StatCard number={stats.matches} label="Connections" />
            <StatCard number={stats.collaborations} label="Collaborations" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              icon="search"
              title="Discover"
              subtitle="Find musicians"
              onPress={handleExplore}
              gradient={colors.gradientPrimary}
            />
            <QuickActionCard
              icon="add-circle"
              title="Create Project"
              subtitle="Start collaborating"
              onPress={handleProjects}
              gradient={colors.gradientSecondary}
            />
            <QuickActionCard
              icon="heart"
              title="Matches"
              subtitle="View connections"
              onPress={handleMatches}
              gradient={colors.gradientPrimary}
            />
            <QuickActionCard
              icon="person"
              title="Profile"
              subtitle="Edit your profile"
              onPress={handleProfile}
              gradient={colors.gradientSecondary}
            />
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What You Can Do</Text>
          <FeatureCard
            icon="people"
            title="Connect with Musicians"
            description="Discover and match with talented musicians from around the world"
            gradient={colors.gradientPrimary}
            onPress={handleExplore}
            delay={0}
          />
          <FeatureCard
            icon="musical-notes"
            title="Collaborate on Projects"
            description="Create and join music projects with other artists"
            gradient={colors.gradientSecondary}
            onPress={handleProjects}
            delay={100}
          />
          <FeatureCard
            icon="chatbubbles"
            title="Chat & Share Ideas"
            description="Communicate with your matches and share creative ideas"
            gradient={colors.gradientPrimary}
            onPress={handleMatches}
            delay={200}
          />
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.ctaGradient}
          >
            <View style={styles.ctaContent}>
              <Icon name="rocket" size={48} color={colors.text} />
              <Text style={styles.ctaTitle}>
                {user ? 'Start Creating Today' : 'Join the Community'}
              </Text>
              <Text style={styles.ctaDescription}>
                {user 
                  ? 'Discover new collaborators and create amazing music together'
                  : 'Connect with musicians and start your musical journey'
                }
              </Text>
              <Button
                text={user ? 'Explore Musicians' : 'Get Started'}
                onPress={handleGetStarted}
                variant="secondary"
                size="lg"
                style={{ marginTop: spacing.lg }}
              />
            </View>
          </LinearGradient>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function FeatureCard({ icon, title, description, gradient, onPress, delay }: FeatureCardProps) {
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15 }));
  }, [delay, cardOpacity, cardScale]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ scale: cardScale.value }],
    };
  });

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={gradient}
          style={styles.featureGradient}
        >
          <View style={styles.featureContent}>
            <Icon name={icon} size={32} color={colors.text} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDescription}>{description}</Text>
            </View>
            <Icon name="chevron-forward" size={24} color={colors.text} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatCard({ number, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickActionCard({ icon, title, subtitle, onPress, gradient }: QuickActionCardProps) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradient}
        style={styles.quickActionGradient}
      >
        <Icon name={icon} size={24} color={colors.text} />
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  profileButton: {
    borderRadius: 25,
    overflow: 'hidden',
    ...shadows.md,
  },
  profileGradient: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  quickActionCard: {
    width: '48%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  quickActionGradient: {
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    opacity: 0.8,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: spacing.xl,
  },
  featureCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  featureGradient: {
    padding: 2,
  },
  featureContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg - 2,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  featureTitle: {
    fontSize: 18,
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
  ctaGradient: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  ctaContent: {
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 24,
  },
});
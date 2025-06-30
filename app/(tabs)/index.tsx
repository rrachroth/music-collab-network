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
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    totalProjects: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);
  const scrollY = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const initializeApp = useCallback(async () => {
    try {
      console.log('🏠 Initializing home screen...');
      
      // Initialize sample data if needed
      await initializeSampleData();
      
      // Load current user
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Load stats
      await loadStats();
      
    } catch (error) {
      console.error('❌ Error initializing app:', error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [allUsers, allMatches, allProjects] = await Promise.all([
        getAllUsers(),
        getMatches(),
        getProjects()
      ]);

      setStats({
        totalUsers: allUsers.length,
        totalMatches: allMatches.length,
        totalProjects: allProjects.length
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([initializeApp(), loadStats()]);
    setRefreshing(false);
  }, [initializeApp, loadStats]);

  const handleGetStarted = useCallback(() => {
    if (!user || !user.isOnboarded) {
      router.push('/onboarding');
    } else {
      router.push('/(tabs)/discover');
    }
  }, [user]);

  const handleExplore = useCallback(() => {
    router.push('/(tabs)/discover');
  }, []);

  const handleProfile = useCallback(() => {
    router.push('/(tabs)/profile');
  }, []);

  const handleProjects = useCallback(() => {
    router.push('/(tabs)/projects');
  }, []);

  const handleMatches = useCallback(() => {
    router.push('/(tabs)/matches');
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.8]);
    const translateY = interpolate(scrollY.value, [0, 100], [0, -10]);
    
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              {user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Welcome to Muse'}
            </Text>
            <Text style={styles.subtitle}>
              {user ? 'Ready to create some music?' : 'Connect. Collaborate. Create.'}
            </Text>
          </View>
          
          <Animated.View style={pulseAnimatedStyle}>
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
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
        <Animated.View style={animatedStyle}>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.statsGradient}
            >
              <View style={styles.statsContent}>
                <StatCard number={stats.totalUsers.toString()} label="Musicians" />
                <StatCard number={stats.totalMatches.toString()} label="Matches" />
                <StatCard number={stats.totalProjects.toString()} label="Projects" />
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
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
                icon="heart"
                title="Matches"
                subtitle="Your connections"
                onPress={handleMatches}
                gradient={colors.gradientSecondary}
              />
              
              <QuickActionCard
                icon="folder"
                title="Projects"
                subtitle="Collaborations"
                onPress={handleProjects}
                gradient={['#10B981', '#059669']}
              />
              
              <QuickActionCard
                icon="person"
                title="Profile"
                subtitle="Your music profile"
                onPress={handleProfile}
                gradient={['#F59E0B', '#D97706']}
              />
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>Why Muse?</Text>
            
            <FeatureCard
              icon="musical-notes"
              title="Find Your Sound"
              description="Connect with musicians who share your musical vision and style"
              gradient={colors.gradientPrimary}
              onPress={handleExplore}
              delay={0}
            />
            
            <FeatureCard
              icon="people"
              title="Build Your Network"
              description="Grow your professional network and find long-term collaborators"
              gradient={colors.gradientSecondary}
              onPress={handleMatches}
              delay={100}
            />
            
            <FeatureCard
              icon="rocket"
              title="Launch Projects"
              description="Start new projects and find the perfect team to bring them to life"
              gradient={['#10B981', '#059669']}
              onPress={handleProjects}
              delay={200}
            />
          </View>

          {/* CTA */}
          <View style={styles.ctaContainer}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.ctaGradient}
            >
              <Icon name="musical-notes" size={48} color={colors.text} />
              <Text style={styles.ctaTitle}>Ready to Make Music?</Text>
              <Text style={styles.ctaDescription}>
                Join thousands of musicians creating amazing music together
              </Text>
              <Button
                text={user?.isOnboarded ? "Start Discovering" : "Get Started"}
                onPress={handleGetStarted}
                variant="secondary"
                size="lg"
                style={{ marginTop: spacing.lg, backgroundColor: colors.text }}
                textStyle={{ color: colors.primary }}
              />
            </LinearGradient>
          </View>
        </Animated.View>
      </Animated.ScrollView>
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
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15 }));
  }, [delay, cardOpacity, cardScale]);

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={gradient}
          style={styles.featureGradient}
        >
          <View style={styles.featureContent}>
            <View style={styles.featureIcon}>
              <Icon name={icon} size={32} color={colors.text} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDescription}>{description}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.text} />
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
        <Icon name={icon} size={28} color={colors.text} />
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 24,
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statsContainer: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  statsGradient: {
    padding: spacing.lg,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  quickActionsContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    width: '48%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  quickActionGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginTop: spacing.sm,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    opacity: 0.8,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: spacing.xl,
  },
  featureCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
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
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
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
  ctaContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  ctaGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  ctaDescription: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
  },
});
import { Text, View, ScrollView, TouchableOpacity, Alert, Dimensions, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
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
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { getCurrentUser, initializeSampleData, User, getAllUsers, getMatches, getProjects } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    totalProjects: 0,
    userMatches: 0,
  });
  
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  
  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const scale = useSharedValue(0.8);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    initializeApp();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  };

  const initializeApp = async () => {
    try {
      console.log('🏠 Initializing Muse App');
      setLoading(true);
      
      // Initialize sample data if needed
      await initializeSampleData();
      
      // Load current user
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Load app statistics
      await loadStats();
      
      console.log('👤 Current user:', currentUser?.name || 'No user');
      
      // Start entrance animations
      fadeIn.value = withTiming(1, { duration: 1000 });
      slideUp.value = withSpring(0, { damping: 15, stiffness: 100 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
      
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize app. Please restart.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [allUsers, matches, projects] = await Promise.all([
        getAllUsers(),
        getMatches(),
        getProjects(),
      ]);

      const currentUser = await getCurrentUser();
      const userMatches = currentUser ? matches.filter(m => 
        m.userId === currentUser.id || m.matchedUserId === currentUser.id
      ).length : 0;

      setStats({
        totalUsers: allUsers.length,
        totalMatches: matches.length,
        totalProjects: projects.length,
        userMatches,
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

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
    
    const newOpacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      'clamp'
    );
    headerOpacity.value = withTiming(newOpacity, { duration: 150 });
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [
        { translateY: slideUp.value },
        { scale: scale.value }
      ],
    };
  });

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });

  const animatedPulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const handleGetStarted = () => {
    console.log('🎵 Starting onboarding flow');
    router.push('/onboarding');
  };

  const handleExplore = () => {
    console.log('🔍 Exploring features');
    if (!user?.isOnboarded) {
      Alert.alert(
        'Complete Your Profile',
        'Please complete your profile setup before discovering other musicians.',
        [
          { text: 'Setup Profile', onPress: () => router.push('/onboarding') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    router.push('/discover');
  };

  const handleProfile = () => {
    console.log('👤 Opening profile');
    router.push('/profile');
  };

  const handleProjects = () => {
    console.log('📋 Opening projects');
    if (!user?.isOnboarded) {
      Alert.alert(
        'Complete Your Profile',
        'Please complete your profile setup before browsing projects.',
        [
          { text: 'Setup Profile', onPress: () => router.push('/onboarding') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    router.push('/projects');
  };

  const handleMatches = () => {
    console.log('💕 Opening matches');
    if (!user?.isOnboarded) {
      Alert.alert(
        'Complete Your Profile',
        'Please complete your profile setup first.',
        [
          { text: 'Setup Profile', onPress: () => router.push('/onboarding') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    router.push('/matches');
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[animatedPulseStyle]}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.logoGradient}
          >
            <Icon name="musical-notes" size={60} />
          </LinearGradient>
        </Animated.View>
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Loading Muse...
        </Text>
        <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
          Preparing your musical journey
        </Text>
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Floating Header */}
      <Animated.View style={[styles.floatingHeader, animatedHeaderStyle]}>
        <LinearGradient
          colors={['rgba(10, 14, 26, 0.95)', 'rgba(26, 31, 46, 0.95)']}
          style={styles.headerGradient}
        >
          <Text style={[commonStyles.heading, { color: colors.text, textAlign: 'center' }]}>
            Muse
          </Text>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[commonStyles.content, { paddingTop: spacing.xl }]}
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
        <Animated.View style={animatedContainerStyle}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.logoGradient}
              >
                <Icon name="musical-notes" size={60} />
              </LinearGradient>
            </View>
            
            <Text style={[commonStyles.title, { fontSize: 36, marginBottom: spacing.sm }]}>
              Muse
            </Text>
            
            <Text style={[commonStyles.text, { fontSize: 18, opacity: 0.9, marginBottom: spacing.xl }]}>
              The Professional Network for Musicians
            </Text>

            {user && user.isOnboarded && (
              <View style={styles.userWelcome}>
                <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: spacing.sm }]}>
                  Welcome back, {user.name}! 👋
                </Text>
                <Text style={[commonStyles.caption, { textAlign: 'center', opacity: 0.8 }]}>
                  {user.role} • {user.genres.slice(0, 2).join(', ')}
                </Text>
                {stats.userMatches > 0 && (
                  <TouchableOpacity 
                    style={styles.matchesBadge}
                    onPress={handleMatches}
                  >
                    <Text style={styles.matchesBadgeText}>
                      {stats.userMatches} New Match{stats.userMatches !== 1 ? 'es' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.statsContainer}>
              <StatCard number={`${stats.totalUsers}+`} label="Artists" />
              <StatCard number={`${stats.totalMatches}+`} label="Matches" />
              <StatCard number={`${stats.totalProjects}+`} label="Projects" />
            </View>
          </View>

          {/* Quick Actions */}
          {user?.isOnboarded && (
            <View style={[commonStyles.section, { marginTop: spacing.lg }]}>
              <Text style={[commonStyles.subtitle, { marginBottom: spacing.lg }]}>
                Quick Actions
              </Text>
              <View style={styles.quickActions}>
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
                  subtitle={`${stats.userMatches} new`}
                  onPress={handleMatches}
                  gradient={colors.gradientSecondary}
                />
                <QuickActionCard
                  icon="briefcase"
                  title="Projects"
                  subtitle="Browse & create"
                  onPress={handleProjects}
                  gradient={colors.gradientPrimary}
                />
                <QuickActionCard
                  icon="person"
                  title="Profile"
                  subtitle="Edit & view"
                  onPress={handleProfile}
                  gradient={colors.gradientSecondary}
                />
              </View>
            </View>
          )}

          {/* Features Section */}
          <View style={[commonStyles.section, { marginTop: spacing.xl }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: spacing.lg }]}>
              {user?.isOnboarded ? 'Explore Features' : 'Discover Your Sound'}
            </Text>
            
            <FeatureCard
              icon="people"
              title="Connect & Collaborate"
              description="Find musicians, producers, and industry professionals worldwide"
              gradient={colors.gradientPrimary}
              onPress={handleExplore}
              delay={0}
            />
            
            <FeatureCard
              icon="mic"
              title="Showcase Your Talent"
              description="Upload audio/video highlights and build your professional profile"
              gradient={colors.gradientSecondary}
              onPress={handleProfile}
              delay={200}
            />
            
            <FeatureCard
              icon="briefcase"
              title="Open Projects"
              description="Browse and apply to collaborative music projects"
              gradient={colors.gradientPrimary}
              onPress={handleProjects}
              delay={400}
            />
            
            <FeatureCard
              icon="flash"
              title="Smart Matching"
              description="AI-powered recommendations based on your musical style"
              gradient={colors.gradientSecondary}
              onPress={handleExplore}
              delay={600}
            />
          </View>

          {/* CTA Section */}
          <View style={[commonStyles.section, { marginTop: spacing.xl }]}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
              style={styles.ctaContainer}
            >
              <Text style={[commonStyles.heading, { textAlign: 'center', marginBottom: spacing.md }]}>
                {user?.isOnboarded ? 'Ready to Collaborate?' : 'Ready to Make Music?'}
              </Text>
              
              <Text style={[commonStyles.text, { marginBottom: spacing.lg, opacity: 0.8, textAlign: 'center' }]}>
                {user?.isOnboarded 
                  ? 'Continue building your network and creating amazing music'
                  : 'Join thousands of musicians already collaborating on Muse'
                }
              </Text>

              <View style={styles.buttonGroup}>
                {!user?.isOnboarded ? (
                  <Button
                    text="Get Started"
                    onPress={handleGetStarted}
                    variant="gradient"
                    size="lg"
                    style={{ marginBottom: spacing.sm }}
                  />
                ) : (
                  <Button
                    text="Discover Artists"
                    onPress={handleExplore}
                    variant="gradient"
                    size="lg"
                    style={{ marginBottom: spacing.sm }}
                  />
                )}
                
                <Button
                  text={user?.isOnboarded ? "View My Profile" : "Learn More"}
                  onPress={handleProfile}
                  variant="outline"
                  size="md"
                />
              </View>
            </LinearGradient>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[commonStyles.caption, { opacity: 0.6 }]}>
              Version 1.0.0 - Production Ready
            </Text>
            <Text style={[commonStyles.caption, { opacity: 0.4, marginTop: spacing.xs }]}>
              Made with ❤️ for musicians worldwide
            </Text>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

interface FeatureCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
  onPress: () => void;
  delay: number;
}

function FeatureCard({ icon, title, description, gradient, onPress, delay }: FeatureCardProps) {
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15 }));
  }, [delay]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ scale: cardScale.value }],
    };
  });

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={gradient}
          style={styles.featureGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.featureContent}>
            <View style={styles.featureIcon}>
              <Icon name={icon} size={32} />
            </View>
            <View style={styles.featureText}>
              <Text style={[commonStyles.heading, { fontSize: 18, marginBottom: spacing.xs }]}>
                {title}
              </Text>
              <Text style={[commonStyles.text, { fontSize: 14, opacity: 0.9, textAlign: 'left' }]}>
                {description}
              </Text>
            </View>
            <View style={styles.featureArrow}>
              <Icon name="chevron-forward" size={24} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface StatCardProps {
  number: string;
  label: string;
}

function StatCard({ number, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface QuickActionCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  gradient: string[];
}

function QuickActionCard({ icon, title, subtitle, onPress, gradient }: QuickActionCardProps) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradient}
        style={styles.quickActionGradient}
      >
        <Icon name={icon} size={24} />
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: spacing.xl,
  },
  headerGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  userWelcome: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    alignItems: 'center',
  },
  matchesBadge: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  matchesBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.lg,
  },
  statCard: {
    alignItems: 'center',
    padding: spacing.md,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  quickActions: {
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
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    opacity: 0.8,
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
    borderRadius: 30,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureArrow: {
    marginLeft: spacing.sm,
  },
  ctaContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  buttonGroup: {
    width: '100%',
    gap: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.xl,
  },
});
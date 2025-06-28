import { Text, View, ScrollView, TouchableOpacity, Alert, Dimensions, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { getCurrentUser, initializeSampleData, User, getAllUsers, getMatches, getProjects } from '../../utils/storage';

const { width } = Dimensions.get('window');

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
  const [stats, setStats] = useState({ matches: 0, projects: 0, users: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);
  const pulseScale = useSharedValue(1);
  const scrollY = useSharedValue(0);

  const initializeApp = useCallback(async () => {
    try {
      console.log('🏠 Initializing Home Screen...');
      
      // Initialize sample data first
      await initializeSampleData();
      
      // Load current user
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        console.log('👤 User loaded:', currentUser.name);
      }
      
      // Load stats
      await loadStats();
      
    } catch (error) {
      console.error('❌ Error initializing app:', error);
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

  const loadStats = async () => {
    try {
      const [allUsers, matches, projects] = await Promise.all([
        getAllUsers(),
        getMatches(),
        getProjects()
      ]);
      
      setStats({
        users: allUsers.length,
        matches: matches.length,
        projects: projects.length
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeApp();
    setRefreshing(false);
  }, [initializeApp]);

  const handleGetStarted = () => {
    router.push('/(tabs)/discover');
  };

  const handleExplore = () => {
    router.push('/(tabs)/discover');
  };

  const handleProfile = () => {
    router.push('/(tabs)/profile');
  };

  const handleProjects = () => {
    router.push('/(tabs)/projects');
  };

  const handleMatches = () => {
    router.push('/(tabs)/matches');
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Icon name="musical-notes" size={80} />
        <Text style={[commonStyles.title, { marginTop: 24 }]}>
          Muse
        </Text>
        <Text style={[commonStyles.caption, { marginTop: 8 }]}>
          Loading your musical journey...
        </Text>
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <Animated.ScrollView
        style={commonStyles.wrapper}
        contentContainerStyle={[commonStyles.content, { paddingTop: spacing.lg }]}
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[commonStyles.title, { textAlign: 'left', marginBottom: 0 }]}>
                Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}! 👋
              </Text>
              <Text style={[commonStyles.text, { textAlign: 'left', marginTop: spacing.sm }]}>
                Ready to create some amazing music?
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={handleProfile}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.profileGradient}
              >
                <Icon name="person" size={24} color={colors.text} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <StatCard number={stats.users.toString()} label="Artists" />
            <StatCard number={stats.projects.toString()} label="Projects" />
            <StatCard number={stats.matches.toString()} label="Matches" />
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[commonStyles.heading, { textAlign: 'left', marginBottom: spacing.lg }]}>
              Quick Actions
            </Text>
            
            <View style={styles.quickActionsGrid}>
              <QuickActionCard
                icon="search"
                title="Discover"
                subtitle="Find new collaborators"
                onPress={handleExplore}
                gradient={colors.gradientPrimary}
              />
              <QuickActionCard
                icon="heart"
                title="Matches"
                subtitle="View your connections"
                onPress={handleMatches}
                gradient={colors.gradientSecondary}
              />
              <QuickActionCard
                icon="folder"
                title="Projects"
                subtitle="Browse open projects"
                onPress={handleProjects}
                gradient={['#F59E0B', '#EF4444']}
              />
              <QuickActionCard
                icon="person"
                title="Profile"
                subtitle="Edit your profile"
                onPress={handleProfile}
                gradient={['#10B981', '#059669']}
              />
            </View>
          </View>

          {/* Featured Content */}
          <View style={styles.section}>
            <Text style={[commonStyles.heading, { textAlign: 'left', marginBottom: spacing.lg }]}>
              Explore Muse
            </Text>
            
            <FeatureCard
              icon="musical-notes"
              title="Discover Artists"
              description="Swipe through talented musicians and find your perfect collaborator"
              gradient={colors.gradientPrimary}
              onPress={handleExplore}
              delay={0}
            />
            
            <FeatureCard
              icon="folder-open"
              title="Open Projects"
              description="Browse exciting music projects looking for collaborators"
              gradient={colors.gradientSecondary}
              onPress={handleProjects}
              delay={200}
            />
            
            <FeatureCard
              icon="chatbubbles"
              title="Connect & Chat"
              description="Message your matches and start creating music together"
              gradient={['#F59E0B', '#EF4444']}
              onPress={handleMatches}
              delay={400}
            />
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.ctaCard}
            >
              <Icon name="rocket" size={48} color={colors.text} />
              <Text style={[commonStyles.subtitle, { color: colors.text, marginTop: spacing.md }]}>
                Start Your Musical Journey
              </Text>
              <Text style={[commonStyles.text, { color: colors.text, opacity: 0.9, marginBottom: spacing.lg }]}>
                Connect with artists worldwide and create amazing music together
              </Text>
              <Button
                text="Get Started"
                onPress={handleGetStarted}
                variant="outline"
                size="lg"
                style={{ backgroundColor: colors.text, borderColor: colors.text }}
                textStyle={{ color: colors.primary }}
              />
            </LinearGradient>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: spacing.xxl }} />
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

function FeatureCard({ icon, title, description, gradient, onPress, delay }: FeatureCardProps) {
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15 }));
  }, [delay, cardOpacity, cardScale]);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ scale: cardScale.value }],
    };
  });

  return (
    <Animated.View style={animatedCardStyle}>
      <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={gradient}
          style={styles.featureGradient}
        >
          <Icon name={icon} size={32} color={colors.text} />
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
      </LinearGradient>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  profileButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...shadows.md,
  },
  profileGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
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
  section: {
    marginBottom: spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  quickActionGradient: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  quickActionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
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
    borderColor: colors.border,
    ...shadows.md,
  },
  featureGradient: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
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
  ctaSection: {
    marginTop: spacing.xl,
  },
  ctaCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
});
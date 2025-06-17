import { Text, View, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
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
  runOnJS
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  
  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    console.log('🏠 MusicLinked Home Screen Loaded');
    
    // Simulate user check
    const mockUser = {
      id: '1',
      name: 'Demo User',
      role: 'Producer',
      isOnboarded: false
    };
    setUser(mockUser);

    // Start entrance animations
    fadeIn.value = withTiming(1, { duration: 800 });
    slideUp.value = withSpring(0, { damping: 15 });
    scale.value = withSpring(1, { damping: 15 });
  }, []);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
    
    // Update header opacity based on scroll
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

  const handleGetStarted = () => {
    console.log('🎵 Starting onboarding flow');
    router.push('/onboarding');
  };

  const handleExplore = () => {
    console.log('🔍 Exploring features');
    router.push('/discover');
  };

  const handleProfile = () => {
    console.log('👤 Opening profile');
    router.push('/profile');
  };

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      {/* Floating Header */}
      <Animated.View style={[styles.floatingHeader, animatedHeaderStyle]}>
        <LinearGradient
          colors={['rgba(10, 14, 26, 0.95)', 'rgba(26, 31, 46, 0.95)']}
          style={styles.headerGradient}
        >
          <Text style={[commonStyles.heading, { color: colors.text, textAlign: 'center' }]}>
            MusicLinked
          </Text>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[commonStyles.content, { paddingTop: spacing.xl }]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <Animated.View style={animatedContainerStyle}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.logoGradient}
              >
                <Icon name="musical-notes" size={60} color={colors.text} />
              </LinearGradient>
            </View>
            
            <Text style={[commonStyles.title, { fontSize: 36, marginBottom: spacing.sm }]}>
              MusicLinked
            </Text>
            
            <Text style={[commonStyles.text, { fontSize: 18, opacity: 0.9, marginBottom: spacing.xl }]}>
              The Professional Network for Musicians
            </Text>

            <View style={styles.statsContainer}>
              <StatCard number="10K+" label="Artists" />
              <StatCard number="5K+" label="Collabs" />
              <StatCard number="50+" label="Genres" />
            </View>
          </View>

          {/* Features Section */}
          <View style={[commonStyles.section, { marginTop: spacing.xl }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: spacing.lg }]}>
              Discover Your Sound
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
              icon="flash"
              title="Smart Matching"
              description="AI-powered recommendations based on your musical style and preferences"
              gradient={colors.gradientPrimary}
              onPress={handleExplore}
              delay={400}
            />
            
            <FeatureCard
              icon="cash"
              title="Revenue Splitting"
              description="Automated payment distribution for seamless collaborations"
              gradient={colors.gradientSecondary}
              onPress={() => Alert.alert('Coming Soon! 🚀', 'Revenue splitting will be available in the beta version. Stay tuned!')}
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
                Ready to Make Music?
              </Text>
              
              <Text style={[commonStyles.text, { marginBottom: spacing.lg, opacity: 0.8 }]}>
                Join thousands of musicians already collaborating on MusicLinked
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
                  text="View My Profile"
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
              Version 1.0.0 - Alpha Build
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
              <Icon name={icon} size={32} color={colors.text} />
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
              <Icon name="chevron-forward" size={24} color={colors.textMuted} />
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

const styles = {
  floatingHeader: {
    position: 'absolute' as const,
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
    alignItems: 'center' as const,
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
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.lg,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    width: '100%',
    marginTop: spacing.lg,
  },
  statCard: {
    alignItems: 'center' as const,
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
  featureCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden' as const,
    ...shadows.md,
  },
  featureGradient: {
    padding: 2,
  },
  featureContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg - 2,
    padding: spacing.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  buttonGroup: {
    width: '100%',
    gap: spacing.sm,
  },
  footer: {
    alignItems: 'center' as const,
    paddingVertical: spacing.xl,
    marginTop: spacing.xl,
  },
};
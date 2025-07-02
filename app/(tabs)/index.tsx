import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import { router } from 'expo-router';
import { Text, View, ScrollView, TouchableOpacity, Alert, Dimensions, RefreshControl, StyleSheet } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import { getCurrentUser, initializeSampleData, User, getAllUsers, getMatches, getProjects } from '../../utils/storage';
import { SubscriptionService } from '../../utils/subscriptionService';
import { PaymentService } from '../../utils/paymentService';
import SubscriptionModal from '../../components/SubscriptionModal';
import PaymentInfoModal from '../../components/PaymentInfoModal';
import { useState, useEffect, useCallback } from 'react';
import Button from '../../components/Button';
import PaymentModal from '../../components/PaymentModal';

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

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    totalProjects: 0,
    userMatches: 0,
    userProjects: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 0,
    description: '',
    recipientName: '',
  });
  
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

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.8]);
    const translateY = interpolate(scrollY.value, [0, 100], [0, -10]);
    
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const initializeApp = useCallback(async () => {
    try {
      console.log('🏠 Initializing home screen...');
      await initializeSampleData();
      
      const [currentUser, allUsers, matches, projects] = await Promise.all([
        getCurrentUser(),
        getAllUsers(),
        getMatches(),
        getProjects()
      ]);

      if (currentUser) {
        setUser(currentUser);
        
        const userMatches = matches.filter(match => 
          match.userId === currentUser.id || match.matchedUserId === currentUser.id
        );
        
        const userProjects = projects.filter(project => 
          project.authorId === currentUser.id
        );

        setStats({
          totalUsers: allUsers.length,
          totalMatches: matches.length,
          totalProjects: projects.length,
          userMatches: userMatches.length,
          userProjects: userProjects.length,
        });

        // Load subscription status
        const subStatus = await SubscriptionService.getSubscriptionStatus();
        setSubscriptionStatus(subStatus);
      }
    } catch (error) {
      console.error('❌ Error initializing app:', error);
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
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [fadeIn, slideUp, initializeApp, startPulseAnimation]);

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

  const handleMarketplace = () => {
    Alert.alert(
      'Marketplace & Education Hub 🎓',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Buy Beat ($25)', 
          onPress: () => {
            setPaymentDetails({
              amount: 2500, // $25.00 in cents
              description: 'Premium Hip-Hop Beat License',
              recipientName: 'Producer Mike',
            });
            setPaymentModalVisible(true);
          }
        },
        { 
          text: 'Book Session ($50)', 
          onPress: () => {
            setPaymentDetails({
              amount: 5000, // $50.00 in cents
              description: '1-hour Mixing Session',
              recipientName: 'Mix Engineer Sarah',
            });
            setPaymentModalVisible(true);
          }
        },
        { 
          text: 'Mentoring ($75)', 
          onPress: () => {
            setPaymentDetails({
              amount: 7500, // $75.00 in cents
              description: '1-hour Music Production Mentoring',
              recipientName: 'Producer Alex',
            });
            setPaymentModalVisible(true);
          }
        }
      ]
    );
  };

  const handlePremiumUpgrade = () => {
    setShowSubscriptionModal(true);
  };

  const handleAIMatching = () => {
    Alert.alert(
      'AI Matching Engine 🤖',
      'Advanced ML model using profile tags, audio embeddings, and past success metrics for smart suggestions. Coming Soon!',
      [
        { text: 'Got It', style: 'cancel' },
        { text: 'Join Beta', onPress: () => console.log('AI matching beta') }
      ]
    );
  };

  const handleDistribution = () => {
    Alert.alert(
      'Distribution Plugin 🎵',
      'Push finished collaborations to Spotify/Apple via Distro API with automated royalty tracking. Coming Soon!',
      [
        { text: 'Got It', style: 'cancel' },
        { text: 'Join Waitlist', onPress: () => console.log('Distribution waitlist') }
      ]
    );
  };

  const handleAnalytics = () => {
    Alert.alert(
      'Analytics Dashboard 📊',
      'Track your performance, match success rate, and collaboration metrics.',
      [
        { text: 'Got It', style: 'cancel' },
        { text: 'Preview', onPress: () => console.log('Analytics preview') }
      ]
    );
  };

  const handleARSaaS = () => {
    Alert.alert(
      'A&R SaaS Platform 🎯',
      'Specialized tools for A&R professionals including bulk search, curated talent lists, and CSV export. Coming Soon!',
      [
        { text: 'Got It', style: 'cancel' },
        { text: 'Request Demo', onPress: () => console.log('A&R demo request') }
      ]
    );
  };

  const handlePaymentSuccess = (paymentResult: any) => {
    console.log('✅ Payment successful:', paymentResult);
    // Here you would typically update the user's subscription status or grant access to purchased content
  };

  if (!user) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Text style={commonStyles.text}>Loading...</Text>
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
        {/* Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View>
            <Text style={[commonStyles.title, { marginBottom: 0, textAlign: 'left' }]}>
              Welcome back, {user.name}! 👋
            </Text>
            <Text style={[commonStyles.caption, { textAlign: 'left', marginTop: spacing.xs }]}>
              Ready to create amazing music together?
            </Text>
          </View>
          <TouchableOpacity onPress={handleProfile}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.profileButton}
            >
              <Icon name="person" size={24} color={colors.text} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={animatedStyle}>
          {/* Subscription Status */}
          {subscriptionStatus && (
            <View style={styles.subscriptionSection}>
              <LinearGradient
                colors={subscriptionStatus.isPremium ? ['#FFD700', '#FFA500'] : colors.gradientBackground}
                style={styles.subscriptionCard}
              >
                <View style={styles.subscriptionHeader}>
                  <Icon 
                    name={subscriptionStatus.isPremium ? "diamond" : "person"} 
                    size={24} 
                    color={subscriptionStatus.isPremium ? "#000" : colors.primary} 
                  />
                  <Text style={[styles.subscriptionTitle, { color: subscriptionStatus.isPremium ? "#000" : colors.text }]}>
                    {subscriptionStatus.plan} Plan
                  </Text>
                </View>
                
                {subscriptionStatus.usage && (
                  <View style={styles.subscriptionUsage}>
                    <Text style={[styles.subscriptionUsageText, { color: subscriptionStatus.isPremium ? "#000" : colors.text }]}>
                      Projects: {subscriptionStatus.isPremium 
                        ? 'Unlimited' 
                        : `${subscriptionStatus.usage.projectsPostedThisMonth}/${subscriptionStatus.limits.projectsPerMonth} this month`
                      }
                    </Text>
                    <Text style={[styles.subscriptionUsageText, { color: subscriptionStatus.isPremium ? "#000" : colors.text }]}>
                      Likes: {subscriptionStatus.isPremium 
                        ? 'Unlimited' 
                        : `${subscriptionStatus.usage.likesUsedToday}/${subscriptionStatus.limits.likesPerDay} today`
                      }
                    </Text>
                  </View>
                )}
                
                {!subscriptionStatus.isPremium && (
                  <Button
                    text="Upgrade to Premium"
                    onPress={handlePremiumUpgrade}
                    variant="primary"
                    size="sm"
                    style={styles.upgradeButton}
                  />
                )}
              </LinearGradient>
            </View>
          )}

          {/* Platform Stats */}
          <View style={styles.statsSection}>
            <Text style={[commonStyles.heading, { marginBottom: spacing.lg }]}>
              Platform Overview
            </Text>
            <View style={styles.statsGrid}>
              <StatCard number={stats.totalUsers.toString()} label="Active Artists" />
              <StatCard number={stats.totalMatches.toString()} label="Total Matches" />
              <StatCard number={stats.totalProjects.toString()} label="Open Projects" />
              <StatCard number="15%" label="Success Rate" />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={[commonStyles.heading, { marginBottom: spacing.lg }]}>
              Quick Actions
            </Text>
            
            <QuickActionCard
              icon="search"
              title="Discover Artists"
              subtitle="Find your next collaborator"
              onPress={handleDiscover}
              gradient={colors.gradientPrimary}
            />
            
            <QuickActionCard
              icon="folder"
              title="Browse Projects"
              subtitle="Join exciting collaborations"
              onPress={handleProjects}
              gradient={colors.gradientSecondary}
            />
            
            <QuickActionCard
              icon="heart"
              title="View Matches"
              subtitle={`${stats.userMatches} new connections`}
              onPress={handleMatches}
              gradient={['#10B981', '#059669']}
            />
          </View>

          {/* Core Features */}
          <View style={styles.featuresSection}>
            <Text style={[commonStyles.heading, { marginBottom: spacing.lg }]}>
              Core Features ✅
            </Text>
            
            <FeatureCard
              icon="people"
              title="Profile & Media Upload"
              description="Create profiles and upload 60-sec highlights"
              gradient={colors.gradientPrimary}
              onPress={handleProfile}
              delay={0}
            />
            
            <FeatureCard
              icon="shuffle"
              title="Swipe Discovery"
              description="Tinder-style discovery with genre filters"
              gradient={colors.gradientSecondary}
              onPress={handleDiscover}
              delay={100}
            />
            
            <FeatureCard
              icon="chatbubbles"
              title="Match & Messaging"
              description="Direct messaging with matched artists"
              gradient={['#10B981', '#059669']}
              onPress={handleMatches}
              delay={200}
            />
          </View>

          {/* Enhanced Features */}
          <View style={styles.featuresSection}>
            <Text style={[commonStyles.heading, { marginBottom: spacing.lg }]}>
              Enhanced Features 🚀
            </Text>
            
            <FeatureCard
              icon="megaphone"
              title="Open Projects Feed"
              description="Post and discover collaboration opportunities"
              gradient={['#F59E0B', '#D97706']}
              onPress={handleProjects}
              delay={0}
            />
            
            <FeatureCard
              icon="card"
              title="Revenue Splitting with Stripe"
              description="Secure payments with automatic revenue distribution"
              gradient={['#8B5CF6', '#7C3AED']}
              onPress={() => setShowPaymentInfoModal(true)}
              delay={100}
            />
            
            <FeatureCard
              icon="analytics"
              title="Analytics Dashboard"
              description="Track your collaboration metrics"
              gradient={['#06B6D4', '#0891B2']}
              onPress={handleAnalytics}
              delay={200}
            />
          </View>

          {/* Marketplace & Premium */}
          <View style={styles.featuresSection}>
            <Text style={[commonStyles.heading, { marginBottom: spacing.lg }]}>
              Marketplace & Premium 💎
            </Text>
            
            <FeatureCard
              icon="storefront"
              title="Marketplace & Education (Coming Soon)"
              description="Book sessions, buy beats, mentoring with Stripe payments"
              gradient={['#EC4899', '#DB2777']}
              onPress={handleMarketplace}
              delay={0}
            />
            
            <FeatureCard
              icon="diamond"
              title="Premium Tiers (Coming Soon)"
              description="Creator+, Pro Studio, A&R Seat plans"
              gradient={['#F59E0B', '#D97706']}
              onPress={handlePremiumUpgrade}
              delay={100}
            />
          </View>

          {/* AI & Scale Features */}
          <View style={styles.featuresSection}>
            <Text style={[commonStyles.heading, { marginBottom: spacing.lg }]}>
              AI & Scale Features 🤖
            </Text>
            
            <FeatureCard
              icon="bulb"
              title="AI Matching Engine (Coming Soon)"
              description="ML-powered smart collaboration suggestions"
              gradient={['#8B5CF6', '#7C3AED']}
              onPress={handleAIMatching}
              delay={0}
            />
            
            <FeatureCard
              icon="musical-notes"
              title="Distribution Plugin (Coming Soon)"
              description="Push to Spotify/Apple with royalty tracking"
              gradient={['#10B981', '#059669']}
              onPress={handleDistribution}
              delay={100}
            />
            
            <FeatureCard
              icon="business"
              title="A&R SaaS Platform (Coming Soon)"
              description="Professional tools for talent scouts"
              gradient={['#06B6D4', '#0891B2']}
              onPress={handleARSaaS}
              delay={200}
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
                Join thousands of artists creating amazing music together
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
      </Animated.ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        amount={paymentDetails.amount}
        description={paymentDetails.description}
        recipientName={paymentDetails.recipientName}
        onSuccess={handlePaymentSuccess}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          setShowSubscriptionModal(false);
          initializeApp(); // Refresh subscription status
          Alert.alert('Welcome to Premium! 🎉', 'You now have unlimited project postings and likes!');
        }}
      />

      {/* Payment Info Modal */}
      <PaymentInfoModal
        visible={showPaymentInfoModal}
        onClose={() => setShowPaymentInfoModal(false)}
      />
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
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <LinearGradient
        colors={gradient}
        style={styles.quickActionIcon}
      >
        <Icon name={icon} size={24} color={colors.text} />
      </LinearGradient>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
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
  quickActionCard: {
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
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  featuresSection: {
    marginBottom: spacing.xl,
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
  },
  ctaButton: {
    backgroundColor: colors.text,
    minWidth: 200,
  },
  subscriptionSection: {
    marginBottom: spacing.xl,
  },
  subscriptionCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: spacing.sm,
  },
  subscriptionUsage: {
    marginBottom: spacing.md,
  },
  subscriptionUsageText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: spacing.xs,
  },
  upgradeButton: {
    alignSelf: 'flex-start',
  },
});
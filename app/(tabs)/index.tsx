
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
import SubscriptionModal from '../../components/SubscriptionModal';
import PaymentInfoModal from '../../components/PaymentInfoModal';
import PaymentModal from '../../components/PaymentModal';
import { getCurrentUser, initializeSampleData, User, getAllUsers, getMatches, getProjects } from '../../utils/storage';
import { SubscriptionService } from '../../utils/subscriptionService';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';

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
              amount: 2500,
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
              amount: 5000,
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
              amount: 7500,
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

  const handlePaymentSuccess = (paymentResult: any) => {
    console.log('✅ Payment successful:', paymentResult);
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
              Welcome back, {user.name}! 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Ready to create amazing music together?
            </Text>
          </View>
          <TouchableOpacity onPress={handleProfile} style={styles.profileButton}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.profileButtonGradient}
            >
              <Icon name="person" size={24} color={colors.text} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard number={stats.totalUsers.toString()} label="Active Artists" />
              <StatCard number={stats.totalMatches.toString()} label="Total Matches" />
              <StatCard number={stats.totalProjects.toString()} label="Open Projects" />
              <StatCard number="15%" label="Success Rate" />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Core Features ✅</Text>
            
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enhanced Features 🚀</Text>
            
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
              title="Revenue Splitting"
              description="Secure payments with automatic distribution"
              gradient={['#8B5CF6', '#7C3AED']}
              onPress={() => setShowPaymentInfoModal(true)}
              delay={100}
            />
            
            <FeatureCard
              icon="storefront"
              title="Marketplace"
              description="Book sessions, buy beats, mentoring"
              gradient={['#EC4899', '#DB2777']}
              onPress={handleMarketplace}
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
      </ScrollView>

      {/* Modals */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        amount={paymentDetails.amount}
        description={paymentDetails.description}
        recipientName={paymentDetails.recipientName}
        onSuccess={handlePaymentSuccess}
      />

      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          setShowSubscriptionModal(false);
          initializeApp();
          Alert.alert('Welcome to Premium! 🎉', 'You now have unlimited project postings and likes!');
        }}
      />

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  profileButton: {
    marginLeft: spacing.md,
  },
  profileButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: spacing.lg,
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

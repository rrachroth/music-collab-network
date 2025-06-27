import { Text, View, ScrollView, TouchableOpacity, Dimensions, Alert, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  useAnimatedGestureHandler,
  withSequence,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { 
  getCurrentUser, 
  getAllUsers, 
  getMatches, 
  addMatch, 
  generateId, 
  getCurrentTimestamp,
  User, 
  Match 
} from '../utils/storage';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.7;
const SWIPE_THRESHOLD = width * 0.25;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const nextCardScale = useSharedValue(0.95);
  const nextCardOpacity = useSharedValue(0.8);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔍 Loading discover data...');
      setLoading(true);
      
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Profile Required', 'Please complete your profile setup first.', [
          { text: 'Setup Profile', onPress: () => router.replace('/onboarding') }
        ]);
        return;
      }
      
      setCurrentUser(user);
      
      // Load all users except current user
      const allUsers = await getAllUsers();
      const otherUsers = allUsers.filter(u => u.id !== user.id && u.isOnboarded);
      
      // Load existing matches to filter out already matched users
      const existingMatches = await getMatches();
      const matchedUserIds = existingMatches
        .filter(match => match.userId === user.id || match.matchedUserId === user.id)
        .map(match => match.userId === user.id ? match.matchedUserId : match.userId);
      
      // Filter out already matched users and sort by compatibility
      const availableUsers = otherUsers
        .filter(u => !matchedUserIds.includes(u.id))
        .sort((a, b) => calculateCompatibility(user, b) - calculateCompatibility(user, a));
      
      setProfiles(availableUsers);
      setMatches(existingMatches);
      setCurrentIndex(0);
      
      // Reset animations
      resetCardPosition();
      
      console.log(`✅ Loaded ${availableUsers.length} available profiles`);
      
    } catch (error) {
      console.error('❌ Error loading discover data:', error);
      Alert.alert('Error', 'Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompatibility = (user1: User, user2: User): number => {
    let score = 0;
    
    // Genre compatibility
    const commonGenres = user1.genres.filter(genre => user2.genres.includes(genre));
    score += commonGenres.length * 20;
    
    // Role compatibility (different roles often collaborate well)
    if (user1.role !== user2.role) score += 15;
    
    // Location proximity (simplified)
    if (user1.location === user2.location) score += 10;
    
    // Verified users get bonus
    if (user2.verified) score += 5;
    
    return score;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const resetCardPosition = () => {
    translateX.value = 0;
    translateY.value = 0;
    rotateZ.value = 0;
    scale.value = 1;
    opacity.value = 1;
    nextCardScale.value = 0.95;
    nextCardOpacity.value = 0.8;
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(1.05);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5;
      rotateZ.value = interpolate(
        event.translationX,
        [-width, width],
        [-30, 30]
      );
      
      // Update next card
      const progress = Math.abs(event.translationX) / SWIPE_THRESHOLD;
      nextCardScale.value = interpolate(progress, [0, 1], [0.95, 1], 'clamp');
      nextCardOpacity.value = interpolate(progress, [0, 1], [0.8, 1], 'clamp');
    },
    onEnd: (event) => {
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      
      if (shouldSwipe) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        runOnJS(handleSwipe)(direction);
        
        // Animate card off screen
        translateX.value = withTiming(
          event.translationX > 0 ? width * 1.5 : -width * 1.5,
          { duration: 300 }
        );
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
      } else {
        // Snap back
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotateZ.value = withSpring(0);
        scale.value = withSpring(1);
        nextCardScale.value = withSpring(0.95);
        nextCardOpacity.value = withSpring(0.8);
      }
    },
  });

  const handleSwipe = async (direction: 'left' | 'right') => {
    const profile = profiles[currentIndex];
    if (!profile || !currentUser) return;
    
    setSwipeDirection(direction);
    
    if (direction === 'right') {
      console.log('👍 Swiped right on:', profile.name);
      
      try {
        // Create a match
        const newMatch: Match = {
          id: generateId(),
          userId: currentUser.id,
          matchedUserId: profile.id,
          matchedAt: getCurrentTimestamp(),
          isRead: false,
        };
        
        await addMatch(newMatch);
        setMatches(prev => [...prev, newMatch]);
        
        // Show match notification with delay
        setTimeout(() => {
          Alert.alert(
            '🎉 It\'s a Match!',
            `You and ${profile.name} are now connected! Start a conversation to begin collaborating.`,
            [
              { text: 'Keep Discovering', style: 'cancel' },
              { text: 'View Matches', onPress: () => router.push('/matches') }
            ]
          );
        }, 500);
        
      } catch (error) {
        console.error('❌ Error creating match:', error);
        Alert.alert('Error', 'Failed to create match. Please try again.');
      }
    } else {
      console.log('👎 Swiped left on:', profile.name);
    }
    
    // Move to next profile after animation
    setTimeout(() => {
      nextProfile();
    }, 300);
  };

  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetCardPosition();
      setSwipeDirection(null);
    } else {
      console.log('📋 No more profiles available');
    }
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    // Animate button press
    if (direction === 'left') {
      translateX.value = withSequence(
        withTiming(-SWIPE_THRESHOLD * 1.2, { duration: 300 }),
        withTiming(-width * 1.5, { duration: 200 })
      );
    } else {
      translateX.value = withSequence(
        withTiming(SWIPE_THRESHOLD * 1.2, { duration: 300 }),
        withTiming(width * 1.5, { duration: 200 })
      );
    }
    
    rotateZ.value = withTiming(direction === 'left' ? -30 : 30, { duration: 300 });
    opacity.value = withTiming(0, { duration: 500 });
    scale.value = withTiming(0.8, { duration: 500 });
    
    handleSwipe(direction);
  };

  const handleViewProfile = () => {
    const profile = profiles[currentIndex];
    if (profile) {
      console.log('👤 Viewing full profile:', profile.name);
      router.push(`/profile/${profile.id}`);
    }
  };

  const handleSuperLike = () => {
    const profile = profiles[currentIndex];
    if (profile) {
      console.log('⭐ Super liked:', profile.name);
      // Animate super like
      translateY.value = withSequence(
        withTiming(-height * 0.3, { duration: 400 }),
        withTiming(-height * 1.5, { duration: 300 })
      );
      scale.value = withTiming(1.1, { duration: 400 });
      opacity.value = withTiming(0, { duration: 700 });
      
      // Handle as right swipe but with special effect
      setTimeout(() => {
        handleSwipe('right');
      }, 100);
    }
  };

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotateZ.value}deg` },
        { scale: scale.value }
      ],
      opacity: opacity.value,
    };
  });

  const nextCardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: nextCardScale.value }],
      opacity: nextCardOpacity.value,
    };
  });

  const swipeIndicatorStyle = useAnimatedStyle(() => {
    const leftOpacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      'clamp'
    );
    const rightOpacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      'clamp'
    );
    
    return {
      opacity: Math.max(leftOpacity, rightOpacity),
    };
  });

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="search" size={80} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Finding Musicians...
        </Text>
        <Text style={[commonStyles.text, { textAlign: 'center', marginTop: spacing.sm }]}>
          Loading profiles that match your musical style
        </Text>
      </View>
    );
  }

  const currentProfile = profiles[currentIndex];
  const nextProfileData = profiles[currentIndex + 1];

  if (!currentProfile) {
    return (
      <View style={[commonStyles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
          style={StyleSheet.absoluteFill}
        />
        <View style={commonStyles.centerContent}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.emptyStateIcon}
          >
            <Icon name="musical-notes" size={60} />
          </LinearGradient>
          <Text style={[commonStyles.title, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
            No More Profiles
          </Text>
          <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: spacing.xl }]}>
            You've discovered all available musicians! Check back later for new profiles or browse open projects.
          </Text>
          <Button
            text="Browse Open Projects"
            onPress={() => router.push('/projects')}
            variant="gradient"
            size="lg"
            style={{ marginBottom: spacing.md }}
          />
          <Button
            text="View Your Matches"
            onPress={() => router.push('/matches')}
            variant="outline"
            size="md"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
        
        <Text style={[commonStyles.heading, { flex: 1, textAlign: 'center' }]}>
          Discover
        </Text>
        
        <TouchableOpacity onPress={() => router.push('/matches')} style={styles.headerButton}>
          <View>
            <Icon name="heart" size={24} />
            {matches.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {matches.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {/* Next Card (Background) */}
        {nextProfileData && (
          <Animated.View style={[styles.card, styles.nextCard, nextCardAnimatedStyle]}>
            <ProfileCard profile={nextProfileData} />
          </Animated.View>
        )}
        
        {/* Current Card */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
            <ProfileCard profile={currentProfile} onViewProfile={handleViewProfile} />
            
            {/* Swipe Indicators */}
            <Animated.View style={[styles.swipeIndicator, styles.likeIndicator, swipeIndicatorStyle]}>
              <Text style={styles.swipeText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.swipeIndicator, styles.passIndicator, swipeIndicatorStyle]}>
              <Text style={styles.swipeText}>PASS</Text>
            </Animated.View>
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Profile Counter */}
      <Text style={[commonStyles.caption, { textAlign: 'center', marginVertical: spacing.md, opacity: 0.6 }]}>
        {currentIndex + 1} of {profiles.length} profiles
      </Text>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.passButton]} 
          onPress={() => handleButtonSwipe('left')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ff6b6b', '#ff5252']}
            style={styles.actionButtonGradient}
          >
            <Icon name="close" size={28} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.superLikeButton]} 
          onPress={handleSuperLike}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ffd700', '#ffb347']}
            style={styles.actionButtonGradient}
          >
            <Icon name="star" size={24} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.likeButton]} 
          onPress={() => handleButtonSwipe('right')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#2ed573', '#1dd1a1']}
            style={styles.actionButtonGradient}
          >
            <Icon name="heart" size={28} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface ProfileCardProps {
  profile: User;
  onViewProfile?: () => void;
}

function ProfileCard({ profile, onViewProfile }: ProfileCardProps) {
  return (
    <LinearGradient
      colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
      style={styles.cardGradient}
    >
      <View style={styles.cardContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {profile.name.charAt(0)}
              </Text>
            </LinearGradient>
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={20} />
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[commonStyles.heading, { fontSize: 24, marginBottom: spacing.xs }]}>
              {profile.name}
            </Text>
            <Text style={[commonStyles.text, { opacity: 0.8, marginBottom: spacing.sm }]}>
              {profile.role} • {profile.location}
            </Text>
            
            {/* Genres */}
            <View style={styles.genreContainer}>
              {profile.genres.slice(0, 3).map(genre => (
                <View key={genre} style={styles.genreChip}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {profile.highlights.length}
            </Text>
            <Text style={styles.statLabel}>Highlights</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {profile.collaborations.length}
            </Text>
            <Text style={styles.statLabel}>Collabs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {profile.rating > 0 ? profile.rating.toFixed(1) : '-'}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Bio */}
        <ScrollView style={styles.bioContainer} showsVerticalScrollIndicator={false}>
          <Text style={[commonStyles.text, { lineHeight: 22, textAlign: 'center' }]}>
            {profile.bio}
          </Text>
        </ScrollView>

        {/* View Profile Button */}
        {onViewProfile && (
          <TouchableOpacity style={styles.viewProfileButton} onPress={onViewProfile}>
            <LinearGradient
              colors={colors.gradientSecondary}
              style={styles.viewProfileGradient}
            >
              <Text style={[commonStyles.text, { fontWeight: 'bold', color: colors.text }]}>
                View Full Profile
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.xl,
    position: 'absolute',
    ...shadows.lg,
  },
  nextCard: {
    zIndex: 1,
  },
  cardGradient: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: 2,
  },
  cardContent: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl - 2,
    padding: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 2,
  },
  profileInfo: {
    alignItems: 'center',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  genreChip: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  genreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
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
  bioContainer: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  viewProfileButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  viewProfileGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 3,
  },
  likeIndicator: {
    right: spacing.lg,
    borderColor: colors.success,
    backgroundColor: 'rgba(46, 213, 115, 0.1)',
  },
  passIndicator: {
    left: spacing.lg,
    borderColor: colors.error,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  swipeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  actionButton: {
    borderRadius: 35,
    ...shadows.lg,
  },
  actionButtonGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passButton: {},
  superLikeButton: {
    transform: [{ scale: 0.8 }],
  },
  likeButton: {},
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});
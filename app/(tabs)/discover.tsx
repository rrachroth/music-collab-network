import { Text, View, ScrollView, TouchableOpacity, Dimensions, Alert, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler } from 'react-native-gesture-handler';
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
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { 
  getCurrentUser, 
  getAllUsers, 
  getMatches, 
  addMatch, 
  generateId, 
  getCurrentTimestamp,
  User, 
  Match 
} from '../../utils/storage';
import { SubscriptionService } from '../../utils/subscriptionService';
import SubscriptionModal from '../../components/SubscriptionModal';

interface ProfileCardProps {
  profile: User;
  onViewProfile?: () => void;
}

const CARD_WIDTH = Dimensions.get('window').width - 40;
const CARD_HEIGHT = Dimensions.get('window').height * 0.7;
const SWIPE_THRESHOLD = 120;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const loadData = useCallback(async () => {
    try {
      console.log('🔍 Loading discover data...');
      setLoading(true);
      
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please complete your profile first.', [
          { text: 'Setup Profile', onPress: () => router.replace('/onboarding') }
        ]);
        return;
      }
      
      setCurrentUser(user);
      
      const allUsers = await getAllUsers();
      const existingMatches = await getMatches();
      
      // Filter out current user and already matched users
      const matchedUserIds = existingMatches
        .filter(match => match.userId === user.id || match.matchedUserId === user.id)
        .map(match => match.userId === user.id ? match.matchedUserId : match.userId);
      
      const availableProfiles = allUsers.filter(profile => 
        profile.id !== user.id && !matchedUserIds.includes(profile.id)
      );
      
      setProfiles(availableProfiles);
      setCurrentIndex(0);
      
      console.log(`✅ Loaded ${availableProfiles.length} profiles`);
      
    } catch (error) {
      console.error('❌ Error loading discover data:', error);
      Alert.alert('Error', 'Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const resetCardPosition = useCallback(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    rotate.value = withSpring(0);
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
  }, [translateX, translateY, rotate, scale, opacity]);

  const nextProfile = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
    resetCardPosition();
  }, [resetCardPosition]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!currentUser || currentIndex >= profiles.length) return;
    
    // Check like limits before allowing swipe
    const { canLike, reason } = await SubscriptionService.canLike();
    if (!canLike && direction === 'right') {
      Alert.alert(
        'Like Limit Reached 💔',
        reason || 'You have reached your daily like limit.',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade to Premium', onPress: () => setShowSubscriptionModal(true) }
        ]
      );
      return;
    }
    
    const currentProfile = profiles[currentIndex];
    
    if (direction === 'right') {
      // Increment like count for free users
      await SubscriptionService.incrementLikeCount();
      
      // Create match
      const match: Match = {
        id: generateId(),
        userId: currentUser.id,
        matchedUserId: currentProfile.id,
        matchedAt: getCurrentTimestamp(),
        isRead: false,
      };
      
      try {
        await addMatch(match);
        console.log(`💕 Matched with ${currentProfile.name}`);
        
        Alert.alert(
          'It\'s a Match! 🎉',
          `You and ${currentProfile.name} are now connected! Start chatting to begin your collaboration.`,
          [
            { text: 'Keep Swiping', style: 'cancel' },
            { text: 'Start Chat', onPress: () => router.push('/matches') }
          ]
        );
      } catch (error) {
        console.error('❌ Error creating match:', error);
      }
    }
    
    nextProfile();
  }, [currentUser, currentIndex, profiles, nextProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateCompatibility = (user1: User, user2: User): number => {
    const genreOverlap = user1.genres.filter(genre => user2.genres.includes(genre)).length;
    const maxGenres = Math.max(user1.genres.length, user2.genres.length);
    const genreScore = maxGenres > 0 ? genreOverlap / maxGenres : 0;
    
    // Role compatibility (different roles work better together)
    const roleScore = user1.role !== user2.role ? 0.3 : 0.1;
    
    // Rating score
    const ratingScore = (user1.rating + user2.rating) / 10;
    
    return Math.min((genreScore * 0.5 + roleScore + ratingScore * 0.2) * 100, 99);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    const targetX = direction === 'right' ? CARD_WIDTH : -CARD_WIDTH;
    
    translateX.value = withTiming(targetX, { duration: 300 });
    rotate.value = withTiming(direction === 'right' ? 15 : -15, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    
    setTimeout(() => {
      runOnJS(handleSwipe)(direction);
    }, 300);
  }, [translateX, rotate, opacity, handleSwipe]);

  const handleViewProfile = useCallback(() => {
    if (currentIndex < profiles.length) {
      const profile = profiles[currentIndex];
      console.log(`👤 Viewing profile: ${profile.name}`);
      // TODO: Navigate to profile view
    }
  }, [currentIndex, profiles]);

  const handleSuperLike = useCallback(() => {
    console.log('⭐ Super like!');
    handleButtonSwipe('right');
  }, [handleButtonSwipe]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(0.95);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotate.value = interpolate(event.translationX, [-CARD_WIDTH, CARD_WIDTH], [-30, 30]);
      opacity.value = interpolate(
        Math.abs(event.translationX),
        [0, SWIPE_THRESHOLD],
        [1, 0.8]
      );
    },
    onEnd: (event) => {
      scale.value = withSpring(1);
      
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        const targetX = direction === 'right' ? CARD_WIDTH * 2 : -CARD_WIDTH * 2;
        
        translateX.value = withTiming(targetX, { duration: 300 });
        rotate.value = withTiming(direction === 'right' ? 30 : -30, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        
        setTimeout(() => {
          runOnJS(handleSwipe)(direction);
        }, 300);
      } else {
        runOnJS(resetCardPosition)();
      }
    },
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="search" size={80} color={colors.primary} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Finding Musicians
        </Text>
        <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
          Discovering amazing talent for you
        </Text>
      </View>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="checkmark-circle" size={80} color={colors.success} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          You&apos;re All Caught Up!
        </Text>
        <Text style={[commonStyles.text, { marginTop: spacing.sm, marginBottom: spacing.xl }]}>
          No more profiles to discover right now. Check back later for new musicians!
        </Text>
        <Button
          text="Refresh"
          onPress={onRefresh}
          variant="gradient"
          size="lg"
          style={{ marginBottom: spacing.md }}
        />
        <Button
          text="View Matches"
          onPress={() => router.push('/matches')}
          variant="outline"
          size="lg"
        />
      </View>
    );
  }

  const currentProfile = profiles[currentIndex];
  const compatibility = currentUser ? calculateCompatibility(currentUser, currentProfile) : 0;

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={colors.gradientBackground}
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
        
        <TouchableOpacity onPress={handleViewProfile} style={styles.headerButton}>
          <Icon name="information-circle" size={24} />
        </TouchableOpacity>
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
            <ProfileCard profile={currentProfile} onViewProfile={handleViewProfile} />
          </Animated.View>
        </PanGestureHandler>
        
        {/* Next card preview */}
        {currentIndex + 1 < profiles.length && (
          <View style={[styles.card, styles.nextCard]}>
            <ProfileCard profile={profiles[currentIndex + 1]} />
          </View>
        )}
      </View>

      {/* Compatibility Badge */}
      <View style={[styles.compatibilityBadge, { top: insets.top + 80 }]}>
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.compatibilityGradient}
        >
          <Text style={styles.compatibilityText}>{compatibility}% Match</Text>
        </LinearGradient>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.passButton]} 
          onPress={() => handleButtonSwipe('left')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.actionButtonGradient}
          >
            <Icon name="close" size={32} color={colors.text} />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.superLikeButton]} 
          onPress={handleSuperLike}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradientSecondary}
            style={styles.actionButtonGradient}
          >
            <Icon name="star" size={28} color={colors.text} />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.likeButton]} 
          onPress={() => handleButtonSwipe('right')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.actionButtonGradient}
          >
            <Icon name="heart" size={32} color={colors.text} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / profiles.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {profiles.length}
        </Text>
      </View>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          setShowSubscriptionModal(false);
          Alert.alert('Welcome to Premium! 🎉', 'You now have unlimited likes and project postings!');
        }}
      />
    </View>
  );
}

function ProfileCard({ profile, onViewProfile }: ProfileCardProps) {
  return (
    <TouchableOpacity style={styles.profileCard} onPress={onViewProfile} activeOpacity={0.95}>
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.profileGradient}
      >
        <View style={styles.profileContent}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <LinearGradient
              colors={colors.gradientSecondary}
              style={styles.profileImageGradient}
            >
              <Text style={styles.profileInitial}>
                {profile.name.charAt(0)}
              </Text>
            </LinearGradient>
            
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={24} color={colors.success} />
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileRole}>{profile.role}</Text>
            <Text style={styles.profileLocation}>{profile.location}</Text>
            
            {profile.rating > 0 && (
              <View style={styles.ratingContainer}>
                <Icon name="star" size={16} color={colors.warning} />
                <Text style={styles.ratingText}>{profile.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Bio */}
          <View style={styles.bioContainer}>
            <Text style={styles.bioText} numberOfLines={3}>
              {profile.bio}
            </Text>
          </View>

          {/* Genres */}
          <View style={styles.genresContainer}>
            <Text style={styles.genresTitle}>Genres</Text>
            <View style={styles.genresList}>
              {profile.genres.slice(0, 3).map(genre => (
                <View key={genre} style={styles.genreChip}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
              {profile.genres.length > 3 && (
                <View style={styles.genreChip}>
                  <Text style={styles.genreText}>+{profile.genres.length - 3}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Highlights */}
          <View style={styles.highlightsContainer}>
            <Text style={styles.highlightsTitle}>
              Highlights ({profile.highlights.length})
            </Text>
            <View style={styles.highlightsList}>
              {profile.highlights.slice(0, 3).map(highlight => (
                <View key={highlight.id} style={styles.highlightItem}>
                  <Icon 
                    name={highlight.type === 'audio' ? 'musical-note' : highlight.type === 'video' ? 'videocam' : 'image'} 
                    size={16} 
                    color={colors.textMuted} 
                  />
                  <Text style={styles.highlightText}>{highlight.title}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
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
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'absolute',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  nextCard: {
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
    zIndex: -1,
  },
  profileCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  profileGradient: {
    flex: 1,
    padding: 2,
  },
  profileContent: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl - 2,
    padding: spacing.lg,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  profileImageGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: '30%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 2,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileName: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  profileRole: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  profileLocation: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  bioContainer: {
    marginBottom: spacing.lg,
  },
  bioText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  genresContainer: {
    marginBottom: spacing.lg,
  },
  genresTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  genreText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  highlightsContainer: {
    flex: 1,
  },
  highlightsTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  highlightsList: {
    gap: spacing.sm,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  highlightText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  compatibilityBadge: {
    position: 'absolute',
    right: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  compatibilityGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  compatibilityText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  actionButton: {
    borderRadius: 35,
    overflow: 'hidden',
    ...shadows.lg,
  },
  actionButtonGradient: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passButton: {},
  superLikeButton: {
    transform: [{ scale: 0.8 }],
  },
  likeButton: {},
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
});
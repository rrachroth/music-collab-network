
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Dimensions, Alert, RefreshControl, StyleSheet, Platform } from 'react-native';
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
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import ErrorBoundary from '../../components/ErrorBoundary';
import { setupErrorLogging } from '../../utils/errorLogger';
import { 
  getCurrentUser, 
  getAllUsers, 
  getMatches, 
  addMatch, 
  generateId, 
  getCurrentTimestamp,
  initializeSampleData,
  User, 
  Match 
} from '../../utils/storage';
import { SubscriptionService } from '../../utils/subscriptionService';
import SubscriptionModal from '../../components/SubscriptionModal';

interface ProfileCardProps {
  profile: User;
  onViewProfile?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = screenHeight * 0.65;
const SWIPE_THRESHOLD = 100;

export default function DiscoverScreen() {
  console.log('🔍 DiscoverScreen rendering - Simplified Version');
  
  const insets = useSafeAreaInsets();
  const isMountedRef = useRef(true);
  
  // State hooks
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Animated values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  // Setup error logging
  useEffect(() => {
    try {
      setupErrorLogging();
      console.log('✅ Error logging setup complete for DiscoverScreen');
    } catch (error) {
      console.error('❌ Failed to setup error logging:', error);
    }
  }, []);

  // Calculate compatibility function
  const calculateCompatibility = useCallback((user1: User | null, user2: User | null): number => {
    try {
      if (!user1 || !user2) return 50;
      
      let score = 50;
      
      // Genre compatibility
      if (user1.genres && user2.genres && Array.isArray(user1.genres) && Array.isArray(user2.genres)) {
        const commonGenres = user1.genres.filter(genre => user2.genres.includes(genre));
        const genreScore = (commonGenres.length / Math.max(user1.genres.length, user2.genres.length)) * 40;
        score += genreScore;
      }
      
      // Role compatibility
      if (user1.role && user2.role) {
        const complementaryRoles = [
          ['producer', 'vocalist'],
          ['producer', 'rapper'],
          ['songwriter', 'vocalist'],
          ['mixer', 'producer'],
          ['instrumentalist', 'producer']
        ];
        
        const isComplementary = complementaryRoles.some(([role1, role2]) => 
          (user1.role === role1 && user2.role === role2) ||
          (user1.role === role2 && user2.role === role1)
        );
        
        if (isComplementary) {
          score += 30;
        } else if (user1.role === user2.role) {
          score += 15;
        }
      }
      
      // Location proximity
      if (user1.location && user2.location && user1.location === user2.location) {
        score += 20;
      }
      
      return Math.min(Math.max(Math.round(score), 0), 100);
    } catch (error) {
      console.error('❌ Error calculating compatibility:', error);
      return 50;
    }
  }, []);

  // Current profile
  const currentProfile = useMemo(() => {
    try {
      if (!Array.isArray(profiles) || profiles.length === 0 || currentIndex >= profiles.length) {
        return null;
      }
      
      const profile = profiles[currentIndex];
      if (!profile || !profile.id || !profile.name) {
        return null;
      }
      
      return profile;
    } catch (error) {
      console.error('❌ Error in currentProfile memo:', error);
      return null;
    }
  }, [profiles, currentIndex]);

  // Compatibility score
  const compatibility = useMemo(() => {
    try {
      return calculateCompatibility(currentUser, currentProfile);
    } catch (error) {
      console.error('❌ Error calculating compatibility score:', error);
      return 50;
    }
  }, [currentUser, currentProfile, calculateCompatibility]);

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      console.log('🔍 Loading discover data...');
      setLoading(true);
      setError(null);
      
      // Initialize sample data
      await initializeSampleData();
      
      if (!isMountedRef.current) return;
      
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert(
          'Profile Required', 
          'Please complete your profile first.',
          [{ text: 'Setup Profile', onPress: () => router.replace('/onboarding') }]
        );
        return;
      }
      
      setCurrentUser(user);
      
      // Load all users
      const allUsers = await getAllUsers();
      const existingMatches = await getMatches();
      
      // Filter out current user and already matched users
      const matchedUserIds = existingMatches
        .filter(match => match.userId === user.id || match.matchedUserId === user.id)
        .map(match => match.userId === user.id ? match.matchedUserId : match.userId);
      
      const availableProfiles = allUsers.filter(profile => 
        profile.id !== user.id && 
        !matchedUserIds.includes(profile.id) &&
        profile.name && 
        profile.role
      );
      
      if (isMountedRef.current) {
        setProfiles(availableProfiles);
        setCurrentIndex(0);
        setIsInitialized(true);
      }
      
    } catch (error) {
      console.error('❌ Error loading discover data:', error);
      if (isMountedRef.current) {
        setError(`Failed to load profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setProfiles([]);
        setCurrentIndex(0);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const resetCardPosition = useCallback(() => {
    try {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      rotate.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    } catch (error) {
      console.error('❌ Error resetting card position:', error);
    }
  }, [translateX, translateY, rotate, scale, opacity]);

  const nextProfile = useCallback(() => {
    try {
      if (isMountedRef.current) {
        setCurrentIndex(prev => prev + 1);
        resetCardPosition();
      }
    } catch (error) {
      console.error('❌ Error moving to next profile:', error);
    }
  }, [resetCardPosition]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!isMountedRef.current || !currentUser || !currentProfile) return;

    try {
      console.log(`👆 Handling swipe: ${direction}`);
      
      if (direction === 'right') {
        // Check like limits
        const { canLike, reason } = await SubscriptionService.canLike();
        if (!canLike) {
          Alert.alert(
            'Like Limit Reached 💖',
            reason || 'You have reached your daily like limit.',
            [
              { text: 'Maybe Later', style: 'cancel' },
              { text: 'Upgrade to Premium', onPress: () => setShowSubscriptionModal(true) }
            ]
          );
          return;
        }

        // Increment like count
        await SubscriptionService.incrementLikeCount();

        // Create match
        const match: Match = {
          id: generateId(),
          userId: currentUser.id,
          matchedUserId: currentProfile.id,
          matchedAt: getCurrentTimestamp(),
          isRead: false,
        };
        
        await addMatch(match);
        console.log(`✅ Successfully matched with ${currentProfile.name}`);
        
        Alert.alert(
          'It\'s a Match! 🎉',
          `You and ${currentProfile.name} are now connected!`,
          [
            { text: 'Keep Swiping', style: 'cancel' },
            { text: 'Start Chat', onPress: () => router.push('/(tabs)/matches') }
          ]
        );
      }
      
      // Move to next profile
      if (isMountedRef.current) {
        nextProfile();
      }
      
    } catch (error) {
      console.error('❌ Error handling swipe:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }, [currentUser, currentProfile, nextProfile]);

  useEffect(() => {
    loadData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadData();
    } catch (error) {
      console.error('❌ Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    try {
      if (!currentProfile || !isMountedRef.current) return;
      
      const targetX = direction === 'right' ? CARD_WIDTH : -CARD_WIDTH;
      
      translateX.value = withTiming(targetX, { duration: 300 });
      rotate.value = withTiming(direction === 'right' ? 15 : -15, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
      
      setTimeout(() => {
        if (isMountedRef.current) {
          runOnJS(handleSwipe)(direction);
        }
      }, 300);
      
    } catch (error) {
      console.error('❌ Error in button swipe:', error);
      handleSwipe(direction);
    }
  }, [translateX, rotate, opacity, handleSwipe, currentProfile]);

  const handleViewProfile = useCallback(() => {
    try {
      if (currentProfile) {
        Alert.alert(
          'Profile View', 
          `${currentProfile.name}\n\nRole: ${currentProfile.role}\nLocation: ${currentProfile.location || 'Unknown'}\nGenres: ${(currentProfile.genres || []).join(', ') || 'None listed'}`
        );
      }
    } catch (error) {
      console.error('❌ Error viewing profile:', error);
    }
  }, [currentProfile]);

  // Simplified gesture handler
  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      'worklet';
      scale.value = withSpring(0.95);
    },
    onActive: (event) => {
      'worklet';
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
      'worklet';
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
    'worklet';
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

  // Loading state
  if (loading) {
    return (
      <ErrorBoundary>
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
      </ErrorBoundary>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorBoundary>
        <View style={[commonStyles.container, commonStyles.centerContent]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="alert-circle" size={80} color={colors.error} />
          <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
            Oops! Something went wrong
          </Text>
          <Text style={[commonStyles.text, { marginTop: spacing.sm, marginBottom: spacing.xl, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
            {error}
          </Text>
          <Button
            text="Try Again"
            onPress={onRefresh}
            variant="gradient"
            size="lg"
          />
        </View>
      </ErrorBoundary>
    );
  }

  // No more profiles state
  if (isInitialized && (currentIndex >= profiles.length || profiles.length === 0)) {
    return (
      <ErrorBoundary>
        <View style={[commonStyles.container, commonStyles.centerContent]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="checkmark-circle" size={80} color={colors.success} />
          <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
            You&apos;re All Caught Up!
          </Text>
          <Text style={[commonStyles.text, { marginTop: spacing.sm, marginBottom: spacing.xl, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
            {profiles.length === 0 
              ? 'No profiles available right now. Check back later for new musicians!'
              : 'No more profiles to discover right now. Check back later for new musicians!'
            }
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
            onPress={() => router.push('/(tabs)/matches')}
            variant="outline"
            size="lg"
          />
        </View>
      </ErrorBoundary>
    );
  }

  // Main render
  return (
    <ErrorBoundary>
      <View style={[commonStyles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
      
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.headerButton}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[commonStyles.heading, { flex: 1, textAlign: 'center' }]}>
            Discover
          </Text>
          
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                'Debug Info',
                `User: ${currentUser?.name || 'None'}\nProfiles: ${profiles.length}\nIndex: ${currentIndex}\nCurrent: ${currentProfile?.name || 'None'}`
              );
            }} 
            style={styles.headerButton}
          >
            <Icon name="information-circle" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Card Stack */}
        <View style={styles.cardContainer}>
          {currentProfile && (
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View style={[styles.card, cardAnimatedStyle]}>
                <ProfileCard profile={currentProfile} onViewProfile={handleViewProfile} />
              </Animated.View>
            </PanGestureHandler>
          )}
          
          {/* Next card preview */}
          {(() => {
            const nextIndex = currentIndex + 1;
            const nextProfile = profiles[nextIndex];
            if (nextIndex < profiles.length && nextProfile) {
              return (
                <View style={[styles.card, styles.nextCard]}>
                  <ProfileCard profile={nextProfile} />
                </View>
              );
            }
            return null;
          })()}
        </View>

        {/* Compatibility Badge */}
        {currentProfile && (
          <View style={[styles.compatibilityBadge, { top: insets.top + 80 }]}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.compatibilityGradient}
            >
              <Text style={styles.compatibilityText}>{Math.round(compatibility)}% Match</Text>
            </LinearGradient>
          </View>
        )}

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
            onPress={() => handleButtonSwipe('right')}
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
                { width: `${profiles.length > 0 ? ((currentIndex + 1) / profiles.length) * 100 : 0}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {profiles.length > 0 ? `${currentIndex + 1} of ${profiles.length}` : '0 of 0'}
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
    </ErrorBoundary>
  );
}

function ProfileCard({ profile, onViewProfile }: ProfileCardProps) {
  try {
    if (!profile || !profile.id || !profile.name) {
      return (
        <View style={styles.profileCard}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.profileGradient}
          >
            <View style={styles.profileContent}>
              <Text style={[commonStyles.text, { textAlign: 'center' }]}>
                No profile data
              </Text>
            </View>
          </LinearGradient>
        </View>
      );
    }

    const profileName = profile.name || 'Unknown';
    const profileRole = profile.role || 'Musician';
    const profileLocation = profile.location || 'Unknown Location';
    const profileBio = profile.bio || 'No bio available';
    const profileGenres = Array.isArray(profile.genres) ? profile.genres.filter(g => g && typeof g === 'string') : [];
    const profileHighlights = Array.isArray(profile.highlights) ? profile.highlights.filter(h => h && h.id) : [];
    const profileRating = typeof profile.rating === 'number' ? profile.rating : 0;
    const profileVerified = Boolean(profile.verified);

    return (
      <TouchableOpacity 
        style={styles.profileCard} 
        onPress={onViewProfile} 
        activeOpacity={0.95}
      >
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
                  {profileName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              
              {profileVerified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="checkmark-circle" size={24} color={colors.success} />
                </View>
              )}
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{profileName}</Text>
              <Text style={styles.profileRole} numberOfLines={1}>{profileRole}</Text>
              <Text style={styles.profileLocation} numberOfLines={1}>{profileLocation}</Text>
              
              {profileRating > 0 && (
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={16} color={colors.warning} />
                  <Text style={styles.ratingText}>{profileRating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            {/* Bio */}
            <View style={styles.bioContainer}>
              <Text style={styles.bioText} numberOfLines={3}>
                {profileBio}
              </Text>
            </View>

            {/* Genres */}
            <View style={styles.genresContainer}>
              <Text style={styles.genresTitle}>Genres</Text>
              <View style={styles.genresList}>
                {profileGenres.slice(0, 3).map((genre, index) => (
                  <View key={`${genre}-${index}`} style={styles.genreChip}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
                {profileGenres.length > 3 && (
                  <View style={styles.genreChip}>
                    <Text style={styles.genreText}>+{profileGenres.length - 3}</Text>
                  </View>
                )}
                {profileGenres.length === 0 && (
                  <Text style={[commonStyles.caption, { color: colors.textMuted }]}>
                    No genres listed
                  </Text>
                )}
              </View>
            </View>

            {/* Highlights */}
            <View style={styles.highlightsContainer}>
              <Text style={styles.highlightsTitle}>
                Highlights ({profileHighlights.length})
              </Text>
              <View style={styles.highlightsList}>
                {profileHighlights.slice(0, 3).map((highlight, index) => {
                  const highlightType = highlight.type || 'image';
                  const highlightTitle = highlight.title || 'Untitled';
                  const iconName = highlightType === 'audio' ? 'musical-note' : 
                                 highlightType === 'video' ? 'videocam' : 'image';
                  
                  return (
                    <View key={`${highlight.id || index}`} style={styles.highlightItem}>
                      <Icon name={iconName} size={16} color={colors.textMuted} />
                      <Text style={styles.highlightText} numberOfLines={1}>
                        {highlightTitle}
                      </Text>
                    </View>
                  );
                })}
                {profileHighlights.length === 0 && (
                  <Text style={[commonStyles.caption, { textAlign: 'center', color: colors.textMuted }]}>
                    No highlights yet
                  </Text>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  } catch (error) {
    console.error('❌ Error in ProfileCard:', error);
    return (
      <View style={styles.profileCard}>
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.profileGradient}
        >
          <View style={styles.profileContent}>
            <Text style={[commonStyles.text, { textAlign: 'center' }]}>
              Error loading profile
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }
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


import { Text, View, ScrollView, TouchableOpacity, Dimensions, Alert, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  initializeSampleData,
  User, 
  Match 
} from '../../utils/storage';

interface ProfileCardProps {
  profile: User;
  onViewProfile?: () => void;
}

const CARD_WIDTH = Dimensions.get('window').width - 40;
const CARD_HEIGHT = Dimensions.get('window').height * 0.7;
const SWIPE_THRESHOLD = 120;

export default function DiscoverScreen() {
  console.log('🔍 DiscoverScreen rendering...');
  
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Memoize current profile to prevent unnecessary re-renders
  const currentProfile = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < profiles.length) {
      return profiles[currentIndex];
    }
    return null;
  }, [profiles, currentIndex]);

  const loadData = useCallback(async () => {
    try {
      console.log('🔍 Loading discover data...');
      setLoading(true);
      setError(null);
      
      // Add delay for mobile AsyncStorage operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Initialize sample data if needed (with error handling)
      try {
        await initializeSampleData();
        console.log('✅ Sample data initialized');
      } catch (initError) {
        console.warn('⚠️ Sample data initialization failed:', initError);
        // Continue anyway, might have existing data
      }
      
      // Get current user with retry logic
      let user: User | null = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!user && retryCount < maxRetries) {
        try {
          user = await getCurrentUser();
          if (user) break;
          
          retryCount++;
          console.log(`🔄 Retry ${retryCount}/${maxRetries} getting current user`);
          await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
        } catch (userError) {
          console.error(`❌ Error getting user (attempt ${retryCount + 1}):`, userError);
          retryCount++;
          if (retryCount >= maxRetries) {
            throw userError;
          }
          await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
        }
      }
      
      if (!user) {
        console.log('❌ No current user found after retries, redirecting to onboarding');
        Alert.alert(
          'Profile Required', 
          'Please complete your profile first.',
          [
            { 
              text: 'Setup Profile', 
              onPress: () => {
                try {
                  router.replace('/onboarding');
                } catch (navError) {
                  console.error('❌ Navigation error:', navError);
                  router.push('/onboarding');
                }
              }
            }
          ]
        );
        return;
      }
      
      console.log('👤 Current user loaded:', user.name || 'Unknown');
      setCurrentUser(user);
      
      // Load all users with error handling
      let allUsers: User[] = [];
      try {
        allUsers = await getAllUsers();
        console.log('👥 All users loaded:', allUsers.length);
        
        // Validate users data
        allUsers = allUsers.filter(u => 
          u && 
          typeof u === 'object' && 
          u.id && 
          u.name && 
          typeof u.id === 'string' && 
          typeof u.name === 'string'
        );
        console.log('👥 Valid users after filtering:', allUsers.length);
      } catch (usersError) {
        console.error('❌ Error loading users:', usersError);
        allUsers = [];
      }
      
      // Load existing matches with error handling
      let existingMatches: Match[] = [];
      try {
        existingMatches = await getMatches();
        console.log('💕 Existing matches loaded:', existingMatches.length);
        
        // Validate matches data
        existingMatches = existingMatches.filter(m => 
          m && 
          typeof m === 'object' && 
          m.userId && 
          m.matchedUserId &&
          typeof m.userId === 'string' &&
          typeof m.matchedUserId === 'string'
        );
        console.log('💕 Valid matches after filtering:', existingMatches.length);
      } catch (matchesError) {
        console.error('❌ Error loading matches:', matchesError);
        existingMatches = [];
      }
      
      // Filter out current user and already matched users
      const matchedUserIds = existingMatches
        .filter(match => 
          match && 
          (match.userId === user.id || match.matchedUserId === user.id)
        )
        .map(match => 
          match.userId === user.id ? match.matchedUserId : match.userId
        )
        .filter(id => id && typeof id === 'string');
      
      const availableProfiles = allUsers.filter(profile => 
        profile && 
        profile.id && 
        profile.id !== user.id && 
        !matchedUserIds.includes(profile.id) &&
        profile.name && // Ensure profile has required fields
        profile.role
      );
      
      console.log('🎯 Available profiles after filtering:', availableProfiles.length);
      setProfiles(availableProfiles);
      setCurrentIndex(0);
      setIsInitialized(true);
      
    } catch (error) {
      console.error('❌ Error loading discover data:', error);
      setError(`Failed to load profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProfiles([]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetCardPosition = useCallback(() => {
    try {
      console.log('🔄 Resetting card position');
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
      console.log('➡️ Moving to next profile');
      setCurrentIndex(prev => {
        const newIndex = prev + 1;
        console.log(`📊 Profile index: ${prev} -> ${newIndex} (total: ${profiles.length})`);
        return newIndex;
      });
      resetCardPosition();
    } catch (error) {
      console.error('❌ Error moving to next profile:', error);
    }
  }, [resetCardPosition, profiles.length]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    try {
      console.log(`👆 Handling swipe: ${direction}`);
      
      if (!currentUser) {
        console.log('❌ No current user for swipe');
        return;
      }
      
      if (!currentProfile) {
        console.log('❌ No current profile for swipe');
        return;
      }
      
      if (currentIndex >= profiles.length) {
        console.log('❌ Current index out of bounds');
        return;
      }
      
      console.log(`🎯 Swiping on profile: ${currentProfile.name} (${currentProfile.id})`);
      
      if (direction === 'right') {
        try {
          // Create match with validation
          const matchId = generateId();
          const timestamp = getCurrentTimestamp();
          
          if (!matchId || !timestamp) {
            throw new Error('Failed to generate match data');
          }
          
          const match: Match = {
            id: matchId,
            userId: currentUser.id,
            matchedUserId: currentProfile.id,
            matchedAt: timestamp,
            isRead: false,
          };
          
          console.log('💕 Creating match:', match);
          await addMatch(match);
          console.log(`✅ Successfully matched with ${currentProfile.name}`);
          
          // Show match alert with error handling
          setTimeout(() => {
            try {
              Alert.alert(
                'It\'s a Match! 🎉',
                `You and ${currentProfile.name} are now connected! Start chatting to begin your collaboration.`,
                [
                  { text: 'Keep Swiping', style: 'cancel' },
                  { 
                    text: 'Start Chat', 
                    onPress: () => {
                      try {
                        router.push('/(tabs)/matches');
                      } catch (navError) {
                        console.error('❌ Navigation error:', navError);
                      }
                    }
                  }
                ]
              );
            } catch (alertError) {
              console.error('❌ Error showing match alert:', alertError);
            }
          }, 100);
          
        } catch (matchError) {
          console.error('❌ Error creating match:', matchError);
          Alert.alert('Error', 'Failed to create match. Please try again.');
          return;
        }
      } else {
        console.log(`👎 Passed on ${currentProfile.name}`);
      }
      
      // Move to next profile
      nextProfile();
      
    } catch (error) {
      console.error('❌ Error handling swipe:', error);
      Alert.alert('Error', 'Something went wrong with the swipe. Please try again.');
    }
  }, [currentUser, currentProfile, currentIndex, profiles.length, nextProfile]);

  useEffect(() => {
    console.log('🔄 useEffect: Initial data load');
    let isMounted = true;
    
    const loadDataSafely = async () => {
      try {
        if (isMounted) {
          await loadData();
        }
      } catch (error) {
        console.error('❌ Error in useEffect loadData:', error);
        if (isMounted) {
          setError('Failed to initialize app. Please restart.');
          setLoading(false);
        }
      }
    };
    
    loadDataSafely();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const calculateCompatibility = useCallback((user1: User, user2: User): number => {
    try {
      if (!user1 || !user2) {
        console.log('⚠️ Missing users for compatibility calculation');
        return 50;
      }
      
      const user1Genres = Array.isArray(user1.genres) ? user1.genres : [];
      const user2Genres = Array.isArray(user2.genres) ? user2.genres : [];
      
      if (user1Genres.length === 0 && user2Genres.length === 0) {
        return 50;
      }
      
      const genreOverlap = user1Genres.filter(genre => 
        genre && typeof genre === 'string' && user2Genres.includes(genre)
      ).length;
      
      const maxGenres = Math.max(user1Genres.length, user2Genres.length);
      const genreScore = maxGenres > 0 ? genreOverlap / maxGenres : 0;
      
      // Role compatibility (different roles work better together)
      const roleScore = (user1.role && user2.role && user1.role !== user2.role) ? 0.3 : 0.1;
      
      // Rating score with null checks
      const user1Rating = typeof user1.rating === 'number' ? user1.rating : 0;
      const user2Rating = typeof user2.rating === 'number' ? user2.rating : 0;
      const ratingScore = (user1Rating + user2Rating) / 10;
      
      const compatibility = Math.min((genreScore * 0.5 + roleScore + ratingScore * 0.2) * 100, 99);
      return Math.max(compatibility, 10); // Minimum 10% compatibility
      
    } catch (error) {
      console.error('❌ Error calculating compatibility:', error);
      return 50;
    }
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      console.log('🔄 Refreshing data');
      setRefreshing(true);
      setError(null);
      await loadData();
    } catch (error) {
      console.error('❌ Error refreshing:', error);
      setError('Failed to refresh. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    try {
      console.log(`🔘 Button swipe: ${direction}`);
      
      if (!currentProfile) {
        console.log('❌ No current profile for button swipe');
        return;
      }
      
      const targetX = direction === 'right' ? CARD_WIDTH : -CARD_WIDTH;
      
      translateX.value = withTiming(targetX, { duration: 300 });
      rotate.value = withTiming(direction === 'right' ? 15 : -15, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
      
      setTimeout(() => {
        try {
          runOnJS(handleSwipe)(direction);
        } catch (error) {
          console.error('❌ Error in button swipe timeout:', error);
        }
      }, 300);
      
    } catch (error) {
      console.error('❌ Error in button swipe:', error);
    }
  }, [translateX, rotate, opacity, handleSwipe, currentProfile]);

  const handleViewProfile = useCallback(() => {
    try {
      if (currentProfile) {
        console.log(`👤 Viewing profile: ${currentProfile.name}`);
        Alert.alert(
          'Profile View', 
          `Viewing ${currentProfile.name}'s profile\n\nRole: ${currentProfile.role}\nLocation: ${currentProfile.location || 'Unknown'}\nGenres: ${(currentProfile.genres || []).join(', ') || 'None listed'}`
        );
      } else {
        console.log('❌ No current profile to view');
      }
    } catch (error) {
      console.error('❌ Error viewing profile:', error);
    }
  }, [currentProfile]);

  const handleSuperLike = useCallback(() => {
    try {
      console.log('⭐ Super like!');
      handleButtonSwipe('right');
    } catch (error) {
      console.error('❌ Error in super like:', error);
    }
  }, [handleButtonSwipe]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      try {
        scale.value = withSpring(0.95);
      } catch (error) {
        console.error('❌ Error in gesture start:', error);
      }
    },
    onActive: (event) => {
      try {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
        rotate.value = interpolate(event.translationX, [-CARD_WIDTH, CARD_WIDTH], [-30, 30]);
        opacity.value = interpolate(
          Math.abs(event.translationX),
          [0, SWIPE_THRESHOLD],
          [1, 0.8]
        );
      } catch (error) {
        console.error('❌ Error in gesture active:', error);
      }
    },
    onEnd: (event) => {
      try {
        scale.value = withSpring(1);
        
        if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
          const direction = event.translationX > 0 ? 'right' : 'left';
          const targetX = direction === 'right' ? CARD_WIDTH * 2 : -CARD_WIDTH * 2;
          
          translateX.value = withTiming(targetX, { duration: 300 });
          rotate.value = withTiming(direction === 'right' ? 30 : -30, { duration: 300 });
          opacity.value = withTiming(0, { duration: 300 });
          
          setTimeout(() => {
            try {
              runOnJS(handleSwipe)(direction);
            } catch (error) {
              console.error('❌ Error in gesture end timeout:', error);
            }
          }, 300);
        } else {
          runOnJS(resetCardPosition)();
        }
      } catch (error) {
        console.error('❌ Error in gesture end:', error);
      }
    },
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotate.value}deg` },
          { scale: scale.value },
        ],
        opacity: opacity.value,
      };
    } catch (error) {
      console.error('❌ Error in card animated style:', error);
      return {};
    }
  });

  // Loading state
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

  // Error state
  if (error) {
    return (
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
          title="Try Again"
          onPress={onRefresh}
          variant="gradient"
          size="lg"
        />
      </View>
    );
  }

  // No more profiles state
  if (isInitialized && (currentIndex >= profiles.length || profiles.length === 0)) {
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
        <Text style={[commonStyles.text, { marginTop: spacing.sm, marginBottom: spacing.xl, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
          {profiles.length === 0 
            ? 'No profiles available right now. Check back later for new musicians!'
            : 'No more profiles to discover right now. Check back later for new musicians!'
          }
        </Text>
        <Button
          title="Refresh"
          onPress={onRefresh}
          variant="gradient"
          size="lg"
          style={{ marginBottom: spacing.md }}
        />
        <Button
          title="View Matches"
          onPress={() => {
            try {
              router.push('/(tabs)/matches');
            } catch (navError) {
              console.error('❌ Navigation error:', navError);
            }
          }}
          variant="outline"
          size="lg"
        />
      </View>
    );
  }

  // No current profile (shouldn't happen but safety check)
  if (!currentProfile) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="refresh" size={80} color={colors.textMuted} />
        <Text style={[commonStyles.text, { marginTop: spacing.lg, marginBottom: spacing.xl }]}>
          Loading profile...
        </Text>
        <Button
          title="Refresh"
          onPress={onRefresh}
          variant="gradient"
          size="lg"
        />
      </View>
    );
  }

  const compatibility = currentUser ? calculateCompatibility(currentUser, currentProfile) : 50;

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            try {
              router.back();
            } catch (navError) {
              console.error('❌ Navigation error:', navError);
            }
          }} 
          style={styles.headerButton}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[commonStyles.heading, { flex: 1, textAlign: 'center' }]}>
          Discover
        </Text>
        
        <TouchableOpacity onPress={handleViewProfile} style={styles.headerButton}>
          <Icon name="information-circle" size={24} color={colors.text} />
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
        {currentIndex + 1 < profiles.length && profiles[currentIndex + 1] && (
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
          <Text style={styles.compatibilityText}>{Math.round(compatibility)}% Match</Text>
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
              { width: `${profiles.length > 0 ? ((currentIndex + 1) / profiles.length) * 100 : 0}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {profiles.length > 0 ? `${currentIndex + 1} of ${profiles.length}` : '0 of 0'}
        </Text>
      </View>
    </View>
  );
}

function ProfileCard({ profile, onViewProfile }: ProfileCardProps) {
  console.log('🎴 Rendering ProfileCard for:', profile?.name || 'Unknown');
  
  if (!profile) {
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
  const profileGenres = Array.isArray(profile.genres) ? profile.genres : [];
  const profileHighlights = Array.isArray(profile.highlights) ? profile.highlights : [];
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
              {profileHighlights.slice(0, 3).map((highlight, index) => (
                <View key={`${highlight.id || index}`} style={styles.highlightItem}>
                  <Icon 
                    name={
                      highlight.type === 'audio' ? 'musical-note' : 
                      highlight.type === 'video' ? 'videocam' : 'image'
                    } 
                    size={16} 
                    color={colors.textMuted} 
                  />
                  <Text style={styles.highlightText} numberOfLines={1}>
                    {highlight.title || 'Untitled'}
                  </Text>
                </View>
              ))}
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

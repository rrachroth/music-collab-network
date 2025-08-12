// This file is deprecated - using app/(tabs)/discover.tsx instead
// Redirecting to the tabs version to avoid conflicts

import { useEffect } from 'react';
import { router } from 'expo-router';

export default function DiscoverRedirect() {
  useEffect(() => {
    console.log('🔄 Redirecting from standalone discover to tabs discover');
    router.replace('/(tabs)/discover');
  }, []);

  return null;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 600;
const SWIPE_THRESHOLD = 120;

interface ProfileCardProps {
  profile: User;
  onViewProfile?: () => void;
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(1.05);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.1;
      rotate.value = event.translationX * 0.1;
      
      const progress = Math.abs(event.translationX) / SWIPE_THRESHOLD;
      opacity.value = 1 - progress * 0.5;
    },
    onEnd: (event) => {
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      
      if (shouldSwipe) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        
        translateX.value = withTiming(event.translationX > 0 ? width : -width, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        
        runOnJS(handleSwipe)(direction);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
        opacity.value = withSpring(1);
        scale.value = withSpring(1);
      }
    },
  });

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
        .filter(m => m.userId === user.id || m.matchedUserId === user.id)
        .map(m => m.userId === user.id ? m.matchedUserId : m.userId);
      
      const availableProfiles = allUsers.filter(profile => 
        profile.id !== user.id && 
        !matchedUserIds.includes(profile.id) &&
        profile.isOnboarded
      );
      
      // Sort by compatibility
      const sortedProfiles = availableProfiles.sort((a, b) => {
        const compatibilityA = calculateCompatibility(user, a);
        const compatibilityB = calculateCompatibility(user, b);
        return compatibilityB - compatibilityA;
      });
      
      setProfiles(sortedProfiles);
      setCurrentIndex(0);
      
      console.log(`✅ Loaded ${sortedProfiles.length} profiles for discovery`);
      
    } catch (error) {
      console.error('❌ Error loading discover data:', error);
      Alert.alert('Error', 'Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateCompatibility = (user1: User, user2: User): number => {
    let score = 0;
    
    // Genre compatibility (40% weight)
    const commonGenres = user1.genres.filter(genre => user2.genres.includes(genre));
    score += (commonGenres.length / Math.max(user1.genres.length, user2.genres.length)) * 40;
    
    // Role complementarity (30% weight)
    const complementaryRoles = {
      'producer': ['vocalist', 'songwriter', 'instrumentalist'],
      'vocalist': ['producer', 'songwriter', 'mixer'],
      'songwriter': ['producer', 'vocalist', 'instrumentalist'],
      'instrumentalist': ['producer', 'vocalist', 'songwriter'],
      'mixer': ['producer', 'vocalist', 'songwriter'],
      'ar': ['producer', 'vocalist', 'songwriter', 'instrumentalist']
    };
    
    if (complementaryRoles[user1.role]?.includes(user2.role)) {
      score += 30;
    }
    
    // Activity and verification (30% weight)
    if (user2.verified) score += 15;
    if (user2.highlights.length > 0) score += 10;
    if (user2.rating > 4) score += 5;
    
    return Math.min(score, 100);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const resetCardPosition = () => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    rotate.value = withSpring(0);
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= profiles.length) return;
    
    const currentProfile = profiles[currentIndex];
    
    if (direction === 'right' && currentUser) {
      // Create match
      try {
        const match: Match = {
          id: generateId(),
          userId: currentUser.id,
          matchedUserId: currentProfile.id,
          matchedAt: getCurrentTimestamp(),
          isRead: false,
        };
        
        await addMatch(match);
        
        Alert.alert(
          'It\'s a Match! 🎉',
          `You and ${currentProfile.name} are now connected! Start collaborating on amazing music.`,
          [
            { text: 'Keep Swiping', style: 'cancel' },
            { text: 'Start Chat', onPress: () => router.push(`/chat/${match.id}`) }
          ]
        );
        
        console.log('💕 Match created with', currentProfile.name);
      } catch (error) {
        console.error('❌ Error creating match:', error);
      }
    }
    
    nextProfile();
  };

  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetCardPosition();
    } else {
      // No more profiles
      Alert.alert(
        'No More Profiles',
        'You\'ve seen all available musicians! Check back later for new profiles.',
        [
          { text: 'Refresh', onPress: () => loadData() },
          { text: 'View Matches', onPress: () => router.push('/matches') }
        ]
      );
    }
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      translateX.value = withSequence(
        withTiming(width, { duration: 300 }),
        withTiming(0, { duration: 0 })
      );
    } else {
      translateX.value = withSequence(
        withTiming(-width, { duration: 300 }),
        withTiming(0, { duration: 0 })
      );
    }
    
    opacity.value = withSequence(
      withTiming(0, { duration: 300 }),
      withTiming(1, { duration: 0 })
    );
    
    setTimeout(() => handleSwipe(direction), 300);
  };

  const handleViewProfile = () => {
    if (currentIndex < profiles.length) {
      const profile = profiles[currentIndex];
      console.log('👤 Viewing profile:', profile.name);
      // TODO: Navigate to profile view
    }
  };

  const handleSuperLike = () => {
    console.log('⭐ Super like!');
    handleButtonSwipe('right');
  };

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
          colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="search" size={80} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Finding Musicians...
        </Text>
        <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
          Discovering your perfect collaborators
        </Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={commonStyles.title}>Profile Required</Text>
        <Text style={[commonStyles.text, { marginBottom: spacing.xl }]}>
          Please complete your profile to discover other musicians
        </Text>
        <Button 
          text="Setup Profile" 
          onPress={() => router.replace('/onboarding')} 
          variant="gradient"
          size="lg"
        />
      </View>
    );
  }

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="checkmark-circle" size={80} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          All Caught Up!
        </Text>
        <Text style={[commonStyles.text, { marginBottom: spacing.xl }]}>
          You've seen all available musicians. Check back later for new profiles.
        </Text>
        <View style={styles.buttonGroup}>
          <Button 
            text="Refresh" 
            onPress={() => loadData()} 
            variant="gradient"
            size="lg"
            style={{ marginBottom: spacing.md }}
          />
          <Button 
            text="View Matches" 
            onPress={() => router.push('/matches')} 
            variant="outline"
            size="md"
          />
        </View>
      </View>
    );
  }

  const currentProfile = profiles[currentIndex];

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
        
        <TouchableOpacity onPress={handleViewProfile} style={styles.headerButton}>
          <Icon name="information-circle" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
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
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={[commonStyles.caption, { textAlign: 'center' }]}>
            {currentIndex + 1} of {profiles.length} profiles
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentIndex + 1) / profiles.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Card Stack */}
        <View style={styles.cardContainer}>
          {/* Next Card (Background) */}
          {currentIndex + 1 < profiles.length && (
            <View style={[styles.card, styles.nextCard]}>
              <ProfileCard profile={profiles[currentIndex + 1]} />
            </View>
          )}
          
          {/* Current Card */}
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.card, cardAnimatedStyle]}>
              <ProfileCard 
                profile={currentProfile} 
                onViewProfile={handleViewProfile}
              />
            </Animated.View>
          </PanGestureHandler>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.passButton]}
            onPress={() => handleButtonSwipe('left')}
          >
            <Icon name="close" size={32} color={colors.error} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.superLikeButton]}
            onPress={handleSuperLike}
          >
            <Icon name="star" size={28} color={colors.warning} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => handleButtonSwipe('right')}
          >
            <Icon name="heart" size={32} color={colors.success} />
          </TouchableOpacity>
        </View>

        {/* Swipe Instructions */}
        <View style={styles.instructions}>
          <Text style={[commonStyles.caption, { textAlign: 'center', opacity: 0.6 }]}>
            Swipe right to connect • Swipe left to pass
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileCard({ profile, onViewProfile }: ProfileCardProps) {
  return (
    <LinearGradient
      colors={colors.gradientPrimary}
      style={styles.cardGradient}
    >
      <View style={styles.cardContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={colors.gradientSecondary}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {profile.name.charAt(0)}
            </Text>
          </LinearGradient>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{profile.name}</Text>
              {profile.verified && (
                <Icon name="checkmark-circle" size={20} color={colors.success} />
              )}
            </View>
            
            <Text style={styles.profileRole}>
              {profile.role} • {profile.location}
            </Text>
            
            {profile.rating > 0 && (
              <View style={styles.ratingContainer}>
                <Icon name="star" size={16} color={colors.warning} />
                <Text style={styles.ratingText}>{profile.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>

        {/* Genres */}
        <View style={styles.genresSection}>
          <Text style={styles.sectionTitle}>Musical Genres</Text>
          <View style={styles.genreContainer}>
            {profile.genres.slice(0, 4).map(genre => (
              <View key={genre} style={styles.genreChip}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
            {profile.genres.length > 4 && (
              <View style={styles.genreChip}>
                <Text style={styles.genreText}>+{profile.genres.length - 4}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Highlights */}
        <View style={styles.highlightsSection}>
          <Text style={styles.sectionTitle}>
            Highlights ({profile.highlights.length})
          </Text>
          
          {profile.highlights.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.highlightsContainer}
            >
              {profile.highlights.slice(0, 3).map((highlight, index) => (
                <View key={highlight.id} style={styles.highlightCard}>
                  <Icon 
                    name={highlight.type === 'audio' ? 'musical-note' : 'videocam'} 
                    size={24} 
                    color={colors.primary}
                  />
                  <Text style={styles.highlightTitle}>{highlight.title}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={[commonStyles.caption, { opacity: 0.6 }]}>
              No highlights uploaded yet
            </Text>
          )}
        </View>

        {/* View Profile Button */}
        <TouchableOpacity style={styles.viewProfileButton} onPress={onViewProfile}>
          <Text style={styles.viewProfileText}>View Full Profile</Text>
          <Icon name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  cardContainer: {
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
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
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  cardGradient: {
    flex: 1,
    padding: 2,
  },
  cardContent: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl - 2,
    padding: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginRight: spacing.sm,
  },
  profileRole: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
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
  bioSection: {
    marginBottom: spacing.lg,
  },
  bioText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 24,
  },
  genresSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  genreContainer: {
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
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  highlightsSection: {
    marginBottom: spacing.lg,
  },
  highlightsContainer: {
    gap: spacing.md,
  },
  highlightCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 100,
  },
  highlightTitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: 'auto',
  },
  viewProfileText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    marginRight: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  passButton: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 2,
    borderColor: colors.error,
  },
  superLikeButton: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 2,
    borderColor: colors.warning,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  likeButton: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 2,
    borderColor: colors.success,
  },
  instructions: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  buttonGroup: {
    width: '100%',
    gap: spacing.sm,
  },
});
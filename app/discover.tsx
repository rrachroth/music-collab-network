import { Text, View, ScrollView, TouchableOpacity, Dimensions, Alert, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
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

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const cardScale = useSharedValue(1);
  const cardRotation = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

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
      
      // Filter out already matched users
      const availableUsers = otherUsers.filter(u => !matchedUserIds.includes(u.id));
      
      setProfiles(availableUsers);
      setMatches(existingMatches);
      setCurrentIndex(0);
      
      console.log(`✅ Loaded ${availableUsers.length} available profiles`);
      
    } catch (error) {
      console.error('❌ Error loading discover data:', error);
      Alert.alert('Error', 'Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const animateCard = (direction: 'left' | 'right') => {
    const rotation = direction === 'left' ? -30 : 30;
    const translateX = direction === 'left' ? -width : width;
    
    cardRotation.value = withTiming(rotation, { duration: 300 });
    cardScale.value = withTiming(0.8, { duration: 300 });
    cardOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(nextProfile)();
      // Reset for next card
      cardRotation.value = 0;
      cardScale.value = withSpring(1);
      cardOpacity.value = withTiming(1);
    });
  };

  const handleSwipeLeft = () => {
    console.log('👎 Swiped left on:', profiles[currentIndex]?.name);
    animateCard('left');
  };

  const handleSwipeRight = async () => {
    const profile = profiles[currentIndex];
    if (!profile || !currentUser) return;
    
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
      
      Alert.alert(
        'It\'s a Match! 💕',
        `You and ${profile.name} are now connected! Start a conversation to begin collaborating.`,
        [
          { text: 'Keep Discovering', style: 'cancel' },
          { text: 'View Matches', onPress: () => router.push('/matches') }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error creating match:', error);
      Alert.alert('Error', 'Failed to create match. Please try again.');
    }
    
    animateCard('right');
  };

  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more profiles
      console.log('📋 No more profiles available');
    }
  };

  const handleViewProfile = () => {
    const profile = profiles[currentIndex];
    if (profile) {
      console.log('👤 Viewing full profile:', profile.name);
      // Would implement detailed profile view
      Alert.alert(
        `${profile.name}'s Profile`,
        `Role: ${profile.role}\nGenres: ${profile.genres.join(', ')}\nLocation: ${profile.location}\n\n${profile.bio}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleOpenProjects = () => {
    console.log('📋 Opening projects feed');
    router.push('/projects');
  };

  const handleMatches = () => {
    console.log('💕 Viewing matches');
    router.push('/matches');
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: cardScale.value },
        { rotate: `${cardRotation.value}deg` }
      ],
      opacity: cardOpacity.value,
    };
  });

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.content]}>
        <Icon name="search" size={80} color={colors.primary} />
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

  if (!currentProfile) {
    return (
      <View style={[commonStyles.container, { paddingTop: insets.top }]}>
        <View style={commonStyles.content}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.emptyStateIcon}
          >
            <Icon name="musical-notes" size={60} color={colors.text} />
          </LinearGradient>
          <Text style={[commonStyles.title, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
            No More Profiles
          </Text>
          <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: spacing.xl }]}>
            You've discovered all available musicians! Check back later for new profiles or browse open projects.
          </Text>
          <Button
            text="Browse Open Projects"
            onPress={handleOpenProjects}
            variant="gradient"
            size="lg"
            style={{ marginBottom: spacing.md }}
          />
          <Button
            text="View Your Matches"
            onPress={handleMatches}
            variant="outline"
            size="md"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[commonStyles.heading, { flex: 1, textAlign: 'center' }]}>
          Discover
        </Text>
        
        <TouchableOpacity onPress={handleMatches} style={styles.headerButton}>
          <View>
            <Icon name="heart" size={24} color={colors.text} />
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Card */}
        <View style={styles.cardContainer}>
          <Animated.View style={[styles.profileCard, animatedCardStyle]}>
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
                        {currentProfile.name.charAt(0)}
                      </Text>
                    </LinearGradient>
                    {currentProfile.verified && (
                      <View style={styles.verifiedBadge}>
                        <Icon name="checkmark-circle" size={20} color={colors.success} />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.profileInfo}>
                    <Text style={[commonStyles.heading, { fontSize: 24, marginBottom: spacing.xs }]}>
                      {currentProfile.name}
                    </Text>
                    <Text style={[commonStyles.text, { opacity: 0.8, marginBottom: spacing.sm }]}>
                      {currentProfile.role} • {currentProfile.location}
                    </Text>
                    
                    {/* Genres */}
                    <View style={styles.genreContainer}>
                      {currentProfile.genres.slice(0, 3).map(genre => (
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
                      {currentProfile.highlights.length}
                    </Text>
                    <Text style={styles.statLabel}>Highlights</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {currentProfile.collaborations.length}
                    </Text>
                    <Text style={styles.statLabel}>Collabs</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {currentProfile.rating > 0 ? currentProfile.rating.toFixed(1) : '-'}
                    </Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                </View>

                {/* Bio */}
                <View style={styles.bioContainer}>
                  <Text style={[commonStyles.text, { lineHeight: 22, textAlign: 'center' }]}>
                    {currentProfile.bio}
                  </Text>
                </View>

                {/* View Profile Button */}
                <TouchableOpacity style={styles.viewProfileButton} onPress={handleViewProfile}>
                  <LinearGradient
                    colors={colors.gradientSecondary}
                    style={styles.viewProfileGradient}
                  >
                    <Text style={[commonStyles.text, { fontWeight: 'bold', color: colors.text }]}>
                      View Full Profile
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Profile Counter */}
        <Text style={[commonStyles.caption, { textAlign: 'center', marginTop: spacing.md, opacity: 0.6 }]}>
          {currentIndex + 1} of {profiles.length} profiles
        </Text>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={handleSwipeLeft}>
          <LinearGradient
            colors={['#ff6b6b', '#ff5252']}
            style={styles.actionButtonGradient}
          >
            <Icon name="close" size={30} color={colors.text} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.likeButton]} onPress={handleSwipeRight}>
          <LinearGradient
            colors={['#2ed573', '#1dd1a1']}
            style={styles.actionButtonGradient}
          >
            <Icon name="heart" size={30} color={colors.text} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.lg,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  profileCard: {
    width: CARD_WIDTH,
    maxHeight: '80%',
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  cardGradient: {
    borderRadius: borderRadius.xl,
    padding: 2,
  },
  cardContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl - 2,
    padding: spacing.xl,
  },
  profileHeader: {
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.md,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  verifiedBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 2,
  },
  profileInfo: {
    alignItems: 'center' as const,
  },
  genreContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
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
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.lg,
  },
  statItem: {
    alignItems: 'center' as const,
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
    marginBottom: spacing.lg,
  },
  viewProfileButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden' as const,
  },
  viewProfileGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    ...shadows.lg,
  },
  actionButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  rejectButton: {},
  likeButton: {},
};
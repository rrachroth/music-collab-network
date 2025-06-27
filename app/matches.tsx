import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, StyleSheet } from 'react-native';
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
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { 
  getCurrentUser, 
  getMatches, 
  getAllUsers, 
  getMessages,
  User, 
  Match 
} from '../utils/storage';

interface MatchWithUser extends Match {
  user: User;
  lastMessage?: string;
  unreadCount: number;
}

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<MatchWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  useEffect(() => {
    loadMatches();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, []);

  const loadMatches = async () => {
    try {
      console.log('💕 Loading matches...');
      setLoading(true);
      
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'User not found');
        router.replace('/onboarding');
        return;
      }
      setCurrentUser(user);
      
      // Get all matches for current user
      const allMatches = await getMatches();
      const userMatches = allMatches.filter(match => 
        match.userId === user.id || match.matchedUserId === user.id
      );
      
      // Get all users to populate match data
      const allUsers = await getAllUsers();
      
      // Create matches with user data
      const matchesWithUsers: MatchWithUser[] = await Promise.all(
        userMatches.map(async (match) => {
          const otherUserId = match.userId === user.id ? match.matchedUserId : match.userId;
          const otherUser = allUsers.find(u => u.id === otherUserId);
          
          if (!otherUser) {
            return null;
          }
          
          // Get messages for this match
          const messages = await getMessages(match.id);
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
          const unreadCount = messages.filter(msg => 
            msg.receiverId === user.id && !msg.isRead
          ).length;
          
          return {
            ...match,
            user: otherUser,
            lastMessage: lastMessage?.content,
            unreadCount,
          };
        })
      );
      
      // Filter out null matches and sort by most recent
      const validMatches = matchesWithUsers
        .filter((match): match is MatchWithUser => match !== null)
        .sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime());
      
      setMatches(validMatches);
      console.log(`✅ Loaded ${validMatches.length} matches`);
      
    } catch (error) {
      console.error('❌ Error loading matches:', error);
      Alert.alert('Error', 'Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleStartChat = (match: MatchWithUser) => {
    console.log('💬 Starting chat with:', match.user.name);
    router.push(`/chat/${match.id}`);
  };

  const handleViewProfile = (userId: string) => {
    console.log('👤 Viewing profile:', userId);
    router.push(`/profile/${userId}`);
  };

  const handleBackToDiscover = () => {
    console.log('🔍 Back to discover');
    router.push('/discover');
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="heart" size={80} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Loading Matches...
        </Text>
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
          Your Matches
        </Text>
        
        <TouchableOpacity onPress={handleBackToDiscover} style={styles.headerButton}>
          <Icon name="search" size={24} />
        </TouchableOpacity>
      </View>

      {matches.length === 0 ? (
        <Animated.View style={[commonStyles.centerContent, animatedStyle]}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.emptyStateIcon}
          >
            <Icon name="heart-outline" size={60} />
          </LinearGradient>
          <Text style={[commonStyles.title, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
            No Matches Yet
          </Text>
          <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.lg }]}>
            Start swiping to discover musicians and build your network! When you match with someone, they'll appear here.
          </Text>
          <Button
            text="Discover Musicians"
            onPress={handleBackToDiscover}
            variant="gradient"
            size="lg"
            style={{ marginBottom: spacing.md }}
          />
          <Button
            text="Complete Profile"
            onPress={() => router.push('/profile')}
            variant="outline"
            size="md"
          />
        </Animated.View>
      ) : (
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <ScrollView 
            contentContainerStyle={styles.matchesList}
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
            {/* Stats Header */}
            <View style={styles.statsHeader}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                style={styles.statsContainer}
              >
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{matches.length}</Text>
                  <Text style={styles.statLabel}>Total Matches</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {matches.filter(m => m.unreadCount > 0).length}
                  </Text>
                  <Text style={styles.statLabel}>New Messages</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {matches.filter(m => m.lastMessage).length}
                  </Text>
                  <Text style={styles.statLabel}>Active Chats</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Matches List */}
            {matches.map((match, index) => (
              <MatchCard
                key={match.id}
                match={match}
                onPress={() => handleStartChat(match)}
                onViewProfile={() => handleViewProfile(match.user.id)}
                formatTimeAgo={formatTimeAgo}
                delay={index * 100}
              />
            ))}

            {/* Discover More CTA */}
            <View style={styles.ctaContainer}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                style={styles.ctaGradient}
              >
                <Icon name="search" size={40} style={{ marginBottom: spacing.md, opacity: 0.7 }} />
                <Text style={[commonStyles.heading, { fontSize: 18, marginBottom: spacing.sm }]}>
                  Discover More Musicians
                </Text>
                <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: spacing.lg, opacity: 0.8 }]}>
                  Keep swiping to find more collaborators and expand your network.
                </Text>
                <Button
                  text="Continue Discovering"
                  onPress={handleBackToDiscover}
                  variant="gradient"
                  size="md"
                />
              </LinearGradient>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

interface MatchCardProps {
  match: MatchWithUser;
  onPress: () => void;
  onViewProfile: () => void;
  formatTimeAgo: (timestamp: string) => string;
  delay: number;
}

function MatchCard({ match, onPress, onViewProfile, formatTimeAgo, delay }: MatchCardProps) {
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
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
      <TouchableOpacity
        style={[styles.matchCard, match.unreadCount > 0 && styles.unreadMatchCard]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={match.unreadCount > 0 ? colors.gradientPrimary : ['rgba(99, 102, 241, 0.05)', 'rgba(139, 92, 246, 0.05)']}
          style={styles.matchCardGradient}
        >
          <View style={styles.matchCardContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={colors.gradientSecondary}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {match.user.name.charAt(0)}
                </Text>
              </LinearGradient>
              {match.user.verified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="checkmark-circle" size={16} />
                </View>
              )}
              {match.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {match.unreadCount > 9 ? '9+' : match.unreadCount}
                  </Text>
                </View>
              )}
            </View>

            {/* Match Info */}
            <View style={styles.matchInfo}>
              <View style={styles.matchHeader}>
                <Text style={[commonStyles.heading, { fontSize: 18, flex: 1 }]}>
                  {match.user.name}
                </Text>
                <Text style={[commonStyles.caption, { opacity: 0.6 }]}>
                  {formatTimeAgo(match.matchedAt)}
                </Text>
              </View>
              
              <Text style={[commonStyles.text, { fontSize: 14, opacity: 0.8, marginBottom: spacing.xs }]}>
                {match.user.role} • {match.user.location}
              </Text>
              
              <View style={styles.genreContainer}>
                {match.user.genres.slice(0, 2).map(genre => (
                  <View key={genre} style={styles.genreChip}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
              
              {match.lastMessage ? (
                <Text style={[styles.lastMessage, match.unreadCount > 0 && styles.unreadMessage]}>
                  {match.lastMessage.length > 50 
                    ? `${match.lastMessage.substring(0, 50)}...` 
                    : match.lastMessage
                  }
                </Text>
              ) : (
                <Text style={[styles.lastMessage, { fontStyle: 'italic', opacity: 0.6 }]}>
                  Say hello! 👋
                </Text>
              )}
            </View>

            {/* Actions */}
            <View style={styles.matchActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onPress}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.actionButtonGradient}
                >
                  <Icon name="chatbubble" size={20} />
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { marginTop: spacing.sm }]}
                onPress={onViewProfile}
              >
                <View style={styles.secondaryActionButton}>
                  <Icon name="person" size={18} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
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
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  matchesList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statsHeader: {
    marginVertical: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  matchCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  unreadMatchCard: {
    ...shadows.lg,
  },
  matchCardGradient: {
    padding: 2,
  },
  matchCardContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg - 2,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.success,
    borderRadius: 10,
    padding: 2,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  genreChip: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  genreText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 18,
  },
  unreadMessage: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  matchActions: {
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaContainer: {
    marginTop: spacing.xl,
  },
  ctaGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});
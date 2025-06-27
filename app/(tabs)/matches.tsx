import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
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
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { 
  getCurrentUser, 
  getMatches, 
  getAllUsers, 
  getMessages,
  User, 
  Match 
} from '../../utils/storage';

interface MatchWithUser extends Match {
  user: User;
  lastMessage?: string;
  unreadCount: number;
}

interface MatchCardProps {
  match: MatchWithUser;
  onPress: () => void;
  onViewProfile: () => void;
  formatTimeAgo: (timestamp: string) => string;
  delay: number;
}

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<MatchWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const loadMatches = useCallback(async () => {
    try {
      console.log('💕 Loading matches...');
      setLoading(true);
      
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please complete your profile first.', [
          { text: 'Setup Profile', onPress: () => router.replace('/onboarding') }
        ]);
        return;
      }
      
      setCurrentUser(user);
      
      const [allMatches, allUsers, allMessages] = await Promise.all([
        getMatches(),
        getAllUsers(),
        getMessages(),
      ]);
      
      // Filter matches for current user
      const userMatches = allMatches.filter(match => 
        match.userId === user.id || match.matchedUserId === user.id
      );
      
      // Enrich matches with user data and message info
      const enrichedMatches: MatchWithUser[] = userMatches.map(match => {
        const otherUserId = match.userId === user.id ? match.matchedUserId : match.userId;
        const otherUser = allUsers.find(u => u.id === otherUserId);
        
        if (!otherUser) {
          return null;
        }
        
        // Get messages for this match
        const matchMessages = allMessages.filter(msg => msg.matchId === match.id);
        const lastMessage = matchMessages.sort((a, b) => 
          new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        )[0];
        
        const unreadCount = matchMessages.filter(msg => 
          msg.receiverId === user.id && !msg.isRead
        ).length;
        
        return {
          ...match,
          user: otherUser,
          lastMessage: lastMessage?.content,
          unreadCount,
        };
      }).filter(Boolean) as MatchWithUser[];
      
      // Sort by most recent activity
      enrichedMatches.sort((a, b) => 
        new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()
      );
      
      setMatches(enrichedMatches);
      console.log(`✅ Loaded ${enrichedMatches.length} matches`);
      
    } catch (error) {
      console.error('❌ Error loading matches:', error);
      Alert.alert('Error', 'Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [loadMatches, fadeIn, slideUp]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleStartChat = (match: MatchWithUser) => {
    console.log(`💬 Starting chat with ${match.user.name}`);
    router.push(`/chat/${match.id}`);
  };

  const handleViewProfile = (userId: string) => {
    console.log(`👤 Viewing profile: ${userId}`);
    // TODO: Navigate to profile view
  };

  const handleBackToDiscover = () => {
    console.log('🔍 Back to discover');
    router.push('/(tabs)/discover');
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
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
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="heart" size={80} color={colors.primary} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Loading Matches
        </Text>
        <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
          Getting your connections ready
        </Text>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="heart-outline" size={80} color={colors.textMuted} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          No Matches Yet
        </Text>
        <Text style={[commonStyles.text, { marginTop: spacing.sm, marginBottom: spacing.xl }]}>
          Start swiping to find musicians you&apos;d love to collaborate with!
        </Text>
        <Button
          text="Discover Musicians"
          onPress={handleBackToDiscover}
          variant="gradient"
          size="lg"
        />
      </View>
    );
  }

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
          Matches ({matches.length})
        </Text>
        
        <TouchableOpacity onPress={handleBackToDiscover} style={styles.headerButton}>
          <Icon name="search" size={24} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={animatedStyle}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.statsGradient}
          >
            <View style={styles.statsContent}>
              <Icon name="heart" size={32} color={colors.text} />
              <View style={styles.statsText}>
                <Text style={styles.statsNumber}>{matches.length}</Text>
                <Text style={styles.statsLabel}>Total Matches</Text>
              </View>
              <View style={styles.statsText}>
                <Text style={styles.statsNumber}>
                  {matches.filter(m => m.unreadCount > 0).length}
                </Text>
                <Text style={styles.statsLabel}>Unread Chats</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Matches List */}
        <View style={styles.matchesList}>
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
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaTitle}>Want More Matches?</Text>
          <Text style={styles.ctaDescription}>
            Keep discovering new musicians to expand your network
          </Text>
          <Button
            text="Discover More"
            onPress={handleBackToDiscover}
            variant="outline"
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function MatchCard({ match, onPress, onViewProfile, formatTimeAgo, delay }: MatchCardProps) {
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15 }));
  }, [delay, cardOpacity, cardScale]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ scale: cardScale.value }],
    };
  });

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity style={styles.matchCard} onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={match.unreadCount > 0 ? colors.gradientPrimary : colors.gradientSecondary}
          style={styles.matchGradient}
        >
          <View style={styles.matchContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={colors.gradientSecondary}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {match.user.name.charAt(0)}
                </Text>
              </LinearGradient>
              
              {match.user.verified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="checkmark-circle" size={16} color={colors.success} />
                </View>
              )}
              
              {match.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {match.unreadCount > 9 ? '9+' : match.unreadCount}
                  </Text>
                </View>
              )}
            </View>

            {/* Match Info */}
            <View style={styles.matchInfo}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchName}>{match.user.name}</Text>
                <Text style={styles.matchTime}>
                  {formatTimeAgo(match.matchedAt)}
                </Text>
              </View>
              
              <Text style={styles.matchRole}>{match.user.role}</Text>
              
              {match.lastMessage ? (
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {match.lastMessage}
                </Text>
              ) : (
                <Text style={styles.noMessage}>
                  Say hello to start the conversation!
                </Text>
              )}
              
              {/* Genres */}
              <View style={styles.genresContainer}>
                {match.user.genres.slice(0, 2).map(genre => (
                  <View key={genre} style={styles.genreChip}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
                {match.user.genres.length > 2 && (
                  <Text style={styles.moreGenres}>
                    +{match.user.genres.length - 2}
                  </Text>
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.matchActions}>
              <TouchableOpacity 
                onPress={onViewProfile} 
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="person" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={onPress} 
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="chatbubble" size={20} color={colors.primary} />
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statsContainer: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  statsGradient: {
    padding: spacing.lg,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsText: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  statsLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    opacity: 0.9,
  },
  matchesList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  matchCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  matchGradient: {
    padding: 2,
  },
  matchContent: {
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
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    padding: 2,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  matchName: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  matchTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  matchRole: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  noMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  genresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  genreChip: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  genreText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  moreGenres: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  matchActions: {
    alignItems: 'center',
    gap: spacing.md,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  ctaDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
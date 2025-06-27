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

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const [matches, setMatches] = useState<MatchWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const loadMatches = useCallback(async () => {
    try {
      console.log('💕 Loading matches...');
      setLoading(true);
      
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'Please complete your profile first.', [
          { text: 'Setup Profile', onPress: () => router.replace('/onboarding') }
        ]);
        return;
      }
      
      const [allMatches, allUsers, allMessages] = await Promise.all([
        getMatches(),
        getAllUsers(),
        getMessages(),
      ]);
      
      // Filter matches for current user
      const userMatches = allMatches.filter(match => 
        match.userId === currentUser.id || match.matchedUserId === currentUser.id
      );
      
      // Enrich matches with user data and message info
      const enrichedMatches: MatchWithUser[] = userMatches.map(match => {
        const otherUserId = match.userId === currentUser.id ? match.matchedUserId : match.userId;
        const otherUser = allUsers.find(user => user.id === otherUserId);
        
        if (!otherUser) {
          return null;
        }
        
        // Get messages for this match
        const matchMessages = allMessages.filter(msg => msg.matchId === match.id);
        const lastMessage = matchMessages.sort((a, b) => 
          new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        )[0];
        
        const unreadCount = matchMessages.filter(msg => 
          !msg.isRead && msg.receiverId === currentUser.id
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
    console.log('💬 Starting chat with', match.user.name);
    router.push(`/chat/${match.id}`);
  };

  const handleViewProfile = (userId: string) => {
    console.log('👤 Viewing profile:', userId);
    // TODO: Navigate to user profile view
  };

  const handleBackToDiscover = () => {
    console.log('🔍 Back to discover');
    router.push('/discover');
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
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
        <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
          Finding your connections
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
          Matches ({matches.length})
        </Text>
        
        <TouchableOpacity onPress={handleBackToDiscover} style={styles.headerButton}>
          <Icon name="search" size={24} />
        </TouchableOpacity>
      </View>

      {matches.length === 0 ? (
        <Animated.View style={[commonStyles.centerContent, { flex: 1 }, animatedStyle]}>
          <LinearGradient
            colors={colors.gradientSecondary}
            style={styles.emptyIcon}
          >
            <Icon name="heart-outline" size={60} />
          </LinearGradient>
          
          <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
            No Matches Yet
          </Text>
          
          <Text style={[commonStyles.text, { marginBottom: spacing.xl, textAlign: 'center' }]}>
            Start swiping to find musicians who share your passion for music!
          </Text>
          
          <Button
            text="Discover Musicians"
            onPress={handleBackToDiscover}
            variant="gradient"
            size="lg"
          />
        </Animated.View>
      ) : (
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
              style={styles.statCard}
            >
              <Icon name="heart" size={32} />
              <Text style={styles.statNumber}>{matches.length}</Text>
              <Text style={styles.statLabel}>Total Matches</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={colors.gradientSecondary}
              style={styles.statCard}
            >
              <Icon name="chatbubble" size={32} />
              <Text style={styles.statNumber}>
                {matches.filter(m => m.unreadCount > 0).length}
              </Text>
              <Text style={styles.statLabel}>Unread Chats</Text>
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

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              text="Discover More Musicians"
              onPress={handleBackToDiscover}
              variant="gradient"
              size="lg"
              style={{ marginBottom: spacing.md }}
            />
            
            <Button
              text="View All Conversations"
              onPress={() => router.push('/conversations')}
              variant="outline"
              size="md"
            />
          </View>
        </Animated.ScrollView>
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
          colors={colors.gradientPrimary}
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
              
              <Text style={styles.matchRole}>
                {match.user.role} • {match.user.location}
              </Text>
              
              {match.lastMessage ? (
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {match.lastMessage}
                </Text>
              ) : (
                <Text style={[styles.lastMessage, { fontStyle: 'italic', opacity: 0.6 }]}>
                  Say hello! 👋
                </Text>
              )}
              
              {/* Genres */}
              <View style={styles.genreContainer}>
                {match.user.genres.slice(0, 2).map(genre => (
                  <View key={genre} style={styles.genreChip}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.matchActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={onViewProfile}
              >
                <Icon name="person" size={20} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.chatButton]}
                onPress={onPress}
              >
                <Icon name="chatbubble" size={20} color={colors.text} />
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
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginVertical: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    opacity: 0.9,
  },
  matchesList: {
    marginBottom: spacing.xl,
  },
  matchCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
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
  },
  unreadText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
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
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  genreContainer: {
    flexDirection: 'row',
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
    fontFamily: 'Inter_500Medium',
    color: colors.text,
  },
  matchActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButton: {
    backgroundColor: colors.primary,
  },
  actionButtons: {
    marginTop: spacing.lg,
  },
});
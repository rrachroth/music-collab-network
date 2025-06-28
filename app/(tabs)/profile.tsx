import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { pickImage, pickVideo, pickAudio } from '../../utils/mediaUtils';
import { 
  getCurrentUser, 
  updateCurrentUser, 
  getMatches, 
  getProjects,
  getApplications,
  User 
} from '../../utils/storage';

interface StatCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  number: number;
  label: string;
  onPress: () => void;
  gradient: string[];
}

interface QuickActionCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  gradient: string[];
}

interface HighlightCardProps {
  highlight: any;
  delay: number;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ matches: 0, projects: 0, collaborations: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const loadProfile = useCallback(async () => {
    try {
      console.log('👤 Loading profile...');
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadStats(currentUser);
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 800 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [loadProfile, fadeIn, slideUp]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

  const loadStats = async (currentUser: User) => {
    try {
      const [matches, projects, applications] = await Promise.all([
        getMatches(),
        getProjects(),
        getApplications()
      ]);
      
      const userMatches = matches.filter(m => 
        m.userId === currentUser.id || m.matchedUserId === currentUser.id
      );
      
      const userProjects = projects.filter(p => p.createdBy === currentUser.id);
      
      setStats({
        matches: userMatches.length,
        projects: userProjects.length,
        collaborations: currentUser.collaborations?.length || 0
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const handleEditProfile = () => {
    router.push('/onboarding');
  };

  const handleUploadHighlight = () => {
    Alert.alert(
      'Upload Highlight',
      'Choose the type of media you want to upload',
      [
        { text: 'Audio', onPress: () => uploadMedia('audio') },
        { text: 'Video', onPress: () => uploadMedia('video') },
        { text: 'Image', onPress: () => uploadMedia('image') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const uploadMedia = async (type: 'audio' | 'video' | 'image') => {
    try {
      let result;
      switch (type) {
        case 'audio':
          result = await pickAudio();
          break;
        case 'video':
          result = await pickVideo();
          break;
        case 'image':
          result = await pickImage();
          break;
      }
      
      if (result && user) {
        const updatedHighlights = [...(user.highlights || []), result];
        const updatedUser = await updateCurrentUser({ highlights: updatedHighlights });
        if (updatedUser) {
          setUser(updatedUser);
          Alert.alert('Success', 'Highlight uploaded successfully!');
        }
      }
    } catch (error) {
      console.error('❌ Error uploading media:', error);
      Alert.alert('Error', 'Failed to upload media. Please try again.');
    }
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings feature coming soon!');
  };

  const handleViewCollaborations = () => {
    Alert.alert('Collaborations', 'View collaborations feature coming soon!');
  };

  const handleViewMatches = () => {
    router.push('/(tabs)/matches');
  };

  const handleViewProjects = () => {
    router.push('/(tabs)/projects');
  };

  const formatJoinDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Icon name="person" size={80} />
        <Text style={[commonStyles.caption, { marginTop: 16 }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Icon name="person-add" size={80} />
        <Text style={[commonStyles.title, { marginTop: 24 }]}>
          No Profile Found
        </Text>
        <Text style={[commonStyles.text, { marginBottom: 32 }]}>
          Let's create your profile to get started
        </Text>
        <Button
          text="Create Profile"
          onPress={() => router.push('/onboarding')}
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
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <ScrollView
        style={commonStyles.wrapper}
        contentContainerStyle={[commonStyles.content, { paddingTop: spacing.lg }]}
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
        <Animated.View style={animatedStyle}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileImageContainer}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.profileImage}
              >
                <Icon name="person" size={48} color={colors.text} />
              </LinearGradient>
              
              {user.verified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="checkmark-circle" size={20} color={colors.success} />
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileRole}>{user.role}</Text>
              <Text style={styles.profileLocation}>
                <Icon name="location" size={14} color={colors.textMuted} />
                {' '}{user.location}
              </Text>
              <Text style={styles.joinDate}>
                Member since {formatJoinDate(user.joinDate)}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
              <Icon name="settings" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Bio */}
          {user.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}

          {/* Genres */}
          <View style={styles.genresSection}>
            <Text style={styles.sectionTitle}>Genres</Text>
            <View style={styles.genresContainer}>
              {user.genres.map((genre, index) => (
                <View key={index} style={styles.genreChip}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Stats</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="heart"
                number={stats.matches}
                label="Matches"
                onPress={handleViewMatches}
                gradient={colors.gradientPrimary}
              />
              <StatCard
                icon="folder"
                number={stats.projects}
                label="Projects"
                onPress={handleViewProjects}
                gradient={colors.gradientSecondary}
              />
              <StatCard
                icon="people"
                number={stats.collaborations}
                label="Collabs"
                onPress={handleViewCollaborations}
                gradient={['#F59E0B', '#EF4444']}
              />
            </View>
          </View>

          {/* Highlights */}
          <View style={styles.highlightsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Highlights</Text>
              <Button
                text="Add"
                onPress={handleUploadHighlight}
                variant="outline"
                size="sm"
              />
            </View>
            
            {user.highlights && user.highlights.length > 0 ? (
              <View style={styles.highlightsGrid}>
                {user.highlights.map((highlight, index) => (
                  <HighlightCard
                    key={highlight.id}
                    highlight={highlight}
                    delay={index * 100}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyHighlights}>
                <Icon name="musical-notes" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No highlights yet</Text>
                <Text style={styles.emptySubtext}>
                  Upload audio, video, or images to showcase your work
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionCard
                icon="create"
                title="Edit Profile"
                subtitle="Update your information"
                onPress={handleEditProfile}
                gradient={colors.gradientPrimary}
              />
              <QuickActionCard
                icon="add-circle"
                title="New Project"
                subtitle="Start a collaboration"
                onPress={() => router.push('/(tabs)/projects')}
                gradient={colors.gradientSecondary}
              />
              <QuickActionCard
                icon="search"
                title="Discover"
                subtitle="Find new artists"
                onPress={() => router.push('/(tabs)/discover')}
                gradient={['#F59E0B', '#EF4444']}
              />
              <QuickActionCard
                icon="chatbubbles"
                title="Messages"
                subtitle="Chat with matches"
                onPress={() => router.push('/(tabs)/matches')}
                gradient={['#10B981', '#059669']}
              />
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: spacing.xxl }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, number, label, onPress, gradient }: StatCardProps) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradient}
        style={styles.statGradient}
      >
        <Icon name={icon} size={24} color={colors.text} />
      </LinearGradient>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function QuickActionCard({ icon, title, subtitle, onPress, gradient }: QuickActionCardProps) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradient}
        style={styles.quickActionGradient}
      >
        <Icon name={icon} size={20} color={colors.text} />
      </LinearGradient>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function HighlightCard({ highlight, delay }: HighlightCardProps) {
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15 }));
  }, [delay, cardOpacity, cardScale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ scale: cardScale.value }],
    };
  });

  return (
    <Animated.View style={[styles.highlightCard, animatedStyle]}>
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.highlightIcon}
      >
        <Icon 
          name={highlight.type === 'audio' ? 'musical-note' : highlight.type === 'video' ? 'videocam' : 'image'} 
          size={20} 
          color={colors.text} 
        />
      </LinearGradient>
      <Text style={styles.highlightTitle}>{highlight.title}</Text>
      <Text style={styles.highlightDuration}>
        {highlight.type === 'audio' || highlight.type === 'video' 
          ? `${Math.floor(highlight.duration / 60)}:${(highlight.duration % 60).toString().padStart(2, '0')}`
          : highlight.type
        }
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 2,
  },
  profileInfo: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  profileRole: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  profileLocation: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  settingsButton: {
    padding: spacing.sm,
  },
  bioSection: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bioText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 24,
  },
  genresSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  genreText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  highlightsSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  highlightCard: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  highlightTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  highlightDuration: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  emptyHighlights: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  quickActionGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import { pickImage, pickVideo, pickAudio } from '../../utils/mediaUtils';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import Icon from '../../components/Icon';
import { 
  getCurrentUser, 
  updateCurrentUser, 
  getMatches, 
  getProjects,
  getApplications,
  User 
} from '../../utils/storage';
import { useState, useEffect, useCallback } from 'react';
import Button from '../../components/Button';

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
  const [stats, setStats] = useState({
    matches: 0,
    projects: 0,
    collaborations: 0,
    rating: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

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
      Alert.alert('Error', 'Failed to load profile data');
    }
  }, []);

  const loadStats = async (currentUser: User) => {
    try {
      const [matches, projects, applications] = await Promise.all([
        getMatches(),
        getProjects(),
        getApplications()
      ]);

      const userMatches = matches.filter(match => 
        match.userId === currentUser.id || match.matchedUserId === currentUser.id
      );

      const userProjects = projects.filter(project => 
        project.authorId === currentUser.id
      );

      const userApplications = applications.filter(app => 
        app.applicantId === currentUser.id
      );

      setStats({
        matches: userMatches.length,
        projects: userProjects.length,
        collaborations: currentUser.collaborations.length,
        rating: currentUser.rating
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadProfile();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [loadProfile, fadeIn, slideUp]);

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
      'Choose media type to upload',
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
        const updatedHighlights = [...user.highlights, result];
        const updatedUser = await updateCurrentUser({ highlights: updatedHighlights });
        if (updatedUser) {
          setUser(updatedUser);
          Alert.alert('Success', 'Highlight uploaded successfully!');
        }
      }
    } catch (error) {
      console.error('❌ Error uploading media:', error);
      Alert.alert('Error', 'Failed to upload media');
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (!user) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Text style={commonStyles.text}>Loading profile...</Text>
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
            <View style={styles.headerContent}>
              <Text style={[commonStyles.title, { marginBottom: 0 }]}>
                {user.name}
              </Text>
              <Text style={[commonStyles.caption, { marginTop: spacing.xs }]}>
                {user.role} • {user.location}
              </Text>
              <Text style={[commonStyles.caption, { opacity: 0.7 }]}>
                Member since {formatJoinDate(user.joinDate)}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={handleSettings}
            >
              <Icon name="settings-outline" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Bio */}
          {user.bio && (
            <View style={[commonStyles.card, { marginBottom: spacing.lg }]}>
              <Text style={[commonStyles.textLeft, { marginBottom: 0 }]}>
                {user.bio}
              </Text>
            </View>
          )}

          {/* Genres */}
          <View style={[commonStyles.card, { marginBottom: spacing.lg }]}>
            <Text style={[commonStyles.heading, { marginBottom: spacing.md }]}>
              Genres
            </Text>
            <View style={styles.genreContainer}>
              {user.genres.map((genre, index) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
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
          </View>

          <View style={styles.statsContainer}>
            <StatCard
              icon="people"
              number={stats.collaborations}
              label="Collabs"
              onPress={handleViewCollaborations}
              gradient={['#10B981', '#059669']}
            />
            <StatCard
              icon="star"
              number={stats.rating}
              label="Rating"
              onPress={() => {}}
              gradient={['#F59E0B', '#D97706']}
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={[commonStyles.heading, { marginBottom: spacing.lg }]}>
              Quick Actions
            </Text>
            
            <QuickActionCard
              icon="create"
              title="Edit Profile"
              subtitle="Update your information"
              onPress={handleEditProfile}
              gradient={colors.gradientPrimary}
            />
            
            <QuickActionCard
              icon="cloud-upload"
              title="Upload Highlight"
              subtitle="Add audio, video, or image"
              onPress={handleUploadHighlight}
              gradient={colors.gradientSecondary}
            />
          </View>

          {/* Highlights */}
          <View style={styles.highlightsContainer}>
            <Text style={[commonStyles.heading, { marginBottom: spacing.lg }]}>
              Highlights ({user.highlights.length})
            </Text>
            
            {user.highlights.length === 0 ? (
              <View style={[commonStyles.card, styles.emptyState]}>
                <Icon name="musical-notes" size={48} color={colors.textMuted} />
                <Text style={[commonStyles.text, { marginTop: spacing.md }]}>
                  No highlights yet
                </Text>
                <Text style={[commonStyles.caption, { marginTop: spacing.xs }]}>
                  Upload your best work to showcase your talent
                </Text>
                <Button
                  text="Upload First Highlight"
                  onPress={handleUploadHighlight}
                  variant="primary"
                  size="sm"
                  style={{ marginTop: spacing.lg }}
                />
              </View>
            ) : (
              <View style={styles.highlightsGrid}>
                {user.highlights.map((highlight, index) => (
                  <HighlightCard
                    key={highlight.id}
                    highlight={highlight}
                    delay={index * 100}
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, number, label, onPress, gradient }: StatCardProps) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <LinearGradient
        colors={gradient}
        style={styles.statCardGradient}
      >
        <Icon name={icon} size={24} color={colors.text} />
        <Text style={styles.statNumber}>{number}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function QuickActionCard({ icon, title, subtitle, onPress, gradient }: QuickActionCardProps) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <LinearGradient
        colors={gradient}
        style={styles.quickActionGradient}
      >
        <Icon name={icon} size={32} color={colors.text} />
      </LinearGradient>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function HighlightCard({ highlight, delay }: HighlightCardProps) {
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ scale: cardScale.value }],
    };
  });

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15 }));
  }, [delay, cardOpacity, cardScale]);

  return (
    <Animated.View style={[styles.highlightCard, cardAnimatedStyle]}>
      <View style={styles.highlightIcon}>
        <Icon 
          name={highlight.type === 'audio' ? 'musical-note' : highlight.type === 'video' ? 'videocam' : 'image'} 
          size={24} 
          color={colors.primary} 
        />
      </View>
      <Text style={styles.highlightTitle} numberOfLines={1}>
        {highlight.title}
      </Text>
      <Text style={styles.highlightType}>
        {highlight.type.toUpperCase()}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerContent: {
    flex: 1,
  },
  settingsButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundCard,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  genreText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statCardGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  quickActionsContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  quickActionGradient: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  highlightsContainer: {
    marginBottom: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  highlightCard: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  highlightTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  highlightType: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
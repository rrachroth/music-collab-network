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
  updateCurrentUser, 
  getMatches, 
  getProjects,
  getApplications,
  User 
} from '../../utils/storage';
import { pickImage, pickVideo, pickAudio } from '../../utils/mediaUtils';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    matches: 0,
    projects: 0,
    applications: 0,
    collaborations: 0,
  });
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const loadProfile = useCallback(async () => {
    try {
      console.log('👤 Loading profile...');
      setLoading(true);
      
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'Please complete your profile first.', [
          { text: 'Setup Profile', onPress: () => router.replace('/onboarding') }
        ]);
        return;
      }
      
      setUser(currentUser);
      await loadStats(currentUser);
      
      console.log('✅ Profile loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [loadProfile, fadeIn, slideUp]);

  const loadStats = async (currentUser: User) => {
    try {
      const [matches, projects, applications] = await Promise.all([
        getMatches(),
        getProjects(),
        getApplications(),
      ]);

      const userMatches = matches.filter(m => 
        m.userId === currentUser.id || m.matchedUserId === currentUser.id
      ).length;

      const userProjects = projects.filter(p => p.createdBy === currentUser.id).length;
      const userApplications = applications.filter(a => a.applicantId === currentUser.id).length;

      setStats({
        matches: userMatches,
        projects: userProjects,
        applications: userApplications,
        collaborations: userMatches + userApplications,
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    console.log('✏️ Editing profile');
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
        const updatedHighlights = [...user.highlights, result];
        const updatedUser = { ...user, highlights: updatedHighlights };
        
        await updateCurrentUser(updatedUser);
        setUser(updatedUser);
        
        Alert.alert('Success', 'Highlight uploaded successfully!');
      }
    } catch (error) {
      console.error('❌ Error uploading media:', error);
      Alert.alert('Error', 'Failed to upload media. Please try again.');
    }
  };

  const handleSettings = () => {
    console.log('⚙️ Opening settings');
    // TODO: Navigate to settings
  };

  const handleViewCollaborations = () => {
    console.log('🤝 Viewing collaborations');
    // TODO: Navigate to collaborations view
  };

  const handleViewMatches = () => {
    console.log('💕 Viewing matches');
    router.push('/matches');
  };

  const handleViewProjects = () => {
    console.log('📋 Viewing projects');
    router.push('/projects');
  };

  const formatJoinDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
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
        <Icon name="person" size={80} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Loading Profile...
        </Text>
        <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
          Getting your information ready
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={commonStyles.title}>Profile Not Found</Text>
        <Text style={[commonStyles.text, { marginBottom: spacing.xl }]}>
          Please complete your profile setup
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
          My Profile
        </Text>
        
        <TouchableOpacity onPress={handleSettings} style={styles.headerButton}>
          <Icon name="settings" size={24} />
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
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.avatarGradient}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0)}
              </Text>
            </View>
          </LinearGradient>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{user.name}</Text>
              {user.verified && (
                <Icon name="checkmark-circle" size={24} color={colors.success} />
              )}
            </View>
            
            <Text style={styles.profileRole}>
              {user.role} • {user.location}
            </Text>
            
            {user.rating > 0 && (
              <View style={styles.ratingContainer}>
                <Icon name="star" size={18} color={colors.warning} />
                <Text style={styles.ratingText}>{user.rating.toFixed(1)}</Text>
                <Text style={styles.ratingLabel}>rating</Text>
              </View>
            )}
            
            <Text style={styles.joinDate}>
              Member since {formatJoinDate(user.createdAt)}
            </Text>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="heart"
              number={stats.matches}
              label="Matches"
              onPress={handleViewMatches}
              gradient={colors.gradientPrimary}
            />
            <StatCard
              icon="briefcase"
              number={stats.projects}
              label="Projects"
              onPress={handleViewProjects}
              gradient={colors.gradientSecondary}
            />
            <StatCard
              icon="document"
              number={stats.applications}
              label="Applications"
              onPress={handleViewProjects}
              gradient={colors.gradientPrimary}
            />
            <StatCard
              icon="people"
              number={stats.collaborations}
              label="Collaborations"
              onPress={handleViewCollaborations}
              gradient={colors.gradientSecondary}
            />
          </View>
        </View>

        {/* Genres */}
        <View style={styles.genresSection}>
          <Text style={styles.sectionTitle}>Musical Genres</Text>
          <View style={styles.genreContainer}>
            {user.genres.map(genre => (
              <View key={genre} style={styles.genreChip}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Highlights */}
        <View style={styles.highlightsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Highlights ({user.highlights.length})
            </Text>
            <TouchableOpacity onPress={handleUploadHighlight} style={styles.addButton}>
              <Icon name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {user.highlights.length > 0 ? (
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
              <Icon name="musical-note" size={48} color={colors.textMuted} />
              <Text style={[commonStyles.text, { marginTop: spacing.md, textAlign: 'center' }]}>
                No highlights uploaded yet
              </Text>
              <Text style={[commonStyles.caption, { marginTop: spacing.sm, textAlign: 'center' }]}>
                Upload audio, video, or images to showcase your work
              </Text>
              <Button
                text="Upload First Highlight"
                onPress={handleUploadHighlight}
                variant="outline"
                size="md"
                style={{ marginTop: spacing.lg }}
              />
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
              subtitle="Update your info"
              onPress={handleEditProfile}
              gradient={colors.gradientPrimary}
            />
            <QuickActionCard
              icon="add-circle"
              title="Upload Media"
              subtitle="Add highlights"
              onPress={handleUploadHighlight}
              gradient={colors.gradientSecondary}
            />
            <QuickActionCard
              icon="heart"
              title="View Matches"
              subtitle={`${stats.matches} connections`}
              onPress={handleViewMatches}
              gradient={colors.gradientPrimary}
            />
            <QuickActionCard
              icon="briefcase"
              title="My Projects"
              subtitle={`${stats.projects} active`}
              onPress={handleViewProjects}
              gradient={colors.gradientSecondary}
            />
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function StatCard({ icon, number, label, onPress, gradient }: StatCardProps) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradient}
        style={styles.statCardGradient}
      >
        <Icon name={icon} size={24} />
        <Text style={styles.statNumber}>{number}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
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
        <Icon name={icon} size={24} />
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function HighlightCard({ highlight, delay }: HighlightCardProps) {
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
    <Animated.View style={[styles.highlightCard, cardAnimatedStyle]}>
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.highlightGradient}
      >
        <View style={styles.highlightContent}>
          <Icon 
            name={highlight.type === 'audio' ? 'musical-note' : highlight.type === 'video' ? 'videocam' : 'image'} 
            size={32} 
            color={colors.text}
          />
          <Text style={styles.highlightTitle}>{highlight.title}</Text>
          <Text style={styles.highlightType}>{highlight.type}</Text>
        </View>
      </LinearGradient>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarGradient: {
    padding: 3,
    borderRadius: 50,
    marginRight: spacing.lg,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
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
    marginBottom: spacing.sm,
  },
  ratingText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
  ratingLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  joinDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  bioSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  bioText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 24,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  statCardGradient: {
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginVertical: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    opacity: 0.9,
  },
  genresSection: {
    marginBottom: spacing.xl,
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
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  highlightCard: {
    width: '48%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  highlightGradient: {
    padding: 2,
  },
  highlightContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md - 2,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  highlightTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  highlightType: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  emptyHighlights: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  quickActionCard: {
    width: '48%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  quickActionGradient: {
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginTop: spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    opacity: 0.8,
  },
});
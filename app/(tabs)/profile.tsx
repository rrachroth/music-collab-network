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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    matches: 0,
    projects: 0,
    applications: 0,
  });
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  useEffect(() => {
    loadProfile();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, []);

  const loadProfile = async () => {
    try {
      console.log('👤 Loading profile...');
      setLoading(true);
      
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert('Profile Not Found', 'Please complete your profile setup.', [
          { text: 'Setup Profile', onPress: () => router.replace('/onboarding') }
        ]);
        return;
      }
      
      setUser(currentUser);
      
      // Load user stats
      await loadStats(currentUser);
      
      console.log('✅ Profile loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

      const userProjects = projects.filter(p => p.authorId === currentUser.id).length;
      
      const userApplications = applications.filter(a => a.applicantId === currentUser.id).length;

      setStats({
        matches: userMatches,
        projects: userProjects,
        applications: userApplications,
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
    router.push('/edit-profile');
  };

  const handleUploadHighlight = async () => {
    if (!user) return;
    
    console.log('🎵 Uploading highlight');
    
    Alert.alert(
      'Upload Highlight',
      'Choose the type of media you want to upload',
      [
        { text: 'Audio', onPress: () => uploadMedia('audio') },
        { text: 'Video', onPress: () => uploadMedia('video') },
        { text: 'Photo', onPress: () => uploadMedia('image') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const uploadMedia = async (type: 'audio' | 'video' | 'image') => {
    try {
      let mediaFile = null;
      
      switch (type) {
        case 'audio':
          mediaFile = await pickAudio();
          break;
        case 'video':
          mediaFile = await pickVideo();
          break;
        case 'image':
          mediaFile = await pickImage();
          break;
      }
      
      if (mediaFile && user) {
        const updatedUser = await updateCurrentUser({
          highlights: [...user.highlights, mediaFile],
        });
        
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
    console.log('⚙️ Opening settings');
    router.push('/settings');
  };

  const handleViewCollaborations = () => {
    console.log('🤝 Viewing collaborations');
    router.push('/collaborations');
  };

  const handleViewMatches = () => {
    console.log('💕 Viewing matches');
    router.push('/matches');
  };

  const handleViewProjects = () => {
    console.log('📋 Viewing projects');
    router.push('/projects');
  };

  const formatJoinDate = (dateString: string) => {
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
        <Text style={commonStyles.title}>Profile not found</Text>
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
            colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
            style={styles.profileHeaderGradient}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user.name.charAt(0)}
                </Text>
              </LinearGradient>
              {user.verified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="checkmark-circle" size={24} />
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={[commonStyles.title, { fontSize: 28, marginBottom: spacing.xs }]}>
                {user.name}
              </Text>
              
              <Text style={[commonStyles.text, { fontSize: 16, opacity: 0.8, marginBottom: spacing.sm }]}>
                {user.role} • {user.location}
              </Text>
              
              <Text style={[commonStyles.caption, { opacity: 0.6, marginBottom: spacing.lg }]}>
                Member since {formatJoinDate(user.joinDate)}
              </Text>
              
              {!user.isOnboarded && (
                <View style={styles.incompleteProfile}>
                  <Icon name="warning" size={16} style={{ marginRight: spacing.xs }} />
                  <Text style={styles.incompleteText}>
                    Complete your profile to start discovering musicians
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
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
            icon="briefcase"
            number={stats.projects}
            label="Projects"
            onPress={handleViewProjects}
            gradient={colors.gradientSecondary}
          />
          <StatCard
            icon="document-text"
            number={stats.applications}
            label="Applications"
            onPress={() => router.push('/applications')}
            gradient={colors.gradientPrimary}
          />
        </View>

        {/* Genres */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[commonStyles.heading, { fontSize: 18 }]}>
              Musical Genres
            </Text>
            <TouchableOpacity onPress={handleEditProfile}>
              <Icon name="create" size={20} />
            </TouchableOpacity>
          </View>
          <View style={styles.genreContainer}>
            {user.genres.map(genre => (
              <View key={genre} style={styles.genreChip}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[commonStyles.heading, { fontSize: 18 }]}>
              About Me
            </Text>
            <TouchableOpacity onPress={handleEditProfile}>
              <Icon name="create" size={20} />
            </TouchableOpacity>
          </View>
          <Text style={[commonStyles.text, { lineHeight: 22, textAlign: 'left' }]}>
            {user.bio}
          </Text>
        </View>

        {/* Highlights Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[commonStyles.heading, { fontSize: 18 }]}>
              Highlights ({user.highlights.length})
            </Text>
            <TouchableOpacity onPress={handleUploadHighlight}>
              <Icon name="add-circle" size={24} />
            </TouchableOpacity>
          </View>
          
          {user.highlights.length === 0 ? (
            <View style={styles.emptyHighlights}>
              <LinearGradient
                colors={colors.gradientSecondary}
                style={styles.emptyHighlightsIcon}
              >
                <Icon name="musical-note" size={40} />
              </LinearGradient>
              <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: spacing.md }]}>
                No highlights yet. Upload your best work to showcase your talent!
              </Text>
              <Button
                text="Upload Your First Highlight"
                onPress={handleUploadHighlight}
                variant="gradient"
                size="md"
              />
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.highlightsContainer}
            >
              {user.highlights.map((highlight, index) => (
                <HighlightCard
                  key={highlight.id}
                  highlight={highlight}
                  delay={index * 100}
                />
              ))}
              
              {/* Add More Button */}
              <TouchableOpacity 
                style={styles.addHighlightCard}
                onPress={handleUploadHighlight}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.addHighlightGradient}
                >
                  <Icon name="add" size={32} />
                  <Text style={styles.addHighlightText}>Add More</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[commonStyles.heading, { fontSize: 18, marginBottom: spacing.lg }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActions}>
            <QuickActionCard
              icon="people"
              title="Discover"
              subtitle="Find musicians"
              onPress={() => router.push('/discover')}
              gradient={colors.gradientPrimary}
            />
            <QuickActionCard
              icon="briefcase"
              title="Projects"
              subtitle="Browse & create"
              onPress={() => router.push('/projects')}
              gradient={colors.gradientSecondary}
            />
            <QuickActionCard
              icon="heart"
              title="Matches"
              subtitle={`${stats.matches} connections`}
              onPress={() => router.push('/matches')}
              gradient={colors.gradientPrimary}
            />
            <QuickActionCard
              icon="settings"
              title="Settings"
              subtitle="Preferences"
              onPress={handleSettings}
              gradient={colors.gradientSecondary}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            text="Edit Profile"
            onPress={handleEditProfile}
            variant="gradient"
            size="lg"
            style={{ marginBottom: spacing.md }}
          />
          
          <Button
            text="View Collaborations"
            onPress={handleViewCollaborations}
            variant="outline"
            size="md"
            style={{ marginBottom: spacing.md }}
          />
          
          <Button
            text="Discover New Musicians"
            onPress={() => router.push('/discover')}
            variant="ghost"
            size="md"
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

interface StatCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  number: number;
  label: string;
  onPress: () => void;
  gradient: string[];
}

function StatCard({ icon, number, label, onPress, gradient }: StatCardProps) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradient}
        style={styles.statCardGradient}
      >
        <Icon name={icon} size={24} style={{ marginBottom: spacing.sm }} />
        <Text style={styles.statNumber}>{number}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

interface QuickActionCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  gradient: string[];
}

function QuickActionCard({ icon, title, subtitle, onPress, gradient }: QuickActionCardProps) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradient}
        style={styles.quickActionGradient}
      >
        <Icon name={icon} size={20} />
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

interface HighlightCardProps {
  highlight: any;
  delay: number;
}

function HighlightCard({ highlight, delay }: HighlightCardProps) {
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
    <Animated.View style={[styles.highlightCard, cardAnimatedStyle]}>
      <LinearGradient
        colors={colors.gradientSecondary}
        style={styles.highlightGradient}
      >
        <Icon 
          name={highlight.type === 'audio' ? 'musical-note' : highlight.type === 'video' ? 'videocam' : 'image'} 
          size={32} 
          style={{ marginBottom: spacing.sm }} 
        />
        <Text style={styles.highlightTitle}>{highlight.title}</Text>
        <Text style={styles.highlightType}>{highlight.type.toUpperCase()}</Text>
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
    paddingBottom: spacing.xl,
  },
  profileHeader: {
    marginVertical: spacing.lg,
  },
  profileHeaderGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  avatarText: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: colors.success,
    borderRadius: 15,
    padding: 3,
  },
  profileInfo: {
    alignItems: 'center',
  },
  incompleteProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  incompleteText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  statCardGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    opacity: 0.9,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyHighlights: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyHighlightsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  highlightsContainer: {
    gap: spacing.md,
  },
  highlightCard: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  highlightGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  highlightTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  highlightType: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    opacity: 0.8,
  },
  addHighlightCard: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  addHighlightGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  addHighlightText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginTop: spacing.xs,
  },
  quickActions: {
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
  actionButtons: {
    marginTop: spacing.lg,
  },
});
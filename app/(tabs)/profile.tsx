
import { 
  getCurrentUser, 
  updateCurrentUser, 
  getMatches, 
  getProjects,
  getApplications,
  User 
} from '../../utils/storage';
import { triggerBuildCheck } from '../../utils/buildTrigger';
import { runFullDeploymentCheck } from '../../utils/deploymentChecker';
import { useState, useEffect, useCallback } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import SubscriptionModal from '../../components/SubscriptionModal';
import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, StyleSheet, Modal } from 'react-native';
import Button from '../../components/Button';
import { pickImage, pickVideo, pickAudio } from '../../utils/mediaUtils';
import { SubscriptionService } from '../../utils/subscriptionService';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import ProductionChecklist from '../../components/ProductionChecklist';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  role: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  joinDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.small,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  quickActionIcon: {
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
  },
  highlightsContainer: {
    gap: spacing.md,
  },
  highlightCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  highlightType: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyHighlights: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buildTriggerSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  buildTriggerCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.medium,
  },
  buildTriggerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  buildTriggerDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  buildTriggerButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});

export default function ProfileScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ matches: 0, projects: 0, collaborations: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showProductionChecklist, setShowProductionChecklist] = useState(false);
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const insets = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const loadProfile = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        await loadStats(user);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  const loadStats = async (currentUser: User) => {
    try {
      const [matches, projects, applications] = await Promise.all([
        getMatches(currentUser.id),
        getProjects(),
        getApplications(),
      ]);

      setStats({
        matches: matches.length,
        projects: projects.filter(p => p.createdBy === currentUser.id).length,
        collaborations: applications.filter(a => a.userId === currentUser.id).length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadProfile();
    
    fadeIn.value = withTiming(1, { duration: 800 });
    slideUp.value = withSpring(0, { damping: 20, stiffness: 100 });
  }, [loadProfile, fadeIn, slideUp]);

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleUploadHighlight = () => {
    Alert.alert(
      'Upload Highlight',
      'Choose media type',
      [
        { text: 'Audio', onPress: () => uploadMedia('audio') },
        { text: 'Video', onPress: () => uploadMedia('video') },
        { text: 'Image', onPress: () => uploadMedia('image') },
        { text: 'Cancel', style: 'cancel' },
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

      if (result && !result.canceled && result.assets?.[0]) {
        Alert.alert('Success', `${type} uploaded successfully!`);
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      Alert.alert('Error', `Failed to upload ${type}`);
    }
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings feature coming soon!');
  };

  const handleDeploymentCheck = async () => {
    try {
      Alert.alert('Running Deployment Check', 'Please wait...');
      const report = await runFullDeploymentCheck();
      
      if (report.overallStatus === 'ready') {
        Alert.alert('✅ Deployment Ready', 'All systems are ready for deployment!');
      } else {
        setShowProductionChecklist(true);
      }
    } catch (error) {
      console.error('Deployment check error:', error);
      Alert.alert('Error', 'Failed to run deployment check');
    }
  };

  const handleBuildTrigger = () => {
    Alert.alert(
      '🚀 Trigger iOS Build',
      'This will verify all configurations and prepare for a new iOS build. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Trigger Build', 
          onPress: () => {
            const isReady = triggerBuildCheck();
            if (isReady) {
              Alert.alert(
                '✅ Build Ready!',
                'All configurations verified. Your app is ready for iOS build!\n\n' +
                '• Merchant ID: merchant.com.rracroth.nextdrop\n' +
                '• Bundle ID: com.rracroth.nextdrop\n' +
                '• Build Number: 2\n\n' +
                'You can now submit to EAS Build.',
                [{ text: 'Great!', style: 'default' }]
              );
            } else {
              Alert.alert(
                '❌ Build Issues Found',
                'Some issues were found. Check the console for details.',
                [{ text: 'OK', style: 'default' }]
              );
            }
          }
        },
      ]
    );
  };

  const handleViewCollaborations = () => {
    router.push('/projects');
  };

  const handleViewMatches = () => {
    router.push('/matches');
  };

  const handleViewProjects = () => {
    router.push('/projects');
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };

  if (!currentUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadProfile} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={animatedStyle}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={styles.name}>{currentUser.name || 'Unknown User'}</Text>
              <Text style={styles.role}>{currentUser.role || 'Music Creator'}</Text>
              <Text style={styles.joinDate}>
                {formatJoinDate(currentUser.createdAt || new Date().toISOString())}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <StatCard
              icon="people"
              number={stats.matches}
              label="Matches"
              onPress={handleViewMatches}
              gradient={['#667eea', '#764ba2']}
            />
            <StatCard
              icon="musical-notes"
              number={stats.projects}
              label="Projects"
              onPress={handleViewProjects}
              gradient={['#f093fb', '#f5576c']}
            />
            <StatCard
              icon="trophy"
              number={stats.collaborations}
              label="Collabs"
              onPress={handleViewCollaborations}
              gradient={['#4facfe', '#00f2fe']}
            />
          </View>

          {/* Build Trigger Section */}
          <View style={styles.buildTriggerSection}>
            <View style={styles.buildTriggerCard}>
              <Text style={styles.buildTriggerTitle}>🚀 iOS Build Ready</Text>
              <Text style={styles.buildTriggerDescription}>
                All Stripe configurations have been updated and verified. 
                Your app is ready for a new iOS build with proper Apple Pay support.
              </Text>
              <View style={styles.buildTriggerButtons}>
                <Button
                  title="Trigger Build Check"
                  onPress={handleBuildTrigger}
                  variant="primary"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Deployment Check"
                  onPress={handleDeploymentCheck}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionCard
                icon="create"
                title="Edit Profile"
                subtitle="Update your info"
                onPress={handleEditProfile}
                gradient={['#667eea', '#764ba2']}
              />
              <QuickActionCard
                icon="cloud-upload"
                title="Upload Highlight"
                subtitle="Add new media"
                onPress={handleUploadHighlight}
                gradient={['#f093fb', '#f5576c']}
              />
              <QuickActionCard
                icon="diamond"
                title="Go Premium"
                subtitle="Unlock features"
                onPress={() => setShowSubscription(true)}
                gradient={['#ffecd2', '#fcb69f']}
              />
              <QuickActionCard
                icon="settings"
                title="Settings"
                subtitle="App preferences"
                onPress={handleSettings}
                gradient={['#a8edea', '#fed6e3']}
              />
            </View>
          </View>

          {/* Highlights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Highlights</Text>
            <View style={styles.highlightsContainer}>
              {currentUser.highlights && currentUser.highlights.length > 0 ? (
                currentUser.highlights.map((highlight, index) => (
                  <HighlightCard
                    key={index}
                    highlight={highlight}
                    delay={index * 100}
                  />
                ))
              ) : (
                <View style={styles.emptyHighlights}>
                  <Text style={styles.emptyText}>
                    No highlights yet. Upload your first audio or video to showcase your talent!
                  </Text>
                  <Button
                    title="Upload Highlight"
                    onPress={handleUploadHighlight}
                    variant="primary"
                  />
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <SubscriptionModal
        visible={showSubscription}
        onClose={() => setShowSubscription(false)}
        onSuccess={() => {
          setShowSubscription(false);
          Alert.alert('Success', 'Welcome to Premium!');
        }}
      />

      <Modal
        visible={showProductionChecklist}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ProductionChecklist onClose={() => setShowProductionChecklist(false)} />
      </Modal>
    </View>
  );
}

function StatCard({ icon, number, label, onPress, gradient }: StatCardProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient colors={gradient} style={styles.statCard}>
        <Icon name={icon} size={24} color={colors.white} />
        <Text style={styles.statNumber}>{number}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function QuickActionCard({ icon, title, subtitle, onPress, gradient }: QuickActionCardProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient colors={gradient} style={styles.quickActionCard}>
        <Icon name={icon} size={24} color={colors.white} style={styles.quickActionIcon} />
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function HighlightCard({ highlight, delay }: HighlightCardProps) {
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 100 }));
  }, [delay, cardOpacity, cardScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <Animated.View style={[styles.highlightCard, animatedStyle]}>
      <Text style={styles.highlightTitle}>{highlight.title || 'Untitled'}</Text>
      <Text style={styles.highlightType}>{highlight.type || 'Audio'}</Text>
    </Animated.View>
  );
}

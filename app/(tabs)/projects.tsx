
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import CreateProjectModal from '../../components/CreateProjectModal';
import ProjectApplicationsModal from '../../components/ProjectApplicationsModal';
import DirectMessagesModal from '../../components/DirectMessagesModal';
import SubscriptionModal from '../../components/SubscriptionModal';
import ErrorBoundary from '../../components/ErrorBoundary';
import { SubscriptionService } from '../../utils/subscriptionService';
import { 
  getCurrentUser, 
  getProjects, 
  addProject, 
  getApplications,
  addApplication,
  generateId, 
  getCurrentTimestamp,
  User, 
  Project,
  Application 
} from '../../utils/storage';

interface ProjectWithApplications extends Project {
  applicationCount: number;
  hasApplied: boolean;
  isOwner: boolean;
}

interface ProjectCardProps {
  project: ProjectWithApplications;
  onApply: () => void;
  onView: () => void;
  onViewApplications?: () => void;
  formatTimeAgo: (timestamp: string) => string;
  delay: number;
}

export default function ProjectsScreen() {
  console.log('📋 ProjectsScreen rendering...');
  
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<ProjectWithApplications[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithApplications[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showDirectMessagesModal, setShowDirectMessagesModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithApplications | null>(null);
  const [filter, setFilter] = useState<'all' | 'my' | 'open'>('all');
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

  const loadProjects = useCallback(async () => {
    try {
      console.log('📋 Loading projects...');
      setLoading(true);
      setError(null);

      const [user, allProjects, applications] = await Promise.all([
        getCurrentUser(),
        getProjects(),
        getApplications()
      ]);

      if (!user) {
        console.log('❌ No current user found');
        setError('Please complete your profile first');
        return;
      }

      console.log('👤 Current user:', user.name);
      setCurrentUser(user);
      
      // Validate projects data
      const validProjects = Array.isArray(allProjects) ? allProjects.filter(project => 
        project && 
        typeof project === 'object' && 
        project.id && 
        project.title &&
        typeof project.id === 'string' &&
        typeof project.title === 'string'
      ) : [];

      // Validate applications data
      const validApplications = Array.isArray(applications) ? applications.filter(app => 
        app && 
        typeof app === 'object' && 
        app.id && 
        app.projectId &&
        typeof app.id === 'string' &&
        typeof app.projectId === 'string'
      ) : [];

      console.log(`📋 Valid projects: ${validProjects.length}, Valid applications: ${validApplications.length}`);
      
      const projectsWithApplications: ProjectWithApplications[] = validProjects.map(project => {
        try {
          const projectApplications = validApplications.filter(app => app.projectId === project.id);
          const hasApplied = projectApplications.some(app => app.applicantId === user.id);
          const isOwner = project.authorId === user.id || project.createdBy === user.id;
          
          return {
            ...project,
            applicationCount: projectApplications.length,
            hasApplied,
            isOwner
          };
        } catch (projectError) {
          console.error('❌ Error processing project:', project.id, projectError);
          return {
            ...project,
            applicationCount: 0,
            hasApplied: false,
            isOwner: false
          };
        }
      });

      console.log(`📋 Projects with applications: ${projectsWithApplications.length}`);
      setProjects(projectsWithApplications);
      
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      setError(`Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterProjects = useCallback(() => {
    try {
      if (!currentUser || !Array.isArray(projects)) {
        console.log('⚠️ Cannot filter projects: missing user or invalid projects data');
        setFilteredProjects([]);
        return;
      }

      let filtered = [...projects];
      
      switch (filter) {
        case 'my':
          filtered = projects.filter(project => 
            project.authorId === currentUser.id || project.createdBy === currentUser.id
          );
          break;
        case 'open':
          filtered = projects.filter(project => 
            project.status === 'open' && 
            project.authorId !== currentUser.id &&
            project.createdBy !== currentUser.id &&
            !project.hasApplied
          );
          break;
        default:
          // Show all projects
          break;
      }

      // Sort by creation date (newest first)
      filtered.sort((a, b) => {
        try {
          const dateA = new Date(a.createdAt || a.updatedAt || '').getTime();
          const dateB = new Date(b.createdAt || b.updatedAt || '').getTime();
          return dateB - dateA;
        } catch (sortError) {
          console.error('❌ Error sorting projects:', sortError);
          return 0;
        }
      });
      
      console.log(`📋 Filtered projects (${filter}): ${filtered.length}`);
      setFilteredProjects(filtered);
    } catch (error) {
      console.error('❌ Error filtering projects:', error);
      setFilteredProjects([]);
    }
  }, [projects, filter, currentUser]);

  useEffect(() => {
    console.log('🔄 useEffect: Initial load');
    loadProjects();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [loadProjects, fadeIn, slideUp]);

  useEffect(() => {
    console.log('🔄 useEffect: Filter projects');
    filterProjects();
  }, [projects, currentUser, filterProjects]);

  const onRefresh = useCallback(async () => {
    try {
      console.log('🔄 Refreshing projects');
      setRefreshing(true);
      setError(null);
      await loadProjects();
    } catch (error) {
      console.error('❌ Error refreshing:', error);
      setError('Failed to refresh. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [loadProjects]);

  const handleCreateProject = async () => {
    try {
      console.log('📋 Creating new project');
      
      // Check project posting limits
      const { canPost, reason } = await SubscriptionService.canPostProject();
      if (!canPost) {
        Alert.alert(
          'Project Limit Reached 📋',
          reason || 'You have reached your monthly project limit.',
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade to Premium', onPress: () => setShowSubscriptionModal(true) }
          ]
        );
        return;
      }
      
      setShowCreateModal(true);
    } catch (error) {
      console.error('❌ Error checking project limits:', error);
      setShowCreateModal(true); // Allow creation anyway
    }
  };

  const handleProjectCreated = async (projectData: Partial<Project>) => {
    try {
      if (!currentUser) {
        Alert.alert('Error', 'User not found. Please restart the app.');
        return;
      }

      console.log('📋 Creating project with data:', projectData);

      const newProject: Project = {
        id: generateId(),
        title: projectData.title || '',
        description: projectData.description || '',
        createdBy: currentUser.id,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        genres: projectData.genres || [],
        budget: projectData.budget || '',
        timeline: projectData.timeline || '',
        status: 'open',
        applicants: [],
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      };

      await addProject(newProject);
      
      // Increment project count for free users
      try {
        await SubscriptionService.incrementProjectCount();
      } catch (subscriptionError) {
        console.warn('⚠️ Failed to increment project count:', subscriptionError);
      }
      
      setShowCreateModal(false);
      await loadProjects();
      
      Alert.alert('Success! 🎉', 'Project created successfully!');
    } catch (error) {
      console.error('❌ Error creating project:', error);
      Alert.alert('Error', 'Failed to create project. Please try again.');
    }
  };

  const handleApplyToProject = async (project: ProjectWithApplications) => {
    try {
      if (!currentUser) {
        Alert.alert('Error', 'User not found. Please restart the app.');
        return;
      }

      console.log('📝 Applying to project:', project.title);

      Alert.prompt(
        'Apply to Project',
        'Tell the project owner why you\'re perfect for this collaboration:',
        async (message) => {
          if (message && message.trim()) {
            try {
              const application: Application = {
                id: generateId(),
                projectId: project.id,
                applicantId: currentUser.id,
                applicantName: currentUser.name,
                message: message.trim(),
                portfolio: currentUser.highlights || [],
                appliedAt: getCurrentTimestamp(),
                status: 'pending'
              };

              await addApplication(application);
              await loadProjects();
              
              Alert.alert('Success! 📝', 'Application submitted successfully!');
            } catch (applicationError) {
              console.error('❌ Error submitting application:', applicationError);
              Alert.alert('Error', 'Failed to submit application. Please try again.');
            }
          }
        },
        'plain-text',
        '',
        'default'
      );
    } catch (error) {
      console.error('❌ Error applying to project:', error);
      Alert.alert('Error', 'Failed to apply to project. Please try again.');
    }
  };

  const handleViewProject = (project: ProjectWithApplications) => {
    try {
      console.log('👁️ Viewing project:', project.title);
      
      if (project.isOwner && project.applicationCount > 0) {
        // If it's the owner's project and has applications, show applications modal
        setSelectedProject(project);
        setShowApplicationsModal(true);
      } else {
        // Otherwise show project details
        Alert.alert(
          project.title,
          `${project.description}\n\nBudget: ${project.budget}\nTimeline: ${project.timeline}\nApplications: ${project.applicationCount}`,
          [
            { text: 'Close', style: 'cancel' },
            ...(project.isOwner && project.applicationCount > 0 ? [
              { text: 'View Applications', onPress: () => {
                setSelectedProject(project);
                setShowApplicationsModal(true);
              }}
            ] : []),
            ...(!project.isOwner && !project.hasApplied && project.status === 'open' ? [
              { text: 'Apply', onPress: () => handleApplyToProject(project) }
            ] : [])
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error viewing project:', error);
      Alert.alert('Error', 'Failed to view project details.');
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `${diffInWeeks}w ago`;
    } catch (error) {
      console.error('❌ Error formatting time:', error);
      return 'Unknown';
    }
  };

  // Loading state
  if (loading) {
    return (
      <ErrorBoundary>
        <View style={[commonStyles.container, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={[commonStyles.centerContent, { flex: 1 }]}>
            <Icon name="folder-open" size={80} color={colors.primary} />
            <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
              Loading Projects
            </Text>
            <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
              Finding collaboration opportunities
            </Text>
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorBoundary>
        <View style={[commonStyles.container, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={[commonStyles.centerContent, { flex: 1 }]}>
            <Icon name="alert-circle" size={80} color={colors.error} />
            <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
              Oops! Something went wrong
            </Text>
            <Text style={[commonStyles.text, { marginTop: spacing.sm, marginBottom: spacing.xl, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
              {error}
            </Text>
            <Button
              text="Try Again"
              onPress={onRefresh}
              variant="gradient"
              size="lg"
              style={{ marginBottom: spacing.md }}
            />
            <Button
              text="Go to Profile"
              onPress={() => router.push('/(tabs)/profile')}
              variant="outline"
              size="md"
            />
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[commonStyles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        
        {/* Header */}
        <ErrorBoundary>
          <View style={styles.header}>
            <Text style={[commonStyles.title, { marginBottom: 0 }]}>
              Projects
            </Text>
            <View style={styles.headerActions}>
              <Button
                text="Messages"
                onPress={() => setShowDirectMessagesModal(true)}
                variant="outline"
                size="sm"
                icon={<Icon name="chatbubbles" size={16} color={colors.primary} />}
                style={{ marginRight: spacing.sm }}
              />
              <Button
                text="Create"
                onPress={handleCreateProject}
                variant="primary"
                size="sm"
                icon={<Icon name="add" size={20} color={colors.text} />}
              />
            </View>
          </View>
        </ErrorBoundary>

        {/* Filter Tabs */}
        <ErrorBoundary>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'open' && styles.filterTabActive]}
              onPress={() => setFilter('open')}
            >
              <Text style={[styles.filterText, filter === 'open' && styles.filterTextActive]}>
                Open
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'my' && styles.filterTabActive]}
              onPress={() => setFilter('my')}
            >
              <Text style={[styles.filterText, filter === 'my' && styles.filterTextActive]}>
                My Projects
              </Text>
            </TouchableOpacity>
          </View>
        </ErrorBoundary>

        <ScrollView
          contentContainerStyle={[commonStyles.content, { paddingTop: spacing.md }]}
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
          <ErrorBoundary>
            <Animated.View style={animatedStyle}>
              {filteredProjects.length === 0 ? (
                <View style={[commonStyles.card, styles.emptyState]}>
                  <Icon name="folder-open" size={48} color={colors.textMuted} />
                  <Text style={[commonStyles.text, { marginTop: spacing.md }]}>
                    {filter === 'my' ? 'No projects created yet' : 
                     filter === 'open' ? 'No open projects available' : 
                     'No projects found'}
                  </Text>
                  <Text style={[commonStyles.caption, { marginTop: spacing.xs }]}>
                    {filter === 'my' ? 'Create your first project to find collaborators' :
                     'Check back later for new collaboration opportunities'}
                  </Text>
                  {filter === 'my' && (
                    <Button
                      text="Create Project"
                      onPress={handleCreateProject}
                      variant="primary"
                      size="sm"
                      style={{ marginTop: spacing.lg }}
                    />
                  )}
                </View>
              ) : (
                filteredProjects.map((project, index) => (
                  <ErrorBoundary key={project.id}>
                    <ProjectCard
                      project={project}
                      onApply={() => handleApplyToProject(project)}
                      onView={() => handleViewProject(project)}
                      onViewApplications={() => {
                        setSelectedProject(project);
                        setShowApplicationsModal(true);
                      }}
                      formatTimeAgo={formatTimeAgo}
                      delay={index * 100}
                    />
                  </ErrorBoundary>
                ))
              )}
            </Animated.View>
          </ErrorBoundary>
        </ScrollView>

        {/* Modals */}
        <ErrorBoundary>
          <CreateProjectModal
            visible={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleProjectCreated}
            currentUser={currentUser}
          />

          <SubscriptionModal
            visible={showSubscriptionModal}
            onClose={() => setShowSubscriptionModal(false)}
            onSuccess={() => {
              setShowSubscriptionModal(false);
              Alert.alert('Welcome to Premium! 🎉', 'You now have unlimited project postings and likes!');
            }}
          />

          {selectedProject && (
            <ProjectApplicationsModal
              visible={showApplicationsModal}
              onClose={() => {
                setShowApplicationsModal(false);
                setSelectedProject(null);
              }}
              project={selectedProject}
            />
          )}

          <DirectMessagesModal
            visible={showDirectMessagesModal}
            onClose={() => setShowDirectMessagesModal(false)}
          />
        </ErrorBoundary>
      </View>
    </ErrorBoundary>
  );
}

function ProjectCard({ project, onApply, onView, onViewApplications, formatTimeAgo, delay }: ProjectCardProps) {
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

  const getStatusColor = () => {
    try {
      switch (project.status) {
        case 'open': return colors.success;
        case 'in_progress': return colors.warning;
        case 'completed': return colors.primary;
        case 'cancelled': return colors.error;
        default: return colors.textMuted;
      }
    } catch (error) {
      console.error('❌ Error getting status color:', error);
      return colors.textMuted;
    }
  };

  return (
    <ErrorBoundary>
      <Animated.View style={cardAnimatedStyle}>
        <TouchableOpacity style={styles.projectCard} onPress={onView}>
          <View style={styles.projectHeader}>
            <View style={styles.projectInfo}>
              <Text style={styles.projectTitle} numberOfLines={2}>
                {project.title || 'Untitled Project'}
              </Text>
              <Text style={styles.projectAuthor}>
                by {project.authorName || 'Unknown'} • {project.authorRole || 'Unknown'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>
                {(project.status || 'unknown').replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.projectDescription} numberOfLines={3}>
            {project.description || 'No description available'}
          </Text>

          <View style={styles.projectGenres}>
            {(project.genres || []).slice(0, 3).map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
            {(project.genres || []).length > 3 && (
              <Text style={styles.moreGenres}>+{(project.genres || []).length - 3}</Text>
            )}
          </View>

          <View style={styles.projectFooter}>
            <View style={styles.projectMeta}>
              <Text style={styles.projectBudget}>{project.budget || 'Budget not specified'}</Text>
              <Text style={styles.projectTimeline}>{project.timeline || 'Timeline not specified'}</Text>
            </View>
            <View style={styles.projectActions}>
              <Text style={styles.applicationCount}>
                {project.applicationCount || 0} applications
              </Text>
              <Text style={styles.projectTime}>
                {formatTimeAgo(project.createdAt || project.updatedAt || '')}
              </Text>
            </View>
          </View>

          {!project.isOwner && !project.hasApplied && project.status === 'open' && (
            <Button
              text="Apply"
              onPress={(e) => {
                e?.stopPropagation?.();
                onApply();
              }}
              variant="primary"
              size="sm"
              style={{ marginTop: spacing.md }}
            />
          )}

          {project.hasApplied && (
            <View style={styles.appliedBadge}>
              <Icon name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.appliedText}>Applied</Text>
            </View>
          )}

          {project.isOwner && project.applicationCount > 0 && onViewApplications && (
            <Button
              text={`View ${project.applicationCount} Application${project.applicationCount !== 1 ? 's' : ''}`}
              onPress={(e) => {
                e?.stopPropagation?.();
                onViewApplications();
              }}
              variant="outline"
              size="sm"
              style={{ marginTop: spacing.md }}
              icon={<Icon name="people" size={16} color={colors.primary} />}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  projectCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  projectInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  projectTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  projectAuthor: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  projectDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  projectGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  genreTag: {
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  genreText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  moreGenres: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  projectMeta: {
    flex: 1,
  },
  projectBudget: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.success,
    marginBottom: spacing.xs,
  },
  projectTimeline: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  projectActions: {
    alignItems: 'flex-end',
  },
  applicationCount: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  projectTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  appliedText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.success,
    marginLeft: spacing.xs,
  },
});

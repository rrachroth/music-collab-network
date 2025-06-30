import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import CreateProjectModal from '../../components/CreateProjectModal';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import Icon from '../../components/Icon';
import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import Button from '../../components/Button';

interface ProjectWithApplications extends Project {
  applicationCount: number;
  hasApplied: boolean;
  isOwner: boolean;
}

interface ProjectCardProps {
  project: ProjectWithApplications;
  onApply: () => void;
  onView: () => void;
  formatTimeAgo: (timestamp: string) => string;
  delay: number;
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<ProjectWithApplications[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithApplications[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
      const [user, allProjects, applications] = await Promise.all([
        getCurrentUser(),
        getProjects(),
        getApplications()
      ]);

      if (user) {
        setCurrentUser(user);
        
        const projectsWithApplications: ProjectWithApplications[] = allProjects.map(project => {
          const projectApplications = applications.filter(app => app.projectId === project.id);
          const hasApplied = projectApplications.some(app => app.applicantId === user.id);
          const isOwner = project.authorId === user.id;
          
          return {
            ...project,
            applicationCount: projectApplications.length,
            hasApplied,
            isOwner
          };
        });

        setProjects(projectsWithApplications);
      }
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects');
    }
  }, []);

  const filterProjects = useCallback(() => {
    if (!currentUser) return;

    let filtered = [...projects];
    
    switch (filter) {
      case 'my':
        filtered = projects.filter(project => project.authorId === currentUser.id);
        break;
      case 'open':
        filtered = projects.filter(project => 
          project.status === 'open' && 
          project.authorId !== currentUser.id &&
          !project.hasApplied
        );
        break;
      default:
        // Show all projects
        break;
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setFilteredProjects(filtered);
  }, [projects, filter, currentUser]);

  useEffect(() => {
    loadProjects();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [loadProjects, fadeIn, slideUp]);

  useEffect(() => {
    filterProjects();
  }, [filterProjects]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, [loadProjects]);

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleProjectCreated = async (projectData: Partial<Project>) => {
    try {
      if (!currentUser) return;

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
      setShowCreateModal(false);
      await loadProjects();
      
      Alert.alert('Success', 'Project created successfully!');
    } catch (error) {
      console.error('❌ Error creating project:', error);
      Alert.alert('Error', 'Failed to create project');
    }
  };

  const handleApplyToProject = async (project: ProjectWithApplications) => {
    try {
      if (!currentUser) return;

      Alert.prompt(
        'Apply to Project',
        'Tell the project owner why you\'re perfect for this collaboration:',
        async (message) => {
          if (message && message.trim()) {
            const application: Application = {
              id: generateId(),
              projectId: project.id,
              applicantId: currentUser.id,
              applicantName: currentUser.name,
              message: message.trim(),
              portfolio: currentUser.highlights,
              appliedAt: getCurrentTimestamp(),
              status: 'pending'
            };

            await addApplication(application);
            await loadProjects();
            
            Alert.alert('Success', 'Application submitted successfully!');
          }
        },
        'plain-text',
        '',
        'default'
      );
    } catch (error) {
      console.error('❌ Error applying to project:', error);
      Alert.alert('Error', 'Failed to submit application');
    }
  };

  const handleViewProject = (project: ProjectWithApplications) => {
    Alert.alert(
      project.title,
      `${project.description}\n\nBudget: ${project.budget}\nTimeline: ${project.timeline}\nApplications: ${project.applicationCount}`,
      [
        { text: 'Close', style: 'cancel' },
        ...(project.isOwner ? [
          { text: 'View Applications', onPress: () => console.log('View applications') }
        ] : []),
        ...(!project.isOwner && !project.hasApplied && project.status === 'open' ? [
          { text: 'Apply', onPress: () => handleApplyToProject(project) }
        ] : [])
      ]
    );
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[commonStyles.title, { marginBottom: 0 }]}>
          Projects
        </Text>
        <Button
          text="Create"
          onPress={handleCreateProject}
          variant="primary"
          size="sm"
          icon={<Icon name="add" size={20} color={colors.text} />}
        />
      </View>

      {/* Filter Tabs */}
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
              <ProjectCard
                key={project.id}
                project={project}
                onApply={() => handleApplyToProject(project)}
                onView={() => handleViewProject(project)}
                formatTimeAgo={formatTimeAgo}
                delay={index * 100}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>

      <CreateProjectModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleProjectCreated}
        currentUser={currentUser}
      />
    </View>
  );
}

function ProjectCard({ project, onApply, onView, formatTimeAgo, delay }: ProjectCardProps) {
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
    switch (project.status) {
      case 'open': return colors.success;
      case 'in_progress': return colors.warning;
      case 'completed': return colors.primary;
      case 'cancelled': return colors.error;
      default: return colors.textMuted;
    }
  };

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity style={styles.projectCard} onPress={onView}>
        <View style={styles.projectHeader}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle} numberOfLines={2}>
              {project.title}
            </Text>
            <Text style={styles.projectAuthor}>
              by {project.authorName} • {project.authorRole}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>
              {project.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.projectDescription} numberOfLines={3}>
          {project.description}
        </Text>

        <View style={styles.projectGenres}>
          {project.genres.slice(0, 3).map((genre, index) => (
            <View key={index} style={styles.genreTag}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          ))}
          {project.genres.length > 3 && (
            <Text style={styles.moreGenres}>+{project.genres.length - 3}</Text>
          )}
        </View>

        <View style={styles.projectFooter}>
          <View style={styles.projectMeta}>
            <Text style={styles.projectBudget}>{project.budget}</Text>
            <Text style={styles.projectTimeline}>{project.timeline}</Text>
          </View>
          <View style={styles.projectActions}>
            <Text style={styles.applicationCount}>
              {project.applicationCount} applications
            </Text>
            <Text style={styles.projectTime}>
              {formatTimeAgo(project.createdAt)}
            </Text>
          </View>
        </View>

        {!project.isOwner && !project.hasApplied && project.status === 'open' && (
          <Button
            text="Apply"
            onPress={(e) => {
              e.stopPropagation();
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
      </TouchableOpacity>
    </Animated.View>
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
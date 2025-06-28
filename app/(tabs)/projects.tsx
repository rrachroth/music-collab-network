import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, StyleSheet } from 'react-native';
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
import CreateProjectModal from '../../components/CreateProjectModal';
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
  formatTimeAgo: (timestamp: string) => string;
  delay: number;
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectWithApplications[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithApplications[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'my_projects'>('all');

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const loadProjects = useCallback(async () => {
    try {
      console.log('📋 Loading projects...');
      const [currentUser, allProjects, applications] = await Promise.all([
        getCurrentUser(),
        getProjects(),
        getApplications()
      ]);
      
      if (currentUser) {
        setUser(currentUser);
        
        const projectsWithApplications: ProjectWithApplications[] = allProjects.map(project => {
          const projectApplications = applications.filter(app => app.projectId === project.id);
          const hasApplied = projectApplications.some(app => app.applicantId === currentUser.id);
          const isOwner = project.createdBy === currentUser.id;
          
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
    } finally {
      setLoading(false);
    }
  }, []);

  const filterProjects = useCallback(() => {
    let filtered = projects;
    
    switch (filter) {
      case 'open':
        filtered = projects.filter(p => p.status === 'open');
        break;
      case 'my_projects':
        filtered = projects.filter(p => p.isOwner);
        break;
      default:
        filtered = projects;
    }
    
    setFilteredProjects(filtered);
  }, [projects, filter]);

  useEffect(() => {
    loadProjects();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 800 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [loadProjects, fadeIn, slideUp]);

  useEffect(() => {
    filterProjects();
  }, [filterProjects]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, [loadProjects]);

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleProjectCreated = async (projectData: Partial<Project>) => {
    if (!user) return;
    
    try {
      const newProject: Project = {
        id: generateId(),
        title: projectData.title || '',
        description: projectData.description || '',
        createdBy: user.id,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
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
      Alert.alert('Error', 'Failed to create project. Please try again.');
    }
  };

  const handleApplyToProject = async (project: ProjectWithApplications) => {
    if (!user) return;
    
    if (project.hasApplied) {
      Alert.alert('Already Applied', 'You have already applied to this project.');
      return;
    }
    
    if (project.isOwner) {
      Alert.alert('Own Project', 'You cannot apply to your own project.');
      return;
    }
    
    Alert.prompt(
      'Apply to Project',
      'Tell the project owner why you\'re interested and what you can bring to this collaboration:',
      async (message) => {
        if (message && message.trim()) {
          try {
            const application: Application = {
              id: generateId(),
              projectId: project.id,
              applicantId: user.id,
              applicantName: user.name,
              message: message.trim(),
              portfolio: user.highlights || [],
              appliedAt: getCurrentTimestamp(),
              status: 'pending'
            };
            
            await addApplication(application);
            await loadProjects();
            
            Alert.alert('Success', 'Application submitted successfully!');
          } catch (error) {
            console.error('❌ Error applying to project:', error);
            Alert.alert('Error', 'Failed to submit application. Please try again.');
          }
        }
      },
      'plain-text',
      '',
      'I\'m interested in collaborating on this project because...'
    );
  };

  const handleViewProject = (project: ProjectWithApplications) => {
    Alert.alert(
      project.title,
      `${project.description}\n\nBudget: ${project.budget}\nTimeline: ${project.timeline}\nApplications: ${project.applicationCount}`,
      [
        { text: 'Close', style: 'cancel' },
        ...(project.isOwner ? [{ text: 'View Applications', onPress: () => {} }] : []),
        ...(!project.isOwner && !project.hasApplied && project.status === 'open' ? [{ text: 'Apply', onPress: () => handleApplyToProject(project) }] : [])
      ]
    );
  };

  const formatTimeAgo = (timestamp: string): string => {
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInDays > 0) {
        return `${diffInDays}d ago`;
      } else if (diffInHours > 0) {
        return `${diffInHours}h ago`;
      } else {
        return 'Just now';
      }
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
        <Icon name="folder" size={80} />
        <Text style={[commonStyles.caption, { marginTop: 16 }]}>
          Loading projects...
        </Text>
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[commonStyles.title, { textAlign: 'left', marginBottom: 0 }]}>
          Projects
        </Text>
        <Button
          text="Create"
          onPress={handleCreateProject}
          variant="gradient"
          size="sm"
          icon={<Icon name="add" size={16} color={colors.text} />}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All Projects
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
          style={[styles.filterTab, filter === 'my_projects' && styles.filterTabActive]}
          onPress={() => setFilter('my_projects')}
        >
          <Text style={[styles.filterText, filter === 'my_projects' && styles.filterTextActive]}>
            My Projects
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={commonStyles.wrapper}
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
          {filteredProjects.length > 0 ? (
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
          ) : (
            <View style={styles.emptyState}>
              <Icon name="folder-open" size={80} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'my_projects' 
                  ? 'You haven\'t created any projects yet'
                  : 'No projects match your current filter'
                }
              </Text>
              {filter === 'my_projects' && (
                <Button
                  text="Create Your First Project"
                  onPress={handleCreateProject}
                  variant="gradient"
                  size="lg"
                  style={{ marginTop: spacing.lg }}
                />
              )}
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: spacing.xxl }} />
        </Animated.View>
      </ScrollView>

      {/* Create Project Modal */}
      <CreateProjectModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleProjectCreated}
        currentUser={user}
      />
    </View>
  );
}

function ProjectCard({ project, onApply, onView, formatTimeAgo, delay }: ProjectCardProps) {
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

  const getStatusColor = () => {
    switch (project.status) {
      case 'open':
        return colors.success;
      case 'in_progress':
        return colors.warning;
      case 'completed':
        return colors.primary;
      default:
        return colors.textMuted;
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity style={styles.projectCard} onPress={onView} activeOpacity={0.8}>
        <View style={styles.projectHeader}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>{project.title}</Text>
            <Text style={styles.projectAuthor}>by {project.authorName}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{project.status}</Text>
          </View>
        </View>

        <Text style={styles.projectDescription} numberOfLines={3}>
          {project.description}
        </Text>

        <View style={styles.projectGenres}>
          {project.genres.slice(0, 3).map((genre, index) => (
            <View key={index} style={styles.genreChip}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          ))}
          {project.genres.length > 3 && (
            <Text style={styles.moreGenres}>+{project.genres.length - 3} more</Text>
          )}
        </View>

        <View style={styles.projectFooter}>
          <View style={styles.projectMeta}>
            <Text style={styles.metaText}>
              <Icon name="time" size={12} color={colors.textMuted} />
              {' '}{formatTimeAgo(project.createdAt)}
            </Text>
            <Text style={styles.metaText}>
              <Icon name="people" size={12} color={colors.textMuted} />
              {' '}{project.applicationCount} applications
            </Text>
          </View>

          <View style={styles.projectActions}>
            {project.isOwner ? (
              <Text style={styles.ownerLabel}>Your Project</Text>
            ) : project.hasApplied ? (
              <Text style={styles.appliedLabel}>Applied</Text>
            ) : project.status === 'open' ? (
              <Button
                text="Apply"
                onPress={onApply}
                variant="primary"
                size="sm"
              />
            ) : null}
          </View>
        </View>
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
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
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
    fontFamily: 'Inter_600SemiBold',
  },
  projectCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  projectInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  projectTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
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
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    textTransform: 'capitalize',
  },
  projectDescription: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  projectGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  genreChip: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  genreText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
  },
  moreGenres: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectMeta: {
    flex: 1,
    gap: spacing.sm,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectActions: {
    alignItems: 'flex-end',
  },
  ownerLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
  },
  appliedLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.success,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
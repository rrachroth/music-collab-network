import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, StyleSheet } from 'react-native';
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectWithApplications[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my' | 'applied'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const loadProjects = useCallback(async () => {
    try {
      console.log('📋 Loading projects...');
      setLoading(true);
      
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please complete your profile first.', [
          { text: 'Setup Profile', onPress: () => router.replace('/onboarding') }
        ]);
        return;
      }
      
      setCurrentUser(user);
      
      const [allProjects, applications] = await Promise.all([
        getProjects(),
        getApplications(),
      ]);
      
      // Enrich projects with application data
      const enrichedProjects: ProjectWithApplications[] = allProjects.map(project => {
        const projectApplications = applications.filter(app => app.projectId === project.id);
        const hasApplied = projectApplications.some(app => app.applicantId === user.id);
        const isOwner = project.createdBy === user.id;
        
        return {
          ...project,
          applicationCount: projectApplications.length,
          hasApplied,
          isOwner,
        };
      });
      
      // Sort by most recent
      enrichedProjects.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setProjects(enrichedProjects);
      console.log(`✅ Loaded ${enrichedProjects.length} projects`);
      
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterProjects = useCallback(() => {
    if (!currentUser) return;
    
    let filtered = projects;
    
    switch (filter) {
      case 'my':
        filtered = projects.filter(p => p.isOwner);
        break;
      case 'applied':
        filtered = projects.filter(p => p.hasApplied);
        break;
      default:
        filtered = projects.filter(p => !p.isOwner); // Show all except own projects
    }
    
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleCreateProject = () => {
    console.log('📝 Creating new project');
    setShowCreateModal(true);
  };

  const handleProjectCreated = async (projectData: Partial<Project>) => {
    if (!currentUser) return;
    
    try {
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
      Alert.alert('Error', 'Failed to create project. Please try again.');
    }
  };

  const handleApplyToProject = async (project: ProjectWithApplications) => {
    if (!currentUser) return;
    
    try {
      const application: Application = {
        id: generateId(),
        projectId: project.id,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        message: `Hi! I'm interested in collaborating on "${project.title}". I'm a ${currentUser.role} with experience in ${currentUser.genres.join(', ')}.`,
        portfolio: currentUser.highlights,
        appliedAt: getCurrentTimestamp(),
        status: 'pending',
      };
      
      await addApplication(application);
      await loadProjects();
      
      Alert.alert('Success', 'Application submitted successfully!');
    } catch (error) {
      console.error('❌ Error applying to project:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    }
  };

  const handleViewProject = (project: ProjectWithApplications) => {
    console.log(`👁️ Viewing project: ${project.title}`);
    // TODO: Navigate to project detail view
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
        <Icon name="briefcase" size={80} color={colors.primary} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Loading Projects
        </Text>
        <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
          Finding collaboration opportunities
        </Text>
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
          Projects
        </Text>
        
        <TouchableOpacity onPress={handleCreateProject} style={styles.headerButton}>
          <Icon name="add" size={24} />
        </TouchableOpacity>
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
          style={[styles.filterTab, filter === 'my' && styles.filterTabActive]}
          onPress={() => setFilter('my')}
        >
          <Text style={[styles.filterText, filter === 'my' && styles.filterTextActive]}>
            My Projects
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'applied' && styles.filterTabActive]}
          onPress={() => setFilter('applied')}
        >
          <Text style={[styles.filterText, filter === 'applied' && styles.filterTextActive]}>
            Applied
          </Text>
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
        {filteredProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="briefcase-outline" size={80} color={colors.textMuted} />
            <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
              {filter === 'my' ? 'No Projects Created' : 
               filter === 'applied' ? 'No Applications' : 'No Projects Available'}
            </Text>
            <Text style={[commonStyles.text, { marginTop: spacing.sm, marginBottom: spacing.xl }]}>
              {filter === 'my' ? 'Create your first project to start collaborating' :
               filter === 'applied' ? 'Apply to projects to see them here' :
               'Check back later for new collaboration opportunities'}
            </Text>
            {filter === 'my' && (
              <Button
                text="Create Project"
                onPress={handleCreateProject}
                variant="gradient"
                size="lg"
              />
            )}
          </View>
        ) : (
          <View style={styles.projectsList}>
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                onApply={() => handleApplyToProject(project)}
                onView={() => handleViewProject(project)}
                formatTimeAgo={formatTimeAgo}
                delay={index * 100}
              />
            ))}
          </View>
        )}

        {/* Create Project CTA */}
        {filter === 'all' && (
          <View style={styles.ctaContainer}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.ctaGradient}
            >
              <View style={styles.ctaContent}>
                <Icon name="add-circle" size={48} color={colors.text} />
                <Text style={styles.ctaTitle}>Have a Project Idea?</Text>
                <Text style={styles.ctaDescription}>
                  Create a project and find the perfect collaborators
                </Text>
                <Button
                  text="Create Project"
                  onPress={handleCreateProject}
                  variant="secondary"
                  size="lg"
                  style={{ marginTop: spacing.lg }}
                />
              </View>
            </LinearGradient>
          </View>
        )}
      </Animated.ScrollView>

      {/* Create Project Modal */}
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
      <TouchableOpacity style={styles.projectCard} onPress={onView} activeOpacity={0.8}>
        <LinearGradient
          colors={project.isOwner ? colors.gradientPrimary : colors.gradientSecondary}
          style={styles.projectGradient}
        >
          <View style={styles.projectContent}>
            {/* Header */}
            <View style={styles.projectHeader}>
              <View style={styles.projectTitleContainer}>
                <Text style={styles.projectTitle} numberOfLines={2}>
                  {project.title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                  <Text style={styles.statusText}>
                    {project.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.projectTime}>
                {formatTimeAgo(project.createdAt)}
              </Text>
            </View>

            {/* Author */}
            <View style={styles.authorContainer}>
              <View style={styles.authorAvatar}>
                <Text style={styles.authorInitial}>
                  {project.authorName.charAt(0)}
                </Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{project.authorName}</Text>
                <Text style={styles.authorRole}>{project.authorRole}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.projectDescription} numberOfLines={3}>
              {project.description}
            </Text>

            {/* Genres */}
            <View style={styles.genresContainer}>
              {project.genres.slice(0, 3).map(genre => (
                <View key={genre} style={styles.genreChip}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
              {project.genres.length > 3 && (
                <Text style={styles.moreGenres}>
                  +{project.genres.length - 3}
                </Text>
              )}
            </View>

            {/* Project Details */}
            <View style={styles.projectDetails}>
              <View style={styles.detailItem}>
                <Icon name="cash" size={16} color={colors.textMuted} />
                <Text style={styles.detailText}>{project.budget}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="time" size={16} color={colors.textMuted} />
                <Text style={styles.detailText}>{project.timeline}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="people" size={16} color={colors.textMuted} />
                <Text style={styles.detailText}>
                  {project.applicationCount} applicant{project.applicationCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.projectActions}>
              <Button
                text="View Details"
                onPress={onView}
                variant="outline"
                size="sm"
                style={{ flex: 1 }}
              />
              
              {!project.isOwner && !project.hasApplied && project.status === 'open' && (
                <Button
                  text="Apply"
                  onPress={onApply}
                  variant="primary"
                  size="sm"
                  style={{ flex: 1, marginLeft: spacing.sm }}
                />
              )}
              
              {project.hasApplied && (
                <View style={styles.appliedBadge}>
                  <Icon name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.appliedText}>Applied</Text>
                </View>
              )}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  projectsList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  projectCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  projectGradient: {
    padding: 2,
  },
  projectContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg - 2,
    padding: spacing.lg,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  projectTitleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  projectTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
  },
  projectTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  authorInitial: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  authorRole: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  projectDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  genresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
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
  projectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  appliedText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.success,
    marginLeft: spacing.xs,
  },
  ctaContainer: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  ctaGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  ctaContent: {
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
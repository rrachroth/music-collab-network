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
      
      // Sort by creation date (newest first)
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
    
    let filtered = [...projects];
    
    switch (filter) {
      case 'my':
        filtered = projects.filter(p => p.isOwner);
        break;
      case 'applied':
        filtered = projects.filter(p => p.hasApplied);
        break;
      default:
        // Show all projects except user's own
        filtered = projects.filter(p => !p.isOwner);
        break;
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
    setShowCreateModal(true);
  };

  const handleProjectCreated = async (projectData: Partial<Project>) => {
    if (!currentUser) return;
    
    try {
      const newProject: Project = {
        id: generateId(),
        title: projectData.title!,
        description: projectData.description!,
        genres: projectData.genres!,
        budget: projectData.budget || '',
        timeline: projectData.timeline || '',
        status: 'open',
        createdBy: currentUser.id,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      };
      
      await addProject(newProject);
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
        message: `Hi! I'm interested in collaborating on "${project.title}". I think my skills as a ${currentUser.role} would be a great fit for this project.`,
        status: 'pending',
        appliedAt: getCurrentTimestamp(),
      };
      
      await addApplication(application);
      await loadProjects();
      
      Alert.alert('Application Sent', 'Your application has been sent to the project owner!');
    } catch (error) {
      console.error('❌ Error applying to project:', error);
      Alert.alert('Error', 'Failed to apply to project. Please try again.');
    }
  };

  const handleViewProject = (project: ProjectWithApplications) => {
    console.log('👁️ Viewing project:', project.title);
    // TODO: Navigate to project detail view
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
        <Icon name="briefcase" size={80} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Loading Projects...
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
        colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
        
        <Text style={[commonStyles.heading, { flex: 1, textAlign: 'center' }]}>
          Projects ({filteredProjects.length})
        </Text>
        
        <TouchableOpacity onPress={handleCreateProject} style={styles.headerButton}>
          <Icon name="add" size={24} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.activeFilterTabText]}>
            All Projects
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'my' && styles.activeFilterTab]}
          onPress={() => setFilter('my')}
        >
          <Text style={[styles.filterTabText, filter === 'my' && styles.activeFilterTabText]}>
            My Projects
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'applied' && styles.activeFilterTab]}
          onPress={() => setFilter('applied')}
        >
          <Text style={[styles.filterTabText, filter === 'applied' && styles.activeFilterTabText]}>
            Applied
          </Text>
        </TouchableOpacity>
      </View>

      {filteredProjects.length === 0 ? (
        <Animated.View style={[commonStyles.centerContent, { flex: 1 }, animatedStyle]}>
          <LinearGradient
            colors={colors.gradientSecondary}
            style={styles.emptyIcon}
          >
            <Icon name="briefcase-outline" size={60} />
          </LinearGradient>
          
          <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
            {filter === 'my' ? 'No Projects Created' : 
             filter === 'applied' ? 'No Applications Yet' : 
             'No Projects Available'}
          </Text>
          
          <Text style={[commonStyles.text, { marginBottom: spacing.xl, textAlign: 'center' }]}>
            {filter === 'my' ? 'Create your first project to find collaborators!' :
             filter === 'applied' ? 'Start applying to projects that interest you!' :
             'Check back later for new collaboration opportunities!'}
          </Text>
          
          <Button
            text={filter === 'my' ? 'Create Project' : 'View All Projects'}
            onPress={filter === 'my' ? handleCreateProject : () => setFilter('all')}
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
              <Icon name="briefcase" size={32} />
              <Text style={styles.statNumber}>{projects.filter(p => p.isOwner).length}</Text>
              <Text style={styles.statLabel}>My Projects</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={colors.gradientSecondary}
              style={styles.statCard}
            >
              <Icon name="document" size={32} />
              <Text style={styles.statNumber}>{projects.filter(p => p.hasApplied).length}</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </LinearGradient>
          </View>

          {/* Projects List */}
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

          {/* Create Project CTA */}
          {filter === 'all' && (
            <View style={styles.ctaSection}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                style={styles.ctaContainer}
              >
                <Icon name="add-circle" size={48} color={colors.primary} />
                <Text style={[commonStyles.heading, { textAlign: 'center', marginTop: spacing.md }]}>
                  Have a Project Idea?
                </Text>
                <Text style={[commonStyles.text, { marginVertical: spacing.md, textAlign: 'center' }]}>
                  Create a project and find talented musicians to collaborate with
                </Text>
                <Button
                  text="Create New Project"
                  onPress={handleCreateProject}
                  variant="gradient"
                  size="lg"
                />
              </LinearGradient>
            </View>
          )}
        </Animated.ScrollView>
      )}

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
      case 'open':
        return colors.success;
      case 'in-progress':
        return colors.warning;
      case 'completed':
        return colors.primary;
      case 'closed':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity style={styles.projectCard} onPress={onView} activeOpacity={0.8}>
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.projectCardGradient}
        >
          <View style={styles.projectCardContent}>
            {/* Project Header */}
            <View style={styles.projectHeader}>
              <View style={styles.projectTitleRow}>
                <Text style={styles.projectTitle} numberOfLines={2}>
                  {project.title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                  <Text style={styles.statusText}>{project.status}</Text>
                </View>
              </View>
              
              <Text style={styles.projectTime}>
                {formatTimeAgo(project.createdAt)}
              </Text>
            </View>

            {/* Project Description */}
            <Text style={styles.projectDescription} numberOfLines={3}>
              {project.description}
            </Text>

            {/* Genres */}
            <View style={styles.projectGenres}>
              {project.genres.slice(0, 3).map(genre => (
                <View key={genre} style={styles.genreChip}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
              {project.genres.length > 3 && (
                <View style={styles.genreChip}>
                  <Text style={styles.genreText}>+{project.genres.length - 3}</Text>
                </View>
              )}
            </View>

            {/* Project Details */}
            <View style={styles.projectDetails}>
              {project.budget && (
                <View style={styles.detailItem}>
                  <Icon name="card" size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>{project.budget}</Text>
                </View>
              )}
              
              {project.timeline && (
                <View style={styles.detailItem}>
                  <Icon name="time" size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>{project.timeline}</Text>
                </View>
              )}
              
              <View style={styles.detailItem}>
                <Icon name="people" size={16} color={colors.textMuted} />
                <Text style={styles.detailText}>
                  {project.applicationCount} applicant{project.applicationCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.projectActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={onView}
              >
                <Icon name="eye" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>
              
              {!project.isOwner && !project.hasApplied && project.status === 'open' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.applyButton]}
                  onPress={onApply}
                >
                  <Icon name="send" size={20} color={colors.text} />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>Apply</Text>
                </TouchableOpacity>
              )}
              
              {project.hasApplied && (
                <View style={[styles.actionButton, styles.appliedButton]}>
                  <Icon name="checkmark" size={20} color={colors.success} />
                  <Text style={[styles.actionButtonText, { color: colors.success }]}>Applied</Text>
                </View>
              )}
              
              {project.isOwner && (
                <View style={[styles.actionButton, styles.ownerButton]}>
                  <Icon name="person" size={20} color={colors.warning} />
                  <Text style={[styles.actionButtonText, { color: colors.warning }]}>Owner</Text>
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
  activeFilterTab: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  activeFilterTabText: {
    color: colors.text,
    fontWeight: 'bold',
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
  projectsList: {
    marginBottom: spacing.xl,
  },
  projectCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  projectCardGradient: {
    padding: 2,
  },
  projectCardContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg - 2,
    padding: spacing.lg,
  },
  projectHeader: {
    marginBottom: spacing.md,
  },
  projectTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  projectTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    textTransform: 'capitalize',
  },
  projectTime: {
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
  projectGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
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
  projectDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  projectActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundAlt,
    gap: spacing.xs,
  },
  applyButton: {
    backgroundColor: colors.primary,
  },
  appliedButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.success,
  },
  ownerButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
  },
  ctaSection: {
    marginTop: spacing.xl,
  },
  ctaContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});
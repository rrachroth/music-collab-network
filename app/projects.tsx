import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, StyleSheet } from 'react-native';
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
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';
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
} from '../utils/storage';
import CreateProjectModal from '../components/CreateProjectModal';

interface ProjectWithApplications extends Project {
  applicationCount: number;
  hasApplied: boolean;
  isOwner: boolean;
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectWithApplications[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const filters = [
    { id: 'all', name: 'All Projects', icon: 'list' },
    { id: 'vocals', name: 'Vocals', icon: 'mic' },
    { id: 'production', name: 'Production', icon: 'musical-notes' },
    { id: 'mixing', name: 'Mixing', icon: 'settings' },
    { id: 'my-projects', name: 'My Projects', icon: 'person' },
  ];

  useEffect(() => {
    loadProjects();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, filter]);

  const loadProjects = async () => {
    try {
      console.log('📋 Loading projects...');
      setLoading(true);
      
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'User not found');
        router.replace('/onboarding');
        return;
      }
      setCurrentUser(user);
      
      // Load all projects
      const allProjects = await getProjects();
      
      // Load applications to check if user has applied
      const allApplications = await getApplications();
      
      // Enhance projects with application data
      const enhancedProjects: ProjectWithApplications[] = allProjects.map(project => {
        const projectApplications = allApplications.filter(app => app.projectId === project.id);
        const hasApplied = projectApplications.some(app => app.applicantId === user.id);
        const isOwner = project.authorId === user.id;
        
        return {
          ...project,
          applicationCount: projectApplications.length,
          hasApplied,
          isOwner,
        };
      });
      
      // Sort by creation date (newest first)
      enhancedProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setProjects(enhancedProjects);
      console.log(`✅ Loaded ${enhancedProjects.length} projects`);
      
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];
    
    switch (filter) {
      case 'vocals':
        filtered = projects.filter(p => 
          p.title.toLowerCase().includes('vocal') || 
          p.description.toLowerCase().includes('vocal') ||
          p.title.toLowerCase().includes('singer')
        );
        break;
      case 'production':
        filtered = projects.filter(p => 
          p.title.toLowerCase().includes('produc') || 
          p.description.toLowerCase().includes('produc') ||
          p.title.toLowerCase().includes('beat')
        );
        break;
      case 'mixing':
        filtered = projects.filter(p => 
          p.title.toLowerCase().includes('mix') || 
          p.description.toLowerCase().includes('mix') ||
          p.title.toLowerCase().includes('master')
        );
        break;
      case 'my-projects':
        filtered = projects.filter(p => p.isOwner);
        break;
      default:
        // 'all' - no filtering
        break;
    }
    
    setFilteredProjects(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleCreateProject = () => {
    if (!currentUser?.isOnboarded) {
      Alert.alert(
        'Complete Your Profile',
        'Please complete your profile setup before creating projects.',
        [
          { text: 'Setup Profile', onPress: () => router.push('/onboarding') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    console.log('➕ Creating new project');
    setShowCreateModal(true);
  };

  const handleProjectCreated = async (projectData: Partial<Project>) => {
    if (!currentUser) return;
    
    try {
      const newProject: Project = {
        id: generateId(),
        title: projectData.title!,
        description: projectData.description!,
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
      await loadProjects(); // Reload to show new project
      
      Alert.alert(
        'Project Created! 🎉',
        'Your project has been posted successfully. Musicians can now apply to collaborate with you.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Error creating project:', error);
      Alert.alert('Error', 'Failed to create project. Please try again.');
    }
  };

  const handleApplyToProject = async (project: ProjectWithApplications) => {
    if (!currentUser) return;
    
    if (project.hasApplied) {
      Alert.alert('Already Applied', 'You have already applied to this project.');
      return;
    }
    
    if (project.isOwner) {
      Alert.alert('Your Project', 'You cannot apply to your own project.');
      return;
    }
    
    try {
      const application: Application = {
        id: generateId(),
        projectId: project.id,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        message: `Hi ${project.authorName}! I'm interested in collaborating on "${project.title}". I'm a ${currentUser.role} with experience in ${currentUser.genres.join(', ')}. Let's create something amazing together!`,
        portfolio: currentUser.highlights,
        appliedAt: getCurrentTimestamp(),
        status: 'pending',
      };
      
      await addApplication(application);
      await loadProjects(); // Reload to update application status
      
      Alert.alert(
        'Application Sent! 📝',
        `Your application has been sent to ${project.authorName}. They will review your profile and get back to you.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Error applying to project:', error);
      Alert.alert('Error', 'Failed to apply to project. Please try again.');
    }
  };

  const handleViewProject = (project: ProjectWithApplications) => {
    console.log('👁️ Viewing project:', project.title);
    router.push(`/project/${project.id}`);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just posted';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
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
          Open Projects
        </Text>
        
        <TouchableOpacity onPress={handleCreateProject} style={styles.headerButton}>
          <Icon name="add" size={24} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map(filterItem => (
            <TouchableOpacity
              key={filterItem.id}
              style={[
                styles.filterTab,
                filter === filterItem.id && styles.activeFilterTab
              ]}
              onPress={() => setFilter(filterItem.id)}
            >
              <Icon 
                name={filterItem.icon as any} 
                size={16} 
                style={{ 
                  marginRight: spacing.xs,
                  opacity: filter === filterItem.id ? 1 : 0.7 
                }} 
              />
              <Text style={[
                styles.filterText,
                filter === filterItem.id && styles.activeFilterText
              ]}>
                {filterItem.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Projects List */}
        <ScrollView 
          contentContainerStyle={styles.projectsList}
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
          {/* Stats Header */}
          <View style={styles.statsHeader}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
              style={styles.statsContainer}
            >
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{projects.length}</Text>
                <Text style={styles.statLabel}>Total Projects</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {projects.filter(p => p.status === 'open').length}
                </Text>
                <Text style={styles.statLabel}>Open</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {projects.filter(p => p.isOwner).length}
                </Text>
                <Text style={styles.statLabel}>My Projects</Text>
              </View>
            </LinearGradient>
          </View>

          {filteredProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.emptyStateIcon}
              >
                <Icon name="briefcase-outline" size={60} />
              </LinearGradient>
              <Text style={[commonStyles.title, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                {filter === 'my-projects' ? 'No Projects Yet' : 'No Projects Found'}
              </Text>
              <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: spacing.xl }]}>
                {filter === 'my-projects' 
                  ? 'Create your first project to start collaborating with other musicians.'
                  : 'Try adjusting your filters or check back later for new projects.'
                }
              </Text>
              <Button
                text={filter === 'my-projects' ? 'Create Project' : 'View All Projects'}
                onPress={filter === 'my-projects' ? handleCreateProject : () => setFilter('all')}
                variant="gradient"
                size="lg"
              />
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

          {/* Create Project CTA */}
          {filteredProjects.length > 0 && (
            <View style={styles.ctaContainer}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                style={styles.ctaGradient}
              >
                <Icon name="add-circle" size={40} style={{ marginBottom: spacing.md, opacity: 0.7 }} />
                <Text style={[commonStyles.heading, { fontSize: 18, marginBottom: spacing.sm }]}>
                  Have a Project?
                </Text>
                <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: spacing.lg, opacity: 0.8 }]}>
                  Post your open project and find the perfect collaborators for your music.
                </Text>
                <Button
                  text="Create New Project"
                  onPress={handleCreateProject}
                  variant="gradient"
                  size="md"
                />
              </LinearGradient>
            </View>
          )}
        </ScrollView>
      </Animated.View>

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

interface ProjectCardProps {
  project: ProjectWithApplications;
  onApply: () => void;
  onView: () => void;
  formatTimeAgo: (timestamp: string) => string;
  delay: number;
}

function ProjectCard({ project, onApply, onView, formatTimeAgo, delay }: ProjectCardProps) {
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
      <TouchableOpacity
        style={styles.projectCard}
        onPress={onView}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.05)', 'rgba(139, 92, 246, 0.05)']}
          style={styles.projectCardGradient}
        >
          <View style={styles.projectCardContent}>
            {/* Project Header */}
            <View style={styles.projectHeader}>
              <View style={styles.projectTitleContainer}>
                <Text style={[commonStyles.heading, { fontSize: 18, marginBottom: spacing.xs }]}>
                  {project.title}
                </Text>
                <Text style={[commonStyles.text, { fontSize: 14, opacity: 0.8 }]}>
                  by {project.authorName} • {project.authorRole}
                </Text>
              </View>
              <View style={styles.projectStatus}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                  <Text style={styles.statusText}>
                    {project.status.toUpperCase()}
                  </Text>
                </View>
                {project.isOwner && (
                  <View style={styles.ownerBadge}>
                    <Text style={styles.ownerBadgeText}>YOURS</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Genres */}
            <View style={styles.genreContainer}>
              {project.genres.map(genre => (
                <View key={genre} style={styles.genreChip}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>

            {/* Description */}
            <Text style={[commonStyles.text, { marginBottom: spacing.md, lineHeight: 20 }]}>
              {project.description.length > 120 
                ? `${project.description.substring(0, 120)}...` 
                : project.description
              }
            </Text>

            {/* Project Details */}
            <View style={styles.projectDetails}>
              <View style={styles.detailItem}>
                <Icon name="cash" size={16} style={{ marginRight: spacing.xs, opacity: 0.7 }} />
                <Text style={styles.detailText}>
                  {project.budget || 'Budget TBD'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="time" size={16} style={{ marginRight: spacing.xs, opacity: 0.7 }} />
                <Text style={styles.detailText}>
                  {project.timeline || 'Timeline TBD'}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.projectFooter}>
              <View style={styles.projectMeta}>
                <Text style={[commonStyles.caption, { opacity: 0.6 }]}>
                  {project.applicationCount} applicant{project.applicationCount !== 1 ? 's' : ''}
                </Text>
                <Text style={[commonStyles.caption, { opacity: 0.6 }]}>
                  {formatTimeAgo(project.createdAt)}
                </Text>
              </View>
              
              <View style={styles.projectActions}>
                <Button
                  text="View Details"
                  onPress={onView}
                  variant="outline"
                  size="sm"
                  style={{ marginRight: spacing.sm }}
                />
                
                {!project.isOwner && (
                  <Button
                    text={project.hasApplied ? "Applied" : "Apply"}
                    onPress={onApply}
                    variant={project.hasApplied ? "ghost" : "primary"}
                    size="sm"
                    disabled={project.hasApplied || project.status !== 'open'}
                  />
                )}
              </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  activeFilterText: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
  },
  projectsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statsHeader: {
    marginBottom: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  projectTitleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  projectStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  statusText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  ownerBadge: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  ownerBadgeText: {
    color: colors.text,
    fontSize: 8,
    fontWeight: 'bold',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  genreChip: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  genreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  projectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  projectMeta: {
    flex: 1,
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaContainer: {
    marginTop: spacing.xl,
  },
  ctaGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});
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

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectWithApplications[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my' | 'applied'>('all');
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

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
        const isOwner = project.authorId === user.id;
        
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
  };

  const filterProjects = () => {
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
        mediaFiles: projectData.mediaFiles || [],
      };
      
      await addProject(newProject);
      setShowCreateModal(false);
      
      Alert.alert(
        'Project Created! 🎉',
        'Your project has been posted. Musicians can now apply to collaborate with you.',
        [{ text: 'OK', onPress: () => loadProjects() }]
      );
      
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
        message: `Hi ${project.authorName}! I'm interested in collaborating on "${project.title}". As a ${currentUser.role}, I think I could bring great value to this project.`,
        portfolio: currentUser.highlights,
        appliedAt: getCurrentTimestamp(),
        status: 'pending',
      };
      
      await addApplication(application);
      
      Alert.alert(
        'Application Sent! 📤',
        `Your application has been sent to ${project.authorName}. They'll review your profile and get back to you.`,
        [{ text: 'OK', onPress: () => loadProjects() }]
      );
      
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
            Browse ({projects.filter(p => !p.isOwner).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'my' && styles.filterTabActive]}
          onPress={() => setFilter('my')}
        >
          <Text style={[styles.filterText, filter === 'my' && styles.filterTextActive]}>
            My Projects ({projects.filter(p => p.isOwner).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'applied' && styles.filterTabActive]}
          onPress={() => setFilter('applied')}
        >
          <Text style={[styles.filterText, filter === 'applied' && styles.filterTextActive]}>
            Applied ({projects.filter(p => p.hasApplied).length})
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
             filter === 'applied' ? 'Browse projects and apply to start collaborating!' :
             'Check back later for new collaboration opportunities!'}
          </Text>
          
          <Button
            text={filter === 'my' ? 'Create Project' : 'Browse Projects'}
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
          {/* Projects List */}
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

          {/* Create Project CTA */}
          {filter === 'all' && (
            <View style={styles.ctaContainer}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                style={styles.ctaCard}
              >
                <Icon name="add-circle" size={48} color={colors.primary} />
                <Text style={[commonStyles.heading, { fontSize: 18, marginVertical: spacing.md }]}>
                  Have a Project Idea?
                </Text>
                <Text style={[commonStyles.text, { marginBottom: spacing.lg, textAlign: 'center' }]}>
                  Create a project and find talented musicians to collaborate with
                </Text>
                <Button
                  text="Create Project"
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
      <TouchableOpacity style={styles.projectCard} onPress={onView} activeOpacity={0.8}>
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.projectCardGradient}
        >
          <View style={styles.projectCardContent}>
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

            {/* Author Info */}
            <View style={styles.authorInfo}>
              <LinearGradient
                colors={colors.gradientSecondary}
                style={styles.authorAvatar}
              >
                <Text style={styles.authorAvatarText}>
                  {project.authorName.charAt(0)}
                </Text>
              </LinearGradient>
              
              <View style={styles.authorDetails}>
                <Text style={styles.authorName}>{project.authorName}</Text>
                <Text style={styles.authorRole}>{project.authorRole}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.projectDescription} numberOfLines={3}>
              {project.description}
            </Text>

            {/* Genres */}
            <View style={styles.genreContainer}>
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
              <View style={styles.detailItem}>
                <Icon name="cash" size={16} color={colors.success} />
                <Text style={styles.detailText}>{project.budget}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Icon name="time" size={16} color={colors.warning} />
                <Text style={styles.detailText}>{project.timeline}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Icon name="people" size={16} color={colors.primary} />
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
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              
              {!project.isOwner && !project.hasApplied && project.status === 'open' && (
                <Button
                  text="Apply"
                  onPress={onApply}
                  variant="gradient"
                  size="sm"
                  style={{ flex: 1 }}
                />
              )}
              
              {project.hasApplied && (
                <View style={styles.appliedBadge}>
                  <Icon name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.appliedText}>Applied</Text>
                </View>
              )}
              
              {project.isOwner && (
                <View style={styles.ownerBadge}>
                  <Icon name="person" size={16} color={colors.primary} />
                  <Text style={styles.ownerText}>Your Project</Text>
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
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
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
  projectTitleContainer: {
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
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  projectTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  authorAvatarText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  authorRole: {
    fontSize: 14,
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
  genreContainer: {
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
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  appliedText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  ownerText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  ctaContainer: {
    marginTop: spacing.xl,
  },
  ctaCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import Button from './Button';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import {
  Application,
  Project,
  User,
  DirectMessage,
  getApplications,
  getAllUsers,
  addDirectMessage,
  getDirectMessages,
  generateId,
  getCurrentTimestamp,
  getCurrentUser,
} from '../utils/storage';

interface ProjectApplicationsModalProps {
  visible: boolean;
  onClose: () => void;
  project: Project;
}

interface ApplicationWithUser extends Application {
  user: User;
}

export default function ProjectApplicationsModal({
  visible,
  onClose,
  project,
}: ProjectApplicationsModalProps) {
  const insets = useSafeAreaInsets();
  const [applications, setApplications] = useState<ApplicationWithUser[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithUser | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [existingMessages, setExistingMessages] = useState<DirectMessage[]>([]);

  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.9);

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
      transform: [{ scale: modalScale.value }],
    };
  });

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { damping: 15 });
      loadApplications();
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible, modalOpacity, modalScale]);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const [user, projectApplications, allUsers] = await Promise.all([
        getCurrentUser(),
        getApplications(project.id),
        getAllUsers(),
      ]);

      if (user) {
        setCurrentUser(user);
        
        const applicationsWithUsers: ApplicationWithUser[] = projectApplications.map(app => {
          const applicantUser = allUsers.find(u => u.id === app.applicantId);
          return {
            ...app,
            user: applicantUser || {
              id: app.applicantId,
              name: app.applicantName,
              role: 'Unknown',
              genres: [],
              location: 'Unknown',
              bio: '',
              highlights: [],
              collaborations: [],
              rating: 0,
              verified: false,
              joinDate: '',
              isOnboarded: true,
              lastActive: '',
              createdAt: '',
            },
          };
        });

        // Sort by application date (newest first)
        applicationsWithUsers.sort((a, b) => 
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        );

        setApplications(applicationsWithUsers);
      }
    } catch (error) {
      console.error('❌ Error loading applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  }, [loadApplications]);

  const handleMessageApplicant = async (application: ApplicationWithUser) => {
    if (!currentUser) return;

    try {
      // Load existing messages between project owner and applicant
      const messages = await getDirectMessages(project.id, currentUser.id);
      const conversationMessages = messages.filter(msg => 
        (msg.senderId === currentUser.id && msg.receiverId === application.applicantId) ||
        (msg.senderId === application.applicantId && msg.receiverId === currentUser.id)
      );

      setSelectedApplication(application);
      setExistingMessages(conversationMessages);
      setMessageText('');
      setShowMessageModal(true);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      Alert.alert('Error', 'Failed to load conversation');
    }
  };

  const sendMessage = async () => {
    if (!currentUser || !selectedApplication || !messageText.trim()) return;

    try {
      const message: DirectMessage = {
        id: generateId(),
        projectId: project.id,
        senderId: currentUser.id,
        receiverId: selectedApplication.applicantId,
        senderName: currentUser.name,
        receiverName: selectedApplication.applicantName,
        content: messageText.trim(),
        type: 'text',
        sentAt: getCurrentTimestamp(),
        isRead: false,
        applicationId: selectedApplication.id,
      };

      await addDirectMessage(message);
      setExistingMessages(prev => [...prev, message]);
      setMessageText('');
      
      Alert.alert('Message Sent! 💬', 'Your message has been sent to the applicant.');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContainer, modalAnimatedStyle, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Project Applications</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Project Info */}
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>{project.title}</Text>
            <Text style={styles.applicationCount}>
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Applications List */}
          <ScrollView
            style={styles.applicationsList}
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
            {loading ? (
              <View style={styles.loadingContainer}>
                <Icon name="hourglass" size={48} color={colors.textMuted} />
                <Text style={styles.loadingText}>Loading applications...</Text>
              </View>
            ) : applications.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="document-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Applications Yet</Text>
                <Text style={styles.emptyDescription}>
                  When musicians apply to your project, they'll appear here.
                </Text>
              </View>
            ) : (
              applications.map((application, index) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onMessage={() => handleMessageApplicant(application)}
                  formatTimeAgo={formatTimeAgo}
                  delay={index * 100}
                />
              ))
            )}
          </ScrollView>

          {/* Message Modal */}
          <Modal
            visible={showMessageModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowMessageModal(false)}
          >
            <View style={styles.messageModalOverlay}>
              <View style={[styles.messageModalContainer, { paddingTop: insets.top }]}>
                <LinearGradient
                  colors={colors.gradientBackground}
                  style={StyleSheet.absoluteFill}
                />
                
                {/* Message Header */}
                <View style={styles.messageHeader}>
                  <TouchableOpacity 
                    onPress={() => setShowMessageModal(false)} 
                    style={styles.closeButton}
                  >
                    <Icon name="arrow-back" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.messageHeaderTitle}>
                    Message {selectedApplication?.applicantName}
                  </Text>
                  <View style={styles.placeholder} />
                </View>

                {/* Existing Messages */}
                <ScrollView style={styles.messagesContainer}>
                  {existingMessages.map((message) => (
                    <View
                      key={message.id}
                      style={[
                        styles.messageBubble,
                        message.senderId === currentUser?.id
                          ? styles.sentMessage
                          : styles.receivedMessage,
                      ]}
                    >
                      <Text style={styles.messageText}>{message.content}</Text>
                      <Text style={styles.messageTime}>
                        {formatTimeAgo(message.sentAt)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                {/* Message Input */}
                <View style={styles.messageInputContainer}>
                  <View style={styles.messageInputWrapper}>
                    <TextInput
                      style={styles.messageInput}
                      placeholder="Type your message..."
                      placeholderTextColor={colors.textMuted}
                      value={messageText}
                      onChangeText={setMessageText}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        !messageText.trim() && styles.sendButtonDisabled,
                      ]}
                      onPress={sendMessage}
                      disabled={!messageText.trim()}
                    >
                      <Icon name="send" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface ApplicationCardProps {
  application: ApplicationWithUser;
  onMessage: () => void;
  formatTimeAgo: (timestamp: string) => string;
  delay: number;
}

function ApplicationCard({ application, onMessage, formatTimeAgo, delay }: ApplicationCardProps) {
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

  return (
    <Animated.View style={cardAnimatedStyle}>
      <View style={styles.applicationCard}>
        <View style={styles.applicantHeader}>
          <View style={styles.applicantInfo}>
            <Text style={styles.applicantName}>{application.applicantName}</Text>
            <Text style={styles.applicantRole}>{application.user.role}</Text>
            {application.user.verified && (
              <Icon name="checkmark-circle" size={16} color={colors.success} />
            )}
          </View>
          <Text style={styles.applicationTime}>
            {formatTimeAgo(application.appliedAt)}
          </Text>
        </View>

        <Text style={styles.applicationMessage}>{application.message}</Text>

        {application.user.genres.length > 0 && (
          <View style={styles.genresContainer}>
            {application.user.genres.slice(0, 3).map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
            {application.user.genres.length > 3 && (
              <Text style={styles.moreGenres}>+{application.user.genres.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.applicationActions}>
          <Button
            text="Message"
            onPress={onMessage}
            variant="primary"
            size="sm"
            icon={<Icon name="chatbubble" size={16} color={colors.text} />}
          />
          <Button
            text="View Profile"
            onPress={() => console.log('View profile:', application.applicantId)}
            variant="outline"
            size="sm"
            style={{ marginLeft: spacing.sm }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    height: '90%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  placeholder: {
    width: 44,
  },
  projectInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  projectTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  applicationCount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  applicationsList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  applicationCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  applicantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  applicantName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  applicantRole: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  applicationTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  applicationMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  genresContainer: {
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
  applicationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  messageModalContainer: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  messageHeaderTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.xs,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  messageInputContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
});
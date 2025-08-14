
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
import { router } from 'expo-router';
import Icon from './Icon';
import Button from './Button';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import {
  getCurrentUser,
  getDirectMessageConversations,
  User,
} from '../utils/storage';

interface DirectMessagesModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Conversation {
  projectId: string;
  projectTitle: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: any;
  unreadCount: number;
}

export default function DirectMessagesModal({
  visible,
  onClose,
}: DirectMessagesModalProps) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.9);

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
      transform: [{ scale: modalScale.value }],
    };
  });

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const userConversations = await getDirectMessageConversations(user.id);
        setConversations(userConversations);
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { damping: 15 });
      loadConversations();
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible, modalOpacity, modalScale, loadConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  const handleConversationPress = (conversation: Conversation) => {
    onClose();
    // Navigate to a dedicated direct message chat screen
    router.push(`/direct-chat/${conversation.projectId}/${conversation.otherUserId}`);
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
            <Text style={styles.headerTitle}>Project Messages</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Conversations List */}
          <ScrollView
            style={styles.conversationsList}
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
                <Icon name="chatbubbles" size={48} color={colors.textMuted} />
                <Text style={styles.loadingText}>Loading conversations...</Text>
              </View>
            ) : conversations.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="chatbubbles-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Messages Yet</Text>
                <Text style={styles.emptyDescription}>
                  When you message applicants or receive messages about your projects, they&apos;ll appear here.
                </Text>
              </View>
            ) : (
              conversations.map((conversation, index) => (
                <ConversationCard
                  key={`${conversation.projectId}_${conversation.otherUserId}`}
                  conversation={conversation}
                  onPress={() => handleConversationPress(conversation)}
                  formatTimeAgo={formatTimeAgo}
                  delay={index * 100}
                />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface ConversationCardProps {
  conversation: Conversation;
  onPress: () => void;
  formatTimeAgo: (timestamp: string) => string;
  delay: number;
}

function ConversationCard({ conversation, onPress, formatTimeAgo, delay }: ConversationCardProps) {
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
      <TouchableOpacity style={styles.conversationCard} onPress={onPress}>
        <View style={styles.conversationHeader}>
          <View style={styles.conversationInfo}>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {conversation.projectTitle}
            </Text>
            <Text style={styles.otherUserName}>
              with {conversation.otherUserName}
            </Text>
          </View>
          <View style={styles.conversationMeta}>
            <Text style={styles.messageTime}>
              {formatTimeAgo(conversation.lastMessage.sentAt)}
            </Text>
            {conversation.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={2}>
          {conversation.lastMessage.content}
        </Text>
      </TouchableOpacity>
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
    height: '80%',
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
  conversationsList: {
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
    paddingHorizontal: spacing.lg,
  },
  conversationCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  conversationInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  projectTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  otherUserName: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  unreadCount: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

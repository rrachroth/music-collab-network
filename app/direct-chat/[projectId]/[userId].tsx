import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from '../../../components/Icon';
import Button from '../../../components/Button';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../../styles/commonStyles';
import {
  getCurrentUser,
  getDirectMessages,
  addDirectMessage,
  markDirectMessagesAsRead,
  getProjects,
  getAllUsers,
  generateId,
  getCurrentTimestamp,
  User,
  DirectMessage,
  Project,
} from '../../../utils/storage';

export default function DirectChatScreen() {
  const { projectId, userId } = useLocalSearchParams<{ projectId: string; userId: string }>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // Handle scroll events if needed
    },
  });

  const loadChatData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [user, allUsers, allProjects] = await Promise.all([
        getCurrentUser(),
        getAllUsers(),
        getProjects(),
      ]);

      if (!user) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }

      setCurrentUser(user);

      // Find the other user
      const otherUserData = allUsers.find(u => u.id === userId);
      if (!otherUserData) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }
      setOtherUser(otherUserData);

      // Find the project
      const projectData = allProjects.find(p => p.id === projectId);
      if (!projectData) {
        Alert.alert('Error', 'Project not found');
        router.back();
        return;
      }
      setProject(projectData);

      // Load messages
      const chatMessages = await getDirectMessages(projectId, user.id);
      const conversationMessages = chatMessages.filter(msg => 
        (msg.senderId === user.id && msg.receiverId === userId) ||
        (msg.senderId === userId && msg.receiverId === user.id)
      );
      
      setMessages(conversationMessages);

      // Mark messages as read
      await markDirectMessagesAsRead(projectId, userId, user.id);

      console.log(`💬 Loaded ${conversationMessages.length} messages for project ${projectData.title}`);
    } catch (error) {
      console.error('❌ Error loading chat data:', error);
      Alert.alert('Error', 'Failed to load chat data');
    } finally {
      setLoading(false);
    }
  }, [projectId, userId]);

  useEffect(() => {
    loadChatData();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [loadChatData, fadeIn, slideUp]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!currentUser || !otherUser || !project || !messageText.trim()) return;

    try {
      const message: DirectMessage = {
        id: generateId(),
        projectId: project.id,
        senderId: currentUser.id,
        receiverId: otherUser.id,
        senderName: currentUser.name,
        receiverName: otherUser.name,
        content: messageText.trim(),
        type: 'text',
        sentAt: getCurrentTimestamp(),
        isRead: false,
      };

      await addDirectMessage(message);
      setMessages(prev => [...prev, message]);
      setMessageText('');

      console.log('💬 Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="chatbubbles" size={80} color={colors.textMuted} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Loading Chat...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[commonStyles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={colors.gradientBackground}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {project?.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            with {otherUser?.name}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.infoButton}>
          <Icon name="information-circle" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="chatbubble-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Start the Conversation</Text>
              <Text style={styles.emptyDescription}>
                Send a message to discuss the project "{project?.title}"
              </Text>
            </View>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUser?.id}
                otherUser={otherUser!}
                formatTime={formatTime}
              />
            ))
          )}
        </ScrollView>

        {/* Message Input */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
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
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

interface MessageBubbleProps {
  message: DirectMessage;
  isOwn: boolean;
  otherUser: User;
  formatTime: (timestamp: string) => string;
}

function MessageBubble({ message, isOwn, otherUser, formatTime }: MessageBubbleProps) {
  return (
    <View style={[styles.messageBubble, isOwn ? styles.ownMessage : styles.otherMessage]}>
      <View style={[styles.messageContent, isOwn ? styles.ownMessageContent : styles.otherMessageContent]}>
        <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
          {message.content}
        </Text>
        <Text style={[styles.messageTime, isOwn ? styles.ownMessageTime : styles.otherMessageTime]}>
          {formatTime(message.sentAt)}
        </Text>
      </View>
    </View>
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
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  infoButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  messageBubble: {
    marginVertical: spacing.xs,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageContent: {
    maxWidth: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  ownMessageContent: {
    backgroundColor: colors.primary,
  },
  otherMessageContent: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  ownMessageText: {
    color: colors.text,
  },
  otherMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: spacing.xs,
  },
  ownMessageTime: {
    color: colors.text,
    opacity: 0.7,
  },
  otherMessageTime: {
    color: colors.textMuted,
  },
  inputContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textInput: {
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
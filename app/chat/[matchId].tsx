import { Text, View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { 
  getCurrentUser, 
  getMatches, 
  getMessages, 
  addMessage, 
  getAllUsers,
  generateId, 
  getCurrentTimestamp,
  User, 
  Match,
  Message 
} from '../../utils/storage';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  useEffect(() => {
    loadChatData();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [matchId]);

  const loadChatData = async () => {
    try {
      console.log('💬 Loading chat data for match:', matchId);
      setLoading(true);
      
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }
      setCurrentUser(user);
      
      // Find the match
      const matches = await getMatches();
      const match = matches.find(m => m.id === matchId);
      if (!match) {
        Alert.alert('Error', 'Match not found');
        router.back();
        return;
      }
      
      // Get the other user
      const otherUserId = match.userId === user.id ? match.matchedUserId : match.userId;
      const allUsers = await getAllUsers();
      const other = allUsers.find(u => u.id === otherUserId);
      if (!other) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }
      setOtherUser(other);
      
      // Load messages
      const chatMessages = await getMessages(matchId);
      setMessages(chatMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()));
      
      console.log(`✅ Loaded ${chatMessages.length} messages`);
      
    } catch (error) {
      console.error('❌ Error loading chat data:', error);
      Alert.alert('Error', 'Failed to load chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !otherUser || sending) return;
    
    try {
      setSending(true);
      
      const message: Message = {
        id: generateId(),
        matchId: matchId!,
        senderId: currentUser.id,
        receiverId: otherUser.id,
        content: newMessage.trim(),
        type: 'text',
        sentAt: getCurrentTimestamp(),
        isRead: false,
      };
      
      await addMessage(message);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      console.log('✅ Message sent successfully');
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
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
        <Icon name="chatbubbles" size={80} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Loading Chat...
        </Text>
      </View>
    );
  }

  if (!otherUser) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={commonStyles.title}>User not found</Text>
        <Button text="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[commonStyles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {otherUser.name.charAt(0)}
              </Text>
            </LinearGradient>
          </View>
          <View style={styles.headerText}>
            <Text style={[commonStyles.heading, { fontSize: 18 }]}>
              {otherUser.name}
            </Text>
            <Text style={[commonStyles.caption, { opacity: 0.8 }]}>
              {otherUser.role} • {otherUser.location}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={() => router.push(`/profile/${otherUser.id}`)} 
          style={styles.headerButton}
        >
          <Icon name="person" size={24} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <Animated.View style={[styles.messagesContainer, animatedStyle]}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.emptyStateIcon}
              >
                <Icon name="heart" size={40} />
              </LinearGradient>
              <Text style={[commonStyles.heading, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                You Matched!
              </Text>
              <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: spacing.lg }]}>
                Start the conversation and begin your musical collaboration with {otherUser.name}.
              </Text>
              <View style={styles.suggestedMessages}>
                <TouchableOpacity 
                  style={styles.suggestedMessage}
                  onPress={() => setNewMessage("Hey! Love your musical style. Want to collaborate?")}
                >
                  <Text style={styles.suggestedMessageText}>
                    "Hey! Love your musical style. Want to collaborate?"
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestedMessage}
                  onPress={() => setNewMessage("Hi! What kind of project are you working on?")}
                >
                  <Text style={styles.suggestedMessageText}>
                    "Hi! What kind of project are you working on?"
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUser?.id}
                otherUser={otherUser}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: newMessage.trim() ? 1 : 0.5 }]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.sendButtonGradient}
            >
              {sending ? (
                <Icon name="hourglass" size={20} />
              ) : (
                <Icon name="send" size={20} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  otherUser: User;
}

function MessageBubble({ message, isOwn, otherUser }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.messageBubble, isOwn ? styles.ownMessage : styles.otherMessage]}>
      {!isOwn && (
        <View style={styles.messageAvatar}>
          <LinearGradient
            colors={colors.gradientSecondary}
            style={styles.messageAvatarGradient}
          >
            <Text style={styles.messageAvatarText}>
              {otherUser.name.charAt(0)}
            </Text>
          </LinearGradient>
        </View>
      )}
      
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
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  headerAvatar: {
    marginRight: spacing.md,
  },
  avatarGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  headerText: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  suggestedMessages: {
    width: '100%',
    gap: spacing.sm,
  },
  suggestedMessage: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestedMessageText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  messageBubble: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: spacing.sm,
  },
  messageAvatarGradient: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  messageContent: {
    maxWidth: '75%',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  ownMessageContent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageContent: {
    backgroundColor: colors.backgroundCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  ownMessageText: {
    color: colors.text,
  },
  otherMessageText: {
    color: colors.textSecondary,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  ownMessageTime: {
    color: colors.text,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: colors.textMuted,
  },
  inputContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    marginLeft: spacing.sm,
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
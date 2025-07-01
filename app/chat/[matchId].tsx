import { Text, View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
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

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  otherUser: User;
}

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);
  const scrollY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const loadChatData = useCallback(async () => {
    try {
      console.log('💬 Loading chat data for match:', matchId);
      setLoading(true);

      if (!matchId) {
        Alert.alert('Error', 'Invalid chat ID');
        router.back();
        return;
      }

      const [user, allMatches, allUsers, chatMessages] = await Promise.all([
        getCurrentUser(),
        getMatches(),
        getAllUsers(),
        getMessages(matchId),
      ]);

      if (!user) {
        Alert.alert('Error', 'Please log in first');
        router.back();
        return;
      }

      setCurrentUser(user);

      const foundMatch = allMatches.find(m => m.id === matchId);
      if (!foundMatch) {
        Alert.alert('Error', 'Match not found');
        router.back();
        return;
      }

      setMatch(foundMatch);

      const otherUserId = foundMatch.userId === user.id ? foundMatch.matchedUserId : foundMatch.userId;
      const foundOtherUser = allUsers.find(u => u.id === otherUserId);
      
      if (!foundOtherUser) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }

      setOtherUser(foundOtherUser);
      setMessages(chatMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()));

      console.log(`✅ Loaded ${chatMessages.length} messages`);

    } catch (error) {
      console.error('❌ Error loading chat data:', error);
      Alert.alert('Error', 'Failed to load chat. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    loadChatData();
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [loadChatData, fadeIn, slideUp]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !otherUser || !match || sending) return;

    try {
      setSending(true);
      
      const message: Message = {
        id: generateId(),
        matchId: match.id,
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

      console.log('💬 Message sent successfully');

    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="chatbubble" size={80} color={colors.primary} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Loading Chat
        </Text>
        <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
          Getting your conversation ready
        </Text>
      </View>
    );
  }

  if (!otherUser || !match) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="alert-circle" size={80} color={colors.error} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Chat Not Found
        </Text>
        <Button
          text="Go Back"
          onPress={() => router.back()}
          variant="primary"
          size="lg"
          style={{ marginTop: spacing.lg }}
        />
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
          <LinearGradient
            colors={colors.gradientSecondary}
            style={styles.headerAvatar}
          >
            <Text style={styles.headerAvatarText}>
              {otherUser.name.charAt(0)}
            </Text>
          </LinearGradient>
          
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{otherUser.name}</Text>
            <Text style={styles.headerRole}>{otherUser.role}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="information-circle" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={[styles.messagesContainer, animatedStyle]}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.emptyIcon}
            >
              <Icon name="musical-notes" size={48} color={colors.text} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Start the Conversation!</Text>
            <Text style={styles.emptyDescription}>
              You and {otherUser.name} are now connected. Say hello and start collaborating!
            </Text>
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
      </Animated.ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder={`Message ${otherUser.name}...`}
            placeholderTextColor={colors.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <LinearGradient
              colors={newMessage.trim() && !sending ? colors.gradientPrimary : [colors.backgroundAlt, colors.backgroundAlt]}
              style={styles.sendButtonGradient}
            >
              <Icon 
                name={sending ? "hourglass" : "send"} 
                size={20} 
                color={newMessage.trim() && !sending ? colors.text : colors.textMuted} 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, isOwn, otherUser }: MessageBubbleProps) {
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
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
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerAvatarText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  headerRole: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: spacing.md,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  ownMessageContent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  otherMessageContent: {
    backgroundColor: colors.backgroundCard,
    borderBottomLeftRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  ownMessageText: {
    color: colors.text,
  },
  otherMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  ownMessageTime: {
    color: colors.text,
    opacity: 0.8,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: colors.textMuted,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
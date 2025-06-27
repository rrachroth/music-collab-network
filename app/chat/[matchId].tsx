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
  const insets = useSafeAreaInsets();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);
  const scrollY = useSharedValue(0);

  const loadChatData = useCallback(async () => {
    try {
      console.log('💬 Loading chat data...');
      setLoading(true);
      
      if (!matchId) {
        Alert.alert('Error', 'Invalid chat ID');
        router.back();
        return;
      }
      
      const [user, matches, allUsers, chatMessages] = await Promise.all([
        getCurrentUser(),
        getMatches(),
        getAllUsers(),
        getMessages(matchId),
      ]);
      
      if (!user) {
        Alert.alert('Error', 'Please complete your profile first.');
        router.replace('/onboarding');
        return;
      }
      
      setCurrentUser(user);
      
      const currentMatch = matches.find(m => m.id === matchId);
      if (!currentMatch) {
        Alert.alert('Error', 'Match not found');
        router.back();
        return;
      }
      
      setMatch(currentMatch);
      
      const otherUserId = currentMatch.userId === user.id 
        ? currentMatch.matchedUserId 
        : currentMatch.userId;
      
      const otherUserData = allUsers.find(u => u.id === otherUserId);
      if (!otherUserData) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }
      
      setOtherUser(otherUserData);
      setMessages(chatMessages.sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      ));
      
      console.log(`✅ Loaded chat with ${otherUserData.name}`);
      
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

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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
        <Icon name="chatbubbles" size={80} color={colors.primary} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Loading Chat
        </Text>
        <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
          Connecting you with your match
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
        <Text style={commonStyles.title}>Chat Not Found</Text>
        <Button 
          text="Go Back" 
          onPress={() => router.back()} 
          variant="outline"
          size="lg"
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
            {otherUser.verified && (
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={16} color={colors.success} />
              </View>
            )}
          </View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{otherUser.name}</Text>
            <Text style={styles.headerRole}>{otherUser.role}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="information-circle" size={24} />
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
          <View style={styles.emptyChat}>
            <Icon name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyChatTitle}>Start the Conversation</Text>
            <Text style={styles.emptyChatText}>
              Say hello to {otherUser.name} and start collaborating!
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
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <LinearGradient
              colors={(!newMessage.trim() || sending) ? [colors.grey, colors.grey] : colors.gradientPrimary}
              style={styles.sendButtonGradient}
            >
              <Icon 
                name={sending ? "hourglass" : "send"} 
                size={20} 
                color={colors.text} 
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
          <Text style={styles.messageAvatarText}>
            {otherUser.name.charAt(0)}
          </Text>
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
    backgroundColor: colors.backgroundCard,
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
    position: 'relative',
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
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    padding: 1,
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyChatTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyChatText: {
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  messageAvatarText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    maxHeight: 80,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    marginLeft: spacing.sm,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
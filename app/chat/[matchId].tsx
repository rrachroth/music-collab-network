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

  const loadChatData = useCallback(async () => {
    if (!matchId) return;
    
    try {
      console.log('💬 Loading chat data for match:', matchId);
      setLoading(true);
      
      const [user, matches, allMessages, allUsers] = await Promise.all([
        getCurrentUser(),
        getMatches(),
        getMessages(),
        getAllUsers(),
      ]);
      
      if (!user) {
        Alert.alert('Error', 'Please complete your profile first.', [
          { text: 'Setup Profile', onPress: () => router.replace('/onboarding') }
        ]);
        return;
      }
      
      setCurrentUser(user);
      
      // Find the match
      const currentMatch = matches.find(m => m.id === matchId);
      if (!currentMatch) {
        Alert.alert('Error', 'Match not found.', [
          { text: 'Go Back', onPress: () => router.back() }
        ]);
        return;
      }
      
      setMatch(currentMatch);
      
      // Find the other user
      const otherUserId = currentMatch.userId === user.id ? currentMatch.matchedUserId : currentMatch.userId;
      const otherUserData = allUsers.find(u => u.id === otherUserId);
      
      if (!otherUserData) {
        Alert.alert('Error', 'User not found.', [
          { text: 'Go Back', onPress: () => router.back() }
        ]);
        return;
      }
      
      setOtherUser(otherUserData);
      
      // Get messages for this match
      const matchMessages = allMessages
        .filter(msg => msg.matchId === matchId)
        .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      
      setMessages(matchMessages);
      
      console.log(`✅ Loaded ${matchMessages.length} messages for chat with ${otherUserData.name}`);
      
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
    if (!newMessage.trim() || !currentUser || !match || sending) return;
    
    try {
      setSending(true);
      
      const message: Message = {
        id: generateId(),
        matchId: match.id,
        senderId: currentUser.id,
        receiverId: match.userId === currentUser.id ? match.matchedUserId : match.userId,
        content: newMessage.trim(),
        sentAt: getCurrentTimestamp(),
        isRead: false,
      };
      
      await addMessage(message);
      
      // Add message to local state immediately for better UX
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
        <Icon name="chatbubble" size={80} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
          Loading Chat...
        </Text>
        <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
          Connecting you with your match
        </Text>
      </View>
    );
  }

  if (!currentUser || !otherUser || !match) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={commonStyles.title}>Chat Not Found</Text>
        <Text style={[commonStyles.text, { marginBottom: spacing.xl }]}>
          Unable to load this conversation
        </Text>
        <Button 
          text="Go Back" 
          onPress={() => router.back()} 
          variant="gradient"
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
        colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow-back" size={24} />
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
        
        <TouchableOpacity onPress={() => {}} style={styles.headerButton}>
          <Icon name="information-circle" size={24} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={[styles.messagesContainer, animatedStyle]}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.emptyIcon}
            >
              <Icon name="heart" size={48} />
            </LinearGradient>
            
            <Text style={[commonStyles.heading, { marginTop: spacing.lg, textAlign: 'center' }]}>
              It's a Match! 🎉
            </Text>
            
            <Text style={[commonStyles.text, { marginTop: spacing.sm, textAlign: 'center' }]}>
              You and {otherUser.name} are now connected! Start the conversation and create amazing music together.
            </Text>
            
            <View style={styles.matchInfo}>
              <Text style={styles.matchInfoTitle}>About {otherUser.name}</Text>
              <Text style={styles.matchInfoText}>
                {otherUser.role} • {otherUser.location}
              </Text>
              <Text style={styles.matchInfoText}>
                {otherUser.genres.slice(0, 3).join(', ')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.messagesList}>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUser.id}
                otherUser={otherUser}
              />
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.messageInput}
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
              colors={newMessage.trim() && !sending ? colors.gradientPrimary : ['#333', '#333']}
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
            style={styles.avatarSmall}
          >
            <Text style={styles.avatarSmallText}>
              {otherUser.name.charAt(0)}
            </Text>
          </LinearGradient>
        </View>
      )}
      
      <View style={[
        styles.messageContent,
        isOwn ? styles.ownMessageContent : styles.otherMessageContent
      ]}>
        <Text style={[
          styles.messageText,
          isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.content}
        </Text>
        
        <Text style={[
          styles.messageTime,
          isOwn ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerAvatarText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  matchInfo: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  matchInfoTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  matchInfoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  messagesList: {
    flex: 1,
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
    marginBottom: spacing.xs,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  messageContent: {
    maxWidth: '75%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    marginTop: spacing.xs,
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
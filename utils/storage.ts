
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
  genres: string[];
  location: string;
  bio: string;
  highlights: MediaFile[];
  collaborations: string[];
  rating: number;
  verified: boolean;
  joinDate: string;
  isOnboarded: boolean;
  profileImage?: string;
  lastActive: string;
  createdAt: string;
}

export interface MediaFile {
  id: string;
  uri: string;
  type: 'audio' | 'video' | 'image';
  title: string;
  description?: string;
  duration: number;
  uploadedAt: string;
}

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  matchedAt: string;
  isRead: boolean;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'audio' | 'media';
  sentAt: string;
  isRead: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  genres: string[];
  budget: string;
  timeline: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  applicants: string[];
  selectedCollaborator?: string;
  createdAt: string;
  updatedAt: string;
  mediaFiles?: MediaFile[];
}

export interface Application {
  id: string;
  projectId: string;
  applicantId: string;
  applicantName: string;
  message: string;
  portfolio: MediaFile[];
  appliedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface DirectMessage {
  id: string;
  projectId: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  content: string;
  type: 'text' | 'audio' | 'media';
  sentAt: string;
  isRead: boolean;
  applicationId?: string; // Link to application if this is about a specific application
}

// Storage Keys
const STORAGE_KEYS = {
  CURRENT_USER: 'current_user',
  ALL_USERS: 'all_users',
  MATCHES: 'matches',
  MESSAGES: 'messages',
  PROJECTS: 'projects',
  APPLICATIONS: 'applications',
  DIRECT_MESSAGES: 'direct_messages',
  USER_PREFERENCES: 'user_preferences',
  SAMPLE_DATA_INITIALIZED: 'sample_data_initialized',
};

// Helper functions
export const generateId = (): string => {
  try {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2);
    const id = `${timestamp}_${random}`;
    console.log('🆔 Generated ID:', id);
    return id;
  } catch (error) {
    console.error('❌ Error generating ID:', error);
    return `fallback_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
};

export const getCurrentTimestamp = (): string => {
  try {
    const timestamp = new Date().toISOString();
    console.log('⏰ Generated timestamp:', timestamp);
    return timestamp;
  } catch (error) {
    console.error('❌ Error generating timestamp:', error);
    return new Date().toString();
  }
};

// Safe JSON operations with error handling
const safeJSONParse = (data: string | null, fallback: any = null) => {
  if (!data) return fallback;
  
  try {
    const parsed = JSON.parse(data);
    return parsed;
  } catch (error) {
    console.error('❌ JSON parse error:', error);
    return fallback;
  }
};

const safeJSONStringify = (data: any): string => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('❌ JSON stringify error:', error);
    return '{}';
  }
};

// Safe AsyncStorage operations
const safeAsyncStorageGet = async (key: string, fallback: any = null) => {
  try {
    console.log(`📱 Getting from AsyncStorage: ${key}`);
    const data = await AsyncStorage.getItem(key);
    const result = safeJSONParse(data, fallback);
    console.log(`✅ Retrieved from AsyncStorage: ${key}`, typeof result, Array.isArray(result) ? `array(${result.length})` : 'object');
    return result;
  } catch (error) {
    console.error(`❌ Error getting from AsyncStorage (${key}):`, error);
    return fallback;
  }
};

const safeAsyncStorageSet = async (key: string, data: any) => {
  try {
    console.log(`📱 Setting to AsyncStorage: ${key}`, typeof data, Array.isArray(data) ? `array(${data.length})` : 'object');
    const jsonString = safeJSONStringify(data);
    await AsyncStorage.setItem(key, jsonString);
    console.log(`✅ Saved to AsyncStorage: ${key}`);
  } catch (error) {
    console.error(`❌ Error setting to AsyncStorage (${key}):`, error);
    throw error;
  }
};

// User Management
export const saveCurrentUser = async (user: User): Promise<void> => {
  try {
    if (!user || !user.id || !user.name) {
      throw new Error('Invalid user data');
    }
    
    await safeAsyncStorageSet(STORAGE_KEYS.CURRENT_USER, user);
    console.log('✅ User saved successfully:', user.name);
  } catch (error) {
    console.error('❌ Error saving user:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const user = await safeAsyncStorageGet(STORAGE_KEYS.CURRENT_USER, null);
    
    if (user && user.id && user.name) {
      console.log('👤 Current user loaded:', user.name);
      return user;
    }
    
    console.log('👤 No valid current user found');
    return null;
  } catch (error) {
    console.error('❌ Error loading user:', error);
    return null;
  }
};

export const updateCurrentUser = async (updates: Partial<User>): Promise<User | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      await saveCurrentUser(updatedUser);
      return updatedUser;
    }
    return null;
  } catch (error) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
};

// All Users Management
export const saveAllUsers = async (users: User[]): Promise<void> => {
  try {
    if (!Array.isArray(users)) {
      throw new Error('Users must be an array');
    }
    
    // Validate users
    const validUsers = users.filter(user => 
      user && 
      typeof user === 'object' && 
      user.id && 
      user.name &&
      typeof user.id === 'string' &&
      typeof user.name === 'string'
    );
    
    console.log(`👥 Saving ${validUsers.length} valid users (filtered from ${users.length})`);
    await safeAsyncStorageSet(STORAGE_KEYS.ALL_USERS, validUsers);
  } catch (error) {
    console.error('❌ Error saving all users:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const users = await safeAsyncStorageGet(STORAGE_KEYS.ALL_USERS, []);
    
    if (!Array.isArray(users)) {
      console.warn('⚠️ Users data is not an array, returning empty array');
      return [];
    }
    
    // Validate and filter users
    const validUsers = users.filter(user => 
      user && 
      typeof user === 'object' && 
      user.id && 
      user.name &&
      typeof user.id === 'string' &&
      typeof user.name === 'string'
    );
    
    console.log(`👥 Loaded ${validUsers.length} valid users (filtered from ${users.length})`);
    return validUsers;
  } catch (error) {
    console.error('❌ Error loading all users:', error);
    return [];
  }
};

export const addUser = async (user: User): Promise<void> => {
  try {
    if (!user || !user.id || !user.name) {
      throw new Error('Invalid user data');
    }
    
    const allUsers = await getAllUsers();
    
    // Check if user already exists
    const existingUserIndex = allUsers.findIndex(u => u.id === user.id);
    if (existingUserIndex >= 0) {
      // Update existing user
      allUsers[existingUserIndex] = user;
      console.log('👤 Updated existing user:', user.name);
    } else {
      // Add new user
      allUsers.push(user);
      console.log('👤 Added new user:', user.name);
    }
    
    await saveAllUsers(allUsers);
  } catch (error) {
    console.error('❌ Error adding user:', error);
    throw error;
  }
};

// Matches Management
export const saveMatches = async (matches: Match[]): Promise<void> => {
  try {
    if (!Array.isArray(matches)) {
      throw new Error('Matches must be an array');
    }
    
    // Validate matches
    const validMatches = matches.filter(match => 
      match && 
      typeof match === 'object' && 
      match.id && 
      match.userId && 
      match.matchedUserId &&
      typeof match.id === 'string' &&
      typeof match.userId === 'string' &&
      typeof match.matchedUserId === 'string'
    );
    
    console.log(`💕 Saving ${validMatches.length} valid matches (filtered from ${matches.length})`);
    await safeAsyncStorageSet(STORAGE_KEYS.MATCHES, validMatches);
  } catch (error) {
    console.error('❌ Error saving matches:', error);
    throw error;
  }
};

export const getMatches = async (): Promise<Match[]> => {
  try {
    const matches = await safeAsyncStorageGet(STORAGE_KEYS.MATCHES, []);
    
    if (!Array.isArray(matches)) {
      console.warn('⚠️ Matches data is not an array, returning empty array');
      return [];
    }
    
    // Validate and filter matches
    const validMatches = matches.filter(match => 
      match && 
      typeof match === 'object' && 
      match.id && 
      match.userId && 
      match.matchedUserId &&
      typeof match.id === 'string' &&
      typeof match.userId === 'string' &&
      typeof match.matchedUserId === 'string'
    );
    
    console.log(`💕 Loaded ${validMatches.length} valid matches (filtered from ${matches.length})`);
    return validMatches;
  } catch (error) {
    console.error('❌ Error loading matches:', error);
    return [];
  }
};

export const addMatch = async (match: Match): Promise<void> => {
  try {
    if (!match || !match.id || !match.userId || !match.matchedUserId) {
      throw new Error('Invalid match data');
    }
    
    const matches = await getMatches();
    
    // Check if match already exists
    const existingMatch = matches.find(m => 
      (m.userId === match.userId && m.matchedUserId === match.matchedUserId) ||
      (m.userId === match.matchedUserId && m.matchedUserId === match.userId)
    );
    
    if (existingMatch) {
      console.log('💕 Match already exists, skipping');
      return;
    }
    
    matches.push(match);
    await saveMatches(matches);
    console.log('💕 Match added successfully');
  } catch (error) {
    console.error('❌ Error adding match:', error);
    throw error;
  }
};

// Messages Management
export const saveMessages = async (messages: Message[]): Promise<void> => {
  try {
    if (!Array.isArray(messages)) {
      throw new Error('Messages must be an array');
    }
    
    await safeAsyncStorageSet(STORAGE_KEYS.MESSAGES, messages);
  } catch (error) {
    console.error('❌ Error saving messages:', error);
    throw error;
  }
};

export const getMessages = async (matchId?: string): Promise<Message[]> => {
  try {
    const messages = await safeAsyncStorageGet(STORAGE_KEYS.MESSAGES, []);
    
    if (!Array.isArray(messages)) {
      return [];
    }
    
    const validMessages = messages.filter(msg => 
      msg && typeof msg === 'object' && msg.id && msg.content
    );
    
    return matchId ? validMessages.filter(msg => msg.matchId === matchId) : validMessages;
  } catch (error) {
    console.error('❌ Error loading messages:', error);
    return [];
  }
};

export const addMessage = async (message: Message): Promise<void> => {
  try {
    if (!message || !message.id || !message.content) {
      throw new Error('Invalid message data');
    }
    
    const messages = await getMessages();
    messages.push(message);
    await saveMessages(messages);
    console.log('💬 Message added successfully');
  } catch (error) {
    console.error('❌ Error adding message:', error);
    throw error;
  }
};

// Projects Management
export const saveProjects = async (projects: Project[]): Promise<void> => {
  try {
    if (!Array.isArray(projects)) {
      throw new Error('Projects must be an array');
    }
    
    await safeAsyncStorageSet(STORAGE_KEYS.PROJECTS, projects);
  } catch (error) {
    console.error('❌ Error saving projects:', error);
    throw error;
  }
};

export const getProjects = async (): Promise<Project[]> => {
  try {
    const projects = await safeAsyncStorageGet(STORAGE_KEYS.PROJECTS, []);
    
    if (!Array.isArray(projects)) {
      return [];
    }
    
    return projects.filter(project => 
      project && typeof project === 'object' && project.id && project.title
    );
  } catch (error) {
    console.error('❌ Error loading projects:', error);
    return [];
  }
};

export const addProject = async (project: Project): Promise<void> => {
  try {
    if (!project || !project.id || !project.title) {
      throw new Error('Invalid project data');
    }
    
    const projects = await getProjects();
    projects.push(project);
    await saveProjects(projects);
    console.log('📋 Project added successfully');
  } catch (error) {
    console.error('❌ Error adding project:', error);
    throw error;
  }
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  try {
    const projects = await getProjects();
    const updatedProjects = projects.map(project => 
      project.id === projectId ? { ...project, ...updates, updatedAt: getCurrentTimestamp() } : project
    );
    await saveProjects(updatedProjects);
    console.log('📋 Project updated successfully');
  } catch (error) {
    console.error('❌ Error updating project:', error);
    throw error;
  }
};

// Applications Management
export const saveApplications = async (applications: Application[]): Promise<void> => {
  try {
    if (!Array.isArray(applications)) {
      throw new Error('Applications must be an array');
    }
    
    await safeAsyncStorageSet(STORAGE_KEYS.APPLICATIONS, applications);
  } catch (error) {
    console.error('❌ Error saving applications:', error);
    throw error;
  }
};

export const getApplications = async (projectId?: string): Promise<Application[]> => {
  try {
    const applications = await safeAsyncStorageGet(STORAGE_KEYS.APPLICATIONS, []);
    
    if (!Array.isArray(applications)) {
      return [];
    }
    
    const validApplications = applications.filter(app => 
      app && typeof app === 'object' && app.id && app.projectId
    );
    
    return projectId ? validApplications.filter(app => app.projectId === projectId) : validApplications;
  } catch (error) {
    console.error('❌ Error loading applications:', error);
    return [];
  }
};

export const addApplication = async (application: Application): Promise<void> => {
  try {
    if (!application || !application.id || !application.projectId) {
      throw new Error('Invalid application data');
    }
    
    const applications = await getApplications();
    applications.push(application);
    await saveApplications(applications);
    console.log('📝 Application added successfully');
  } catch (error) {
    console.error('❌ Error adding application:', error);
    throw error;
  }
};

// Direct Messages Management
export const saveDirectMessages = async (messages: DirectMessage[]): Promise<void> => {
  try {
    if (!Array.isArray(messages)) {
      throw new Error('Direct messages must be an array');
    }
    
    await safeAsyncStorageSet(STORAGE_KEYS.DIRECT_MESSAGES, messages);
  } catch (error) {
    console.error('❌ Error saving direct messages:', error);
    throw error;
  }
};

export const getDirectMessages = async (projectId?: string, userId?: string): Promise<DirectMessage[]> => {
  try {
    const messages = await safeAsyncStorageGet(STORAGE_KEYS.DIRECT_MESSAGES, []);
    
    if (!Array.isArray(messages)) {
      return [];
    }
    
    let validMessages = messages.filter(msg => 
      msg && typeof msg === 'object' && msg.id && msg.content
    );
    
    if (projectId && userId) {
      validMessages = validMessages.filter(msg => 
        msg.projectId === projectId && 
        (msg.senderId === userId || msg.receiverId === userId)
      );
    } else if (projectId) {
      validMessages = validMessages.filter(msg => msg.projectId === projectId);
    } else if (userId) {
      validMessages = validMessages.filter(msg => 
        msg.senderId === userId || msg.receiverId === userId
      );
    }
    
    return validMessages.sort((a, b) => 
      new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );
  } catch (error) {
    console.error('❌ Error loading direct messages:', error);
    return [];
  }
};

export const addDirectMessage = async (message: DirectMessage): Promise<void> => {
  try {
    if (!message || !message.id || !message.content) {
      throw new Error('Invalid direct message data');
    }
    
    const messages = await getDirectMessages();
    messages.push(message);
    await saveDirectMessages(messages);
    console.log('💬 Direct message added successfully');
  } catch (error) {
    console.error('❌ Error adding direct message:', error);
    throw error;
  }
};

export const getDirectMessageConversations = async (userId: string): Promise<{
  projectId: string;
  projectTitle: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: DirectMessage;
  unreadCount: number;
}[]> => {
  try {
    const messages = await getDirectMessages(undefined, userId);
    const projects = await getProjects();
    const conversations: { [key: string]: any } = {};
    
    messages.forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const conversationKey = `${message.projectId}_${otherUserId}`;
      
      if (!conversations[conversationKey] || 
          new Date(message.sentAt) > new Date(conversations[conversationKey].lastMessage.sentAt)) {
        const project = projects.find(p => p.id === message.projectId);
        conversations[conversationKey] = {
          projectId: message.projectId,
          projectTitle: project?.title || 'Unknown Project',
          otherUserId,
          otherUserName: message.senderId === userId ? message.receiverName : message.senderName,
          lastMessage: message,
          unreadCount: 0
        };
      }
    });
    
    // Calculate unread counts
    Object.keys(conversations).forEach(key => {
      const conv = conversations[key];
      conv.unreadCount = messages.filter(msg => 
        msg.projectId === conv.projectId &&
        msg.senderId === conv.otherUserId &&
        msg.receiverId === userId &&
        !msg.isRead
      ).length;
    });
    
    return Object.values(conversations).sort((a, b) => 
      new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime()
    );
  } catch (error) {
    console.error('❌ Error loading direct message conversations:', error);
    return [];
  }
};

export const markDirectMessagesAsRead = async (projectId: string, otherUserId: string, currentUserId: string): Promise<void> => {
  try {
    const messages = await getDirectMessages();
    const updatedMessages = messages.map(msg => {
      if (msg.projectId === projectId && 
          msg.senderId === otherUserId && 
          msg.receiverId === currentUserId) {
        return { ...msg, isRead: true };
      }
      return msg;
    });
    await saveDirectMessages(updatedMessages);
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    throw error;
  }
};

// Initialize with sample data
export const initializeSampleData = async (): Promise<void> => {
  try {
    // Check if sample data has already been initialized
    const isInitialized = await safeAsyncStorageGet(STORAGE_KEYS.SAMPLE_DATA_INITIALIZED, false);
    
    if (isInitialized) {
      console.log('🎵 Sample data already initialized, skipping');
      return;
    }
    
    const existingUsers = await getAllUsers();
    if (existingUsers.length > 0) {
      console.log('🎵 Users already exist, skipping sample data initialization');
      await safeAsyncStorageSet(STORAGE_KEYS.SAMPLE_DATA_INITIALIZED, true);
      return;
    }
    
    console.log('🎵 Initializing sample data...');
    
    const timestamp = getCurrentTimestamp();
    
    const sampleUsers: User[] = [
      {
        id: 'user_1',
        name: 'Alex Producer',
        role: 'producer',
        genres: ['Hip-Hop', 'R&B'],
        location: 'Los Angeles, CA',
        bio: 'Grammy-nominated producer specializing in modern hip-hop and R&B. Looking for talented vocalists and rappers.',
        highlights: [],
        collaborations: [],
        rating: 4.8,
        verified: true,
        joinDate: '2024-01-15',
        isOnboarded: true,
        lastActive: timestamp,
        createdAt: timestamp,
      },
      {
        id: 'user_2',
        name: 'Maya Vocalist',
        role: 'vocalist',
        genres: ['Pop', 'R&B'],
        location: 'Nashville, TN',
        bio: 'Professional vocalist with 10+ years experience. Featured on multiple Billboard charting songs.',
        highlights: [],
        collaborations: [],
        rating: 4.9,
        verified: true,
        joinDate: '2024-02-20',
        isOnboarded: true,
        lastActive: timestamp,
        createdAt: timestamp,
      },
      {
        id: 'user_3',
        name: 'Jordan Beats',
        role: 'producer',
        genres: ['Electronic', 'Pop'],
        location: 'New York, NY',
        bio: 'Electronic music producer and sound designer. Specializing in innovative pop productions.',
        highlights: [],
        collaborations: [],
        rating: 4.7,
        verified: false,
        joinDate: '2024-03-10',
        isOnboarded: true,
        lastActive: timestamp,
        createdAt: timestamp,
      },
      {
        id: 'user_4',
        name: 'Sophia Strings',
        role: 'instrumentalist',
        genres: ['Classical', 'Pop', 'Rock'],
        location: 'Boston, MA',
        bio: 'Professional violinist and string arranger. Classically trained with a passion for modern music.',
        highlights: [],
        collaborations: [],
        rating: 4.6,
        verified: true,
        joinDate: '2024-02-05',
        isOnboarded: true,
        lastActive: timestamp,
        createdAt: timestamp,
      },
      {
        id: 'user_5',
        name: 'Marcus Mix',
        role: 'mixer',
        genres: ['Hip-Hop', 'Pop', 'R&B'],
        location: 'Atlanta, GA',
        bio: 'Award-winning mix engineer with credits on platinum albums. Specializing in modern urban music.',
        highlights: [],
        collaborations: [],
        rating: 4.9,
        verified: true,
        joinDate: '2024-01-30',
        isOnboarded: true,
        lastActive: timestamp,
        createdAt: timestamp,
      },
    ];

    await saveAllUsers(sampleUsers);

    const sampleProjects: Project[] = [
      {
        id: 'project_1',
        title: 'Looking for Vocalist - R&B Track',
        description: 'I have a smooth R&B instrumental ready and need a talented vocalist to bring it to life. Looking for someone with experience in contemporary R&B.',
        createdBy: 'user_1',
        authorId: 'user_1',
        authorName: 'Alex Producer',
        authorRole: 'Producer',
        genres: ['R&B', 'Soul'],
        budget: '$500-1000',
        timeline: '2 weeks',
        status: 'open',
        applicants: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'project_2',
        title: 'Hip-Hop Collab - Need Rapper',
        description: 'Fresh hip-hop beat with a trap influence. Looking for a skilled rapper with their own style and flow.',
        createdBy: 'user_1',
        authorId: 'user_1',
        authorName: 'Alex Producer',
        authorRole: 'Producer',
        genres: ['Hip-Hop', 'Trap'],
        budget: '$300-500',
        timeline: '1 week',
        status: 'open',
        applicants: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'project_3',
        title: 'Pop Song Needs String Arrangement',
        description: 'Working on a pop ballad that needs beautiful string arrangements. Looking for a skilled string player or arranger.',
        createdBy: 'user_2',
        authorId: 'user_2',
        authorName: 'Maya Vocalist',
        authorRole: 'Vocalist',
        genres: ['Pop', 'Ballad'],
        budget: '$400-800',
        timeline: '3 weeks',
        status: 'open',
        applicants: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ];

    await saveProjects(sampleProjects);
    
    // Mark sample data as initialized
    await safeAsyncStorageSet(STORAGE_KEYS.SAMPLE_DATA_INITIALIZED, true);
    
    console.log('✅ Sample data initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
    // Don't throw error, just log it so app can continue
  }
};

// Clear all data (for development/testing)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    console.log('🧹 All data cleared');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};

// Debug function to check storage state
export const debugStorage = async (): Promise<void> => {
  try {
    console.log('🔍 === STORAGE DEBUG ===');
    
    const currentUser = await getCurrentUser();
    console.log('👤 Current User:', currentUser?.name || 'None');
    
    const allUsers = await getAllUsers();
    console.log('👥 All Users:', allUsers.length);
    
    const matches = await getMatches();
    console.log('💕 Matches:', matches.length);
    
    const projects = await getProjects();
    console.log('📋 Projects:', projects.length);
    
    const isInitialized = await safeAsyncStorageGet(STORAGE_KEYS.SAMPLE_DATA_INITIALIZED, false);
    console.log('🎵 Sample Data Initialized:', isInitialized);
    
    console.log('🔍 === END DEBUG ===');
  } catch (error) {
    console.error('❌ Error in debug storage:', error);
  }
};

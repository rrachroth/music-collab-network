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

// Storage Keys
const STORAGE_KEYS = {
  CURRENT_USER: 'current_user',
  ALL_USERS: 'all_users',
  MATCHES: 'matches',
  MESSAGES: 'messages',
  PROJECTS: 'projects',
  APPLICATIONS: 'applications',
  USER_PREFERENCES: 'user_preferences',
};

// Helper functions
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// User Management
export const saveCurrentUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    console.log('✅ User saved successfully');
  } catch (error) {
    console.error('❌ Error saving user:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (userData) {
      const user = JSON.parse(userData);
      console.log('👤 Current user loaded:', user.name);
      return user;
    }
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
    await AsyncStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  } catch (error) {
    console.error('❌ Error saving all users:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersData = await AsyncStorage.getItem(STORAGE_KEYS.ALL_USERS);
    if (usersData) {
      return JSON.parse(usersData);
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading all users:', error);
    return [];
  }
};

export const addUser = async (user: User): Promise<void> => {
  try {
    const allUsers = await getAllUsers();
    const updatedUsers = [...allUsers, user];
    await saveAllUsers(updatedUsers);
  } catch (error) {
    console.error('❌ Error adding user:', error);
    throw error;
  }
};

// Matches Management
export const saveMatches = async (matches: Match[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  } catch (error) {
    console.error('❌ Error saving matches:', error);
    throw error;
  }
};

export const getMatches = async (): Promise<Match[]> => {
  try {
    const matchesData = await AsyncStorage.getItem(STORAGE_KEYS.MATCHES);
    if (matchesData) {
      return JSON.parse(matchesData);
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading matches:', error);
    return [];
  }
};

export const addMatch = async (match: Match): Promise<void> => {
  try {
    const matches = await getMatches();
    const updatedMatches = [...matches, match];
    await saveMatches(updatedMatches);
    console.log('💕 Match added successfully');
  } catch (error) {
    console.error('❌ Error adding match:', error);
    throw error;
  }
};

// Messages Management
export const saveMessages = async (messages: Message[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  } catch (error) {
    console.error('❌ Error saving messages:', error);
    throw error;
  }
};

export const getMessages = async (matchId?: string): Promise<Message[]> => {
  try {
    const messagesData = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (messagesData) {
      const allMessages = JSON.parse(messagesData);
      return matchId ? allMessages.filter((msg: Message) => msg.matchId === matchId) : allMessages;
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading messages:', error);
    return [];
  }
};

export const addMessage = async (message: Message): Promise<void> => {
  try {
    const messages = await getMessages();
    const updatedMessages = [...messages, message];
    await saveMessages(updatedMessages);
    console.log('💬 Message added successfully');
  } catch (error) {
    console.error('❌ Error adding message:', error);
    throw error;
  }
};

// Projects Management
export const saveProjects = async (projects: Project[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (error) {
    console.error('❌ Error saving projects:', error);
    throw error;
  }
};

export const getProjects = async (): Promise<Project[]> => {
  try {
    const projectsData = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (projectsData) {
      return JSON.parse(projectsData);
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading projects:', error);
    return [];
  }
};

export const addProject = async (project: Project): Promise<void> => {
  try {
    const projects = await getProjects();
    const updatedProjects = [...projects, project];
    await saveProjects(updatedProjects);
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
    await AsyncStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
  } catch (error) {
    console.error('❌ Error saving applications:', error);
    throw error;
  }
};

export const getApplications = async (projectId?: string): Promise<Application[]> => {
  try {
    const applicationsData = await AsyncStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    if (applicationsData) {
      const allApplications = JSON.parse(applicationsData);
      return projectId ? allApplications.filter((app: Application) => app.projectId === projectId) : allApplications;
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading applications:', error);
    return [];
  }
};

export const addApplication = async (application: Application): Promise<void> => {
  try {
    const applications = await getApplications();
    const updatedApplications = [...applications, application];
    await saveApplications(updatedApplications);
    console.log('📝 Application added successfully');
  } catch (error) {
    console.error('❌ Error adding application:', error);
    throw error;
  }
};

// Initialize with sample data
export const initializeSampleData = async (): Promise<void> => {
  try {
    const existingUsers = await getAllUsers();
    if (existingUsers.length === 0) {
      console.log('🎵 Initializing sample data...');
      
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
          lastActive: getCurrentTimestamp(),
          createdAt: getCurrentTimestamp(),
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
          lastActive: getCurrentTimestamp(),
          createdAt: getCurrentTimestamp(),
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
          lastActive: getCurrentTimestamp(),
          createdAt: getCurrentTimestamp(),
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
          lastActive: getCurrentTimestamp(),
          createdAt: getCurrentTimestamp(),
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
          lastActive: getCurrentTimestamp(),
          createdAt: getCurrentTimestamp(),
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
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
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
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
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
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        },
      ];

      await saveProjects(sampleProjects);
      console.log('✅ Sample data initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
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
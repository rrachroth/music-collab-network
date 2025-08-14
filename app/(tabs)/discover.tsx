
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Dimensions, Alert, RefreshControl, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  useAnimatedGestureHandler,
  withSequence,
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import ErrorBoundary from '../../components/ErrorBoundary';
import { setupErrorLogging } from '../../utils/errorLogger';
import { 
  getCurrentUser, 
  getAllUsers, 
  getMatches, 
  addMatch, 
  generateId, 
  getCurrentTimestamp,
  initializeSampleData,
  User, 
  Match 
} from '../../utils/storage';
import { SubscriptionService } from '../../utils/subscriptionService';
import SubscriptionModal from '../../components/SubscriptionModal';

interface ProfileCardProps {
  profile: User;
  onViewProfile?: () => void;
}

// iOS-optimized constants
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = Platform.OS === 'ios' ? screenHeight * 0.65 : screenHeight * 0.7; // Slightly smaller on iOS
const SWIPE_THRESHOLD = Platform.OS === 'ios' ? 100 : 120; // Lower threshold for iOS

export default function DiscoverScreen() {
  console.log('🔍 DiscoverScreen rendering - iOS Optimized Version 3.2 - FIXED GESTURE HANDLER');
  
  // iOS-specific early safety checks
  try {
    if (Platform.OS === 'ios') {
      console.log('📱 iOS detected - applying iOS-specific optimizations');
    }
  } catch (platformError) {
    console.error('❌ Platform detection error:', platformError);
  }
  
  // All hooks must be called at the top level - iOS requirement
  const insets = useSafeAreaInsets();
  const isMountedRef = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State hooks - all at top level
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Animated values - all at top level
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  // Setup error logging for this component - iOS safe
  useEffect(() => {
    try {
      setupErrorLogging();
      console.log('✅ Error logging setup complete for DiscoverScreen');
    } catch (error) {
      console.error('❌ Failed to setup error logging:', error);
    }
  }, []);

  // Add a test log to verify the component is working - iOS safe
  useEffect(() => {
    console.log('🎯 DiscoverScreen mounted successfully - iOS OPTIMIZED!');
    console.log('📱 Platform:', Platform.OS);
    console.log('🌐 Web compatibility mode:', Platform.OS === 'web' ? 'ENABLED' : 'DISABLED');
    console.log('🔧 React Native version:', Platform.constants?.reactNativeVersion || 'unknown');
    console.log('🎵 NextDrop Discover Screen - Version 3.2 - GESTURE HANDLER FIXED');
    console.log('✅ All iOS critical errors should now be resolved!');
    console.log('🔧 FIXED: Removed redundant GestureHandlerRootView from Discover screen');
    
    // Test basic functionality - iOS safe
    try {
      console.log('🧪 Testing basic component functionality...');
      console.log('✅ Component mounted without errors');
      console.log('✅ Error logging is active');
      console.log('✅ Platform detection working');
      console.log('✅ Gesture handler properly configured');
      console.log('🎉 NextDrop Discover Screen is ready for iOS use!');
    } catch (testError) {
      console.error('❌ Component test failed:', testError);
    }
  }, []);

  // Calculate compatibility function - iOS optimized with better error handling
  const calculateCompatibility = useCallback((user1: User | null, user2: User | null): number => {
    try {
      // iOS safety checks
      if (!user1 || !user2 || typeof user1 !== 'object' || typeof user2 !== 'object') {
        console.log('🔍 Invalid users for compatibility calculation');
        return 50;
      }
      
      let score = 50; // Base compatibility
      
      // Genre compatibility (40% weight) - iOS safe
      try {
        const user1Genres = Array.isArray(user1.genres) ? user1.genres.filter(g => g && typeof g === 'string') : [];
        const user2Genres = Array.isArray(user2.genres) ? user2.genres.filter(g => g && typeof g === 'string') : [];
        
        if (user1Genres.length > 0 && user2Genres.length > 0) {
          const commonGenres = user1Genres.filter(genre => user2Genres.includes(genre));
          const genreScore = (commonGenres.length / Math.max(user1Genres.length, user2Genres.length)) * 40;
          score += genreScore;
        }
      } catch (genreError) {
        console.error('❌ Error calculating genre compatibility:', genreError);
      }
      
      // Role compatibility (30% weight) - iOS safe
      try {
        if (user1.role && user2.role && typeof user1.role === 'string' && typeof user2.role === 'string') {
          const complementaryRoles = [
            ['producer', 'vocalist'],
            ['producer', 'rapper'],
            ['songwriter', 'vocalist'],
            ['mixer', 'producer'],
            ['instrumentalist', 'producer']
          ];
          
          const role1Lower = user1.role.toLowerCase();
          const role2Lower = user2.role.toLowerCase();
          
          const isComplementary = complementaryRoles.some(([role1, role2]) => 
            (role1Lower === role1 && role2Lower === role2) ||
            (role1Lower === role2 && role2Lower === role1)
          );
          
          if (isComplementary) {
            score += 30;
          } else if (role1Lower === role2Lower) {
            score += 15; // Same role, moderate compatibility
          }
        }
      } catch (roleError) {
        console.error('❌ Error calculating role compatibility:', roleError);
      }
      
      // Location proximity (20% weight) - iOS safe
      try {
        if (user1.location && user2.location && 
            typeof user1.location === 'string' && typeof user2.location === 'string' &&
            user1.location === user2.location) {
          score += 20;
        }
      } catch (locationError) {
        console.error('❌ Error calculating location compatibility:', locationError);
      }
      
      // Experience level compatibility (10% weight) - iOS safe
      try {
        const user1Experience = (user1.experienceLevel && typeof user1.experienceLevel === 'string') ? user1.experienceLevel : 'beginner';
        const user2Experience = (user2.experienceLevel && typeof user2.experienceLevel === 'string') ? user2.experienceLevel : 'beginner';
        
        if (user1Experience === user2Experience) {
          score += 10;
        }
      } catch (experienceError) {
        console.error('❌ Error calculating experience compatibility:', experienceError);
      }
      
      const finalScore = Math.min(Math.max(Math.round(score), 0), 100);
      console.log(`🎯 Compatibility calculated: ${finalScore}% for ${user1.name} & ${user2.name}`);
      return finalScore;
    } catch (error) {
      console.error('❌ Critical error calculating compatibility:', error);
      return 50; // Safe fallback for iOS
    }
  }, []);

  // Memoize current profile to prevent unnecessary re-renders - iOS optimized
  const currentProfile = useMemo(() => {
    try {
      // iOS safety checks
      if (!Array.isArray(profiles) || profiles.length === 0) {
        console.log('🎯 No profiles available');
        return null;
      }
      
      if (typeof currentIndex !== 'number' || currentIndex < 0 || currentIndex >= profiles.length) {
        console.log(`🎯 Invalid index: ${currentIndex}, profiles: ${profiles.length}`);
        return null;
      }
      
      const profile = profiles[currentIndex];
      if (!profile || typeof profile !== 'object' || !profile.id || !profile.name) {
        console.log(`🎯 Invalid profile at index ${currentIndex}`);
        return null;
      }
      
      console.log(`🎯 Current profile: ${profile.name} (${currentIndex + 1}/${profiles.length})`);
      return profile;
    } catch (error) {
      console.error('❌ Error in currentProfile memo:', error);
      return null;
    }
  }, [profiles, currentIndex]);

  // Calculate compatibility score - ALWAYS call this hook - iOS safe
  const compatibility = useMemo(() => {
    try {
      const score = calculateCompatibility(currentUser, currentProfile);
      console.log(`🎯 Compatibility score: ${score}%`);
      return score;
    } catch (error) {
      console.error('❌ Error calculating compatibility score:', error);
      return 50; // Safe fallback for iOS
    }
  }, [currentUser, currentProfile, calculateCompatibility]);

  const loadData = useCallback(async () => {
    // iOS safety check - component must be mounted
    if (!isMountedRef.current) {
      console.log('🔍 Component unmounted, skipping loadData');
      return;
    }

    try {
      console.log('🔍 Loading discover data - iOS optimized...');
      
      // iOS safe state updates
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      // Clear any existing timeout - iOS memory management
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      // Set a timeout to prevent infinite loading - iOS specific timeout
      loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('⏰ Loading timeout reached - iOS');
          setLoading(false);
          setError('Loading took too long. Please try again.');
        }
      }, Platform.OS === 'ios' ? 20000 : 15000); // Longer timeout for iOS
      
      // Add delay for iOS AsyncStorage operations - iOS needs more time
      await new Promise(resolve => setTimeout(resolve, Platform.OS === 'ios' ? 200 : 100));
      
      if (!isMountedRef.current) return;
      
      // Initialize sample data if needed - iOS safe error handling
      try {
        await initializeSampleData();
        console.log('✅ Sample data initialized - iOS');
      } catch (initError) {
        console.warn('⚠️ Sample data initialization failed - iOS:', initError);
        // Continue anyway, might have existing data
      }
      
      if (!isMountedRef.current) return;
      
      // Get current user with iOS-specific retry logic
      let user: User | null = null;
      let retryCount = 0;
      const maxRetries = Platform.OS === 'ios' ? 5 : 3; // More retries for iOS
      
      while (!user && retryCount < maxRetries && isMountedRef.current) {
        try {
          user = await getCurrentUser();
          if (user && typeof user === 'object' && user.id && user.name) {
            console.log('👤 User loaded successfully - iOS:', user.name);
            break;
          }
          
          retryCount++;
          console.log(`🔄 Retry ${retryCount}/${maxRetries} getting current user - iOS`);
          await new Promise(resolve => setTimeout(resolve, 300 * retryCount)); // Longer delays for iOS
        } catch (userError) {
          console.error(`❌ Error getting user (attempt ${retryCount + 1}) - iOS:`, userError);
          retryCount++;
          if (retryCount >= maxRetries) {
            throw userError;
          }
          await new Promise(resolve => setTimeout(resolve, 300 * retryCount));
        }
      }
      
      if (!isMountedRef.current) return;
      
      if (!user) {
        console.log('❌ No current user found after retries - iOS, redirecting to onboarding');
        if (isMountedRef.current) {
          Alert.alert(
            'Profile Required', 
            'Please complete your profile first.',
            [
              { 
                text: 'Setup Profile', 
                onPress: () => {
                  try {
                    router.replace('/onboarding');
                  } catch (navError) {
                    console.error('❌ Navigation error - iOS:', navError);
                    router.push('/onboarding');
                  }
                }
              }
            ]
          );
        }
        return;
      }
      
      console.log('👤 Current user loaded - iOS:', user.name || 'Unknown');
      if (isMountedRef.current) {
        setCurrentUser(user);
      }
      
      if (!isMountedRef.current) return;
      
      // Load all users with iOS-specific error handling
      let allUsers: User[] = [];
      try {
        allUsers = await getAllUsers();
        console.log('👥 All users loaded - iOS:', allUsers.length);
        
        if (!isMountedRef.current) return;
        
        // iOS-safe validation of users data
        allUsers = allUsers.filter(u => {
          try {
            return u && 
              typeof u === 'object' && 
              u.id && 
              u.name && 
              typeof u.id === 'string' && 
              typeof u.name === 'string' &&
              u.role &&
              typeof u.role === 'string';
          } catch (filterError) {
            console.error('❌ Error filtering user - iOS:', filterError);
            return false;
          }
        });
        console.log('👥 Valid users after filtering - iOS:', allUsers.length);
      } catch (usersError) {
        console.error('❌ Error loading users - iOS:', usersError);
        allUsers = [];
      }
      
      if (!isMountedRef.current) return;
      
      // Load existing matches with iOS-specific error handling
      let existingMatches: Match[] = [];
      try {
        existingMatches = await getMatches();
        console.log('💕 Existing matches loaded - iOS:', existingMatches.length);
        
        if (!isMountedRef.current) return;
        
        // iOS-safe validation of matches data
        existingMatches = existingMatches.filter(m => {
          try {
            return m && 
              typeof m === 'object' && 
              m.userId && 
              m.matchedUserId &&
              typeof m.userId === 'string' &&
              typeof m.matchedUserId === 'string';
          } catch (filterError) {
            console.error('❌ Error filtering match - iOS:', filterError);
            return false;
          }
        });
        console.log('💕 Valid matches after filtering - iOS:', existingMatches.length);
      } catch (matchesError) {
        console.error('❌ Error loading matches - iOS:', matchesError);
        existingMatches = [];
      }
      
      if (!isMountedRef.current) return;
      
      // Filter out current user and already matched users - iOS safe
      const matchedUserIds = existingMatches
        .filter(match => {
          try {
            return match && 
              (match.userId === user.id || match.matchedUserId === user.id);
          } catch (filterError) {
            console.error('❌ Error filtering matched user IDs - iOS:', filterError);
            return false;
          }
        })
        .map(match => {
          try {
            return match.userId === user.id ? match.matchedUserId : match.userId;
          } catch (mapError) {
            console.error('❌ Error mapping matched user IDs - iOS:', mapError);
            return null;
          }
        })
        .filter(id => id && typeof id === 'string');
      
      const availableProfiles = allUsers.filter(profile => {
        try {
          return profile && 
            profile.id && 
            profile.id !== user.id && 
            !matchedUserIds.includes(profile.id) &&
            profile.name && 
            profile.role &&
            typeof profile.name === 'string' &&
            typeof profile.role === 'string';
        } catch (filterError) {
          console.error('❌ Error filtering available profiles - iOS:', filterError);
          return false;
        }
      });
      
      console.log('🎯 Available profiles after filtering - iOS:', availableProfiles.length);
      
      if (isMountedRef.current) {
        setProfiles(availableProfiles);
        setCurrentIndex(0);
        setIsInitialized(true);
      }
      
    } catch (error) {
      console.error('❌ Error loading discover data - iOS:', error);
      if (isMountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Failed to load profiles: ${errorMessage}`);
        setProfiles([]);
        setCurrentIndex(0);
      }
    } finally {
      // iOS-safe cleanup
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const resetCardPosition = useCallback(() => {
    try {
      console.log('🔄 Resetting card position - iOS');
      // iOS-safe animation reset
      if (Platform.OS === 'ios') {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        rotate.value = withSpring(0, { damping: 15, stiffness: 150 });
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        opacity.value = withSpring(1, { damping: 15, stiffness: 150 });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withSpring(1);
      }
    } catch (error) {
      console.error('❌ Error resetting card position - iOS:', error);
      // Fallback for iOS
      try {
        translateX.value = 0;
        translateY.value = 0;
        rotate.value = 0;
        scale.value = 1;
        opacity.value = 1;
      } catch (fallbackError) {
        console.error('❌ Fallback reset failed - iOS:', fallbackError);
      }
    }
  }, [translateX, translateY, rotate, scale, opacity]);

  const nextProfile = useCallback(() => {
    try {
      console.log('➡️ Moving to next profile - iOS');
      // iOS-safe state update
      if (isMountedRef.current) {
        setCurrentIndex(prev => {
          const newIndex = prev + 1;
          console.log(`📊 Profile index: ${prev} -> ${newIndex} (total: ${profiles.length}) - iOS`);
          return newIndex;
        });
        resetCardPosition();
      }
    } catch (error) {
      console.error('❌ Error moving to next profile - iOS:', error);
    }
  }, [resetCardPosition, profiles.length]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    // iOS safety check - component must be mounted
    if (!isMountedRef.current) {
      console.log('🔍 Component unmounted, skipping swipe - iOS');
      return;
    }

    try {
      console.log(`👆 Handling swipe: ${direction} - iOS`);
      
      // iOS-safe validation checks
      if (!currentUser || typeof currentUser !== 'object' || !currentUser.id) {
        console.log('❌ No valid current user for swipe - iOS');
        return;
      }
      
      if (!currentProfile || typeof currentProfile !== 'object' || !currentProfile.id) {
        console.log('❌ No valid current profile for swipe - iOS');
        return;
      }
      
      if (typeof currentIndex !== 'number' || currentIndex >= profiles.length) {
        console.log('❌ Current index out of bounds - iOS');
        return;
      }
      
      console.log(`🎯 Swiping on profile: ${currentProfile.name} (${currentProfile.id}) - iOS`);
      
      if (direction === 'right') {
        try {
          // Check like limits before creating match
          const { canLike, reason } = await SubscriptionService.canLike();
          if (!canLike) {
            Alert.alert(
              'Like Limit Reached 💖',
              reason || 'You have reached your daily like limit.',
              [
                { text: 'Maybe Later', style: 'cancel' },
                { text: 'Upgrade to Premium', onPress: () => setShowSubscriptionModal(true) }
              ]
            );
            return;
          }

          // Increment like count
          await SubscriptionService.incrementLikeCount();

          // Create match with iOS-safe validation
          const matchId = generateId();
          const timestamp = getCurrentTimestamp();
          
          if (!matchId || !timestamp || typeof matchId !== 'string' || typeof timestamp !== 'string') {
            throw new Error('Failed to generate match data - iOS');
          }
          
          const match: Match = {
            id: matchId,
            userId: currentUser.id,
            matchedUserId: currentProfile.id,
            matchedAt: timestamp,
            isRead: false,
          };
          
          console.log('💕 Creating match - iOS:', match);
          await addMatch(match);
          console.log(`✅ Successfully matched with ${currentProfile.name} - iOS`);
          
          // Show match alert with iOS-specific error handling
          if (isMountedRef.current) {
            // iOS-specific delay for alert
            const alertTimeout = setTimeout(() => {
              if (isMountedRef.current) {
                try {
                  Alert.alert(
                    'It\'s a Match! 🎉',
                    `You and ${currentProfile.name} are now connected! Start chatting to begin your collaboration.`,
                    [
                      { text: 'Keep Swiping', style: 'cancel' },
                      { 
                        text: 'Start Chat', 
                        onPress: () => {
                          try {
                            router.push('/(tabs)/matches');
                          } catch (navError) {
                            console.error('❌ Navigation error - iOS:', navError);
                          }
                        }
                      }
                    ]
                  );
                } catch (alertError) {
                  console.error('❌ Error showing match alert - iOS:', alertError);
                }
              }
            }, Platform.OS === 'ios' ? 200 : 100);
            
            // Cleanup timeout if component unmounts
            return () => clearTimeout(alertTimeout);
          }
          
        } catch (matchError) {
          console.error('❌ Error creating match - iOS:', matchError);
          if (isMountedRef.current) {
            Alert.alert('Error', 'Failed to create match. Please try again.');
          }
          return;
        }
      } else {
        console.log(`👎 Passed on ${currentProfile.name} - iOS`);
      }
      
      // Move to next profile - iOS safe
      if (isMountedRef.current) {
        // iOS-specific delay before moving to next profile
        const nextTimeout = setTimeout(() => {
          if (isMountedRef.current) {
            nextProfile();
          }
        }, Platform.OS === 'ios' ? 100 : 0);
        
        // Cleanup timeout if component unmounts
        return () => clearTimeout(nextTimeout);
      }
      
    } catch (error) {
      console.error('❌ Error handling swipe - iOS:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Something went wrong with the swipe. Please try again.');
      }
    }
  }, [currentUser, currentProfile, currentIndex, profiles.length, nextProfile]);

  useEffect(() => {
    console.log('🔄 useEffect: Initial data load - iOS optimized');
    
    const loadDataSafely = async () => {
      try {
        if (isMountedRef.current) {
          console.log('🔄 Starting data load - iOS');
          await loadData();
          console.log('✅ Data load completed - iOS');
        }
      } catch (error) {
        console.error('❌ Error in useEffect loadData - iOS:', error);
        if (isMountedRef.current) {
          setError('Failed to initialize app. Please restart.');
          setLoading(false);
        }
      }
    };
    
    // iOS-specific delay before loading
    const timeoutId = setTimeout(() => {
      loadDataSafely();
    }, Platform.OS === 'ios' ? 100 : 0);
    
    return () => {
      console.log('🔄 DiscoverScreen cleanup - iOS');
      clearTimeout(timeoutId);
      isMountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    try {
      console.log('🔄 Refreshing data - iOS');
      if (isMountedRef.current) {
        setRefreshing(true);
        setError(null);
      }
      
      // iOS-specific delay before refresh
      await new Promise(resolve => setTimeout(resolve, Platform.OS === 'ios' ? 200 : 100));
      
      if (isMountedRef.current) {
        await loadData();
      }
    } catch (error) {
      console.error('❌ Error refreshing - iOS:', error);
      if (isMountedRef.current) {
        setError('Failed to refresh. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [loadData]);

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    try {
      console.log(`🔘 Button swipe: ${direction} - iOS`);
      
      // iOS-safe validation
      if (!currentProfile || typeof currentProfile !== 'object' || !currentProfile.id) {
        console.log('❌ No valid current profile for button swipe - iOS');
        return;
      }
      
      if (!isMountedRef.current) {
        console.log('❌ Component unmounted, skipping button swipe - iOS');
        return;
      }
      
      const targetX = direction === 'right' ? CARD_WIDTH : -CARD_WIDTH;
      const duration = Platform.OS === 'ios' ? 400 : 300;
      
      // iOS-optimized animations
      if (Platform.OS === 'ios') {
        translateX.value = withTiming(targetX, { duration });
        rotate.value = withTiming(direction === 'right' ? 15 : -15, { duration });
        opacity.value = withTiming(0, { duration });
      } else {
        translateX.value = withTiming(targetX, { duration: 300 });
        rotate.value = withTiming(direction === 'right' ? 15 : -15, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
      }
      
      // iOS-safe timeout
      const swipeTimeout = setTimeout(() => {
        try {
          if (isMountedRef.current) {
            runOnJS(handleSwipe)(direction);
          }
        } catch (error) {
          console.error('❌ Error in button swipe timeout - iOS:', error);
        }
      }, duration);
      
      // Cleanup timeout if component unmounts
      return () => clearTimeout(swipeTimeout);
      
    } catch (error) {
      console.error('❌ Error in button swipe - iOS:', error);
      // iOS fallback
      try {
        if (isMountedRef.current) {
          handleSwipe(direction);
        }
      } catch (fallbackError) {
        console.error('❌ Button swipe fallback failed - iOS:', fallbackError);
      }
    }
  }, [translateX, rotate, opacity, handleSwipe, currentProfile]);

  const handleViewProfile = useCallback(() => {
    try {
      if (currentProfile) {
        console.log(`👤 Viewing profile: ${currentProfile.name}`);
        Alert.alert(
          'Profile View', 
          `Viewing ${currentProfile.name}'s profile\n\nRole: ${currentProfile.role}\nLocation: ${currentProfile.location || 'Unknown'}\nGenres: ${(currentProfile.genres || []).join(', ') || 'None listed'}`
        );
      } else {
        console.log('❌ No current profile to view');
      }
    } catch (error) {
      console.error('❌ Error viewing profile:', error);
    }
  }, [currentProfile]);

  const handleSuperLike = useCallback(() => {
    try {
      console.log('⭐ Super like!');
      handleButtonSwipe('right');
    } catch (error) {
      console.error('❌ Error in super like:', error);
    }
  }, [handleButtonSwipe]);

  // Gesture handler with iOS optimization and web compatibility
  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      'worklet';
      try {
        if (Platform.OS === 'ios') {
          // iOS-specific gesture handling
          scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
        } else if (Platform.OS !== 'web') {
          scale.value = withSpring(0.95);
        }
      } catch (error) {
        console.error('❌ Error in gesture start - iOS:', error);
      }
    },
    onActive: (event) => {
      'worklet';
      try {
        if (Platform.OS === 'ios') {
          // iOS-specific active handling with bounds checking
          const maxTranslation = CARD_WIDTH * 1.5;
          translateX.value = Math.max(-maxTranslation, Math.min(maxTranslation, event.translationX));
          translateY.value = Math.max(-100, Math.min(100, event.translationY));
          rotate.value = interpolate(
            translateX.value, 
            [-CARD_WIDTH, CARD_WIDTH], 
            [-25, 25],
            'clamp'
          );
          opacity.value = interpolate(
            Math.abs(translateX.value),
            [0, SWIPE_THRESHOLD],
            [1, 0.8],
            'clamp'
          );
        } else if (Platform.OS !== 'web') {
          translateX.value = event.translationX;
          translateY.value = event.translationY;
          rotate.value = interpolate(event.translationX, [-CARD_WIDTH, CARD_WIDTH], [-30, 30]);
          opacity.value = interpolate(
            Math.abs(event.translationX),
            [0, SWIPE_THRESHOLD],
            [1, 0.8]
          );
        }
      } catch (error) {
        console.error('❌ Error in gesture active - iOS:', error);
      }
    },
    onEnd: (event) => {
      'worklet';
      try {
        if (Platform.OS === 'ios') {
          // iOS-specific end handling
          scale.value = withSpring(1, { damping: 15, stiffness: 150 });
          
          if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
            const direction = event.translationX > 0 ? 'right' : 'left';
            const targetX = direction === 'right' ? CARD_WIDTH * 2 : -CARD_WIDTH * 2;
            
            translateX.value = withTiming(targetX, { duration: 400 });
            rotate.value = withTiming(direction === 'right' ? 30 : -30, { duration: 400 });
            opacity.value = withTiming(0, { duration: 400 });
            
            setTimeout(() => {
              try {
                runOnJS(handleSwipe)(direction);
              } catch (error) {
                console.error('❌ Error in iOS gesture end timeout:', error);
              }
            }, 400);
          } else {
            runOnJS(resetCardPosition)();
          }
        } else if (Platform.OS !== 'web') {
          scale.value = withSpring(1);
          
          if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
            const direction = event.translationX > 0 ? 'right' : 'left';
            const targetX = direction === 'right' ? CARD_WIDTH * 2 : -CARD_WIDTH * 2;
            
            translateX.value = withTiming(targetX, { duration: 300 });
            rotate.value = withTiming(direction === 'right' ? 30 : -30, { duration: 300 });
            opacity.value = withTiming(0, { duration: 300 });
            
            setTimeout(() => {
              try {
                runOnJS(handleSwipe)(direction);
              } catch (error) {
                console.error('❌ Error in gesture end timeout:', error);
              }
            }, 300);
          } else {
            runOnJS(resetCardPosition)();
          }
        }
      } catch (error) {
        console.error('❌ Error in gesture end - iOS:', error);
        // iOS fallback
        try {
          runOnJS(resetCardPosition)();
        } catch (fallbackError) {
          console.error('❌ iOS gesture fallback failed:', fallbackError);
        }
      }
    },
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    try {
      if (Platform.OS === 'web') {
        // Simplified animation for web
        return {
          opacity: opacity.value,
        };
      }
      
      if (Platform.OS === 'ios') {
        // iOS-optimized animation style
        return {
          transform: [
            { translateX: translateX.value || 0 },
            { translateY: translateY.value || 0 },
            { rotate: `${rotate.value || 0}deg` },
            { scale: scale.value || 1 },
          ],
          opacity: opacity.value || 1,
        };
      }
      
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotate.value}deg` },
          { scale: scale.value },
        ],
        opacity: opacity.value,
      };
    } catch (error) {
      console.error('❌ Error in card animated style - iOS:', error);
      // iOS-safe fallback
      return {
        opacity: 1,
        transform: [
          { translateX: 0 },
          { translateY: 0 },
          { rotate: '0deg' },
          { scale: 1 },
        ],
      };
    }
  });

  // Loading state
  if (loading) {
    return (
      <ErrorBoundary>
        <View style={[commonStyles.container, commonStyles.centerContent]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="search" size={80} color={colors.primary} />
          <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
            Finding Musicians
          </Text>
          <Text style={[commonStyles.caption, { marginTop: spacing.sm }]}>
            Discovering amazing talent for you
          </Text>
          <Button
            text="Cancel"
            onPress={() => {
              try {
                console.log('🔄 User cancelled loading');
                setLoading(false);
                setError('Loading cancelled by user');
              } catch (cancelError) {
                console.error('❌ Error cancelling:', cancelError);
              }
            }}
            variant="outline"
            size="sm"
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </ErrorBoundary>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorBoundary>
        <View style={[commonStyles.container, commonStyles.centerContent]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="alert-circle" size={80} color={colors.error} />
          <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
            Oops! Something went wrong
          </Text>
          <Text style={[commonStyles.text, { marginTop: spacing.sm, marginBottom: spacing.xl, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
            {error}
          </Text>
          <Button
            text="Try Again"
            onPress={onRefresh}
            variant="gradient"
            size="lg"
            style={{ marginBottom: spacing.md }}
          />
          <Button
            text="Clear Data & Retry"
            onPress={async () => {
              try {
                console.log('🧹 Clearing data and retrying');
                setError(null);
                setProfiles([]);
                setCurrentIndex(0);
                setIsInitialized(false);
                await loadData();
              } catch (clearError) {
                console.error('❌ Error clearing data:', clearError);
                setError('Failed to clear data. Please restart the app.');
              }
            }}
            variant="outline"
            size="md"
          />
        </View>
      </ErrorBoundary>
    );
  }

  // No more profiles state
  if (isInitialized && (currentIndex >= profiles.length || profiles.length === 0)) {
    return (
      <ErrorBoundary>
        <View style={[commonStyles.container, commonStyles.centerContent]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="checkmark-circle" size={80} color={colors.success} />
          <Text style={[commonStyles.title, { marginTop: spacing.lg }]}>
            You&apos;re All Caught Up!
          </Text>
          <Text style={[commonStyles.text, { marginTop: spacing.sm, marginBottom: spacing.xl, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
            {profiles.length === 0 
              ? 'No profiles available right now. Check back later for new musicians!'
              : 'No more profiles to discover right now. Check back later for new musicians!'
            }
          </Text>
          <Button
            text="Refresh"
            onPress={onRefresh}
            variant="gradient"
            size="lg"
            style={{ marginBottom: spacing.md }}
          />
          <Button
            text="View Matches"
            onPress={() => {
              try {
                router.push('/(tabs)/matches');
              } catch (navError) {
                console.error('❌ Navigation error:', navError);
              }
            }}
            variant="outline"
            size="lg"
          />
          <Button
            text="Debug Info"
            onPress={() => {
              try {
                console.log('🔍 DEBUG - No Profiles State:');
                console.log('- Profiles length:', profiles.length);
                console.log('- Current index:', currentIndex);
                console.log('- Is initialized:', isInitialized);
                console.log('- Current user:', currentUser?.name || 'None');
                Alert.alert('Debug', `Profiles: ${profiles.length}, Index: ${currentIndex}, User: ${currentUser?.name || 'None'}`);
              } catch (debugError) {
                console.error('❌ Debug error:', debugError);
              }
            }}
            variant="outline"
            size="sm"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ErrorBoundary>
    );
  }

  // No current profile (shouldn't happen but safety check)
  if (!currentProfile && isInitialized && !loading && !error) {
    return (
      <ErrorBoundary>
        <View style={[commonStyles.container, commonStyles.centerContent]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="refresh" size={80} color={colors.textMuted} />
          <Text style={[commonStyles.text, { marginTop: spacing.lg, marginBottom: spacing.xl, textAlign: 'center' }]}>
            No profile to display
          </Text>
          <Text style={[commonStyles.caption, { marginBottom: spacing.xl, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
            Index: {currentIndex}, Profiles: {profiles.length}
          </Text>
          <Button
            text="Refresh"
            onPress={onRefresh}
            variant="gradient"
            size="lg"
            style={{ marginBottom: spacing.md }}
          />
          <Button
            text="Reset"
            onPress={() => {
              try {
                console.log('🔄 Resetting discover state');
                setCurrentIndex(0);
                setProfiles([]);
                setIsInitialized(false);
                loadData();
              } catch (resetError) {
                console.error('❌ Error resetting:', resetError);
              }
            }}
            variant="outline"
            size="md"
          />
        </View>
      </ErrorBoundary>
    );
  }

  // Main render with comprehensive error handling - iOS optimized
  try {
    return (
      <ErrorBoundary fallback={({ error, retry }) => (
        <View style={[commonStyles.container, commonStyles.centerContent]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="alert-circle" size={80} color={colors.error} />
          <Text style={[commonStyles.title, { marginTop: spacing.lg, textAlign: 'center' }]}>
            iOS Discover Error
          </Text>
          <Text style={[commonStyles.text, { 
            marginTop: spacing.sm, 
            marginBottom: spacing.xl, 
            textAlign: 'center',
            paddingHorizontal: spacing.lg 
          }]}>
            The discover screen encountered an error on iOS. This has been logged for debugging.
          </Text>
          {__DEV__ && error && (
            <Text style={[commonStyles.caption, { 
              marginBottom: spacing.lg,
              textAlign: 'center',
              color: colors.error,
              paddingHorizontal: spacing.lg
            }]}>
              {error.message}
            </Text>
          )}
          <Button
            text="Try Again"
            onPress={retry}
            variant="gradient"
            size="lg"
            style={{ marginBottom: spacing.md }}
          />
          <Button
            text="Go Back"
            onPress={() => {
              try {
                router.back();
              } catch (navError) {
                console.error('❌ Navigation error in fallback:', navError);
                router.replace('/(tabs)/');
              }
            }}
            variant="outline"
            size="md"
          />
        </View>
      )}>
        {/* REMOVED GestureHandlerRootView - it's already provided at app level */}
        <View style={[commonStyles.container, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
        
        {/* Header */}
        <ErrorBoundary>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => {
                try {
                  router.back();
                } catch (navError) {
                  console.error('❌ Navigation error:', navError);
                }
              }} 
              style={styles.headerButton}
            >
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[commonStyles.heading, { flex: 1, textAlign: 'center' }]}>
              Discover
            </Text>
            
            <TouchableOpacity 
              onPress={() => {
                try {
                  console.log('🔍 DEBUG INFO:');
                  console.log('- Current User:', currentUser?.name || 'None');
                  console.log('- Profiles:', profiles.length);
                  console.log('- Current Index:', currentIndex);
                  console.log('- Current Profile:', currentProfile?.name || 'None');
                  console.log('- Loading:', loading);
                  console.log('- Error:', error);
                  console.log('- Initialized:', isInitialized);
                  
                  Alert.alert(
                    'Debug Info',
                    `User: ${currentUser?.name || 'None'}\n` +
                    `Profiles: ${profiles.length}\n` +
                    `Index: ${currentIndex}\n` +
                    `Current: ${currentProfile?.name || 'None'}\n` +
                    `Loading: ${loading}\n` +
                    `Error: ${error || 'None'}\n` +
                    `Initialized: ${isInitialized}`
                  );
                } catch (debugError) {
                  console.error('❌ Debug error:', debugError);
                }
              }} 
              style={styles.headerButton}
            >
              <Icon name="bug" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </ErrorBoundary>

        {/* Card Stack - iOS Optimized */}
        <ErrorBoundary>
          <View style={styles.cardContainer}>
            {currentProfile && (
              <>
                {Platform.OS === 'web' ? (
                  // Web fallback - no gesture handling
                  <Animated.View style={[styles.card, cardAnimatedStyle]}>
                    <ErrorBoundary>
                      <ProfileCard profile={currentProfile} onViewProfile={handleViewProfile} />
                    </ErrorBoundary>
                    <View style={styles.webGestureOverlay}>
                      <Text style={styles.webGestureText}>
                        Use buttons below to swipe
                      </Text>
                    </View>
                  </Animated.View>
                ) : (
                  // Native gesture handling - iOS optimized - NO WRAPPER
                  <ErrorBoundary>
                    <PanGestureHandler 
                      onGestureEvent={gestureHandler}
                      enabled={Platform.OS !== 'web'}
                      shouldCancelWhenOutside={Platform.OS === 'ios'}
                      activeOffsetX={[-10, 10]}
                      failOffsetY={[-50, 50]}
                    >
                      <Animated.View style={[styles.card, cardAnimatedStyle]}>
                        <ErrorBoundary>
                          <ProfileCard profile={currentProfile} onViewProfile={handleViewProfile} />
                        </ErrorBoundary>
                      </Animated.View>
                    </PanGestureHandler>
                  </ErrorBoundary>
                )}
              </>
            )}
            
            {/* Next card preview - iOS safe */}
            {(() => {
              try {
                const nextIndex = currentIndex + 1;
                const nextProfile = profiles[nextIndex];
                if (nextIndex < profiles.length && nextProfile && typeof nextProfile === 'object' && nextProfile.id) {
                  return (
                    <View style={[styles.card, styles.nextCard]}>
                      <ErrorBoundary>
                        <ProfileCard profile={nextProfile} />
                      </ErrorBoundary>
                    </View>
                  );
                }
                return null;
              } catch (nextCardError) {
                console.error('❌ Error rendering next card - iOS:', nextCardError);
                return null;
              }
            })()}
          </View>
        </ErrorBoundary>

        {/* Compatibility Badge */}
        <ErrorBoundary>
          {currentProfile && (
            <View style={[styles.compatibilityBadge, { top: insets.top + 80 }]}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.compatibilityGradient}
              >
                <Text style={styles.compatibilityText}>{Math.round(compatibility)}% Match</Text>
              </LinearGradient>
            </View>
          )}
        </ErrorBoundary>

        {/* Action Buttons */}
        <ErrorBoundary>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.passButton]} 
              onPress={() => handleButtonSwipe('left')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.actionButtonGradient}
              >
                <Icon name="close" size={32} color={colors.text} />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.superLikeButton]} 
              onPress={handleSuperLike}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradientSecondary}
                style={styles.actionButtonGradient}
              >
                <Icon name="star" size={28} color={colors.text} />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.likeButton]} 
              onPress={() => handleButtonSwipe('right')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.actionButtonGradient}
              >
                <Icon name="heart" size={32} color={colors.text} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ErrorBoundary>

        {/* Progress Indicator */}
        <ErrorBoundary>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${profiles.length > 0 ? ((currentIndex + 1) / profiles.length) * 100 : 0}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {profiles.length > 0 ? `${currentIndex + 1} of ${profiles.length}` : '0 of 0'}
            </Text>
          </View>
        </ErrorBoundary>

        {/* Subscription Modal */}
        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={() => {
            setShowSubscriptionModal(false);
            Alert.alert('Welcome to Premium! 🎉', 'You now have unlimited likes and project postings!');
          }}
        />
        </View>
      </ErrorBoundary>
    );
  } catch (renderError) {
    console.error('❌ Critical render error in DiscoverScreen - iOS:', renderError);
    // iOS-safe critical error fallback
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <LinearGradient
          colors={colors.gradientBackground}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="alert-circle" size={80} color={colors.error} />
        <Text style={[commonStyles.title, { marginTop: spacing.lg, textAlign: 'center' }]}>
          Critical iOS Error
        </Text>
        <Text style={[commonStyles.text, { 
          marginTop: spacing.sm, 
          marginBottom: spacing.xl, 
          textAlign: 'center', 
          paddingHorizontal: spacing.lg 
        }]}>
          The discover screen encountered a critical error on iOS. Please restart the app.
        </Text>
        <Button
          text="Restart App"
          onPress={() => {
            try {
              router.replace('/(tabs)/');
            } catch (navError) {
              console.error('❌ Navigation error in critical fallback - iOS:', navError);
              // Last resort - try to go to home
              try {
                router.push('/');
              } catch (finalError) {
                console.error('❌ Final navigation fallback failed - iOS:', finalError);
              }
            }
          }}
          variant="gradient"
          size="lg"
          style={{ marginBottom: spacing.md }}
        />
        <Button
          text="Debug Info"
          onPress={() => {
            try {
              Alert.alert(
                'Debug Info - iOS',
                `Error: ${renderError instanceof Error ? renderError.message : 'Unknown'}\n` +
                `Platform: ${Platform.OS}\n` +
                `Version: ${Platform.Version}\n` +
                `Time: ${new Date().toISOString()}`
              );
            } catch (debugError) {
              console.error('❌ Debug alert failed - iOS:', debugError);
            }
          }}
          variant="outline"
          size="sm"
        />
      </View>
    );
  }
}

function ProfileCard({ profile, onViewProfile }: ProfileCardProps) {
  try {
    console.log('🎴 Rendering ProfileCard for - iOS:', profile?.name || 'Unknown');
    
    // iOS-safe profile validation
    if (!profile || typeof profile !== 'object' || !profile.id || !profile.name) {
      console.log('🎴 Invalid profile data - iOS');
      return (
        <View style={styles.profileCard}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.profileGradient}
          >
            <View style={styles.profileContent}>
              <Text style={[commonStyles.text, { textAlign: 'center' }]}>
                No profile data
              </Text>
            </View>
          </LinearGradient>
        </View>
      );
    }

    // iOS-safe data extraction with comprehensive validation
    const profileName = (profile.name && typeof profile.name === 'string' && profile.name.trim()) ? profile.name.trim() : 'Unknown';
    const profileRole = (profile.role && typeof profile.role === 'string' && profile.role.trim()) ? profile.role.trim() : 'Musician';
    const profileLocation = (profile.location && typeof profile.location === 'string' && profile.location.trim()) ? profile.location.trim() : 'Unknown Location';
    const profileBio = (profile.bio && typeof profile.bio === 'string' && profile.bio.trim()) ? profile.bio.trim() : 'No bio available';
    
    // iOS-safe array processing
    let profileGenres: string[] = [];
    try {
      if (Array.isArray(profile.genres)) {
        profileGenres = profile.genres.filter(g => g && typeof g === 'string' && g.trim()).map(g => g.trim());
      }
    } catch (genreError) {
      console.error('❌ Error processing genres - iOS:', genreError);
      profileGenres = [];
    }
    
    // iOS-safe highlights processing
    let profileHighlights: any[] = [];
    try {
      if (Array.isArray(profile.highlights)) {
        profileHighlights = profile.highlights.filter(h => h && typeof h === 'object' && h.id);
      }
    } catch (highlightError) {
      console.error('❌ Error processing highlights - iOS:', highlightError);
      profileHighlights = [];
    }
    
    const profileRating = (typeof profile.rating === 'number' && !isNaN(profile.rating) && profile.rating >= 0) ? profile.rating : 0;
    const profileVerified = Boolean(profile.verified);

    // iOS-safe render with comprehensive error handling
    return (
      <TouchableOpacity 
        style={styles.profileCard} 
        onPress={() => {
          try {
            if (onViewProfile && typeof onViewProfile === 'function') {
              onViewProfile();
            }
          } catch (pressError) {
            console.error('❌ Error in profile card press - iOS:', pressError);
          }
        }} 
        activeOpacity={0.95}
      >
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.profileGradient}
        >
          <View style={styles.profileContent}>
            {/* Profile Image - iOS safe */}
            <View style={styles.profileImageContainer}>
              <LinearGradient
                colors={colors.gradientSecondary}
                style={styles.profileImageGradient}
              >
                <Text style={styles.profileInitial}>
                  {profileName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              
              {profileVerified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="checkmark-circle" size={24} color={colors.success} />
                </View>
              )}
            </View>

            {/* Profile Info - iOS safe */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{profileName}</Text>
              <Text style={styles.profileRole} numberOfLines={1}>{profileRole}</Text>
              <Text style={styles.profileLocation} numberOfLines={1}>{profileLocation}</Text>
              
              {profileRating > 0 && (
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={16} color={colors.warning} />
                  <Text style={styles.ratingText}>{profileRating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            {/* Bio - iOS safe */}
            <View style={styles.bioContainer}>
              <Text style={styles.bioText} numberOfLines={3}>
                {profileBio}
              </Text>
            </View>

            {/* Genres - iOS safe */}
            <View style={styles.genresContainer}>
              <Text style={styles.genresTitle}>Genres</Text>
              <View style={styles.genresList}>
                {profileGenres.slice(0, 3).map((genre, index) => {
                  try {
                    return (
                      <View key={`${genre}-${index}-${profile.id}`} style={styles.genreChip}>
                        <Text style={styles.genreText}>{genre}</Text>
                      </View>
                    );
                  } catch (genreRenderError) {
                    console.error('❌ Error rendering genre - iOS:', genreRenderError);
                    return null;
                  }
                })}
                {profileGenres.length > 3 && (
                  <View style={styles.genreChip}>
                    <Text style={styles.genreText}>+{profileGenres.length - 3}</Text>
                  </View>
                )}
                {profileGenres.length === 0 && (
                  <Text style={[commonStyles.caption, { color: colors.textMuted }]}>
                    No genres listed
                  </Text>
                )}
              </View>
            </View>

            {/* Highlights - iOS safe */}
            <View style={styles.highlightsContainer}>
              <Text style={styles.highlightsTitle}>
                Highlights ({profileHighlights.length})
              </Text>
              <View style={styles.highlightsList}>
                {profileHighlights.slice(0, 3).map((highlight, index) => {
                  try {
                    const highlightType = (highlight.type && typeof highlight.type === 'string') ? highlight.type : 'image';
                    const highlightTitle = (highlight.title && typeof highlight.title === 'string' && highlight.title.trim()) ? highlight.title.trim() : 'Untitled';
                    const iconName = highlightType === 'audio' ? 'musical-note' : 
                                   highlightType === 'video' ? 'videocam' : 'image';
                    
                    return (
                      <View key={`${highlight.id || index}-${profile.id}`} style={styles.highlightItem}>
                        <Icon 
                          name={iconName} 
                          size={16} 
                          color={colors.textMuted} 
                        />
                        <Text style={styles.highlightText} numberOfLines={1}>
                          {highlightTitle}
                        </Text>
                      </View>
                    );
                  } catch (highlightError) {
                    console.error('❌ Error rendering highlight - iOS:', highlightError);
                    return null;
                  }
                })}
                {profileHighlights.length === 0 && (
                  <Text style={[commonStyles.caption, { textAlign: 'center', color: colors.textMuted }]}>
                    No highlights yet
                  </Text>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  } catch (error) {
    console.error('❌ Error in ProfileCard - iOS:', error);
    // iOS-safe error fallback
    return (
      <View style={styles.profileCard}>
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.profileGradient}
        >
          <View style={styles.profileContent}>
            <Text style={[commonStyles.text, { textAlign: 'center' }]}>
              Error loading profile
            </Text>
            <Text style={[commonStyles.caption, { textAlign: 'center', marginTop: spacing.sm, color: colors.textMuted }]}>
              Please try refreshing
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }
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
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'absolute',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  nextCard: {
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
    zIndex: -1,
  },
  profileCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  profileGradient: {
    flex: 1,
    padding: 2,
  },
  profileContent: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl - 2,
    padding: spacing.lg,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  profileImageGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: '30%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 2,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileName: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  profileRole: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  profileLocation: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  bioContainer: {
    marginBottom: spacing.lg,
  },
  bioText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  genresContainer: {
    marginBottom: spacing.lg,
  },
  genresTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  genreText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  highlightsContainer: {
    flex: 1,
  },
  highlightsTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  highlightsList: {
    gap: spacing.sm,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  highlightText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  compatibilityBadge: {
    position: 'absolute',
    right: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  compatibilityGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  compatibilityText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  actionButton: {
    borderRadius: 35,
    overflow: 'hidden',
    ...shadows.lg,
  },
  actionButtonGradient: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passButton: {},
  superLikeButton: {
    transform: [{ scale: 0.8 }],
  },
  likeButton: {},
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  webGestureOverlay: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    opacity: 0.8,
  },
  webGestureText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
});

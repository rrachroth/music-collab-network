
import { Text, View, ScrollView, TextInput, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay 
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { saveCurrentUser, getCurrentUser, generateId, getCurrentTimestamp, User } from '../utils/storage';
import { AuthService } from '../utils/authService';

const { width } = Dimensions.get('window');

const ROLES = [
  { id: 'producer', name: 'Producer', icon: 'musical-notes' },
  { id: 'vocalist', name: 'Vocalist', icon: 'mic' },
  { id: 'songwriter', name: 'Songwriter', icon: 'create' },
  { id: 'instrumentalist', name: 'Instrumentalist', icon: 'musical-note' },
  { id: 'mixer', name: 'Mix Engineer', icon: 'settings' },
  { id: 'ar', name: 'A&R', icon: 'business' },
];

const GENRES = [
  'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz',
  'Classical', 'Country', 'Reggae', 'Latin', 'Alternative', 'Indie'
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  const loadExistingUser = useCallback(async () => {
    try {
      const existingUser = await getCurrentUser();
      if (existingUser && !existingUser.isOnboarded) {
        // Pre-fill with existing data
        setName(existingUser.name || '');
        setBio(existingUser.bio || '');
        setLocation(existingUser.location || '');
        setSelectedRole(existingUser.role || '');
        setSelectedGenres(existingUser.genres || []);
        setIsNewUser(false);
      } else {
        // This is a new user coming from the landing page
        setIsNewUser(true);
      }
    } catch (error) {
      console.error('❌ Error loading existing user:', error);
      setIsNewUser(true);
    }
  }, []);

  useEffect(() => {
    console.log('🎯 Onboarding Screen - Step', step);
    loadExistingUser();
    
    // Reset animations for each step
    fadeIn.value = 0;
    slideUp.value = 30;
    
    // Animate in
    fadeIn.value = withTiming(1, { duration: 600 });
    slideUp.value = withSpring(0, { damping: 15 });
  }, [step, fadeIn, slideUp, loadExistingUser]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!selectedRole) {
          Alert.alert('Select Your Role', 'Please choose your primary role in music');
          return false;
        }
        break;
      case 2:
        if (selectedGenres.length === 0) {
          Alert.alert('Select Genres', 'Please choose at least one genre you work with');
          return false;
        }
        break;
      case 3:
        if (isNewUser) {
          if (!email.trim()) {
            Alert.alert('Enter Your Email', 'Please enter your email address');
            return false;
          }
          if (!password.trim() || password.length < 6) {
            Alert.alert('Enter Your Password', 'Please enter a password (at least 6 characters)');
            return false;
          }
        }
        if (!name.trim()) {
          Alert.alert('Enter Your Name', 'Please enter your name or artist name');
          return false;
        }
        if (!location.trim()) {
          Alert.alert('Enter Your Location', 'Please enter your location (city, state/country)');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      Alert.alert(
        'Exit Setup?',
        'Are you sure you want to exit profile setup? Your progress will be lost.',
        [
          { text: 'Continue Setup', style: 'cancel' },
          { 
            text: 'Exit', 
            style: 'destructive',
            onPress: () => router.replace('/auth/login')
          }
        ]
      );
    }
  };

  const handleComplete = async () => {
    if (isCompleting) return; // Prevent double submission
    
    try {
      setLoading(true);
      setIsCompleting(true);
      console.log('🎵 Completing onboarding:', { selectedRole, selectedGenres, name, bio, location, isNewUser });
      
      if (isNewUser) {
        // Create new account with Supabase
        console.log('📝 Creating new account...');
        const profileData = {
          name: name.trim(),
          role: selectedRole,
          genres: selectedGenres,
          location: location.trim(),
          bio: bio.trim() || `${selectedRole} specializing in ${selectedGenres.slice(0, 2).join(' and ')} music.`,
        };
        
        const result = await AuthService.signUp(email.trim(), password, profileData);
        
        if (result.success) {
          console.log('✅ Account created successfully');
          if (result.needsEmailVerification) {
            Alert.alert(
              'Account Created! 🎉',
              'Please check your email and click the verification link to complete your registration. You can now sign in.',
              [
                {
                  text: 'Go to Sign In',
                  onPress: () => router.replace('/auth/login')
                }
              ]
            );
            return;
          } else {
            // Account is ready, redirect to home
            router.replace('/(tabs)');
          }
        } else {
          Alert.alert('Account Creation Failed', result.error || 'Please try again.');
          return;
        }
      } else {
        // Update existing user profile
        const existingUser = await getCurrentUser();
        
        const updatedUser: User = {
          id: existingUser?.id || generateId(),
          name: name.trim(),
          role: selectedRole,
          genres: selectedGenres,
          location: location.trim(),
          bio: bio.trim() || `${selectedRole} specializing in ${selectedGenres.slice(0, 2).join(' and ')} music.`,
          highlights: existingUser?.highlights || [],
          collaborations: existingUser?.collaborations || [],
          rating: existingUser?.rating || 0,
          verified: existingUser?.verified || false,
          joinDate: existingUser?.joinDate || getCurrentTimestamp(),
          isOnboarded: true,
          lastActive: getCurrentTimestamp(),
          createdAt: existingUser?.createdAt || getCurrentTimestamp(),
        };

        await saveCurrentUser(updatedUser);
        
        console.log('✅ User profile updated successfully');
        console.log('🎉 Onboarding completed - automatically redirecting to home');
        
        // Automatically redirect to home screen
        router.replace('/(tabs)');
      }
      
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete profile setup. Please try again.');
    } finally {
      setLoading(false);
      setIsCompleting(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View style={[styles.section, animatedStyle]}>
            <Text style={styles.stepTitle}>
              What's your role in music?
            </Text>
            <Text style={styles.stepSubtitle}>
              Select your primary role to help us connect you with the right collaborators
            </Text>
            
            <View style={styles.optionsGrid}>
              {ROLES.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  selected={selectedRole === role.id}
                  onPress={() => setSelectedRole(role.id)}
                />
              ))}
            </View>
          </Animated.View>
        );
      
      case 2:
        return (
          <Animated.View style={[styles.section, animatedStyle]}>
            <Text style={styles.stepTitle}>
              What genres do you work with?
            </Text>
            <Text style={styles.stepSubtitle}>
              Choose all genres that match your style (you can change this later)
            </Text>
            
            <View style={styles.genreGrid}>
              {GENRES.map((genre) => (
                <GenreChip
                  key={genre}
                  genre={genre}
                  selected={selectedGenres.includes(genre)}
                  onPress={() => toggleGenre(genre)}
                />
              ))}
            </View>
          </Animated.View>
        );
      
      case 3:
        return (
          <Animated.View style={[styles.section, animatedStyle]}>
            <Text style={styles.stepTitle}>
              {isNewUser ? 'Create your account' : 'Tell us about yourself'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {isNewUser ? 'Set up your account and profile information' : 'This information will be displayed on your profile'}
            </Text>
            
            <View style={styles.inputContainer}>
              {isNewUser && (
                <>
                  <Text style={styles.inputLabel}>
                    Email Address *
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email..."
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={100}
                  />
                  
                  <Text style={styles.inputLabel}>
                    Password *
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password (min 6 characters)..."
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    maxLength={50}
                  />
                </>
              )}
              
              <Text style={styles.inputLabel}>
                Name or Artist Name *
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name..."
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                maxLength={50}
              />
              
              <Text style={styles.inputLabel}>
                Location *
              </Text>
              <TextInput
                style={styles.input}
                placeholder="City, State/Country"
                placeholderTextColor={colors.textSecondary}
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
                maxLength={100}
              />
              
              <Text style={styles.inputLabel}>
                Bio (Optional)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about your musical journey..."
                placeholderTextColor={colors.textSecondary}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
            </View>
          </Animated.View>
        );
      
      case 4:
        return (
          <Animated.View style={[styles.section, animatedStyle]}>
            <View style={styles.summaryContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.summaryIcon}
              >
                <Icon name="checkmark-circle" size={60} color={colors.white} />
              </LinearGradient>
              
              <Text style={styles.stepTitle}>
                You're all set!
              </Text>
              
              <Text style={styles.stepSubtitle}>
                Here's what we've set up for your profile:
              </Text>
              
              <View style={styles.summaryCard}>
                {isNewUser && <SummaryItem icon="mail" label="Email" value={email} />}
                <SummaryItem icon="person" label="Name" value={name} />
                <SummaryItem icon="briefcase" label="Role" value={ROLES.find(r => r.id === selectedRole)?.name || ''} />
                <SummaryItem icon="location" label="Location" value={location} />
                <SummaryItem icon="musical-notes" label="Genres" value={selectedGenres.join(', ')} />
                {bio && <SummaryItem icon="document-text" label="Bio" value={bio} />}
              </View>
              
              <Text style={styles.summaryNote}>
                You can always update your profile later in settings
              </Text>
            </View>
          </Animated.View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          Setup Profile
        </Text>
        
        <Text style={styles.stepCounter}>
          {step}/4
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={step === 4 ? (isNewUser ? 'Create Account' : 'Complete Profile') : 'Continue'}
          onPress={handleNext}
          loading={loading}
          disabled={loading || isCompleting}
          style={styles.continueButton}
        />
      </View>
    </View>
  );
}

interface RoleCardProps {
  role: { id: string; name: string; icon: string };
  selected: boolean;
  onPress: () => void;
}

function RoleCard({ role, selected, onPress }: RoleCardProps) {
  return (
    <TouchableOpacity 
      style={[
        styles.roleCard,
        selected && styles.roleCardSelected
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.roleContent}>
        <Icon 
          name={role.icon as any} 
          size={32} 
          color={selected ? colors.white : colors.textSecondary}
        />
        <Text style={[
          styles.roleText,
          selected && styles.roleTextSelected
        ]}>
          {role.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface GenreChipProps {
  genre: string;
  selected: boolean;
  onPress: () => void;
}

function GenreChip({ genre, selected, onPress }: GenreChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.genreChip,
        selected && styles.genreChipSelected
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.genreText,
        selected && styles.genreTextSelected
      ]}>
        {genre}
      </Text>
    </TouchableOpacity>
  );
}

interface SummaryItemProps {
  icon: string;
  label: string;
  value: string;
}

function SummaryItem({ icon, label, value }: SummaryItemProps) {
  return (
    <View style={styles.summaryItem}>
      <Icon name={icon as any} size={20} color={colors.primary} />
      <View style={styles.summaryItemText}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.white,
    textAlign: 'center' as const,
    marginHorizontal: spacing.md,
  },
  stepCounter: {
    fontSize: 14,
    color: colors.textSecondary,
    minWidth: 40,
    textAlign: 'right' as const,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  section: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.white,
    textAlign: 'center' as const,
    marginBottom: spacing.md,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  optionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.md,
    justifyContent: 'space-between' as const,
  },
  roleCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    minHeight: 100,
    marginBottom: spacing.md,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  roleContent: {
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  roleTextSelected: {
    color: colors.white,
    fontWeight: '600' as const,
  },
  genreGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  genreChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genreText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  genreTextSelected: {
    color: colors.white,
    fontWeight: '600' as const,
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    color: colors.white,
    marginBottom: spacing.sm,
    fontWeight: '500' as const,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: 16,
    color: colors.white,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top' as const,
  },
  summaryContainer: {
    alignItems: 'center' as const,
    paddingVertical: spacing.xl,
  },
  summaryIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryItemText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '500' as const,
  },
  summaryValue: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600' as const,
    flexWrap: 'wrap' as const,
  },
  summaryNote: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  continueButton: {
    width: '100%',
  },
};

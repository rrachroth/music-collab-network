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

const { width } = Dimensions.get('window');

const ROLES = [
  { id: 'producer', name: 'Producer', icon: 'musical-notes' },
  { id: 'vocalist', name: 'Vocalist', icon: 'mic' },
  { id: 'songwriter', name: 'Songwriter', icon: 'create' },
  { id: 'instrumentalist', name: 'Instrumentalist', icon: 'piano' },
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
  const [loading, setLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
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
      }
    } catch (error) {
      console.error('❌ Error loading existing user:', error);
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
      // Instead of router.back(), go to home or show confirmation
      Alert.alert(
        'Exit Setup?',
        'Are you sure you want to exit profile setup? Your progress will be lost.',
        [
          { text: 'Continue Setup', style: 'cancel' },
          { 
            text: 'Exit', 
            style: 'destructive',
            onPress: () => router.replace('/(tabs)')
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
      console.log('🎵 Completing onboarding:', { selectedRole, selectedGenres, name, bio, location });
      
      const existingUser = await getCurrentUser();
      
      const newUser: User = {
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

      await saveCurrentUser(newUser);
      
      console.log('✅ User onboarding completed successfully');
      
      // Show success message and navigate
      Alert.alert(
        'Welcome to Muse! 🎉',
        `Your profile has been created successfully, ${name}! Let's start discovering amazing artists and collaborating on music.`,
        [
          {
            text: 'Start Exploring',
            onPress: () => {
              // Use replace to prevent going back to onboarding
              router.replace('/(tabs)');
            }
          }
        ]
      );
      
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
          <Animated.View style={[commonStyles.section, animatedStyle]}>
            <Text style={[commonStyles.subtitle, { marginBottom: spacing.lg }]}>
              What's your role in music?
            </Text>
            <Text style={[commonStyles.text, { marginBottom: spacing.xl }]}>
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
          <Animated.View style={[commonStyles.section, animatedStyle]}>
            <Text style={[commonStyles.subtitle, { marginBottom: spacing.lg }]}>
              What genres do you work with?
            </Text>
            <Text style={[commonStyles.text, { marginBottom: spacing.xl }]}>
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
          <Animated.View style={[commonStyles.section, animatedStyle]}>
            <Text style={[commonStyles.subtitle, { marginBottom: spacing.lg }]}>
              Tell us about yourself
            </Text>
            <Text style={[commonStyles.text, { marginBottom: spacing.xl }]}>
              This information will be displayed on your profile
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[commonStyles.textLeft, { marginBottom: spacing.sm }]}>
                Name or Artist Name *
              </Text>
              <TextInput
                style={[commonStyles.input, styles.input]}
                placeholder="Enter your name..."
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                maxLength={50}
              />
              
              <Text style={[commonStyles.textLeft, { marginBottom: spacing.sm }]}>
                Location *
              </Text>
              <TextInput
                style={[commonStyles.input, styles.input]}
                placeholder="City, State/Country"
                placeholderTextColor={colors.textMuted}
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
                maxLength={100}
              />
              
              <Text style={[commonStyles.textLeft, { marginBottom: spacing.sm }]}>
                Bio (Optional)
              </Text>
              <TextInput
                style={[commonStyles.input, styles.textArea]}
                placeholder="Tell us about your musical journey..."
                placeholderTextColor={colors.textMuted}
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
          <Animated.View style={[commonStyles.section, animatedStyle]}>
            <View style={styles.summaryContainer}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.summaryIcon}
              >
                <Icon name="checkmark-circle" size={60} color={colors.text} />
              </LinearGradient>
              
              <Text style={[commonStyles.subtitle, { marginBottom: spacing.lg }]}>
                You're all set!
              </Text>
              
              <Text style={[commonStyles.text, { marginBottom: spacing.xl }]}>
                Here's what we've set up for your profile:
              </Text>
              
              <View style={styles.summaryCard}>
                <SummaryItem icon="person" label="Name" value={name} />
                <SummaryItem icon="briefcase" label="Role" value={ROLES.find(r => r.id === selectedRole)?.name || ''} />
                <SummaryItem icon="location" label="Location" value={location} />
                <SummaryItem icon="musical-notes" label="Genres" value={selectedGenres.join(', ')} />
                {bio && <SummaryItem icon="document-text" label="Bio" value={bio} />}
              </View>
              
              <Text style={[commonStyles.caption, { marginTop: spacing.lg, textAlign: 'center', opacity: 0.8 }]}>
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
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Button
          text="Back"
          onPress={handleBack}
          variant="ghost"
          size="sm"
          style={styles.backButton}
        />
        
        <Text style={[commonStyles.heading, { flex: 1, textAlign: 'center' }]}>
          Setup Profile
        </Text>
        
        <Text style={[commonStyles.caption, { minWidth: 40, textAlign: 'right' }]}>
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
        contentContainerStyle={[commonStyles.content, { paddingTop: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          text={step === 4 ? 'Complete Profile' : 'Continue'}
          onPress={handleNext}
          variant="gradient"
          size="lg"
          loading={loading}
          disabled={loading || isCompleting}
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
        styles.roleButton,
        selected && styles.roleButtonSelected
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.roleContent}>
        <Icon 
          name={role.icon as any} 
          size={32} 
          style={{ color: selected ? colors.text : colors.textMuted }}
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
    <Button
      text={genre}
      onPress={onPress}
      variant={selected ? "primary" : "outline"}
      size="sm"
      style={[styles.genreChip, selected && styles.genreChipSelected]}
      textStyle={[styles.genreText, selected && styles.genreTextSelected]}
    />
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
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    minWidth: 60,
    justifyContent: 'flex-start' as const,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  optionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.md,
    justifyContent: 'space-between' as const,
  },
  roleCard: {
    width: '48%',
    marginBottom: spacing.md,
  },
  roleCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  roleButton: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    minHeight: 100,
  },
  roleButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundAlt,
  },
  roleContent: {
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  roleText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    textAlign: 'center' as const,
  },
  roleTextSelected: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
  },
  genreGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  genreChip: {
    minWidth: 80,
    marginBottom: spacing.sm,
  },
  genreChipSelected: {
    backgroundColor: colors.primary,
  },
  genreText: {
    fontSize: 14,
  },
  genreTextSelected: {
    color: colors.text,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.lg,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
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
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItemText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    flexWrap: 'wrap' as const,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
};
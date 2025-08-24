
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';
import { AuthService } from '../../utils/authService';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

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

const RegisterScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const initializeAnimations = useCallback(() => {
    fadeIn.value = 0;
    slideUp.value = 50;
    fadeIn.value = withTiming(1, { duration: 800 });
    slideUp.value = withSpring(0, { damping: 20, stiffness: 100 });
  }, [fadeIn, slideUp]);

  useEffect(() => {
    console.log('📝 Register Screen - Step', step);
    initializeAnimations();
  }, [step, initializeAnimations]);

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!email.trim()) {
          Alert.alert('Email Required', 'Please enter your email address.');
          return false;
        }
        if (!email.includes('@') || !email.includes('.')) {
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
          return false;
        }
        if (!password.trim()) {
          Alert.alert('Password Required', 'Please enter a password.');
          return false;
        }
        if (password.length < 6) {
          Alert.alert('Password Too Short', 'Password must be at least 6 characters long.');
          return false;
        }
        if (password !== confirmPassword) {
          Alert.alert('Passwords Don\'t Match', 'Please make sure both passwords match.');
          return false;
        }
        break;
      case 2:
        if (!selectedRole) {
          Alert.alert('Select Your Role', 'Please choose your primary role in music.');
          return false;
        }
        break;
      case 3:
        if (selectedGenres.length === 0) {
          Alert.alert('Select Genres', 'Please choose at least one genre you work with.');
          return false;
        }
        break;
      case 4:
        if (!name.trim()) {
          Alert.alert('Name Required', 'Please enter your name or artist name.');
          return false;
        }
        if (!location.trim()) {
          Alert.alert('Location Required', 'Please enter your location.');
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
      handleCreateAccount();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      console.log('🔙 Back button pressed from register');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  };

  const handleCreateAccount = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      console.log('🎵 Creating new account...');
      
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
            'Please check your email and click the verification link to complete your registration. You can now sign in with your credentials.',
            [
              {
                text: 'Go to Sign In',
                onPress: () => router.replace('/auth/login')
              }
            ]
          );
        } else {
          Alert.alert(
            'Welcome to NextDrop! 🎉',
            'Your account has been created successfully. You\'re now ready to start collaborating!',
            [
              {
                text: 'Get Started',
                onPress: () => {
                  // Navigation will be handled by auth state listener
                  router.replace('/(tabs)');
                }
              }
            ]
          );
        }
      } else {
        console.error('❌ Account creation failed:', result.error);
        
        // Provide more specific error messages
        let errorMessage = result.error || 'Please try again.';
        if (errorMessage.includes('already registered')) {
          errorMessage = 'This email is already registered. Please try signing in instead.';
        } else if (errorMessage.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (errorMessage.includes('weak password')) {
          errorMessage = 'Please choose a stronger password with at least 6 characters.';
        }
        
        Alert.alert('Account Creation Failed', errorMessage);
      }
      
    } catch (error) {
      console.error('❌ Error creating account:', error);
      Alert.alert(
        'Connection Error', 
        'Unable to create account. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
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
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Create Your Account</Text>
            <Text style={styles.stepSubtitle}>
              Enter your email and create a secure password
            </Text>
            
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Icon name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Icon name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>What's Your Role?</Text>
            <Text style={styles.stepSubtitle}>
              Select your primary role in music
            </Text>
            
            <View style={styles.rolesGrid}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    selectedRole === role.id && styles.roleCardSelected
                  ]}
                  onPress={() => setSelectedRole(role.id)}
                  activeOpacity={0.8}
                >
                  <Icon 
                    name={role.icon as any} 
                    size={32} 
                    color={selectedRole === role.id ? colors.white : colors.textSecondary}
                  />
                  <Text style={[
                    styles.roleText,
                    selectedRole === role.id && styles.roleTextSelected
                  ]}>
                    {role.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Choose Your Genres</Text>
            <Text style={styles.stepSubtitle}>
              Select all genres that match your style
            </Text>
            
            <View style={styles.genresGrid}>
              {GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,
                    selectedGenres.includes(genre) && styles.genreChipSelected
                  ]}
                  onPress={() => toggleGenre(genre)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.genreText,
                    selectedGenres.includes(genre) && styles.genreTextSelected
                  ]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Complete Your Profile</Text>
            <Text style={styles.stepSubtitle}>
              Tell us a bit about yourself
            </Text>
            
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Icon name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Name or Artist Name"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="location-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Location (City, State/Country)"
                  placeholderTextColor={colors.textSecondary}
                  value={location}
                  onChangeText={setLocation}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="document-text-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Bio (Optional) - Tell us about your musical journey..."
                  placeholderTextColor={colors.textSecondary}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
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
        colors={['#667eea', '#764ba2']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.stepCounter}>{step}/4</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            text={step === 4 ? (isLoading ? 'Creating Account...' : 'Create Account') : 'Continue'}
            onPress={handleNext}
            disabled={isLoading}
            style={styles.continueButton}
          />
          
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={styles.signInText}>
              Already have an account? 
              <Text style={styles.signInLink}> Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  stepCounter: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.md,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: colors.black,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  roleCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  roleCardSelected: {
    borderColor: colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  roleTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  genreChipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  genreText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  genreTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  continueButton: {
    marginBottom: spacing.md,
  },
  signInButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  signInText: {
    fontSize: 16,
    color: colors.white,
  },
  signInLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;

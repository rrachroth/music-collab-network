import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';

const ROLES = [
  { id: 'producer', name: 'Producer', icon: 'disc' as const },
  { id: 'vocalist', name: 'Vocalist', icon: 'mic' as const },
  { id: 'musician', name: 'Musician', icon: 'musical-notes' as const },
  { id: 'engineer', name: 'Mix Engineer', icon: 'settings' as const },
  { id: 'ar', name: 'A&R', icon: 'business' as const },
];

const GENRES = [
  'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', 
  'Country', 'Alternative', 'Indie', 'Classical', 'Reggae', 'Latin'
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const handleRoleSelect = (roleId: string) => {
    console.log('🎭 Role selected:', roleId);
    setSelectedRole(roleId);
  };

  const handleGenreToggle = (genre: string) => {
    console.log('🎵 Genre toggled:', genre);
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleNext = () => {
    if (step === 1 && !selectedRole) {
      Alert.alert('Select Role', 'Please select your primary role in music');
      return;
    }
    if (step === 2 && selectedGenres.length === 0) {
      Alert.alert('Select Genres', 'Please select at least one genre');
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    console.log('✅ Onboarding completed', { selectedRole, selectedGenres });
    Alert.alert(
      'Welcome to MusicLinked!', 
      'Your profile has been created. Start discovering collaborators!',
      [{ text: 'Continue', onPress: () => router.replace('/discover') }]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.title, { marginBottom: 30 }]}>
              What&apos;s your primary role in music?
            </Text>
            <View style={{ width: '100%' }}>
              {ROLES.map(role => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    commonStyles.card,
                    { 
                      borderColor: selectedRole === role.id ? '#64B5F6' : '#90CAF9',
                      borderWidth: selectedRole === role.id ? 2 : 1,
                      backgroundColor: selectedRole === role.id ? '#193cb8' : '#162133'
                    }
                  ]}
                  onPress={() => handleRoleSelect(role.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name={role.icon} size={30} style={{ marginRight: 15 }} />
                    <Text style={[commonStyles.text, { fontSize: 18 }]}>
                      {role.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.title, { marginBottom: 30 }]}>
              What genres do you work with?
            </Text>
            <Text style={[commonStyles.text, { marginBottom: 20, opacity: 0.8 }]}>
              Select all that apply
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              justifyContent: 'space-between',
              width: '100%'
            }}>
              {GENRES.map(genre => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    {
                      backgroundColor: selectedGenres.includes(genre) ? '#64B5F6' : '#162133',
                      borderColor: selectedGenres.includes(genre) ? '#64B5F6' : '#90CAF9',
                      borderWidth: 1,
                      borderRadius: 20,
                      paddingHorizontal: 15,
                      paddingVertical: 10,
                      marginBottom: 10,
                      width: '48%',
                      alignItems: 'center'
                    }
                  ]}
                  onPress={() => handleGenreToggle(genre)}
                >
                  <Text style={[
                    commonStyles.text,
                    { 
                      color: selectedGenres.includes(genre) ? '#000' : '#e3e3e3',
                      fontSize: 14
                    }
                  ]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Icon name="checkmark-circle" size={100} style={{ marginBottom: 30 }} />
            <Text style={[commonStyles.title, { marginBottom: 20 }]}>
              Perfect! You&apos;re all set.
            </Text>
            <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 30 }]}>
              Your profile as a {ROLES.find(r => r.id === selectedRole)?.name} working in{' '}
              {selectedGenres.join(', ')} has been created.
            </Text>
            <Text style={[commonStyles.text, { textAlign: 'center', opacity: 0.8 }]}>
              Next, you&apos;ll be able to upload your audio/video highlights and start discovering collaborators!
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 30 }}>
        {step > 1 && (
          <TouchableOpacity onPress={() => setStep(step - 1)}>
            <Icon name="arrow-back" size={24} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[commonStyles.text, { fontSize: 16 }]}>
            Step {step} of 3
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View style={{ 
        width: '100%', 
        height: 4, 
        backgroundColor: '#162133', 
        marginBottom: 40,
        marginHorizontal: 20
      }}>
        <View style={{ 
          width: `${(step / 3) * 100}%`, 
          height: '100%', 
          backgroundColor: '#64B5F6',
          borderRadius: 2
        }} />
      </View>

      <ScrollView 
        contentContainerStyle={[commonStyles.content, { paddingHorizontal: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Bottom Button */}
      <View style={[commonStyles.buttonContainer, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          text={step === 3 ? 'Complete Setup' : 'Next'}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}
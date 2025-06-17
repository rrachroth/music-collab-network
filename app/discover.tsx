import { Text, View, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

const MOCK_PROFILES = [
  {
    id: '1',
    name: 'Alex Producer',
    role: 'Producer',
    genres: ['Hip-Hop', 'R&B'],
    location: 'Los Angeles, CA',
    highlights: 3,
    collaborations: 12,
    rating: 4.8,
    bio: 'Grammy-nominated producer specializing in modern hip-hop and R&B. Looking for talented vocalists and rappers.',
    verified: true
  },
  {
    id: '2',
    name: 'Maya Vocalist',
    role: 'Vocalist',
    genres: ['Pop', 'R&B'],
    location: 'Nashville, TN',
    highlights: 5,
    collaborations: 8,
    rating: 4.9,
    bio: 'Professional vocalist with 10+ years experience. Featured on multiple Billboard charting songs.',
    verified: true
  },
  {
    id: '3',
    name: 'Jordan Beats',
    role: 'Producer',
    genres: ['Electronic', 'Pop'],
    location: 'New York, NY',
    highlights: 4,
    collaborations: 15,
    rating: 4.7,
    bio: 'Electronic music producer and sound designer. Specializing in innovative pop productions.',
    verified: false
  }
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles] = useState(MOCK_PROFILES);
  const [matches, setMatches] = useState<string[]>([]);

  useEffect(() => {
    console.log('🔍 Discover Screen Loaded');
  }, []);

  const handleSwipeLeft = () => {
    console.log('👎 Swiped left on:', profiles[currentIndex]?.name);
    nextProfile();
  };

  const handleSwipeRight = () => {
    console.log('👍 Swiped right on:', profiles[currentIndex]?.name);
    const profile = profiles[currentIndex];
    if (profile) {
      setMatches(prev => [...prev, profile.id]);
      Alert.alert('It\'s a Match!', `You and ${profile.name} are now connected!`);
    }
    nextProfile();
  };

  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      Alert.alert('No More Profiles', 'You\'ve seen all available profiles. Check back later for more!');
    }
  };

  const handleViewProfile = () => {
    const profile = profiles[currentIndex];
    if (profile) {
      console.log('👤 Viewing profile:', profile.name);
      router.push(`/profile/${profile.id}`);
    }
  };

  const handleOpenProjects = () => {
    console.log('📋 Opening projects feed');
    router.push('/projects');
  };

  const handleMatches = () => {
    console.log('💕 Viewing matches');
    router.push('/matches');
  };

  const currentProfile = profiles[currentIndex];

  if (!currentProfile) {
    return (
      <View style={[commonStyles.container, { paddingTop: insets.top }]}>
        <View style={commonStyles.content}>
          <Icon name="musical-notes" size={80} />
          <Text style={[commonStyles.title, { marginTop: 20 }]}>
            No More Profiles
          </Text>
          <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 30 }]}>
            You&apos;ve seen all available profiles. Check back later for more collaborators!
          </Text>
          <Button
            text="Browse Open Projects"
            onPress={handleOpenProjects}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={[commonStyles.title, { fontSize: 20 }]}>
          Discover
        </Text>
        <TouchableOpacity onPress={handleMatches}>
          <View>
            <Icon name="heart" size={24} />
            {matches.length > 0 && (
              <View style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: '#ff4757',
                borderRadius: 10,
                width: 20,
                height: 20,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                  {matches.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[
          commonStyles.card,
          {
            width: CARD_WIDTH,
            height: '70%',
            marginHorizontal: 20,
            padding: 20,
            justifyContent: 'space-between'
          }
        ]}>
          {/* Profile Header */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#64B5F6',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15
              }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>
                  {currentProfile.name.charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[commonStyles.title, { fontSize: 22 }]}>
                    {currentProfile.name}
                  </Text>
                  {currentProfile.verified && (
                    <Icon name="checkmark-circle" size={20} style={{ marginLeft: 5 }} />
                  )}
                </View>
                <Text style={[commonStyles.text, { opacity: 0.8 }]}>
                  {currentProfile.role} • {currentProfile.location}
                </Text>
              </View>
            </View>

            {/* Genres */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 }}>
              {currentProfile.genres.map(genre => (
                <View key={genre} style={{
                  backgroundColor: '#64B5F6',
                  borderRadius: 15,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  marginRight: 8,
                  marginBottom: 8
                }}>
                  <Text style={{ color: '#000', fontSize: 12, fontWeight: 'bold' }}>
                    {genre}
                  </Text>
                </View>
              ))}
            </View>

            {/* Stats */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={[commonStyles.title, { fontSize: 20 }]}>
                  {currentProfile.highlights}
                </Text>
                <Text style={[commonStyles.text, { fontSize: 12, opacity: 0.8 }]}>
                  Highlights
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[commonStyles.title, { fontSize: 20 }]}>
                  {currentProfile.collaborations}
                </Text>
                <Text style={[commonStyles.text, { fontSize: 12, opacity: 0.8 }]}>
                  Collabs
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[commonStyles.title, { fontSize: 20 }]}>
                  {currentProfile.rating}
                </Text>
                <Text style={[commonStyles.text, { fontSize: 12, opacity: 0.8 }]}>
                  Rating
                </Text>
              </View>
            </View>

            {/* Bio */}
            <Text style={[commonStyles.text, { textAlign: 'center', lineHeight: 22 }]}>
              {currentProfile.bio}
            </Text>
          </View>

          {/* View Profile Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#162456',
              borderRadius: 8,
              padding: 12,
              alignItems: 'center',
              marginTop: 20
            }}
            onPress={handleViewProfile}
          >
            <Text style={[commonStyles.text, { fontWeight: 'bold' }]}>
              View Full Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        paddingHorizontal: 40,
        paddingBottom: insets.bottom + 20,
        paddingTop: 20
      }}>
        <TouchableOpacity
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#ff4757',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4
          }}
          onPress={handleSwipeLeft}
        >
          <Icon name="close" size={30} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#2ed573',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4
          }}
          onPress={handleSwipeRight}
        >
          <Icon name="heart" size={30} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
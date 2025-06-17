import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';

const MOCK_USER = {
  id: '1',
  name: 'Demo User',
  role: 'Producer',
  genres: ['Hip-Hop', 'R&B', 'Pop'],
  location: 'Los Angeles, CA',
  highlights: [],
  collaborations: 0,
  rating: 0,
  bio: 'Welcome to MusicLinked! Complete your profile to start connecting with other musicians.',
  verified: false,
  joinDate: 'June 2024'
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(MOCK_USER);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    console.log('👤 Profile Screen Loaded');
  }, []);

  const handleEditProfile = () => {
    console.log('✏️ Editing profile');
    setIsEditing(true);
  };

  const handleUploadHighlight = () => {
    console.log('🎵 Uploading highlight');
    Alert.alert(
      'Upload Highlight',
      'This feature will allow you to upload audio/video clips to showcase your work. Coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleSettings = () => {
    console.log('⚙️ Opening settings');
    Alert.alert('Settings', 'Settings panel coming soon!');
  };

  const handleViewCollaborations = () => {
    console.log('🤝 Viewing collaborations');
    Alert.alert('Collaborations', 'Your collaboration history will appear here once you start working with other artists!');
  };

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
          My Profile
        </Text>
        <TouchableOpacity onPress={handleSettings}>
          <Icon name="settings" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[commonStyles.card, { alignItems: 'center', paddingVertical: 30 }]}>
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#64B5F6',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 15
          }}>
            <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#000' }}>
              {user.name.charAt(0)}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <Text style={[commonStyles.title, { fontSize: 24 }]}>
              {user.name}
            </Text>
            {user.verified && (
              <Icon name="checkmark-circle" size={20} style={{ marginLeft: 8 }} />
            )}
          </View>
          
          <Text style={[commonStyles.text, { opacity: 0.8, marginBottom: 15 }]}>
            {user.role} • {user.location}
          </Text>
          
          <Text style={[commonStyles.text, { fontSize: 12, opacity: 0.6 }]}>
            Member since {user.joinDate}
          </Text>
        </View>

        {/* Stats */}
        <View style={[commonStyles.card, { flexDirection: 'row', justifyContent: 'space-around' }]}>
          <TouchableOpacity style={{ alignItems: 'center' }}>
            <Text style={[commonStyles.title, { fontSize: 24 }]}>
              {user.highlights.length}
            </Text>
            <Text style={[commonStyles.text, { fontSize: 14, opacity: 0.8 }]}>
              Highlights
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={handleViewCollaborations}>
            <Text style={[commonStyles.title, { fontSize: 24 }]}>
              {user.collaborations}
            </Text>
            <Text style={[commonStyles.text, { fontSize: 14, opacity: 0.8 }]}>
              Collaborations
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={{ alignItems: 'center' }}>
            <Text style={[commonStyles.title, { fontSize: 24 }]}>
              {user.rating || '-'}
            </Text>
            <Text style={[commonStyles.text, { fontSize: 14, opacity: 0.8 }]}>
              Rating
            </Text>
          </TouchableOpacity>
        </View>

        {/* Genres */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.title, { fontSize: 18, marginBottom: 15 }]}>
            Genres
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {user.genres.map(genre => (
              <View key={genre} style={{
                backgroundColor: '#64B5F6',
                borderRadius: 15,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginRight: 8,
                marginBottom: 8
              }}>
                <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>
                  {genre}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.title, { fontSize: 18, marginBottom: 15 }]}>
            About
          </Text>
          <Text style={[commonStyles.text, { lineHeight: 22 }]}>
            {user.bio}
          </Text>
        </View>

        {/* Highlights Section */}
        <View style={commonStyles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={[commonStyles.title, { fontSize: 18 }]}>
              Highlights
            </Text>
            <TouchableOpacity onPress={handleUploadHighlight}>
              <Icon name="add-circle" size={24} />
            </TouchableOpacity>
          </View>
          
          {user.highlights.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Icon name="musical-note" size={40} style={{ marginBottom: 15, opacity: 0.5 }} />
              <Text style={[commonStyles.text, { textAlign: 'center', opacity: 0.8 }]}>
                No highlights yet. Upload your best work to showcase your talent!
              </Text>
              <TouchableOpacity 
                style={{ marginTop: 15 }}
                onPress={handleUploadHighlight}
              >
                <Text style={[commonStyles.text, { textDecorationLine: 'underline' }]}>
                  Upload Your First Highlight
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {user.highlights.map((highlight, index) => (
                <View key={index} style={{ marginBottom: 10 }}>
                  {/* Highlight items would go here */}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={{ marginTop: 20 }}>
          <Button
            text="Edit Profile"
            onPress={handleEditProfile}
          />
          
          <TouchableOpacity 
            style={{ marginTop: 15, alignItems: 'center' }}
            onPress={() => router.push('/discover')}
          >
            <Text style={[commonStyles.text, { textDecorationLine: 'underline' }]}>
              Discover New Collaborators
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
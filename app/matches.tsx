import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';

const MOCK_MATCHES = [
  {
    id: '1',
    name: 'Alex Producer',
    role: 'Producer',
    genres: ['Hip-Hop', 'R&B'],
    location: 'Los Angeles, CA',
    matchedAt: '2 hours ago',
    lastMessage: 'Hey! Love your vocal style. Want to collaborate?',
    isRead: false
  },
  {
    id: '2',
    name: 'Maya Vocalist',
    role: 'Vocalist',
    genres: ['Pop', 'R&B'],
    location: 'Nashville, TN',
    matchedAt: '1 day ago',
    lastMessage: 'Thanks for the match! What kind of project are you working on?',
    isRead: true
  }
];

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const [matches] = useState(MOCK_MATCHES);

  useEffect(() => {
    console.log('💕 Matches Screen Loaded');
  }, []);

  const handleStartChat = (matchId: string) => {
    console.log('💬 Starting chat with:', matchId);
    Alert.alert(
      'Start Chat',
      'This feature will open a direct messaging interface with your match. Coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleViewProfile = (matchId: string) => {
    console.log('👤 Viewing profile:', matchId);
    router.push(`/profile/${matchId}`);
  };

  const handleBackToDiscover = () => {
    console.log('🔍 Back to discover');
    router.push('/discover');
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
          Your Matches
        </Text>
        <TouchableOpacity onPress={handleBackToDiscover}>
          <Icon name="search" size={24} />
        </TouchableOpacity>
      </View>

      {matches.length === 0 ? (
        <View style={commonStyles.content}>
          <Icon name="heart-outline" size={80} style={{ opacity: 0.5 }} />
          <Text style={[commonStyles.title, { marginTop: 20, marginBottom: 15 }]}>
            No Matches Yet
          </Text>
          <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 30, opacity: 0.8 }]}>
            Start swiping to discover musicians and build your network!
          </Text>
          <Button
            text="Discover Musicians"
            onPress={handleBackToDiscover}
          />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {matches.map(match => (
            <TouchableOpacity
              key={match.id}
              style={[commonStyles.card, { marginBottom: 15 }]}
              onPress={() => handleStartChat(match.id)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Avatar */}
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
                    {match.name.charAt(0)}
                  </Text>
                </View>

                {/* Match Info */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={[commonStyles.title, { fontSize: 18, marginRight: 10 }]}>
                      {match.name}
                    </Text>
                    {!match.isRead && (
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#2ed573'
                      }} />
                    )}
                  </View>
                  
                  <Text style={[commonStyles.text, { fontSize: 14, opacity: 0.8, marginBottom: 5 }]}>
                    {match.role} • {match.location}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                    {match.genres.slice(0, 2).map(genre => (
                      <View key={genre} style={{
                        backgroundColor: '#64B5F6',
                        borderRadius: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        marginRight: 4,
                        marginBottom: 4
                      }}>
                        <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>
                          {genre}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <Text style={[commonStyles.text, { fontSize: 14, opacity: 0.9 }]}>
                    {match.lastMessage}
                  </Text>
                  
                  <Text style={[commonStyles.text, { fontSize: 12, opacity: 0.6, marginTop: 5 }]}>
                    Matched {match.matchedAt}
                  </Text>
                </View>

                {/* Actions */}
                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#162456',
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginBottom: 8
                    }}
                    onPress={() => handleStartChat(match.id)}
                  >
                    <Text style={[commonStyles.text, { fontSize: 12, fontWeight: 'bold' }]}>
                      Chat
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleViewProfile(match.id)}
                  >
                    <Text style={[commonStyles.text, { fontSize: 12, textDecorationLine: 'underline' }]}>
                      Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Discover More CTA */}
          <View style={[commonStyles.card, { alignItems: 'center', paddingVertical: 30 }]}>
            <Icon name="search" size={60} style={{ marginBottom: 15, opacity: 0.7 }} />
            <Text style={[commonStyles.title, { fontSize: 18, marginBottom: 10 }]}>
              Discover More Musicians
            </Text>
            <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 20, opacity: 0.8 }]}>
              Keep swiping to find more collaborators and expand your network.
            </Text>
            <Button
              text="Continue Discovering"
              onPress={handleBackToDiscover}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
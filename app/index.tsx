import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    console.log('🏠 MusicLinked Home Screen Loaded');
    // Simulate user check
    const mockUser = {
      id: '1',
      name: 'Demo User',
      role: 'Producer',
      isOnboarded: false
    };
    setUser(mockUser);
  }, []);

  const handleGetStarted = () => {
    console.log('🎵 Starting onboarding flow');
    router.push('/onboarding');
  };

  const handleExplore = () => {
    console.log('🔍 Exploring features');
    router.push('/discover');
  };

  const handleProfile = () => {
    console.log('👤 Opening profile');
    router.push('/profile');
  };

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        contentContainerStyle={commonStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Icon name="musical-notes" size={80} />
          <Text style={[commonStyles.title, { fontSize: 32, marginTop: 20 }]}>
            MusicLinked
          </Text>
          <Text style={[commonStyles.text, { fontSize: 18, opacity: 0.8 }]}>
            The Professional Network for Musicians
          </Text>
        </View>

        {/* Features Overview */}
        <View style={{ width: '100%', paddingHorizontal: 20, marginBottom: 40 }}>
          <FeatureCard
            icon="people"
            title="Connect & Collaborate"
            description="Find musicians, producers, and industry professionals"
            onPress={handleExplore}
          />
          <FeatureCard
            icon="mic"
            title="Showcase Your Talent"
            description="Upload audio/video highlights and build your profile"
            onPress={handleProfile}
          />
          <FeatureCard
            icon="flash"
            title="Smart Matching"
            description="AI-powered recommendations based on your musical style"
            onPress={handleExplore}
          />
          <FeatureCard
            icon="cash"
            title="Revenue Splitting"
            description="Automated payment distribution for collaborations"
            onPress={() => Alert.alert('Feature Coming Soon', 'Revenue splitting will be available in the beta version!')}
          />
        </View>

        {/* CTA Buttons */}
        <View style={commonStyles.buttonContainer}>
          {!user?.isOnboarded ? (
            <Button
              text="Get Started"
              onPress={handleGetStarted}
            />
          ) : (
            <Button
              text="Discover Artists"
              onPress={handleExplore}
            />
          )}
          
          <TouchableOpacity 
            style={{ marginTop: 15 }}
            onPress={handleProfile}
          >
            <Text style={[commonStyles.text, { textDecorationLine: 'underline' }]}>
              View My Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={[commonStyles.text, { fontSize: 14, opacity: 0.6 }]}>
            Version 1.0.0 - Alpha
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

interface FeatureCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}

function FeatureCard({ icon, title, description, onPress }: FeatureCardProps) {
  return (
    <TouchableOpacity style={commonStyles.card} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name={icon} size={40} style={{ marginRight: 15 }} />
        <View style={{ flex: 1 }}>
          <Text style={[commonStyles.title, { fontSize: 18, marginBottom: 5 }]}>
            {title}
          </Text>
          <Text style={[commonStyles.text, { fontSize: 14, opacity: 0.8 }]}>
            {description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
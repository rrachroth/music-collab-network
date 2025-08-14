
import { Tabs } from 'expo-router';
import { colors } from '../../styles/commonStyles';
import Icon from '../../components/Icon';
import ErrorBoundary from '../../components/ErrorBoundary';
import { Platform } from 'react-native';

export default function TabLayout() {
  console.log('📱 Tab Layout rendering...');
  
  return (
    <ErrorBoundary>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.backgroundCard,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 15 : 8,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 70 : 60,
          },
          tabBarShowLabel: false, // Hide text labels
          tabBarIconStyle: {
            marginBottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, size }) => (
              <Icon name="search" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: 'Projects',
            tabBarIcon: ({ color, size }) => (
              <Icon name="folder" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="matches"
          options={{
            title: 'Matches',
            tabBarIcon: ({ color, size }) => (
              <Icon name="heart" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Icon name="person" size={28} color={color} />
            ),
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}


import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { getCurrentUser, initializeSampleData, User } from '../../utils/storage';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../../styles/commonStyles';

interface FeatureCardProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
  onPress: () => void;
  delay: number;
}

export default function HomeScreen() {
  console.log('🏠 NextDrop Home Screen rendering...');
  
  const insets = useSafeAreaInsets();

  const handleDiscover = () => {
    console.log('🔍 Navigating to Discover');
    router.push('/(tabs)/discover');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientBackground}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.welcomeTitle}>Welcome to NextDrop</Text>
        <Text style={styles.welcomeSubtitle}>
          Connect, collaborate, and create amazing music together
        </Text>
        
        <Button
          text="Start Discovering"
          onPress={handleDiscover}
          variant="primary"
          size="md"
          style={styles.ctaButton}
        />
      </View>
    </View>
  );
}

function FeatureCard({ icon, title, description, gradient, onPress, delay }: FeatureCardProps) {
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ scale: cardScale.value }],
    };
  });

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    cardScale.value = withDelay(delay, withSpring(1, { damping: 15 }));
  }, [delay, cardOpacity, cardScale]);

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity 
        style={styles.featureCard} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradient}
          style={styles.featureIcon}
        >
          <Icon name={icon} size={28} color={colors.white} />
        </LinearGradient>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  ctaButton: {
    backgroundColor: colors.backgroundCard,
    minWidth: 200,
  },
});

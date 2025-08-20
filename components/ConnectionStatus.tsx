
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import Icon from './Icon';
import { connectionService } from '../utils/connectionService';
import { colors, spacing, borderRadius, shadows } from '../styles/commonStyles';

interface ConnectionStatusProps {
  showWhenConnected?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: string;
  consecutiveFailures: number;
  lastError?: string;
}

const ConnectionStatusComponent: React.FC<ConnectionStatusProps> = ({
  showWhenConnected = false,
  compact = false,
  onPress
}) => {
  const [status, setStatus] = useState<ConnectionStatus>(connectionService.getConnectionStatus());
  const [isRetrying, setIsRetrying] = useState(false);
  
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = connectionService.addConnectionListener((newStatus) => {
      setStatus(newStatus);
      
      // Animate in when status changes
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    });

    // Initial animation
    if (!status.isConnected || showWhenConnected) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Pulse animation for disconnected state
    if (!status.isConnected) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [status.isConnected]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { scale: pulseScale.value }
    ],
  }));

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!status.isConnected) {
      setIsRetrying(true);
      try {
        await connectionService.forceReconnect();
      } catch (error) {
        console.error('❌ Manual reconnection failed:', error);
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const getStatusColor = () => {
    if (isRetrying) return colors.warning;
    return status.isConnected ? colors.success : colors.error;
  };

  const getStatusIcon = () => {
    if (isRetrying) return 'refresh';
    return status.isConnected ? 'wifi' : 'wifi-off';
  };

  const getStatusText = () => {
    if (isRetrying) return 'Reconnecting...';
    if (status.isConnected) return 'Connected';
    if (status.consecutiveFailures > 0) {
      return `Connection lost (${status.consecutiveFailures} failures)`;
    }
    return 'Disconnected';
  };

  const getStatusSubtext = () => {
    if (compact) return null;
    
    if (isRetrying) return 'Please wait...';
    if (status.isConnected) return 'All systems operational';
    if (status.lastError) return status.lastError;
    return 'Tap to retry connection';
  };

  // Don't show if connected and showWhenConnected is false
  if (status.isConnected && !showWhenConnected) {
    return null;
  }

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={isRetrying}
        style={[styles.container, compact && styles.compactContainer]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[getStatusColor(), `${getStatusColor()}80`]}
          style={[styles.gradient, compact && styles.compactGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.content, compact && styles.compactContent]}>
            <View style={styles.iconContainer}>
              <Icon 
                name={getStatusIcon()} 
                size={compact ? 16 : 20} 
                color={colors.white} 
              />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={[styles.statusText, compact && styles.compactStatusText]}>
                {getStatusText()}
              </Text>
              
              {!compact && getStatusSubtext() && (
                <Text style={styles.subtextText}>
                  {getStatusSubtext()}
                </Text>
              )}
            </View>

            {!status.isConnected && !isRetrying && (
              <View style={styles.actionContainer}>
                <Icon 
                  name="refresh" 
                  size={compact ? 14 : 16} 
                  color={colors.white} 
                />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  compactContainer: {
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
  },
  gradient: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  compactGradient: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactContent: {
    // Same as content for now
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  compactStatusText: {
    fontSize: 14,
    marginBottom: 0,
  },
  subtextText: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
  },
  actionContainer: {
    marginLeft: spacing.sm,
  },
});

export default ConnectionStatusComponent;

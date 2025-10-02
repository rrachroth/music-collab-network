
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Icon from './Icon';
import { connectionService } from '../utils/connectionService';
import { colors, spacing, borderRadius } from '../styles/commonStyles';

interface ConnectionStatusProps {
  showWhenConnected?: boolean;
  compact?: boolean;
  showDeploymentStatus?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showWhenConnected = false,
  compact = false,
  showDeploymentStatus = false,
}) => {
  const insets = useSafeAreaInsets();
  const [connectionStatus, setConnectionStatus] = useState(connectionService.getConnectionStatus());
  const [isRetrying, setIsRetrying] = useState(false);

  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-50);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    const unsubscribe = connectionService.addConnectionListener((status) => {
      setConnectionStatus(status);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Only show if disconnected AND there have been multiple failures (more than 5)
    const shouldShow = (!connectionStatus.isConnected && connectionStatus.consecutiveFailures > 5) || 
                      (showWhenConnected && connectionStatus.isConnected);
    
    if (shouldShow) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-50, { duration: 300 });
    }
  }, [connectionStatus.isConnected, connectionStatus.consecutiveFailures, showWhenConnected, opacity, translateY]);

  const handleRetry = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    try {
      console.log('🔄 Manual reconnection attempt...');
      await connectionService.forceReconnect();
    } catch (error) {
      console.error('❌ Manual reconnection failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusColor = () => {
    if (connectionStatus.isConnected) {
      return colors.success || '#10B981';
    }
    return colors.error || '#EF4444';
  };

  const getStatusText = () => {
    if (connectionStatus.isConnected) {
      return 'Connected';
    }
    
    if (connectionStatus.consecutiveFailures > 0) {
      return `Connection lost (${connectionStatus.consecutiveFailures} failures)`;
    }
    
    return 'Connection lost';
  };

  const getStatusIcon = () => {
    if (isRetrying) {
      return 'refresh';
    }
    
    if (connectionStatus.isConnected) {
      return 'wifi';
    }
    
    return 'wifi-off';
  };

  // Don't render if connected and not showing when connected, or if failures are minimal
  if ((connectionStatus.isConnected && !showWhenConnected) || 
      (!connectionStatus.isConnected && connectionStatus.consecutiveFailures <= 5)) {
    return null;
  }

  return (
    <Animated.View style={[
      styles.container,
      { 
        paddingTop: insets.top + spacing.sm,
        backgroundColor: getStatusColor(),
      },
      compact && styles.compact,
      animatedStyle,
    ]}>
      <View style={styles.content}>
        <Icon 
          name={getStatusIcon() as any} 
          size={compact ? 16 : 20} 
          color={colors.white} 
        />
        
        <Text style={[
          styles.text,
          compact && styles.compactText,
        ]}>
          {getStatusText()}
        </Text>
        
        {!connectionStatus.isConnected && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            disabled={isRetrying}
          >
            <Text style={styles.retryText}>
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  compact: {
    paddingVertical: spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  compactText: {
    fontSize: 12,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  retryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ConnectionStatus;

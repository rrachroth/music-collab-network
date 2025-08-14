import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/commonStyles';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

interface ButtonProps {
  title?: string;
  text?: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function Button({
  title,
  text,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left'
}: ButtonProps) {
  const buttonText = title || text || '';
  const scale = useSharedValue(1);
  const opacity = useSharedValue(disabled ? 0.6 : 1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    opacity.value = withTiming(disabled ? 0.6 : 1, { duration: 200 });
  }, [disabled, opacity]);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15 });
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.primary];
      case 'secondary':
        return [...baseStyle, styles.secondary];
      case 'outline':
        return [...baseStyle, styles.outline];
      case 'ghost':
        return [...baseStyle, styles.ghost];
      case 'gradient':
        return [...baseStyle, styles.gradient];
      default:
        return [...baseStyle, styles.primary];
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    
    switch (variant) {
      case 'outline':
        return [...baseStyle, { color: colors.primary }];
      case 'ghost':
        return [...baseStyle, { color: colors.textSecondary }];
      default:
        return [...baseStyle, { color: colors.text }];
    }
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={colors.text} />;
    }

    return (
      <>
        {icon && iconPosition === 'left' && icon}
        <Text style={[getTextStyle(), textStyle]}>{buttonText}</Text>
        {icon && iconPosition === 'right' && icon}
      </>
    );
  };

  if (variant === 'gradient') {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            style={[getButtonStyle(), { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }]}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        style={[getButtonStyle(), { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 52,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  gradient: {
    // Gradient styles are applied via LinearGradient
  },
  text: {
    ...typography.button,
    textAlign: 'center',
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
});
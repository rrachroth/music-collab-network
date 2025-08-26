
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../styles/commonStyles';

interface ButtonProps {
  text?: string;
  title?: string; // Alternative prop name for compatibility
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  text,
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  variant = 'primary',
  size = 'large',
  icon,
}) => {
  const buttonText = text || title || 'Button';

  const getButtonStyle = () => {
    // Normalize size
    const normalizedSize = size === 'sm' ? 'small' : size === 'md' ? 'medium' : size === 'lg' ? 'large' : size;
    const baseStyle = [styles.button, styles[normalizedSize]];
    
    if (variant === 'outline') {
      baseStyle.push(styles.outlineButton);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton);
    } else if (variant === 'ghost') {
      baseStyle.push(styles.ghostButton);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabled);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    // Normalize size
    const normalizedSize = size === 'sm' ? 'small' : size === 'md' ? 'medium' : size === 'lg' ? 'large' : size;
    const baseStyle = [styles.text, styles[`${normalizedSize}Text`]];
    
    if (variant === 'outline') {
      baseStyle.push(styles.outlineText);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryText);
    } else if (variant === 'ghost') {
      baseStyle.push(styles.ghostText);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledText);
    }
    
    return baseStyle;
  };

  const renderContent = () => (
    <>
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? colors.white : colors.white} 
          style={styles.loader}
        />
      )}
      {icon && <>{icon}</>}
      <Text style={[getTextStyle(), textStyle]}>
        {buttonText}
      </Text>
    </>
  );

  if ((variant === 'primary' || variant === 'gradient') && !disabled) {
    // Normalize size
    const normalizedSize = size === 'sm' ? 'small' : size === 'md' ? 'medium' : size === 'lg' ? 'large' : size;
    
    return (
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors.gradientPrimary}
          style={[styles.gradient, styles[normalizedSize]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.md,
  },
  gradient: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  
  // Size variants
  small: {
    height: 40,
    paddingHorizontal: spacing.lg,
  },
  medium: {
    height: 48,
    paddingHorizontal: spacing.xl,
  },
  large: {
    height: 56,
    paddingHorizontal: spacing.xl,
  },
  
  // Button variants
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
    color: colors.white,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // Text variants
  outlineText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.text,
  },
  ghostText: {
    color: colors.textMuted,
  },
  
  // Disabled states
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.7,
  },
  
  // Loading
  loader: {
    marginRight: spacing.sm,
  },
});

export default Button;

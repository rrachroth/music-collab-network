import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors } from '../styles/commonStyles';

interface ButtonProps {
  text: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function Button({ 
  text, 
  onPress, 
  style, 
  textStyle, 
  disabled = false,
  loading = false,
  variant = 'primary'
}: ButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.button, styles.secondaryButton];
      case 'outline':
        return [styles.button, styles.outlineButton];
      default:
        return [styles.button, styles.primaryButton];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return [styles.buttonText, styles.outlineButtonText];
      default:
        return [styles.buttonText];
    }
  };

  return (
    <TouchableOpacity 
      style={[
        ...getButtonStyle(),
        disabled && styles.disabledButton,
        style
      ]} 
      onPress={onPress} 
      activeOpacity={0.7}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.accent : '#fff'} />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: colors.accent,
    borderWidth: 2,
  },
  disabledButton: {
    backgroundColor: colors.grey,
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  outlineButtonText: {
    color: colors.accent,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../styles/commonStyles';
import Button from './Button';
import Icon from './Icon';

interface SimpleErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

interface SimpleErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SimpleErrorBoundary extends React.Component<SimpleErrorBoundaryProps, SimpleErrorBoundaryState> {
  constructor(props: SimpleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SimpleErrorBoundaryState {
    console.error('🚨 SimpleErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 SimpleErrorBoundary componentDidCatch:', error, errorInfo);
  }

  retry = () => {
    console.log('🔄 SimpleErrorBoundary retry');
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <View style={styles.container}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
          
          <Icon name="alert-circle" size={60} color={colors.error} />
          
          <Text style={styles.title}>
            Something went wrong
          </Text>
          
          <Text style={styles.message}>
            The app encountered an error. Please try again.
          </Text>

          <Button
            text="Try Again"
            onPress={this.retry}
            variant="primary"
            size="lg"
            style={styles.button}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  button: {
    minWidth: 200,
  },
});

export default SimpleErrorBoundary;

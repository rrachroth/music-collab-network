
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles, colors, spacing, borderRadius } from '../styles/commonStyles';
import Icon from './Icon';
import Button from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🚨 ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary componentDidCatch:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  retry = () => {
    console.log('🔄 ErrorBoundary retry');
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <View style={[commonStyles.container, commonStyles.centerContent]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="alert-circle" size={80} color={colors.error} />
          <Text style={[commonStyles.title, { marginTop: spacing.lg, textAlign: 'center' }]}>
            Something went wrong
          </Text>
          <Text style={[commonStyles.text, { 
            marginTop: spacing.sm, 
            marginBottom: spacing.xl, 
            textAlign: 'center',
            paddingHorizontal: spacing.lg 
          }]}>
            The app encountered an unexpected error. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorText}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <Button
            title="Try Again"
            onPress={this.retry}
            variant="gradient"
            size="lg"
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorDetails: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    maxWidth: '90%',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.error,
    textAlign: 'center',
  },
});

export default ErrorBoundary;

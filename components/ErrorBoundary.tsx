
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles, colors, spacing, borderRadius } from '../styles/commonStyles';
import Icon from './Icon';
import Button from './Button';
import { router } from 'expo-router';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
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
    
    // Generate a unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary componentDidCatch:', error, errorInfo);
    console.error('🚨 Component stack:', errorInfo.componentStack);
    
    this.setState({ error, errorInfo });

    // Log additional context
    console.error('🚨 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      componentStack: errorInfo.componentStack,
    });
  }

  retry = () => {
    console.log('🔄 ErrorBoundary retry');
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined
    });
  };

  handleDiagnostics = () => {
    console.log('🔧 Opening diagnostics from error boundary');
    router.push('/backend-setup');
  };

  getErrorCategory = (error?: Error): string => {
    if (!error) return 'Unknown Error';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network Error';
    } else if (message.includes('auth') || message.includes('unauthorized')) {
      return 'Authentication Error';
    } else if (message.includes('supabase') || message.includes('database')) {
      return 'Database Error';
    } else if (message.includes('timeout')) {
      return 'Timeout Error';
    } else if (message.includes('render') || message.includes('component')) {
      return 'Rendering Error';
    } else {
      return 'Application Error';
    }
  };

  getErrorSuggestion = (error?: Error): string => {
    if (!error) return 'Please try restarting the app.';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Check your internet connection and try again.';
    } else if (message.includes('auth') || message.includes('unauthorized')) {
      return 'Try signing out and signing back in.';
    } else if (message.includes('supabase') || message.includes('database')) {
      return 'The database service may be temporarily unavailable. Run diagnostics for more info.';
    } else if (message.includes('timeout')) {
      return 'The request took too long. Check your connection and try again.';
    } else {
      return 'Try restarting the app. If the problem persists, run diagnostics.';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      const errorCategory = this.getErrorCategory(this.state.error);
      const errorSuggestion = this.getErrorSuggestion(this.state.error);

      return (
        <View style={[commonStyles.container, commonStyles.centerContent]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={StyleSheet.absoluteFill}
          />
          
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={80} color={colors.error} />
              
              <Text style={styles.errorTitle}>
                Oops! Something went wrong
              </Text>
              
              <Text style={styles.errorCategory}>
                {errorCategory}
              </Text>
              
              <Text style={styles.errorMessage}>
                {errorSuggestion}
              </Text>

              {this.state.errorId && (
                <View style={styles.errorIdContainer}>
                  <Text style={styles.errorIdLabel}>Error ID:</Text>
                  <Text style={styles.errorId}>{this.state.errorId}</Text>
                </View>
              )}

              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorDetailsTitle}>Developer Info:</Text>
                  <Text style={styles.errorText}>
                    {this.state.error.message}
                  </Text>
                  {this.state.error.stack && (
                    <ScrollView 
                      style={styles.stackTrace}
                      showsVerticalScrollIndicator={true}
                    >
                      <Text style={styles.stackText}>
                        {this.state.error.stack}
                      </Text>
                    </ScrollView>
                  )}
                </View>
              )}

              <View style={styles.actionsContainer}>
                <Button
                  text="Try Again"
                  onPress={this.retry}
                  variant="primary"
                  size="large"
                  style={styles.primaryButton}
                />
                
                <Button
                  text="Run Diagnostics"
                  onPress={this.handleDiagnostics}
                  variant="secondary"
                  size="large"
                  style={styles.secondaryButton}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: '100%',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
  errorCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    fontFamily: 'Inter_400Regular',
  },
  errorIdContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  errorIdLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: spacing.xs,
    fontFamily: 'Inter_400Regular',
  },
  errorId: {
    fontSize: 14,
    color: colors.white,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  errorDetails: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    maxWidth: '100%',
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.sm,
    fontFamily: 'Inter_600SemiBold',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.error,
    marginBottom: spacing.sm,
  },
  stackTrace: {
    maxHeight: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  stackText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 14,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.white,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default ErrorBoundary;

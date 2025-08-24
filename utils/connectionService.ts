
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: string;
  consecutiveFailures: number;
  lastError?: string;
}

class ConnectionService {
  private static instance: ConnectionService;
  private connectionStatus: ConnectionStatus = {
    isConnected: true, // Start optimistic
    lastChecked: new Date().toISOString(),
    consecutiveFailures: 0
  };
  
  private healthCheckInterval?: NodeJS.Timeout;
  private listeners: Array<(status: ConnectionStatus) => void> = [];

  private constructor() {
    this.initializeConnection();
  }

  public static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  // Initialize connection monitoring
  private async initializeConnection(): Promise<void> {
    console.log('🔌 Initializing connection service...');
    
    try {
      // Load previous status
      await this.loadConnectionStatus();
      
      // Start with optimistic connection
      this.updateConnectionStatus(true);
      
      // Start periodic health checks (less aggressive)
      this.startHealthCheck();
      
      console.log('✅ Connection service initialized');
    } catch (error) {
      console.error('❌ Connection service initialization error:', error);
      this.updateConnectionStatus(false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Lightweight health check
  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Check every 2 minutes (less aggressive)
    this.healthCheckInterval = setInterval(async () => {
      try {
        // Only check if we've had recent failures
        if (this.connectionStatus.consecutiveFailures > 0) {
          await this.testConnection();
        }
      } catch (error) {
        console.warn('⚠️ Health check error:', error);
      }
    }, 120000); // 2 minutes

    console.log('🔄 Health check started (2 minute interval)');
  }

  // Simple connection test
  private async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing connection...');
      
      // Simple fetch test with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://tioevqidrridspbsjlqb.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb2V2cWlkcnJpZHNwYnNqbHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjQ5NzAsImV4cCI6MjA2NzAwMDk3MH0.HqV7918kKK7noaX-QQg5syVsoYjWS-sgxKhD7lUE6Vw',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const connected = response.ok;
      this.updateConnectionStatus(connected);
      
      if (connected) {
        console.log('✅ Connection test successful');
      } else {
        console.log('❌ Connection test failed');
      }
      
      return connected;
    } catch (error) {
      console.warn('⚠️ Connection test error:', error);
      this.updateConnectionStatus(false, error instanceof Error ? error.message : 'Connection test failed');
      return false;
    }
  }

  // Update connection status and notify listeners
  private updateConnectionStatus(isConnected: boolean, error?: string): void {
    const wasConnected = this.connectionStatus.isConnected;
    
    this.connectionStatus = {
      isConnected,
      lastChecked: new Date().toISOString(),
      consecutiveFailures: isConnected ? 0 : this.connectionStatus.consecutiveFailures + 1,
      lastError: error
    };

    // Log significant status changes
    if (wasConnected !== isConnected) {
      if (isConnected) {
        console.log('🟢 Connection restored');
      } else {
        console.log('🔴 Connection lost');
      }
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.connectionStatus);
      } catch (error) {
        console.error('❌ Error notifying connection listener:', error);
      }
    });

    // Save status
    this.saveConnectionStatus();
  }

  // Save connection status to AsyncStorage
  private async saveConnectionStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem('connection_status', JSON.stringify(this.connectionStatus));
    } catch (error) {
      console.error('❌ Failed to save connection status:', error);
    }
  }

  // Load connection status from AsyncStorage
  private async loadConnectionStatus(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('connection_status');
      if (stored) {
        const status = JSON.parse(stored);
        this.connectionStatus = { ...this.connectionStatus, ...status };
        console.log('📱 Loaded connection status from storage');
      }
    } catch (error) {
      console.error('❌ Failed to load connection status:', error);
    }
  }

  // Public methods
  public getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  public isConnected(): boolean {
    return this.connectionStatus.isConnected;
  }

  public async forceReconnect(): Promise<boolean> {
    console.log('🔄 Force reconnecting...');
    
    // Reset failure count
    this.connectionStatus.consecutiveFailures = 0;
    
    // Test connection immediately
    return await this.testConnection();
  }

  public addConnectionListener(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately notify with current status
    listener(this.connectionStatus);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Enhanced error handling for operations
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Operation',
    maxRetries: number = 2
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 ${operationName} (attempt ${attempt}/${maxRetries})`);
        
        const result = await operation();
        
        // Mark as connected on successful operation
        if (this.connectionStatus.consecutiveFailures > 0) {
          this.updateConnectionStatus(true);
        }
        
        console.log(`✅ ${operationName} successful`);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ ${operationName} failed (attempt ${attempt}):`, lastError.message);
        
        // Update connection status on error
        this.updateConnectionStatus(false, lastError.message);
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Short delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
  }

  // Cleanup method
  public cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.listeners = [];
    console.log('🧹 Connection service cleaned up');
  }
}

// Export singleton instance
export const connectionService = ConnectionService.getInstance();
export default connectionService;

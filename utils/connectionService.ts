
import { supabase } from '../app/integrations/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: string;
  consecutiveFailures: number;
  lastError?: string;
}

interface ConnectionConfig {
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  connectionTimeout: number;
}

class ConnectionService {
  private static instance: ConnectionService;
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    lastChecked: new Date().toISOString(),
    consecutiveFailures: 0
  };
  
  private config: ConnectionConfig = {
    maxRetries: 5,
    retryDelay: 2000, // Start with 2 seconds
    healthCheckInterval: 30000, // Check every 30 seconds
    connectionTimeout: 10000 // 10 second timeout
  };

  private healthCheckInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private listeners: Array<(status: ConnectionStatus) => void> = [];

  private constructor() {
    this.initializeConnection();
    this.startHealthCheck();
    this.setupAuthStateListener();
  }

  public static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  // Initialize connection and test it
  private async initializeConnection(): Promise<void> {
    console.log('🔌 Initializing Supabase connection...');
    
    try {
      // Test initial connection
      const isConnected = await this.testConnection();
      this.updateConnectionStatus(isConnected);
      
      if (isConnected) {
        console.log('✅ Supabase connection established successfully');
        await this.saveConnectionStatus();
      } else {
        console.log('❌ Initial connection failed, starting retry process');
        this.startReconnectionProcess();
      }
    } catch (error) {
      console.error('❌ Connection initialization error:', error);
      this.updateConnectionStatus(false, error instanceof Error ? error.message : 'Unknown error');
      this.startReconnectionProcess();
    }
  }

  // Test connection by making a simple query
  private async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Create a promise that will timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), this.config.connectionTimeout);
      });

      // Test connection with a simple query
      const connectionPromise = supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      // Race between connection and timeout
      const { error } = await Promise.race([connectionPromise, timeoutPromise]);

      if (error) {
        console.error('❌ Connection test failed:', error.message);
        return false;
      }

      console.log('✅ Connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Connection test error:', error);
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

    // Log status change
    if (wasConnected !== isConnected) {
      if (isConnected) {
        console.log('🟢 Supabase connection restored');
      } else {
        console.log('🔴 Supabase connection lost');
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
  }

  // Start periodic health checks
  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const isConnected = await this.testConnection();
        this.updateConnectionStatus(isConnected);
        
        if (!isConnected && this.connectionStatus.consecutiveFailures === 1) {
          // First failure, start reconnection process
          this.startReconnectionProcess();
        }
        
        await this.saveConnectionStatus();
      } catch (error) {
        console.error('❌ Health check error:', error);
        this.updateConnectionStatus(false, error instanceof Error ? error.message : 'Health check failed');
      }
    }, this.config.healthCheckInterval);

    console.log(`🔄 Health check started (interval: ${this.config.healthCheckInterval}ms)`);
  }

  // Start reconnection process with exponential backoff
  private startReconnectionProcess(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const attempt = this.connectionStatus.consecutiveFailures;
    if (attempt >= this.config.maxRetries) {
      console.log(`❌ Max reconnection attempts (${this.config.maxRetries}) reached`);
      return;
    }

    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
    const delay = Math.min(this.config.retryDelay * Math.pow(2, attempt), 32000);
    
    console.log(`🔄 Scheduling reconnection attempt ${attempt + 1}/${this.config.maxRetries} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        console.log(`🔄 Reconnection attempt ${attempt + 1}/${this.config.maxRetries}`);
        
        const isConnected = await this.testConnection();
        this.updateConnectionStatus(isConnected);
        
        if (!isConnected) {
          // Continue reconnection process
          this.startReconnectionProcess();
        } else {
          console.log('✅ Reconnection successful');
          await this.saveConnectionStatus();
        }
      } catch (error) {
        console.error('❌ Reconnection attempt failed:', error);
        this.updateConnectionStatus(false, error instanceof Error ? error.message : 'Reconnection failed');
        this.startReconnectionProcess();
      }
    }, delay);
  }

  // Setup auth state listener to detect session changes
  private setupAuthStateListener(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth state changed: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Test connection after auth changes
        const isConnected = await this.testConnection();
        this.updateConnectionStatus(isConnected);
        
        if (!isConnected) {
          this.startReconnectionProcess();
        }
      } else if (event === 'SIGNED_OUT') {
        // Reset connection status on sign out
        this.updateConnectionStatus(false, 'User signed out');
      }
    });
  }

  // Save connection status to AsyncStorage
  private async saveConnectionStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem('supabase_connection_status', JSON.stringify(this.connectionStatus));
    } catch (error) {
      console.error('❌ Failed to save connection status:', error);
    }
  }

  // Load connection status from AsyncStorage
  private async loadConnectionStatus(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('supabase_connection_status');
      if (stored) {
        const status = JSON.parse(stored);
        this.connectionStatus = { ...this.connectionStatus, ...status };
        console.log('📱 Loaded connection status from storage:', status);
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
    
    // Clear existing timeouts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Test connection immediately
    const isConnected = await this.testConnection();
    this.updateConnectionStatus(isConnected);
    
    if (!isConnected) {
      this.startReconnectionProcess();
    }
    
    return isConnected;
  }

  public addConnectionListener(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public updateConfig(newConfig: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Connection config updated:', this.config);
    
    // Restart health check with new interval if changed
    if (newConfig.healthCheckInterval) {
      this.startHealthCheck();
    }
  }

  // Enhanced error handling for Supabase operations
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Supabase operation'
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔄 Executing ${operationName} (attempt ${attempt}/${this.config.maxRetries})`);
        
        // Check connection before operation
        if (!this.connectionStatus.isConnected) {
          const reconnected = await this.forceReconnect();
          if (!reconnected) {
            throw new Error('No connection available');
          }
        }
        
        const result = await operation();
        console.log(`✅ ${operationName} successful`);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ ${operationName} failed (attempt ${attempt}):`, lastError.message);
        
        // Update connection status on error
        this.updateConnectionStatus(false, lastError.message);
        
        // Don't retry on the last attempt
        if (attempt === this.config.maxRetries) {
          break;
        }
        
        // Wait before retry with exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error(`${operationName} failed after ${this.config.maxRetries} attempts`);
  }

  // Cleanup method
  public cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.listeners = [];
    console.log('🧹 Connection service cleaned up');
  }
}

// Export singleton instance
export const connectionService = ConnectionService.getInstance();
export default connectionService;

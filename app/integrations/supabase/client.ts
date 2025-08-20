
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://tioevqidrridspbsjlqb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb2V2cWlkcnJpZHNwYnNqbHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjQ5NzAsImV4cCI6MjA2NzAwMDk3MH0.HqV7918kKK7noaX-QQg5syVsoYjWS-sgxKhD7lUE6Vw";

// Enhanced Supabase client configuration for persistent connection
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'nextdrop-mobile',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Enhanced connection monitoring and error handling
class SupabaseConnectionManager {
  private static instance: SupabaseConnectionManager;
  private connectionListeners: Array<(connected: boolean) => void> = [];
  private lastConnectionCheck = 0;
  private connectionCheckInterval = 30000; // 30 seconds
  private isConnected = false;

  private constructor() {
    this.initializeConnectionMonitoring();
  }

  public static getInstance(): SupabaseConnectionManager {
    if (!SupabaseConnectionManager.instance) {
      SupabaseConnectionManager.instance = new SupabaseConnectionManager();
    }
    return SupabaseConnectionManager.instance;
  }

  private initializeConnectionMonitoring(): void {
    console.log('🔌 Initializing Supabase connection monitoring...');

    // Monitor auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth state changed: ${event}`);
      
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ User signed in, testing connection...');
          await this.checkConnection();
          break;
        case 'SIGNED_OUT':
          console.log('👋 User signed out');
          this.updateConnectionStatus(false);
          break;
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token refreshed, testing connection...');
          await this.checkConnection();
          break;
        case 'PASSWORD_RECOVERY':
          console.log('🔑 Password recovery initiated');
          break;
        default:
          console.log(`🔐 Auth event: ${event}`);
      }
    });

    // Initial connection check
    this.checkConnection();

    // Periodic connection health checks
    setInterval(() => {
      this.checkConnection();
    }, this.connectionCheckInterval);
  }

  private async checkConnection(): Promise<boolean> {
    const now = Date.now();
    
    // Throttle connection checks
    if (now - this.lastConnectionCheck < 5000) {
      return this.isConnected;
    }
    
    this.lastConnectionCheck = now;

    try {
      console.log('🔍 Checking Supabase connection...');
      
      // Test connection with a simple query
      const { error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      const connected = !error;
      this.updateConnectionStatus(connected);
      
      if (error) {
        console.error('❌ Connection check failed:', error.message);
      } else {
        console.log('✅ Connection check successful');
      }
      
      return connected;
    } catch (error) {
      console.error('❌ Connection check error:', error);
      this.updateConnectionStatus(false);
      return false;
    }
  }

  private updateConnectionStatus(connected: boolean): void {
    if (this.isConnected !== connected) {
      this.isConnected = connected;
      console.log(`🔌 Connection status changed: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
      
      // Notify all listeners
      this.connectionListeners.forEach(listener => {
        try {
          listener(connected);
        } catch (error) {
          console.error('❌ Error notifying connection listener:', error);
        }
      });
    }
  }

  public addConnectionListener(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.push(listener);
    
    // Immediately notify with current status
    listener(this.isConnected);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  public async forceConnectionCheck(): Promise<boolean> {
    this.lastConnectionCheck = 0; // Reset throttle
    return await this.checkConnection();
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export the connection manager instance
export const connectionManager = SupabaseConnectionManager.getInstance();

// Enhanced error handling wrapper for Supabase operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Supabase operation',
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Executing ${operationName} (attempt ${attempt}/${maxRetries})`);
      
      // Check connection before operation
      const isConnected = await connectionManager.forceConnectionCheck();
      if (!isConnected) {
        throw new Error('No database connection available');
      }
      
      const result = await operation();
      console.log(`✅ ${operationName} successful`);
      return result;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ ${operationName} failed (attempt ${attempt}):`, lastError.message);
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retry with exponential backoff
      const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
}

// Connection status hook for React components
export function useSupabaseConnection() {
  const [isConnected, setIsConnected] = React.useState(connectionManager.getConnectionStatus());
  
  React.useEffect(() => {
    const unsubscribe = connectionManager.addConnectionListener(setIsConnected);
    return unsubscribe;
  }, []);
  
  return {
    isConnected,
    forceCheck: () => connectionManager.forceConnectionCheck(),
  };
}

// Import React for the hook
import React from 'react';

console.log('🚀 Supabase client initialized with enhanced connection monitoring');

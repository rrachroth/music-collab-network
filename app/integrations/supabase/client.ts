
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://tioevqidrridspbsjlqb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb2V2cWlkcnJpZHNwYnNqbHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjQ5NzAsImV4cCI6MjA2NzAwMDk3MH0.HqV7918kKK7noaX-QQg5syVsoYjWS-sgxKhD7lUE6Vw";

// Enhanced Supabase client configuration for better reliability
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
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

// Simplified connection monitoring
class SupabaseConnectionManager {
  private static instance: SupabaseConnectionManager;
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private isConnected = true; // Start optimistic
  private lastCheck = 0;
  private checkInterval = 60000; // Check every minute

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
    console.log('🔌 Initializing simplified connection monitoring...');

    // Monitor auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth state changed: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Optimistically assume connection is good after successful auth
        this.updateConnectionStatus(true);
      }
    });

    // Periodic lightweight connection checks
    setInterval(() => {
      this.checkConnectionIfNeeded();
    }, this.checkInterval);
  }

  private async checkConnectionIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Throttle checks
    if (now - this.lastCheck < 30000) {
      return;
    }
    
    this.lastCheck = now;

    try {
      // Very lightweight check - just test if we can reach the API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const connected = response.ok;
      this.updateConnectionStatus(connected);
      
    } catch (error) {
      console.warn('⚠️ Connection check failed:', error);
      this.updateConnectionStatus(false);
    }
  }

  private updateConnectionStatus(connected: boolean): void {
    if (this.isConnected !== connected) {
      this.isConnected = connected;
      console.log(`🔌 Connection status: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
      
      // Notify listeners
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

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async forceConnectionCheck(): Promise<boolean> {
    this.lastCheck = 0; // Reset throttle
    await this.checkConnectionIfNeeded();
    return this.isConnected;
  }
}

// Export the connection manager instance
export const connectionManager = SupabaseConnectionManager.getInstance();

// Simplified retry wrapper for critical operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Supabase operation',
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName} (attempt ${attempt}/${maxRetries})`);
      
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
      
      // Short delay before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
}

console.log('🚀 Supabase client initialized with simplified connection monitoring');

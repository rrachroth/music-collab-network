
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment configuration - inline to avoid import issues
const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tioevqidrridspbsjlqb.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb2V2cWlkcnJpZHNwYnNqbHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjQ5NzAsImV4cCI6MjA2NzAwMDk3MH0.HqV7918kKK7noaX-QQg5syVsoYjWS-sgxKhD7lUE6Vw',
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
  APP_VERSION: '1.0.0',
};

// Validation functions
const validateEnvironment = () => {
  const errors: string[] = [];
  
  if (!ENV.SUPABASE_URL) {
    errors.push('SUPABASE_URL is required');
  }
  
  if (!ENV.SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_ANON_KEY is required');
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:', errors);
    return false;
  }
  
  console.log('✅ Environment validation passed');
  return true;
};

// Log current configuration (without sensitive data)
const logConfiguration = () => {
  console.log('🔧 Supabase Configuration:', {
    APP_ENV: ENV.APP_ENV,
    APP_VERSION: ENV.APP_VERSION,
    SUPABASE_URL_CONFIGURED: !!ENV.SUPABASE_URL,
    SUPABASE_ANON_KEY_CONFIGURED: !!ENV.SUPABASE_ANON_KEY,
  });
};

// Validate environment on startup
validateEnvironment();

// Log configuration in development
if (ENV.APP_ENV === 'development') {
  logConfiguration();
}

// Create Supabase client
export const supabase = createClient<Database>(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': `musiclinked-${ENV.APP_VERSION}`,
      },
    },
  }
);

// Health check function
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
};

// Deployment readiness check
export const checkDeploymentReadiness = async (): Promise<{
  ready: boolean;
  issues: string[];
  warnings: string[];
  score?: number;
}> => {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Check database connection
    const connectionOk = await checkSupabaseConnection();
    if (!connectionOk) {
      issues.push('Database connection failed');
    }
    
    // Check required tables exist
    const requiredTables = ['profiles', 'projects', 'matches', 'payments', 'applications'];
    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          issues.push(`Table '${table}' not accessible: ${error.message}`);
        }
      } catch (error) {
        issues.push(`Table '${table}' check failed`);
      }
    }
    
    // Check authentication
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth session check completed');
    } catch (error) {
      warnings.push('Authentication check failed');
    }
    
    // Check environment configuration
    if (!ENV.SUPABASE_URL.includes('supabase.co')) {
      issues.push('Invalid Supabase URL configuration');
    }
    
    if (ENV.APP_ENV === 'production' && !process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_')) {
      warnings.push('Production environment should use live Stripe keys');
    }
    
    // Check RLS policies (basic check)
    try {
      const { data: policies } = await supabase
        .rpc('get_policies_info')
        .select('*');
      
      if (!policies || policies.length === 0) {
        warnings.push('No RLS policies detected - ensure proper security setup');
      }
    } catch (error) {
      // RLS check is optional, just warn
      warnings.push('Could not verify RLS policies');
    }
    
  } catch (error) {
    issues.push(`Deployment check failed: ${error}`);
  }
  
  const ready = issues.length === 0;
  const totalChecks = 10; // Approximate number of checks
  const passedChecks = totalChecks - issues.length - (warnings.length * 0.5);
  const score = Math.round((passedChecks / totalChecks) * 100);
  
  console.log('🔍 Deployment Readiness Check:', {
    ready,
    issues: issues.length,
    warnings: warnings.length,
    score,
  });
  
  return { ready, issues, warnings, score };
};

// Initialize app data if needed
export const initializeAppData = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing app data...');
    
    // Check if we need to create any default data
    const { data: profileCount } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    console.log('✅ App data initialization completed');
  } catch (error) {
    console.error('❌ App data initialization failed:', error);
    throw error;
  }
};

// Export configuration for use in components
export { ENV };
export default supabase;

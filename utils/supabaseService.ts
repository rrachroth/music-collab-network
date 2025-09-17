
import { supabase } from '../app/integrations/supabase/client';
import { User } from './storage';

export interface SupabaseUser {
  id: string;
  name: string;
  email: string;
  role: string;
  genres: string[];
  location?: string;
  bio?: string;
  verified: boolean;
  rating: number;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseService {
  // Test connection to Supabase
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Supabase connection test successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Supabase connection test error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user profile from Supabase
  static async getUserProfile(userId: string): Promise<{ success: boolean; user?: SupabaseUser; error?: string }> {
    try {
      console.log('👤 Fetching user profile from Supabase:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return { success: false, error: error.message };
      }
      
      if (!data) {
        console.log('⚠️ No user profile found');
        return { success: false, error: 'User profile not found' };
      }
      
      console.log('✅ User profile fetched successfully');
      return { success: true, user: data };
    } catch (error) {
      console.error('❌ Error in getUserProfile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Create user profile in Supabase
  static async createUserProfile(
    userId: string, 
    profileData: Partial<SupabaseUser>
  ): Promise<{ success: boolean; user?: SupabaseUser; error?: string }> {
    try {
      console.log('👤 Creating user profile in Supabase:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          name: profileData.name || 'New User',
          email: profileData.email || '',
          role: profileData.role || 'producer',
          genres: profileData.genres || [],
          location: profileData.location || '',
          bio: profileData.bio || '',
          verified: false,
          rating: 0.0,
          subscription_status: 'free',
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating user profile:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ User profile created successfully');
      return { success: true, user: data };
    } catch (error) {
      console.error('❌ Error in createUserProfile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update user profile in Supabase
  static async updateUserProfile(
    userId: string, 
    updates: Partial<SupabaseUser>
  ): Promise<{ success: boolean; user?: SupabaseUser; error?: string }> {
    try {
      console.log('👤 Updating user profile in Supabase:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating user profile:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ User profile updated successfully');
      return { success: true, user: data };
    } catch (error) {
      console.error('❌ Error in updateUserProfile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get all user profiles for discovery
  static async getAllUserProfiles(): Promise<{ success: boolean; users?: SupabaseUser[]; error?: string }> {
    try {
      console.log('👥 Fetching all user profiles from Supabase...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching user profiles:', error);
        return { success: false, error: error.message };
      }
      
      console.log(`✅ Fetched ${data?.length || 0} user profiles`);
      return { success: true, users: data || [] };
    } catch (error) {
      console.error('❌ Error in getAllUserProfiles:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Check if tables exist and have proper RLS policies
  static async checkDatabaseSetup(): Promise<{ success: boolean; issues?: string[]; error?: string }> {
    try {
      console.log('🔍 Checking database setup...');
      
      const issues: string[] = [];
      
      // Check if profiles table exists
      try {
        const { error: profilesError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        if (profilesError) {
          issues.push(`Profiles table issue: ${profilesError.message}`);
        }
      } catch (error) {
        issues.push('Profiles table does not exist or is not accessible');
      }
      
      // Check if projects table exists
      try {
        const { error: projectsError } = await supabase
          .from('projects')
          .select('count')
          .limit(1);
        
        if (projectsError) {
          issues.push(`Projects table issue: ${projectsError.message}`);
        }
      } catch (error) {
        issues.push('Projects table does not exist or is not accessible');
      }
      
      // Check if matches table exists
      try {
        const { error: matchesError } = await supabase
          .from('matches')
          .select('count')
          .limit(1);
        
        if (matchesError) {
          issues.push(`Matches table issue: ${matchesError.message}`);
        }
      } catch (error) {
        issues.push('Matches table does not exist or is not accessible');
      }
      
      if (issues.length > 0) {
        console.warn('⚠️ Database setup issues found:', issues);
        return { success: false, issues };
      }
      
      console.log('✅ Database setup looks good');
      return { success: true };
    } catch (error) {
      console.error('❌ Error checking database setup:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Convert Supabase user to local User format
  static convertToLocalUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id,
      name: supabaseUser.name,
      email: supabaseUser.email,
      role: supabaseUser.role,
      genres: supabaseUser.genres || [],
      location: supabaseUser.location || '',
      bio: supabaseUser.bio || '',
      highlights: [], // Would need separate table for highlights
      collaborations: [], // Would need separate table for collaborations
      rating: supabaseUser.rating || 0,
      verified: supabaseUser.verified || false,
      joinDate: supabaseUser.created_at,
      isOnboarded: true,
      lastActive: new Date().toISOString(),
      createdAt: supabaseUser.created_at,
      subscriptionStatus: supabaseUser.subscription_status === 'premium' ? 'premium' : 'free',
    };
  }
}

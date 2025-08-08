
import { supabase } from '../app/integrations/supabase/client';
import type { Database } from '../app/integrations/supabase/types';

// Type aliases for easier use
type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

type Match = Database['public']['Tables']['matches']['Row'];
type MatchInsert = Database['public']['Tables']['matches']['Insert'];

type Payment = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];

type UserLimit = Database['public']['Tables']['user_limits']['Row'];
type UserLimitInsert = Database['public']['Tables']['user_limits']['Insert'];
type UserLimitUpdate = Database['public']['Tables']['user_limits']['Update'];

export class SupabaseService {
  // Profile operations
  static async createProfile(profile: ProfileInsert): Promise<Profile | null> {
    try {
      console.log('📝 Creating profile:', profile);
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        throw error;
      }

      console.log('✅ Profile created successfully');
      return data;
    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      return null;
    }
  }

  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        return null;
      }

      console.log('✅ Profile fetched successfully');
      return data;
    } catch (error) {
      console.error('❌ Profile fetch failed:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
    try {
      console.log('📝 Updating profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating profile:', error);
        throw error;
      }

      console.log('✅ Profile updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      return null;
    }
  }

  static async getAllProfiles(): Promise<Profile[]> {
    try {
      console.log('🔍 Fetching all profiles');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching profiles:', error);
        return [];
      }

      console.log(`✅ Fetched ${data.length} profiles`);
      return data;
    } catch (error) {
      console.error('❌ Profiles fetch failed:', error);
      return [];
    }
  }

  // Project operations
  static async createProject(project: ProjectInsert): Promise<Project | null> {
    try {
      console.log('📝 Creating project:', project);
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating project:', error);
        throw error;
      }

      console.log('✅ Project created successfully');
      return data;
    } catch (error) {
      console.error('❌ Project creation failed:', error);
      return null;
    }
  }

  static async getProjects(): Promise<Project[]> {
    try {
      console.log('🔍 Fetching all projects');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching projects:', error);
        return [];
      }

      console.log(`✅ Fetched ${data.length} projects`);
      return data;
    } catch (error) {
      console.error('❌ Projects fetch failed:', error);
      return [];
    }
  }

  static async updateProject(projectId: string, updates: ProjectUpdate): Promise<Project | null> {
    try {
      console.log('📝 Updating project:', projectId);
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating project:', error);
        throw error;
      }

      console.log('✅ Project updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Project update failed:', error);
      return null;
    }
  }

  // Match operations
  static async createMatch(match: MatchInsert): Promise<Match | null> {
    try {
      console.log('💕 Creating match:', match);
      const { data, error } = await supabase
        .from('matches')
        .insert(match)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating match:', error);
        throw error;
      }

      console.log('✅ Match created successfully');
      return data;
    } catch (error) {
      console.error('❌ Match creation failed:', error);
      return null;
    }
  }

  static async getUserMatches(userId: string): Promise<Match[]> {
    try {
      console.log('🔍 Fetching matches for user:', userId);
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('is_active', true)
        .order('matched_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching matches:', error);
        return [];
      }

      console.log(`✅ Fetched ${data.length} matches`);
      return data;
    } catch (error) {
      console.error('❌ Matches fetch failed:', error);
      return [];
    }
  }

  // Payment operations
  static async createPayment(payment: PaymentInsert): Promise<Payment | null> {
    try {
      console.log('💳 Creating payment:', payment);
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating payment:', error);
        throw error;
      }

      console.log('✅ Payment created successfully');
      return data;
    } catch (error) {
      console.error('❌ Payment creation failed:', error);
      return null;
    }
  }

  // User limits operations
  static async getUserLimits(userId: string): Promise<UserLimit | null> {
    try {
      console.log('🔍 Fetching user limits for:', userId);
      const { data, error } = await supabase
        .from('user_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, create one
          return await this.createUserLimits(userId);
        }
        console.error('❌ Error fetching user limits:', error);
        return null;
      }

      console.log('✅ User limits fetched successfully');
      return data;
    } catch (error) {
      console.error('❌ User limits fetch failed:', error);
      return null;
    }
  }

  static async createUserLimits(userId: string): Promise<UserLimit | null> {
    try {
      console.log('📝 Creating user limits for:', userId);
      const { data, error } = await supabase
        .from('user_limits')
        .insert({ user_id: userId })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user limits:', error);
        throw error;
      }

      console.log('✅ User limits created successfully');
      return data;
    } catch (error) {
      console.error('❌ User limits creation failed:', error);
      return null;
    }
  }

  static async updateUserLimits(userId: string, updates: UserLimitUpdate): Promise<UserLimit | null> {
    try {
      console.log('📝 Updating user limits for:', userId);
      const { data, error } = await supabase
        .from('user_limits')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user limits:', error);
        throw error;
      }

      console.log('✅ User limits updated successfully');
      return data;
    } catch (error) {
      console.error('❌ User limits update failed:', error);
      return null;
    }
  }

  // Authentication operations
  static async signUp(email: string, password: string) {
    try {
      console.log('🔐 Signing up user:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed'
        }
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        throw error;
      }

      console.log('✅ User signed up successfully');
      return data;
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      throw error;
    }
  }

  static async signIn(email: string, password: string) {
    try {
      console.log('🔐 Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }

      console.log('✅ User signed in successfully');
      return data;
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      console.log('🔐 Signing out user');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }

      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('❌ Get current user error:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('❌ Get current user failed:', error);
      return null;
    }
  }

  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Get current session error:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('❌ Get current session failed:', error);
      return null;
    }
  }

  // Utility functions
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing database connection...');
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Connection test failed:', error);
        return false;
      }

      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Connection test error:', error);
      return false;
    }
  }
}

export default SupabaseService;

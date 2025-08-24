
import { Alert } from 'react-native';
import { supabase } from '../app/integrations/supabase/client';
import { getCurrentUser, saveCurrentUser, User, generateId, getCurrentTimestamp } from './storage';

export interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  profile?: any;
}

export class AuthService {
  static async signUp(email: string, password: string, profileData: Partial<User>) {
    try {
      console.log('🔐 Starting sign up process for:', email);
      
      // First, create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed'
        }
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ User created in auth:', data.user.id);
        
        // Create a local user profile for immediate use
        const localUser: User = {
          id: data.user.id,
          name: profileData.name || 'New User',
          email: email,
          role: profileData.role || 'producer',
          genres: profileData.genres || [],
          location: profileData.location || '',
          bio: profileData.bio || '',
          highlights: [],
          collaborations: [],
          rating: 0,
          verified: false,
          joinDate: getCurrentTimestamp(),
          isOnboarded: true,
          lastActive: getCurrentTimestamp(),
          createdAt: getCurrentTimestamp(),
        };
        
        // Save to local storage immediately
        await saveCurrentUser(localUser);
        
        // Try to create profile in database (but don't fail if it doesn't work)
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              name: profileData.name || 'New User',
              email: email,
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

          if (profileError) {
            console.warn('⚠️ Profile creation failed, but continuing with local storage:', profileError.message);
          } else {
            console.log('✅ Profile created in database');
          }

          // Try to create user limits
          const { error: limitsError } = await supabase
            .from('user_limits')
            .insert({ user_id: data.user.id });

          if (limitsError) {
            console.warn('⚠️ User limits creation failed:', limitsError.message);
          }
        } catch (dbError) {
          console.warn('⚠️ Database operations failed, but user is created locally:', dbError);
        }
        
        console.log('✅ Account created successfully');
        
        return { 
          success: true, 
          user: data.user, 
          needsEmailVerification: !data.user.email_confirmed_at 
        };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  }

  static async signIn(email: string, password: string) {
    try {
      console.log('🔐 Starting sign in process for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the verification link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many sign-in attempts. Please wait a moment and try again.';
        }
        
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        console.log('✅ User signed in:', data.user.email);
        
        // Try to fetch user profile from database
        let localUser: User;
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
          
          if (profile && !profileError) {
            // Create local user from database profile
            localUser = {
              id: profile.id,
              name: profile.name,
              email: profile.email || email,
              role: profile.role,
              genres: profile.genres || [],
              location: profile.location || '',
              bio: profile.bio || '',
              highlights: [],
              collaborations: [],
              rating: profile.rating || 0,
              verified: profile.verified || false,
              joinDate: profile.created_at || getCurrentTimestamp(),
              isOnboarded: true,
              lastActive: getCurrentTimestamp(),
              createdAt: profile.created_at || getCurrentTimestamp(),
            };
            
            console.log('✅ Profile loaded from database');
          } else {
            console.log('⚠️ No profile found in database, user needs onboarding');
            return { success: true, user: data.user, needsOnboarding: true };
          }
        } catch (dbError) {
          console.warn('⚠️ Database fetch failed, checking local storage:', dbError);
          
          // Try to get from local storage
          const existingUser = await getCurrentUser();
          if (existingUser && existingUser.email === email) {
            localUser = existingUser;
            console.log('✅ Profile loaded from local storage');
          } else {
            console.log('⚠️ No local profile found, user needs onboarding');
            return { success: true, user: data.user, needsOnboarding: true };
          }
        }
        
        // Save to local storage
        await saveCurrentUser(localUser);
        
        console.log('✅ User profile loaded and saved locally');
        
        return { success: true, user: data.user, profile: localUser };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      return { success: false, error: 'An unexpected error occurred. Please check your internet connection and try again.' };
    }
  }

  static async signOut() {
    try {
      console.log('🔐 Signing out user...');
      
      await supabase.auth.signOut();
      
      // Clear local storage
      await saveCurrentUser({} as User);
      
      console.log('✅ User signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      return { success: false, error: 'Sign out failed' };
    }
  }

  static async getCurrentAuthUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }
      
      // Try to get profile from database
      let profile = null;
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        profile = profileData;
      } catch (profileError) {
        console.warn('⚠️ Could not fetch profile from database:', profileError);
      }
      
      return {
        id: user.id,
        email: user.email || '',
        emailConfirmed: !!user.email_confirmed_at,
        profile,
      };
    } catch (error) {
      console.error('❌ Get current auth user failed:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: any) {
    try {
      console.log('📝 Updating user profile...');
      
      // Update local storage first
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        await saveCurrentUser(updatedUser);
      }
      
      // Try to update database
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.warn('⚠️ Database update failed, but local update succeeded:', error.message);
        } else {
          console.log('✅ Profile updated in database');
        }
        
        return { success: true, profile };
      } catch (dbError) {
        console.warn('⚠️ Database update failed, but local update succeeded:', dbError);
        return { success: true, profile: currentUser };
      }
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      return { success: false, error: 'Profile update failed' };
    }
  }

  static async checkEmailVerification() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email_confirmed_at ? true : false;
    } catch (error) {
      console.error('❌ Email verification check failed:', error);
      return false;
    }
  }

  static async resendEmailVerification() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
          options: {
            emailRedirectTo: 'https://natively.dev/email-confirmed'
          }
        });
        
        if (error) {
          console.error('❌ Resend email failed:', error);
          return { success: false, error: error.message };
        }
        
        return { success: true };
      }
      return { success: false, error: 'No user email found' };
    } catch (error) {
      console.error('❌ Resend email verification failed:', error);
      return { success: false, error: 'Failed to resend email' };
    }
  }
}

export default AuthService;

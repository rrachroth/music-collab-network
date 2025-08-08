
import { Alert } from 'react-native';
import SupabaseService from './supabaseService';
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
      
      const { data, error } = await SupabaseService.signUp(email, password);
      
      if (error) {
        console.error('❌ Sign up error:', error);
        Alert.alert('Sign Up Failed', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ User created in auth, creating profile...');
        
        // Create profile in database
        const profile = await SupabaseService.createProfile({
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
        });

        if (profile) {
          console.log('✅ Profile created successfully');
          
          // Create user limits
          await SupabaseService.createUserLimits(data.user.id);
          
          // Save to local storage for offline access
          const localUser: User = {
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
            createdAt: getCurrentTimestamp(),
          };
          
          await saveCurrentUser(localUser);
        }

        Alert.alert(
          'Account Created!',
          'Please check your email and click the verification link to complete your registration.',
          [{ text: 'OK' }]
        );
        
        return { 
          success: true, 
          user: data.user, 
          needsEmailVerification: !data.user.email_confirmed_at 
        };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      Alert.alert('Sign Up Failed', 'An unexpected error occurred. Please try again.');
      return { success: false, error: 'Unexpected error' };
    }
  }

  static async signIn(email: string, password: string) {
    try {
      console.log('🔐 Starting sign in process for:', email);
      
      const { data, error } = await SupabaseService.signIn(email, password);
      
      if (error) {
        console.error('❌ Sign in error:', error);
        Alert.alert('Sign In Failed', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ User signed in, fetching profile...');
        
        // Fetch user profile
        const profile = await SupabaseService.getProfile(data.user.id);
        
        if (profile) {
          // Save to local storage
          const localUser: User = {
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
          
          await saveCurrentUser(localUser);
          
          console.log('✅ User profile loaded and saved locally');
          return { success: true, user: data.user, profile: localUser };
        } else {
          console.log('⚠️ No profile found, user needs onboarding');
          return { success: true, user: data.user, needsOnboarding: true };
        }
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      Alert.alert('Sign In Failed', 'An unexpected error occurred. Please try again.');
      return { success: false, error: 'Unexpected error' };
    }
  }

  static async signOut() {
    try {
      console.log('🔐 Signing out user...');
      
      await SupabaseService.signOut();
      
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
      const user = await SupabaseService.getCurrentUser();
      
      if (user) {
        const profile = await SupabaseService.getProfile(user.id);
        
        return {
          id: user.id,
          email: user.email || '',
          emailConfirmed: !!user.email_confirmed_at,
          profile,
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Get current auth user failed:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: any) {
    try {
      console.log('📝 Updating user profile...');
      
      const profile = await SupabaseService.updateProfile(userId, updates);
      
      if (profile) {
        // Update local storage
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          await saveCurrentUser(updatedUser);
        }
        
        console.log('✅ Profile updated successfully');
        return { success: true, profile };
      }
      
      return { success: false, error: 'Profile update failed' };
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      return { success: false, error: 'Profile update failed' };
    }
  }

  static async checkEmailVerification() {
    try {
      const user = await SupabaseService.getCurrentUser();
      return user?.email_confirmed_at ? true : false;
    } catch (error) {
      console.error('❌ Email verification check failed:', error);
      return false;
    }
  }

  static async resendEmailVerification() {
    try {
      const user = await SupabaseService.getCurrentUser();
      if (user?.email) {
        // Supabase doesn't have a direct resend method, so we'll use the sign up method
        // which will resend if the user already exists
        await SupabaseService.signUp(user.email, 'dummy-password');
        Alert.alert('Email Sent', 'Verification email has been resent to your email address.');
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

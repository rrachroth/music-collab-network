import { supabase } from '../app/integrations/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SubscriptionLimits {
  projectsPerMonth: number;
  likesPerDay: number;
  unlimited: boolean;
}

export interface UserLimits {
  projectsPostedThisMonth: number;
  likesUsedToday: number;
  lastProjectResetDate: string;
  lastLikeResetDate: string;
}

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    limits: {
      projectsPerMonth: 1,
      likesPerDay: 3,
      unlimited: false,
    },
  },
  PREMIUM: {
    name: 'Premium',
    price: 1200, // $12.00 in cents
    limits: {
      projectsPerMonth: -1, // Unlimited
      likesPerDay: -1, // Unlimited
      unlimited: true,
    },
  },
};

export class SubscriptionService {
  // Check if user has premium subscription
  static async hasPremiumSubscription(userId?: string): Promise<boolean> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        userId = user.id;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_expires_at')
        .eq('user_id', userId)
        .single();

      if (!profile) return false;

      if (profile.subscription_status === 'premium') {
        // Check if subscription is still valid
        if (profile.subscription_expires_at) {
          const expiresAt = new Date(profile.subscription_expires_at);
          return expiresAt > new Date();
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking premium subscription:', error);
      return false;
    }
  }

  // Get user's current limits
  static async getUserLimits(userId?: string): Promise<UserLimits | null> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        userId = user.id;
      }

      const { data: limits } = await supabase
        .from('user_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!limits) {
        // Create initial limits record
        const newLimits = {
          user_id: userId,
          projects_posted_this_month: 0,
          likes_used_today: 0,
          last_project_reset_date: new Date().toISOString().split('T')[0],
          last_like_reset_date: new Date().toISOString().split('T')[0],
        };

        const { data: createdLimits } = await supabase
          .from('user_limits')
          .insert(newLimits)
          .select()
          .single();

        return createdLimits ? {
          projectsPostedThisMonth: createdLimits.projects_posted_this_month,
          likesUsedToday: createdLimits.likes_used_today,
          lastProjectResetDate: createdLimits.last_project_reset_date,
          lastLikeResetDate: createdLimits.last_like_reset_date,
        } : null;
      }

      return {
        projectsPostedThisMonth: limits.projects_posted_this_month,
        likesUsedToday: limits.likes_used_today,
        lastProjectResetDate: limits.last_project_reset_date,
        lastLikeResetDate: limits.last_like_reset_date,
      };
    } catch (error) {
      console.error('Error getting user limits:', error);
      return null;
    }
  }

  // Check if user can post a project
  static async canPostProject(userId?: string): Promise<{ canPost: boolean; reason?: string }> {
    try {
      const isPremium = await this.hasPremiumSubscription(userId);
      
      if (isPremium) {
        return { canPost: true };
      }

      const limits = await this.getUserLimits(userId);
      if (!limits) {
        return { canPost: false, reason: 'Unable to check limits' };
      }

      // Check if we need to reset monthly counter
      const today = new Date().toISOString().split('T')[0];
      const lastReset = new Date(limits.lastProjectResetDate);
      const currentDate = new Date(today);
      
      // Reset if it's a new month
      if (lastReset.getMonth() !== currentDate.getMonth() || 
          lastReset.getFullYear() !== currentDate.getFullYear()) {
        await this.resetMonthlyProjectCount(userId);
        return { canPost: true };
      }

      const maxProjects = SUBSCRIPTION_PLANS.FREE.limits.projectsPerMonth;
      if (limits.projectsPostedThisMonth >= maxProjects) {
        return { 
          canPost: false, 
          reason: `Free users can only post ${maxProjects} project per month. Upgrade to Premium for unlimited projects!` 
        };
      }

      return { canPost: true };
    } catch (error) {
      console.error('Error checking project posting ability:', error);
      return { canPost: false, reason: 'Error checking limits' };
    }
  }

  // Check if user can like/swipe
  static async canLike(userId?: string): Promise<{ canLike: boolean; reason?: string }> {
    try {
      const isPremium = await this.hasPremiumSubscription(userId);
      
      if (isPremium) {
        return { canLike: true };
      }

      const limits = await this.getUserLimits(userId);
      if (!limits) {
        return { canLike: false, reason: 'Unable to check limits' };
      }

      // Check if we need to reset daily counter
      const today = new Date().toISOString().split('T')[0];
      if (limits.lastLikeResetDate !== today) {
        await this.resetDailyLikeCount(userId);
        return { canLike: true };
      }

      const maxLikes = SUBSCRIPTION_PLANS.FREE.limits.likesPerDay;
      if (limits.likesUsedToday >= maxLikes) {
        return { 
          canLike: false, 
          reason: `Free users get ${maxLikes} likes per day. Upgrade to Premium for unlimited likes!` 
        };
      }

      return { canLike: true };
    } catch (error) {
      console.error('Error checking like ability:', error);
      return { canLike: false, reason: 'Error checking limits' };
    }
  }

  // Increment project count
  static async incrementProjectCount(userId?: string): Promise<void> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }

      await supabase
        .from('user_limits')
        .update({ 
          projects_posted_this_month: supabase.sql`projects_posted_this_month + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error incrementing project count:', error);
    }
  }

  // Increment like count
  static async incrementLikeCount(userId?: string): Promise<void> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }

      await supabase
        .from('user_limits')
        .update({ 
          likes_used_today: supabase.sql`likes_used_today + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error incrementing like count:', error);
    }
  }

  // Reset monthly project count
  static async resetMonthlyProjectCount(userId?: string): Promise<void> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }

      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('user_limits')
        .update({ 
          projects_posted_this_month: 0,
          last_project_reset_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error resetting monthly project count:', error);
    }
  }

  // Reset daily like count
  static async resetDailyLikeCount(userId?: string): Promise<void> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }

      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('user_limits')
        .update({ 
          likes_used_today: 0,
          last_like_reset_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error resetting daily like count:', error);
    }
  }

  // Upgrade to premium
  static async upgradeToPremium(userId: string, stripeCustomerId: string): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'premium',
          subscription_expires_at: expiresAt.toISOString(),
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log('✅ User upgraded to premium successfully');
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      throw error;
    }
  }

  // Cancel premium subscription
  static async cancelPremium(userId: string): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'free',
          subscription_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log('✅ Premium subscription cancelled');
    } catch (error) {
      console.error('Error cancelling premium:', error);
      throw error;
    }
  }

  // Get subscription status for display
  static async getSubscriptionStatus(userId?: string): Promise<{
    isPremium: boolean;
    plan: string;
    expiresAt?: string;
    limits: SubscriptionLimits;
    usage: UserLimits | null;
  }> {
    try {
      const isPremium = await this.hasPremiumSubscription(userId);
      const usage = await this.getUserLimits(userId);
      
      if (isPremium) {
        return {
          isPremium: true,
          plan: 'Premium',
          limits: SUBSCRIPTION_PLANS.PREMIUM.limits,
          usage,
        };
      }

      return {
        isPremium: false,
        plan: 'Free',
        limits: SUBSCRIPTION_PLANS.FREE.limits,
        usage,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return {
        isPremium: false,
        plan: 'Free',
        limits: SUBSCRIPTION_PLANS.FREE.limits,
        usage: null,
      };
    }
  }
}
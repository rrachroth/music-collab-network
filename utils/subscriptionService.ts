import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, updateCurrentUser } from './storage';

export interface SubscriptionLimits {
  projectsPerMonth: number;
  likesPerDay: number;
  applicationsPerMonth: number;
  unlimited: boolean;
}

export interface UserLimits {
  projectsPostedThisMonth: number;
  likesUsedToday: number;
  applicationsThisMonth: number;
  lastProjectResetDate: string;
  lastLikeResetDate: string;
  lastApplicationResetDate: string;
}

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    limits: {
      projectsPerMonth: 1,
      likesPerDay: 5,
      applicationsPerMonth: 1,
      unlimited: false,
    },
  },
  PREMIUM: {
    name: 'Premium',
    price: 1200, // $12.00 in cents
    limits: {
      projectsPerMonth: -1, // Unlimited
      likesPerDay: -1, // Unlimited
      applicationsPerMonth: -1, // Unlimited
      unlimited: true,
    },
  },
};

export class SubscriptionService {
  // Check if user has premium subscription
  static async hasPremiumSubscription(userId?: string): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      if (!user) return false;

      // Check if user has premium subscription
      if (user.subscriptionStatus === 'premium') {
        // Check if subscription is still valid
        if (user.subscriptionExpiresAt) {
          const expiresAt = new Date(user.subscriptionExpiresAt);
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
      const user = await getCurrentUser();
      if (!user) return null;

      // Get limits from AsyncStorage
      const limitsKey = `user_limits_${user.id}`;
      const limitsData = await AsyncStorage.getItem(limitsKey);
      
      if (!limitsData) {
        // Create initial limits record
        const newLimits: UserLimits = {
          projectsPostedThisMonth: 0,
          likesUsedToday: 0,
          applicationsThisMonth: 0,
          lastProjectResetDate: new Date().toISOString().split('T')[0],
          lastLikeResetDate: new Date().toISOString().split('T')[0],
          lastApplicationResetDate: new Date().toISOString().split('T')[0],
        };

        await AsyncStorage.setItem(limitsKey, JSON.stringify(newLimits));
        return newLimits;
      }

      const limits = JSON.parse(limitsData);
      return {
        projectsPostedThisMonth: limits.projectsPostedThisMonth || 0,
        likesUsedToday: limits.likesUsedToday || 0,
        applicationsThisMonth: limits.applicationsThisMonth || 0,
        lastProjectResetDate: limits.lastProjectResetDate || new Date().toISOString().split('T')[0],
        lastLikeResetDate: limits.lastLikeResetDate || new Date().toISOString().split('T')[0],
        lastApplicationResetDate: limits.lastApplicationResetDate || new Date().toISOString().split('T')[0],
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

  // Check if user can apply to projects
  static async canApply(userId?: string): Promise<{ canApply: boolean; reason?: string }> {
    try {
      const isPremium = await this.hasPremiumSubscription(userId);
      
      if (isPremium) {
        return { canApply: true };
      }

      const limits = await this.getUserLimits(userId);
      if (!limits) {
        return { canApply: false, reason: 'Unable to check limits' };
      }

      // Check if we need to reset monthly counter
      const today = new Date().toISOString().split('T')[0];
      const lastReset = new Date(limits.lastApplicationResetDate);
      const currentDate = new Date(today);
      
      // Reset if it's a new month
      if (lastReset.getMonth() !== currentDate.getMonth() || 
          lastReset.getFullYear() !== currentDate.getFullYear()) {
        await this.resetMonthlyApplicationCount(userId);
        return { canApply: true };
      }

      const maxApplications = SUBSCRIPTION_PLANS.FREE.limits.applicationsPerMonth;
      if (limits.applicationsThisMonth >= maxApplications) {
        return { 
          canApply: false, 
          reason: `Free users can only apply to ${maxApplications} project per month. Upgrade to Premium for unlimited applications!` 
        };
      }

      return { canApply: true };
    } catch (error) {
      console.error('Error checking application ability:', error);
      return { canApply: false, reason: 'Error checking limits' };
    }
  }

  // Increment project count
  static async incrementProjectCount(userId?: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const limits = await this.getUserLimits();
      if (!limits) return;

      const updatedLimits = {
        ...limits,
        projectsPostedThisMonth: limits.projectsPostedThisMonth + 1,
      };

      const limitsKey = `user_limits_${user.id}`;
      await AsyncStorage.setItem(limitsKey, JSON.stringify(updatedLimits));
    } catch (error) {
      console.error('Error incrementing project count:', error);
    }
  }

  // Increment like count
  static async incrementLikeCount(userId?: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const limits = await this.getUserLimits();
      if (!limits) return;

      const updatedLimits = {
        ...limits,
        likesUsedToday: limits.likesUsedToday + 1,
      };

      const limitsKey = `user_limits_${user.id}`;
      await AsyncStorage.setItem(limitsKey, JSON.stringify(updatedLimits));
    } catch (error) {
      console.error('Error incrementing like count:', error);
    }
  }

  // Increment application count
  static async incrementApplicationCount(userId?: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const limits = await this.getUserLimits();
      if (!limits) return;

      const updatedLimits = {
        ...limits,
        applicationsThisMonth: limits.applicationsThisMonth + 1,
      };

      const limitsKey = `user_limits_${user.id}`;
      await AsyncStorage.setItem(limitsKey, JSON.stringify(updatedLimits));
    } catch (error) {
      console.error('Error incrementing application count:', error);
    }
  }

  // Reset monthly project count
  static async resetMonthlyProjectCount(userId?: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const limits = await this.getUserLimits();
      if (!limits) return;

      const today = new Date().toISOString().split('T')[0];
      const updatedLimits = {
        ...limits,
        projectsPostedThisMonth: 0,
        lastProjectResetDate: today,
      };

      const limitsKey = `user_limits_${user.id}`;
      await AsyncStorage.setItem(limitsKey, JSON.stringify(updatedLimits));
    } catch (error) {
      console.error('Error resetting monthly project count:', error);
    }
  }

  // Reset daily like count
  static async resetDailyLikeCount(userId?: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const limits = await this.getUserLimits();
      if (!limits) return;

      const today = new Date().toISOString().split('T')[0];
      const updatedLimits = {
        ...limits,
        likesUsedToday: 0,
        lastLikeResetDate: today,
      };

      const limitsKey = `user_limits_${user.id}`;
      await AsyncStorage.setItem(limitsKey, JSON.stringify(updatedLimits));
    } catch (error) {
      console.error('Error resetting daily like count:', error);
    }
  }

  // Reset monthly application count
  static async resetMonthlyApplicationCount(userId?: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const limits = await this.getUserLimits();
      if (!limits) return;

      const today = new Date().toISOString().split('T')[0];
      const updatedLimits = {
        ...limits,
        applicationsThisMonth: 0,
        lastApplicationResetDate: today,
      };

      const limitsKey = `user_limits_${user.id}`;
      await AsyncStorage.setItem(limitsKey, JSON.stringify(updatedLimits));
    } catch (error) {
      console.error('Error resetting monthly application count:', error);
    }
  }

  // Upgrade to premium
  static async upgradeToPremium(userId: string, stripeCustomerId: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not found');

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

      const updatedUser = {
        ...user,
        subscriptionStatus: 'premium',
        subscriptionExpiresAt: expiresAt.toISOString(),
        stripeCustomerId: stripeCustomerId,
      };

      await updateCurrentUser(updatedUser);
      console.log('✅ User upgraded to premium successfully');
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      throw error;
    }
  }

  // Cancel premium subscription
  static async cancelPremium(userId: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not found');

      const updatedUser = {
        ...user,
        subscriptionStatus: 'free',
        subscriptionExpiresAt: null,
      };

      await updateCurrentUser(updatedUser);
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
      const user = await getCurrentUser();
      
      if (isPremium) {
        return {
          isPremium: true,
          plan: 'Premium',
          expiresAt: user?.subscriptionExpiresAt,
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
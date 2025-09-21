
import { supabase } from '../app/integrations/supabase/client';
import { SubscriptionService } from './subscriptionService';

export interface PaymentIntent {
  id: string;
  amount: number;
  platformFee: number;
  recipientAmount: number;
  description: string;
  recipientId: string;
  clientSecret?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntent?: any;
  payment?: any;
  breakdown?: {
    total: number;
    platformFee: number;
    recipientAmount: number;
    platformFeePercentage: number;
  };
  error?: string;
}

export class PaymentService {
  private static readonly PLATFORM_FEE_PERCENTAGE = 10; // 10% platform fee

  // Calculate platform fee and recipient amount
  static calculatePaymentSplit(totalAmount: number): {
    platformFee: number;
    recipientAmount: number;
  } {
    const platformFee = Math.round(totalAmount * (this.PLATFORM_FEE_PERCENTAGE / 100));
    const recipientAmount = totalAmount - platformFee;
    
    return {
      platformFee,
      recipientAmount,
    };
  }

  // Create a payment intent for a project using Stripe
  static async createProjectPayment(
    projectId: string,
    payerId: string,
    recipientId: string,
    amount: number,
    description: string
  ): Promise<PaymentResult> {
    try {
      console.log('Creating project payment:', {
        projectId,
        payerId,
        recipientId,
        amount,
        description,
      });

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Call the Edge Function to create payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount,
          description,
          recipientId,
          projectId,
          metadata: {
            payment_type: 'project',
            payer_id: payerId,
          },
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create payment intent');
      }

      if (!data.success) {
        throw new Error(data.error || 'Payment creation failed');
      }

      console.log('Payment intent created successfully:', data);

      return {
        success: true,
        paymentIntent: data.paymentIntent,
        payment: data.payment,
        breakdown: data.breakdown,
      };
    } catch (error) {
      console.error('Error creating project payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Process subscription payment using Stripe
  static async processSubscriptionPayment(userId: string): Promise<PaymentResult> {
    try {
      console.log('Processing subscription payment for user:', userId);

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Call the Edge Function to create subscription payment
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType: 'premium',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Subscription edge function error:', error);
        throw new Error(error.message || 'Failed to create subscription');
      }

      if (!data.success) {
        throw new Error(data.error || 'Subscription creation failed');
      }

      console.log('Subscription payment created successfully:', data);

      return {
        success: true,
        paymentIntent: data.paymentIntent,
        payment: data.subscription,
        breakdown: {
          total: data.subscription.amount,
          platformFee: data.subscription.amount, // Platform keeps all subscription revenue
          recipientAmount: 0,
          platformFeePercentage: 100,
        },
      };
    } catch (error) {
      console.error('Error processing subscription payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Complete payment after successful Stripe transaction (called by webhook)
  static async completePayment(
    paymentId: string,
    stripePaymentIntentId: string,
    stripeTransferId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          stripe_transfer_id: stripeTransferId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      console.log('✅ Payment completed successfully');
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  }

  // Get payment history for a user
  static async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          projects (title),
          payer:profiles!payments_payer_id_fkey (name),
          recipient:profiles!payments_recipient_id_fkey (name)
        `)
        .or(`payer_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return payments || [];
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  // Get platform revenue analytics
  static async getPlatformRevenue(): Promise<{
    totalRevenue: number;
    subscriptionRevenue: number;
    projectRevenue: number;
    monthlyRevenue: number;
  }> {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('platform_fee, created_at, project_id')
        .eq('status', 'completed');

      if (error) throw error;

      const totalRevenue = payments?.reduce((sum, payment) => sum + payment.platform_fee, 0) || 0;
      
      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = payments?.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      }).reduce((sum, payment) => sum + payment.platform_fee, 0) || 0;

      // Separate subscription vs project revenue
      const subscriptionRevenue = payments?.filter(payment => !payment.project_id)
        .reduce((sum, payment) => sum + payment.platform_fee, 0) || 0;
      const projectRevenue = totalRevenue - subscriptionRevenue;

      return {
        totalRevenue,
        subscriptionRevenue,
        projectRevenue,
        monthlyRevenue,
      };
    } catch (error) {
      console.error('Error getting platform revenue:', error);
      return {
        totalRevenue: 0,
        subscriptionRevenue: 0,
        projectRevenue: 0,
        monthlyRevenue: 0,
      };
    }
  }

  // Test Stripe connection and configuration
  static async testStripeConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return {
          success: false,
          message: 'Authentication required to test Stripe connection',
        };
      }

      // Test creating a small payment intent
      const testResult = await this.createProjectPayment(
        'test-project-id',
        session.user.id,
        'test-recipient-id',
        100, // $1.00
        'Test payment intent - Stripe connection test'
      );

      if (testResult.success) {
        return {
          success: true,
          message: 'Stripe connection successful! Payment processing is ready.',
          details: {
            paymentIntentId: testResult.paymentIntent?.id,
            amount: testResult.breakdown?.total,
            platformFee: testResult.breakdown?.platformFee,
          },
        };
      } else {
        return {
          success: false,
          message: testResult.error || 'Stripe connection test failed',
        };
      }
    } catch (error) {
      console.error('Stripe connection test error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during Stripe test',
      };
    }
  }

  // Validate payment amount and calculate fees
  static validatePaymentAmount(amount: number): {
    valid: boolean;
    error?: string;
    breakdown?: {
      total: number;
      platformFee: number;
      recipientAmount: number;
      platformFeePercentage: number;
    };
  } {
    if (!amount || amount <= 0) {
      return {
        valid: false,
        error: 'Amount must be greater than 0',
      };
    }

    if (amount < 50) { // Minimum $0.50
      return {
        valid: false,
        error: 'Minimum payment amount is $0.50',
      };
    }

    if (amount > 100000) { // Maximum $1,000.00
      return {
        valid: false,
        error: 'Maximum payment amount is $1,000.00',
      };
    }

    const { platformFee, recipientAmount } = this.calculatePaymentSplit(amount);

    return {
      valid: true,
      breakdown: {
        total: amount,
        platformFee,
        recipientAmount,
        platformFeePercentage: this.PLATFORM_FEE_PERCENTAGE,
      },
    };
  }

  // Format amount for display
  static formatAmount(amountInCents: number): string {
    return `$${(amountInCents / 100).toFixed(2)}`;
  }

  // Get payment status display text
  static getPaymentStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return 'Unknown';
    }
  }

  // Get payment status color
  static getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#F59E0B'; // Warning yellow
      case 'completed':
        return '#10B981'; // Success green
      case 'failed':
        return '#EF4444'; // Error red
      case 'refunded':
        return '#6B7280'; // Gray
      default:
        return '#6B7280'; // Gray
    }
  }
}

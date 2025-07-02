import { supabase } from '../app/integrations/supabase/client';
import { SubscriptionService } from './subscriptionService';

export interface PaymentIntent {
  id: string;
  amount: number;
  platformFee: number;
  recipientAmount: number;
  description: string;
  recipientId: string;
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

  // Create a payment intent for a project
  static async createProjectPayment(
    projectId: string,
    payerId: string,
    recipientId: string,
    amount: number,
    description: string
  ): Promise<PaymentIntent> {
    try {
      const { platformFee, recipientAmount } = this.calculatePaymentSplit(amount);

      // Create payment record in database
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          project_id: projectId,
          payer_id: payerId,
          recipient_id: recipientId,
          total_amount: amount,
          platform_fee: platformFee,
          recipient_amount: recipientAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: payment.id,
        amount,
        platformFee,
        recipientAmount,
        description,
        recipientId,
      };
    } catch (error) {
      console.error('Error creating project payment:', error);
      throw error;
    }
  }

  // Process subscription payment
  static async processSubscriptionPayment(userId: string): Promise<PaymentIntent> {
    try {
      const subscriptionAmount = 1200; // $12.00 in cents
      const { platformFee, recipientAmount } = this.calculatePaymentSplit(subscriptionAmount);

      // For subscription, the platform keeps 100% (no recipient)
      return {
        id: `subscription_${Date.now()}`,
        amount: subscriptionAmount,
        platformFee: subscriptionAmount, // Platform keeps all subscription revenue
        recipientAmount: 0,
        description: 'Muse Premium Subscription - Monthly',
        recipientId: '', // No recipient for subscriptions
      };
    } catch (error) {
      console.error('Error processing subscription payment:', error);
      throw error;
    }
  }

  // Complete payment after successful Stripe transaction
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
          stripe_payment_intent_id: stripePaymentIntentId,
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
}
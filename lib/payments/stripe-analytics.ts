/**
 * Stripe Analytics Service
 * Handles Stripe payment analytics and reporting
 */

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export interface PaymentAnalytics {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  averageAmount: number;
  successRate: number;
  topPaymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    payments: number;
    amount: number;
  }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  averageLifetimeValue: number;
  topCustomers: Array<{
    customerId: string;
    totalSpent: number;
    paymentCount: number;
  }>;
}

export class StripeAnalyticsService {
  private stripe: Stripe;
  private supabase;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });
    this.supabase = createClient();
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<PaymentAnalytics> {
    try {
      const start =
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate || new Date();

      // Get payment intents from Stripe
      const paymentIntents = await this.stripe.paymentIntents.list({
        created: {
          gte: Math.floor(start.getTime() / 1000),
          lte: Math.floor(end.getTime() / 1000),
        },
        limit: 100,
      });

      // Calculate basic metrics
      const totalPayments = paymentIntents.data.length;
      const totalAmount = paymentIntents.data.reduce(
        (sum, pi) => sum + pi.amount,
        0
      );
      const successfulPayments = paymentIntents.data.filter(
        pi => pi.status === 'succeeded'
      ).length;
      const failedPayments = paymentIntents.data.filter(
        pi => pi.status === 'requires_payment_method'
      ).length;
      const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;
      const successRate =
        totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

      // Analyze payment methods
      const paymentMethodCounts: Record<string, number> = {};
      paymentIntents.data.forEach(pi => {
        if (pi.payment_method) {
          const method =
            typeof pi.payment_method === 'string'
              ? pi.payment_method
              : pi.payment_method.type;
          paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + 1;
        }
      });

      const topPaymentMethods = Object.entries(paymentMethodCounts)
        .map(([method, count]) => ({
          method,
          count,
          percentage: (count / totalPayments) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate monthly trends
      const monthlyTrends = this.calculateMonthlyTrends(paymentIntents.data);

      return {
        totalPayments,
        totalAmount,
        successfulPayments,
        failedPayments,
        averageAmount,
        successRate,
        topPaymentMethods,
        monthlyTrends,
      };
    } catch (error) {
      throw new Error(
        'Failed to get payment analytics: ' + (error as Error).message
      );
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(): Promise<CustomerAnalytics> {
    try {
      // Get customers from Stripe
      const customers = await this.stripe.customers.list({
        limit: 100,
      });

      const totalCustomers = customers.data.length;
      const activeCustomers = customers.data.filter(c => !c.deleted).length;
      const newCustomers = customers.data.filter(c => {
        const createdDate = new Date(c.created * 1000);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return createdDate > thirtyDaysAgo;
      }).length;

      // Calculate customer lifetime value
      const customerSpending: Record<string, number> = {};
      const customerPaymentCounts: Record<string, number> = {};

      for (const customer of customers.data) {
        const paymentIntents = await this.stripe.paymentIntents.list({
          customer: customer.id,
          limit: 100,
        });

        const totalSpent = paymentIntents.data
          .filter(pi => pi.status === 'succeeded')
          .reduce((sum, pi) => sum + pi.amount, 0);

        customerSpending[customer.id] = totalSpent;
        customerPaymentCounts[customer.id] = paymentIntents.data.length;
      }

      const totalSpent = Object.values(customerSpending).reduce(
        (sum, amount) => sum + amount,
        0
      );
      const averageLifetimeValue =
        activeCustomers > 0 ? totalSpent / activeCustomers : 0;

      // Get top customers
      const topCustomers = Object.entries(customerSpending)
        .map(([customerId, totalSpent]) => ({
          customerId,
          totalSpent,
          paymentCount: customerPaymentCounts[customerId] || 0,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      return {
        totalCustomers,
        activeCustomers,
        newCustomers,
        averageLifetimeValue,
        topCustomers,
      };
    } catch (error) {
      throw new Error(
        'Failed to get customer analytics: ' + (error as Error).message
      );
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRevenue: number;
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
    }>;
    revenueGrowth: number;
  }> {
    try {
      const start =
        startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      const end = endDate || new Date();

      // Get successful payment intents
      const paymentIntents = await this.stripe.paymentIntents.list({
        created: {
          gte: Math.floor(start.getTime() / 1000),
          lte: Math.floor(end.getTime() / 1000),
        },
        limit: 100,
      });

      const successfulPayments = paymentIntents.data.filter(
        pi => pi.status === 'succeeded'
      );
      const totalRevenue = successfulPayments.reduce(
        (sum, pi) => sum + pi.amount,
        0
      );

      // Calculate monthly revenue
      const monthlyRevenue = this.calculateMonthlyRevenue(successfulPayments);

      // Calculate revenue growth
      const previousPeriodStart = new Date(
        start.getTime() - (end.getTime() - start.getTime())
      );
      const previousPeriodEnd = start;

      const previousPaymentIntents = await this.stripe.paymentIntents.list({
        created: {
          gte: Math.floor(previousPeriodStart.getTime() / 1000),
          lte: Math.floor(previousPeriodEnd.getTime() / 1000),
        },
        limit: 100,
      });

      const previousRevenue = previousPaymentIntents.data
        .filter(pi => pi.status === 'succeeded')
        .reduce((sum, pi) => sum + pi.amount, 0);

      const revenueGrowth =
        previousRevenue > 0
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      return {
        totalRevenue,
        monthlyRevenue,
        revenueGrowth,
      };
    } catch (error) {
      throw new Error(
        'Failed to get revenue analytics: ' + (error as Error).message
      );
    }
  }

  /**
   * Get fraud analytics
   */
  async getFraudAnalytics(): Promise<{
    totalDisputes: number;
    disputeRate: number;
    averageDisputeAmount: number;
    topDisputeReasons: Array<{
      reason: string;
      count: number;
    }>;
  }> {
    try {
      // Get disputes from Stripe
      const disputes = await this.stripe.disputes.list({
        limit: 100,
      });

      const totalDisputes = disputes.data.length;
      const totalAmount = disputes.data.reduce(
        (sum, dispute) => sum + dispute.amount,
        0
      );
      const averageDisputeAmount =
        totalDisputes > 0 ? totalAmount / totalDisputes : 0;

      // Calculate dispute rate
      const totalPayments = await this.stripe.paymentIntents.list({
        limit: 1000,
      });

      const successfulPayments = totalPayments.data.filter(
        pi => pi.status === 'succeeded'
      ).length;
      const disputeRate =
        successfulPayments > 0 ? (totalDisputes / successfulPayments) * 100 : 0;

      // Analyze dispute reasons
      const disputeReasons: Record<string, number> = {};
      disputes.data.forEach(dispute => {
        const reason = dispute.reason || 'unknown';
        disputeReasons[reason] = (disputeReasons[reason] || 0) + 1;
      });

      const topDisputeReasons = Object.entries(disputeReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalDisputes,
        disputeRate,
        averageDisputeAmount,
        topDisputeReasons,
      };
    } catch (error) {
      throw new Error(
        'Failed to get fraud analytics: ' + (error as Error).message
      );
    }
  }

  /**
   * Calculate monthly trends
   */
  private calculateMonthlyTrends(
    paymentIntents: Stripe.PaymentIntent[]
  ): Array<{
    month: string;
    payments: number;
    amount: number;
  }> {
    const monthlyData: Record<string, { payments: number; amount: number }> =
      {};

    paymentIntents.forEach(pi => {
      const date = new Date(pi.created * 1000);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { payments: 0, amount: 0 };
      }

      monthlyData[monthKey].payments++;
      monthlyData[monthKey].amount += pi.amount;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        payments: data.payments,
        amount: data.amount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calculate monthly revenue
   */
  private calculateMonthlyRevenue(
    paymentIntents: Stripe.PaymentIntent[]
  ): Array<{
    month: string;
    revenue: number;
  }> {
    const monthlyRevenue: Record<string, number> = {};

    paymentIntents.forEach(pi => {
      const date = new Date(pi.created * 1000);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = 0;
      }

      monthlyRevenue[monthKey] += pi.amount;
    });

    return Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({
        month,
        revenue,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Log analytics event
   */
  async logAnalyticsEvent(
    eventType: string,
    eventData: any,
    userId?: string
  ): Promise<void> {
    try {
      await this.supabase.from('payment_analytics').insert({
        event_type: eventType,
        event_data: eventData,
        user_id: userId,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log analytics event:', error);
    }
  }
}

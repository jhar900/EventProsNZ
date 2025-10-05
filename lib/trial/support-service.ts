import { createClient } from '@/lib/supabase/server';

export interface SupportTicket {
  userId: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
}

export interface SupportResource {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  priority: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  hours: string;
  response_time: string;
  priority_support: string;
}

export class TrialSupportService {
  private supabase = createClient();

  async createSupportTicket(ticketData: SupportTicket): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('trial_support_tickets')
        .insert({
          user_id: ticketData.userId,
          subject: ticketData.subject,
          message: ticketData.message,
          priority: ticketData.priority,
          status: 'open',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create support ticket: ${error.message}`);
      }

      // TODO: Send notification to support team
      // This could include:
      // - Email notification to support team
      // - Slack notification
      // - Integration with support ticket system
      // - Auto-assignment based on priority and user type

      return data.id;
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      throw error;
    }
  }

  async getSupportResources(): Promise<SupportResource[]> {
    // In a real implementation, these would come from a database
    // For now, we'll return static resources
    return [
      {
        id: 'getting-started',
        title: 'Getting Started Guide',
        description:
          'Learn how to set up your profile and start using the platform',
        type: 'guide',
        url: '/help/getting-started',
        priority: 'high',
      },
      {
        id: 'profile-optimization',
        title: 'Profile Optimization Tips',
        description:
          'Maximize your visibility with these profile optimization strategies',
        type: 'guide',
        url: '/help/profile-optimization',
        priority: 'high',
      },
      {
        id: 'portfolio-best-practices',
        title: 'Portfolio Best Practices',
        description:
          'Learn how to create an effective portfolio that attracts clients',
        type: 'guide',
        url: '/help/portfolio-best-practices',
        priority: 'medium',
      },
      {
        id: 'search-tips',
        title: 'Search and Discovery Tips',
        description: 'Find more opportunities with advanced search techniques',
        type: 'guide',
        url: '/help/search-tips',
        priority: 'medium',
      },
      {
        id: 'trial-features',
        title: 'Trial Features Overview',
        description: 'Explore all the features available during your trial',
        type: 'guide',
        url: '/help/trial-features',
        priority: 'high',
      },
    ];
  }

  async getContactInfo(): Promise<ContactInfo> {
    // In a real implementation, this would come from a database or configuration
    return {
      email: 'support@eventprosnz.com',
      phone: '+64 9 123 4567',
      hours: 'Monday - Friday, 9:00 AM - 5:00 PM NZST',
      response_time: 'Within 24 hours',
      priority_support: 'Available for Spotlight tier subscribers',
    };
  }

  async getPersonalizedRecommendations(userId: string): Promise<any[]> {
    try {
      // Get user's trial status for personalized support
      const { data: trialConversion } = await this.supabase
        .from('trial_conversions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'trial')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate trial days remaining
      let trialDaysRemaining = 14;
      if (subscription?.trial_end_date) {
        const trialEndDate = new Date(subscription.trial_end_date);
        const now = new Date();
        trialDaysRemaining = Math.ceil(
          (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      // Add personalized support recommendations
      const personalizedRecommendations = [];

      if (trialDaysRemaining <= 3) {
        personalizedRecommendations.push({
          type: 'urgent',
          message: 'Your trial ends soon! Get help to maximize your success',
          actions: [
            'Schedule a demo call',
            'Get profile optimization help',
            'Learn about upgrade benefits',
          ],
        });
      }

      if (trialConversion?.conversion_likelihood < 0.3) {
        personalizedRecommendations.push({
          type: 'engagement',
          message: "We're here to help you get the most from your trial",
          actions: [
            'Get personalized onboarding',
            'Learn about platform features',
            'Get profile setup assistance',
          ],
        });
      }

      return personalizedRecommendations;
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      return [];
    }
  }

  async getSupportTickets(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('trial_support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch support tickets: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get support tickets:', error);
      throw error;
    }
  }

  async updateSupportTicket(ticketId: string, updates: any): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('trial_support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) {
        throw new Error(`Failed to update support ticket: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to update support ticket:', error);
      throw error;
    }
  }

  async getSupportTicket(ticketId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('trial_support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch support ticket: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to get support ticket:', error);
      throw error;
    }
  }
}

import { createClient } from '@/lib/supabase/server';
import { TrialEmailService } from './email-service';
import { TrialAnalyticsService } from './analytics-service';
import { TrialConversionService } from './conversion-service';
import { TrialRecommendationService } from './recommendation-service';

export class TrialAutomationService {
  private supabase = createClient();
  private emailService = new TrialEmailService();
  private analyticsService = new TrialAnalyticsService();
  private conversionService = new TrialConversionService();
  private recommendationService = new TrialRecommendationService();

  async processTrialAutomation(): Promise<void> {
    try {
      console.log('Starting trial automation process...');

      // 1. Check for expired trials and process them
      await this.processExpiredTrials();

      // 2. Send scheduled trial emails
      await this.processScheduledEmails();

      // 3. Generate recommendations for active trials
      await this.processRecommendations();

      // 4. Update analytics for active trials
      await this.processAnalyticsUpdates();

      console.log('Trial automation process completed');
    } catch (error) {
      console.error('Failed to process trial automation:', error);
      throw error;
    }
  }

  private async processExpiredTrials(): Promise<void> {
    try {
      console.log('Processing expired trials...');

      // Get all active trials that have expired
      const { data: expiredTrials, error } = await this.supabase
        .from('subscriptions')
        .select('user_id, trial_end_date')
        .eq('status', 'trial')
        .lt('trial_end_date', new Date().toISOString());

      if (error) {
        throw new Error(`Failed to fetch expired trials: ${error.message}`);
      }

      if (expiredTrials && expiredTrials.length > 0) {
        console.log(`Found ${expiredTrials.length} expired trials`);

        // Process each expired trial
        for (const trial of expiredTrials) {
          try {
            // Update subscription to inactive
            await this.supabase
              .from('subscriptions')
              .update({
                status: 'inactive',
                tier: 'essential', // Free tier
                price: 0.0,
                end_date: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', trial.user_id)
              .eq('status', 'trial');

            // Update trial conversion status
            await this.supabase
              .from('trial_conversions')
              .update({
                conversion_status: 'expired',
                conversion_reason: 'Trial expired without conversion',
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', trial.user_id)
              .eq('conversion_status', 'active');

            console.log(`Processed expired trial for user ${trial.user_id}`);
          } catch (error) {
            console.error(
              `Failed to process expired trial for user ${trial.user_id}:`,
              error
            );
            // Continue processing other trials
          }
        }
      }
    } catch (error) {
      console.error('Failed to process expired trials:', error);
      throw error;
    }
  }

  private async processScheduledEmails(): Promise<void> {
    try {
      console.log('Processing scheduled trial emails...');

      // Get all pending emails that are due to be sent
      const { data: pendingEmails, error } = await this.supabase
        .from('trial_emails')
        .select('*')
        .eq('email_status', 'pending')
        .lte('scheduled_date', new Date().toISOString());

      if (error) {
        throw new Error(`Failed to fetch pending emails: ${error.message}`);
      }

      if (pendingEmails && pendingEmails.length > 0) {
        console.log(`Found ${pendingEmails.length} pending emails`);

        // Process each pending email
        for (const email of pendingEmails) {
          try {
            await this.emailService.sendTrialEmail(
              email.user_id,
              email.email_type
            );
            console.log(
              `Sent trial email ${email.email_type} to user ${email.user_id}`
            );
          } catch (error) {
            console.error(`Failed to send email ${email.id}:`, error);
            // Continue processing other emails
          }
        }
      }
    } catch (error) {
      console.error('Failed to process scheduled emails:', error);
      throw error;
    }
  }

  private async processRecommendations(): Promise<void> {
    try {
      console.log('Processing trial recommendations...');

      // Get all active trials
      const { data: activeTrials, error } = await this.supabase
        .from('trial_conversions')
        .select('user_id')
        .eq('conversion_status', 'active');

      if (error) {
        throw new Error(`Failed to fetch active trials: ${error.message}`);
      }

      if (activeTrials && activeTrials.length > 0) {
        console.log(`Found ${activeTrials.length} active trials`);

        // Generate recommendations for each active trial
        for (const trial of activeTrials) {
          try {
            // Check if user has recent recommendations (within last 24 hours)
            const { data: recentRecommendations } = await this.supabase
              .from('trial_recommendations')
              .select('id')
              .eq('user_id', trial.user_id)
              .gte(
                'created_at',
                new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              )
              .limit(1);

            // Only generate new recommendations if none exist in the last 24 hours
            if (!recentRecommendations || recentRecommendations.length === 0) {
              await this.recommendationService.generateRecommendations(
                trial.user_id,
                {
                  timestamp: new Date().toISOString(),
                  automation: true,
                }
              );
              console.log(
                `Generated recommendations for user ${trial.user_id}`
              );
            }
          } catch (error) {
            console.error(
              `Failed to generate recommendations for user ${trial.user_id}:`,
              error
            );
            // Continue processing other trials
          }
        }
      }
    } catch (error) {
      console.error('Failed to process recommendations:', error);
      throw error;
    }
  }

  private async processAnalyticsUpdates(): Promise<void> {
    try {
      console.log('Processing analytics updates...');

      // Get all active trials with recent activity
      const { data: activeTrials, error } = await this.supabase
        .from('trial_conversions')
        .select('user_id')
        .eq('conversion_status', 'active');

      if (error) {
        throw new Error(`Failed to fetch active trials: ${error.message}`);
      }

      if (activeTrials && activeTrials.length > 0) {
        console.log(`Found ${activeTrials.length} active trials`);

        // Update analytics for each active trial
        for (const trial of activeTrials) {
          try {
            // Get user's recent activity (this would be implemented based on your tracking system)
            const userActivity = await this.getUserActivity(trial.user_id);

            if (userActivity) {
              await this.analyticsService.trackTrialAnalytics(
                trial.user_id,
                userActivity.trialDay,
                userActivity.featureUsage,
                userActivity.platformEngagement
              );
              console.log(`Updated analytics for user ${trial.user_id}`);
            }
          } catch (error) {
            console.error(
              `Failed to update analytics for user ${trial.user_id}:`,
              error
            );
            // Continue processing other trials
          }
        }
      }
    } catch (error) {
      console.error('Failed to process analytics updates:', error);
      throw error;
    }
  }

  private async getUserActivity(userId: string): Promise<any> {
    try {
      // This would be implemented based on your user activity tracking system
      // For now, we'll return a mock implementation
      const { data: analytics } = await this.supabase
        .from('trial_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (analytics) {
        return {
          trialDay: analytics.trial_day + 1, // Increment trial day
          featureUsage: analytics.feature_usage,
          platformEngagement: analytics.platform_engagement,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get user activity:', error);
      return null;
    }
  }

  async startTrialForUser(userId: string): Promise<void> {
    try {
      console.log(`Starting trial for user ${userId}`);

      // Create trial conversion record
      const trialStartDate = new Date();
      const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

      await this.conversionService.createTrialConversion({
        userId,
        trialStartDate,
        trialEndDate,
        conversionStatus: 'active',
      });

      // Schedule trial emails
      await this.conversionService.scheduleTrialEmails(userId, trialStartDate);

      console.log(`Trial started for user ${userId}`);
    } catch (error) {
      console.error(`Failed to start trial for user ${userId}:`, error);
      throw error;
    }
  }

  async convertTrialToSubscription(
    userId: string,
    tier: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      console.log(`Converting trial to subscription for user ${userId}`);

      // Track conversion
      await this.conversionService.trackConversion(
        userId,
        'converted',
        tier,
        'Trial converted to paid subscription'
      );

      // Update subscription status
      const { error } = await this.supabase
        .from('subscriptions')
        .update({
          status: 'active',
          tier: tier,
          end_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'trial');

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      console.log(`Trial converted to ${tier} subscription for user ${userId}`);
    } catch (error) {
      console.error(`Failed to convert trial for user ${userId}:`, error);
      throw error;
    }
  }

  async downgradeTrialToFree(userId: string, reason?: string): Promise<void> {
    try {
      console.log(`Downgrading trial to free for user ${userId}`);

      // Track conversion as expired
      await this.conversionService.trackConversion(
        userId,
        'expired',
        'essential',
        reason || 'Trial expired without conversion'
      );

      // Update subscription to free tier
      const { error } = await this.supabase
        .from('subscriptions')
        .update({
          status: 'inactive',
          tier: 'essential',
          price: 0.0,
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'trial');

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      console.log(`Trial downgraded to free for user ${userId}`);
    } catch (error) {
      console.error(`Failed to downgrade trial for user ${userId}:`, error);
      throw error;
    }
  }

  async getAutomationStatus(): Promise<any> {
    try {
      // Get automation status and metrics
      const conversionMetrics =
        await this.conversionService.getConversionMetrics();

      // Get pending emails count
      const { data: pendingEmails } = await this.supabase
        .from('trial_emails')
        .select('id')
        .eq('email_status', 'pending');

      // Get active trials count
      const { data: activeTrials } = await this.supabase
        .from('trial_conversions')
        .select('id')
        .eq('conversion_status', 'active');

      return {
        conversionMetrics,
        pendingEmails: pendingEmails?.length || 0,
        activeTrials: activeTrials?.length || 0,
        lastRun: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get automation status:', error);
      throw error;
    }
  }
}

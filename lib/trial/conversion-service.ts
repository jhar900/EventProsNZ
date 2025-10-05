import { createClient } from '@/lib/supabase/server';

export interface TrialConversionData {
  userId: string;
  trialStartDate: Date;
  trialEndDate: Date;
  conversionStatus: 'active' | 'converted' | 'expired' | 'cancelled';
  conversionDate?: Date;
  conversionTier?: string;
  conversionReason?: string;
}

export interface ConversionMetrics {
  totalTrials: number;
  convertedTrials: number;
  expiredTrials: number;
  conversionRate: number;
  avgTrialDuration: number;
}

export class TrialConversionService {
  private supabase = createClient();

  async createTrialConversion(
    conversionData: TrialConversionData
  ): Promise<string> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if supabase client is properly initialized
        if (!this.supabase || !this.supabase.from) {
          throw new Error('Supabase client not properly initialized');
        }

        const { data, error } = await this.supabase
          .from('trial_conversions')
          .insert({
            user_id: conversionData.userId,
            trial_start_date: conversionData.trialStartDate.toISOString(),
            trial_end_date: conversionData.trialEndDate.toISOString(),
            conversion_status: conversionData.conversionStatus,
            conversion_date: conversionData.conversionDate?.toISOString(),
            conversion_tier: conversionData.conversionTier,
            conversion_reason: conversionData.conversionReason,
          })
          .select()
          .single();

        if (error) {
          throw new Error(
            `Failed to create trial conversion: ${error.message}`
          );
        }

        return data.id;
      } catch (error) {
        lastError = error as Error;

        // Only log warnings in development mode
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `Attempt ${attempt} failed to create trial conversion:`,
            error
          );
        }

        // Check if it's a method chaining issue
        if (
          error instanceof TypeError &&
          error.message.includes('is not a function')
        ) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Method chaining issue detected:', error);
          }
          throw new Error('Database connection issue - method chaining failed');
        }

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    console.error(
      'Failed to create trial conversion after all retries:',
      lastError
    );
    throw (
      lastError ||
      new Error('Failed to create trial conversion after multiple attempts')
    );
  }

  async getTrialConversion(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('trial_conversions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch trial conversion: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to get trial conversion:', error);
      throw error;
    }
  }

  async updateTrialConversion(
    userId: string,
    updates: Partial<TrialConversionData>
  ): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.conversionStatus) {
        updateData.conversion_status = updates.conversionStatus;
      }

      if (updates.conversionTier) {
        updateData.conversion_tier = updates.conversionTier;
      }

      if (updates.conversionReason) {
        updateData.conversion_reason = updates.conversionReason;
      }

      if (updates.conversionDate) {
        updateData.conversion_date = updates.conversionDate.toISOString();
      }

      const { error } = await this.supabase
        .from('trial_conversions')
        .update(updateData)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update trial conversion: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to update trial conversion:', error);
      throw error;
    }
  }

  async trackConversion(
    userId: string,
    conversionStatus: string,
    conversionTier?: string,
    conversionReason?: string
  ): Promise<void> {
    try {
      // Get existing trial conversion
      const existingConversion = await this.getTrialConversion(userId);

      const updateData: any = {
        conversion_status: conversionStatus,
        updated_at: new Date().toISOString(),
      };

      if (conversionTier) {
        updateData.conversion_tier = conversionTier;
      }

      if (conversionReason) {
        updateData.conversion_reason = conversionReason;
      }

      if (conversionStatus === 'converted') {
        updateData.conversion_date = new Date().toISOString();
      }

      if (existingConversion) {
        // Update existing conversion
        const { error } = await this.supabase
          .from('trial_conversions')
          .update(updateData)
          .eq('id', existingConversion.id);

        if (error) {
          throw new Error(
            `Failed to update trial conversion: ${error.message}`
          );
        }
      } else {
        // Create new conversion
        await this.createTrialConversion({
          userId,
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          conversionStatus: conversionStatus as any,
          conversionTier,
          conversionReason,
          conversionDate:
            conversionStatus === 'converted' ? new Date() : undefined,
        });
      }

      // If conversion is successful, update subscription status
      if (conversionStatus === 'converted' && conversionTier) {
        const { error: subscriptionError } = await this.supabase
          .from('subscriptions')
          .update({
            status: 'active',
            tier: conversionTier,
            end_date: null, // Remove end date for active subscription
          })
          .eq('user_id', userId)
          .eq('status', 'trial');

        if (subscriptionError) {
          console.error(
            'Failed to update subscription after conversion:',
            subscriptionError
          );
          // Don't fail the request, just log the error
        }
      }
    } catch (error) {
      console.error('Failed to track conversion:', error);
      throw error;
    }
  }

  async processTrialExpiration(): Promise<void> {
    try {
      // Update expired trials to inactive and mark conversion as expired
      const { error: subscriptionError } = await this.supabase
        .from('subscriptions')
        .update({ status: 'inactive' })
        .eq('status', 'trial')
        .lt('trial_end_date', new Date().toISOString());

      if (subscriptionError) {
        throw new Error(
          `Failed to update expired subscriptions: ${subscriptionError.message}`
        );
      }

      // Update trial conversions for expired trials
      const { error: conversionError } = await this.supabase
        .from('trial_conversions')
        .update({
          conversion_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('conversion_status', 'active')
        .lt('trial_end_date', new Date().toISOString());

      if (conversionError) {
        throw new Error(
          `Failed to update expired trial conversions: ${conversionError.message}`
        );
      }
    } catch (error) {
      console.error('Failed to process trial expiration:', error);
      throw error;
    }
  }

  async getConversionMetrics(): Promise<ConversionMetrics> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await this.supabase.rpc(
          'get_trial_conversion_metrics'
        );

        if (error) {
          // If RPC function not found, return default metrics
          if (
            error.message.includes('function') &&
            error.message.includes('not found')
          ) {
            // Only log in development mode
            if (process.env.NODE_ENV === 'development') {
              console.warn('RPC function not found, returning default metrics');
            }
            return {
              totalTrials: 0,
              convertedTrials: 0,
              expiredTrials: 0,
              conversionRate: 0,
              avgTrialDuration: 0,
            };
          }
          throw new Error(
            `Failed to fetch conversion metrics: ${error.message}`
          );
        }

        // Transform snake_case RPC response to camelCase
        const transformedData = data
          ? {
              totalTrials: data.total_trials || 0,
              convertedTrials: data.converted_trials || 0,
              expiredTrials: data.expired_trials || 0,
              conversionRate: data.conversion_rate || 0,
              avgTrialDuration: data.avg_trial_duration || 0,
            }
          : {
              totalTrials: 0,
              convertedTrials: 0,
              expiredTrials: 0,
              conversionRate: 0,
              avgTrialDuration: 0,
            };

        return transformedData;
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Attempt ${attempt} failed to get conversion metrics:`,
          error
        );

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    // If all retries failed, return default metrics instead of throwing
    console.error(
      'Failed to get conversion metrics after all retries:',
      lastError
    );
    return {
      totalTrials: 0,
      convertedTrials: 0,
      expiredTrials: 0,
      conversionRate: 0,
      avgTrialDuration: 0,
    };
  }

  async getTrialConversions(filters?: {
    status?: string;
    tier?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any[]> {
    try {
      let query = this.supabase
        .from('trial_conversions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('conversion_status', filters.status);
      }

      if (filters?.tier) {
        query = query.eq('conversion_tier', filters.tier);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch trial conversions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get trial conversions:', error);
      throw error;
    }
  }

  async getTrialConversionAnalytics(userId: string): Promise<any> {
    try {
      // Get trial conversion data
      const conversion = await this.getTrialConversion(userId);

      // Get trial analytics
      const { data: analytics, error: analyticsError } = await this.supabase
        .from('trial_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (analyticsError) {
        throw new Error(
          `Failed to fetch trial analytics: ${analyticsError.message}`
        );
      }

      // Get trial insights
      const { data: insights, error: insightsError } = await this.supabase
        .from('trial_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (insightsError) {
        throw new Error(
          `Failed to fetch trial insights: ${insightsError.message}`
        );
      }

      return {
        conversion,
        analytics: analytics || [],
        insights: insights || [],
      };
    } catch (error) {
      console.error('Failed to get trial conversion analytics:', error);
      throw error;
    }
  }

  async scheduleTrialEmails(
    userId: string,
    trialStartDate: Date
  ): Promise<void> {
    try {
      // Schedule trial emails
      const emailSchedules = [
        {
          email_type: 'day_2_optimization',
          scheduled_date: new Date(
            trialStartDate.getTime() + 2 * 24 * 60 * 60 * 1000
          ), // 2 days later
        },
        {
          email_type: 'day_7_checkin',
          scheduled_date: new Date(
            trialStartDate.getTime() + 7 * 24 * 60 * 60 * 1000
          ), // 7 days later
        },
        {
          email_type: 'day_12_ending',
          scheduled_date: new Date(
            trialStartDate.getTime() + 12 * 24 * 60 * 60 * 1000
          ), // 12 days later
        },
      ];

      const { error } = await this.supabase.from('trial_emails').insert(
        emailSchedules.map(schedule => ({
          user_id: userId,
          email_type: schedule.email_type,
          scheduled_date: schedule.scheduled_date.toISOString(),
          email_status: 'pending',
        }))
      );

      if (error) {
        throw new Error(`Failed to schedule trial emails: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to schedule trial emails:', error);
      throw error;
    }
  }

  async checkTrialExpiration(): Promise<void> {
    try {
      // Use the database function to check trial expiration
      const { error } = await this.supabase.rpc(
        'check_trial_expiration_and_conversion'
      );

      if (error) {
        throw new Error(`Failed to check trial expiration: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to check trial expiration:', error);
      throw error;
    }
  }
}

import { createClient } from '@/lib/supabase/server';
import DOMPurify from 'isomorphic-dompurify';

export interface TrialEmailData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  trialDay: number;
  daysRemaining: number;
  conversionLikelihood: number;
  featureUsage: {
    profile_completion: number;
    portfolio_uploads: number;
    search_usage: number;
    contact_usage: number;
  };
  platformEngagement: {
    login_frequency: number;
    feature_usage_score: number;
    time_spent: number;
  };
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export class TrialEmailService {
  private supabase = createClient();

  async sendTrialEmail(userId: string, emailType: string): Promise<void> {
    try {
      // Get user data
      const userData = await this.getUserData(userId);
      if (!userData) {
        throw new Error('User not found');
      }

      // Generate email content
      const emailContent = this.generateEmailContent(emailType, userData);

      // Queue email for async processing
      await this.queueEmailForProcessing(
        userId,
        emailType,
        userData.email,
        emailContent
      );

      // Update email status to queued
      await this.updateEmailStatus(userId, emailType, 'queued');
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send trial email:', error);
      }
      await this.updateEmailStatus(userId, emailType, 'failed');
      throw error;
    }
  }

  async scheduleTrialEmail(
    userId: string,
    emailType: string,
    scheduledDate: Date
  ): Promise<void> {
    try {
      const { error } = await this.supabase.from('trial_emails').insert({
        user_id: userId,
        email_type: emailType,
        scheduled_date: scheduledDate.toISOString(),
        email_status: 'pending',
      });

      if (error) {
        throw new Error(`Failed to schedule trial email: ${error.message}`);
      }
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to schedule trial email:', error);
      }
      throw error;
    }
  }

  async getTrialEmails(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('trial_emails')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch trial emails: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to get trial emails:', error);
      }
      throw error;
    }
  }

  async updateEmailStatus(
    userId: string,
    emailType: string,
    status: string
  ): Promise<void> {
    try {
      const updateData: any = { email_status: status };

      if (status === 'sent') {
        updateData.sent_date = new Date().toISOString();
      }

      const { error } = await this.supabase
        .from('trial_emails')
        .update(updateData)
        .eq('user_id', userId)
        .eq('email_type', emailType);

      if (error) {
        throw new Error(`Failed to update email status: ${error.message}`);
      }
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update email status:', error);
      }
      throw error;
    }
  }

  private async getUserData(userId: string): Promise<TrialEmailData | null> {
    try {
      const { data: userData, error } = await this.supabase
        .from('users')
        .select(
          `
          email,
          profiles!inner(first_name, last_name)
        `
        )
        .eq('id', userId)
        .single();

      if (error || !userData) {
        return null;
      }

      // Get trial conversion data
      const { data: trialConversion } = await this.supabase
        .from('trial_conversions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get latest analytics
      const { data: analytics } = await this.supabase
        .from('trial_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const trialDay = analytics?.trial_day || 1;
      const daysRemaining = trialConversion?.trial_end_date
        ? Math.ceil(
            (new Date(trialConversion.trial_end_date).getTime() -
              new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 14;

      return {
        userId,
        email: userData.email,
        firstName: userData.profiles.first_name,
        lastName: userData.profiles.last_name,
        trialDay,
        daysRemaining,
        conversionLikelihood: analytics?.conversion_likelihood || 0.5,
        featureUsage: analytics?.feature_usage || {
          profile_completion: 0,
          portfolio_uploads: 0,
          search_usage: 0,
          contact_usage: 0,
        },
        platformEngagement: analytics?.platform_engagement || {
          login_frequency: 0,
          feature_usage_score: 0,
          time_spent: 0,
        },
      };
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to get user data:', error);
      }
      return null;
    }
  }

  private generateEmailContent(
    emailType: string,
    userData: TrialEmailData
  ): EmailContent {
    switch (emailType) {
      case 'day_2_optimization':
        return this.generateDay2Email(userData);
      case 'day_7_checkin':
        return this.generateDay7Email(userData);
      case 'day_12_ending':
        return this.generateDay12Email(userData);
      default:
        return this.generateDefaultEmail(userData);
    }
  }

  private generateDay2Email(userData: TrialEmailData): EmailContent {
    const { firstName, lastName, featureUsage } = userData;

    // Sanitize user input to prevent XSS
    const sanitizedFirstName = this.sanitizeHtml(firstName);
    const sanitizedLastName = this.sanitizeHtml(lastName);
    const profileCompletion = Math.round(featureUsage.profile_completion * 100);
    const portfolioCount = featureUsage.portfolio_uploads;

    return {
      subject: 'Optimize Your Profile - Day 2 of Your Trial',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;">
          <title>Day 2 Trial Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Hi ${sanitizedFirstName}!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to day 2 of your EventProsNZ trial!</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; margin-bottom: 20px;">
              You're off to a great start! Here are some tips to optimize your profile and get the most from your trial:
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Your Current Progress</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 8px 0;">📊 Profile Completion: ${profileCompletion}%</li>
                <li style="margin: 8px 0;">📁 Portfolio Items: ${portfolioCount}</li>
              </ul>
            </div>
            
            <h3 style="color: #495057;">Optimization Tips:</h3>
            <ul style="padding-left: 20px;">
              <li style="margin: 10px 0;"><strong>Add a professional profile photo</strong> - This increases visibility by 40%</li>
              <li style="margin: 10px 0;"><strong>Complete your bio section</strong> - Include keywords that clients search for</li>
              <li style="margin: 10px 0;"><strong>Add your service categories</strong> - Help clients find you easily</li>
              <li style="margin: 10px 0;"><strong>Upload portfolio items</strong> - Showcase your best work</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://eventprosnz.com/profile" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Complete Your Profile
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
              These optimizations will help you get more visibility and inquiries from potential clients.
            </p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center;">
              Best regards,<br>
              <strong>The EventProsNZ Team</strong>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${sanitizedFirstName}! Welcome to day 2 of your EventProsNZ trial! You're off to a great start! Here are some tips to optimize your profile and get the most from your trial:

Your Current Progress:
- Profile Completion: ${profileCompletion}%
- Portfolio Items: ${portfolioCount}

Optimization Tips:
- Add a professional profile photo - This increases visibility by 40%
- Complete your bio section - Include keywords that clients search for
- Add your service categories - Help clients find you easily
- Upload portfolio items - Showcase your best work

Complete your profile at: https://eventprosnz.com/profile

These optimizations will help you get more visibility and inquiries from potential clients.

Best regards,
The EventProsNZ Team`,
    };
  }

  private generateDay7Email(userData: TrialEmailData): EmailContent {
    const { firstName, lastName, featureUsage, platformEngagement } = userData;

    // Sanitize user input to prevent XSS
    const sanitizedFirstName = this.sanitizeHtml(firstName);
    const sanitizedLastName = this.sanitizeHtml(lastName);
    const profileCompletion = Math.round(featureUsage.profile_completion * 100);
    const engagementScore = Math.round(
      platformEngagement.feature_usage_score * 100
    );

    return {
      subject: 'How is your trial going? - Day 7 Check-in',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;">
          <title>Day 7 Trial Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Hi ${sanitizedFirstName}!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You're halfway through your trial!</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; margin-bottom: 20px;">
              How has your experience been so far? We'd love to hear your feedback and help you make the most of the platform.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Your Progress So Far</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 8px 0;">📊 Profile Completion: ${profileCompletion}%</li>
                <li style="margin: 8px 0;">🎯 Engagement Score: ${engagementScore}%</li>
              </ul>
            </div>
            
            <h3 style="color: #495057;">Features to Explore:</h3>
            <ul style="padding-left: 20px;">
              <li style="margin: 10px 0;"><strong>Advanced search filters</strong> - Find the perfect opportunities</li>
              <li style="margin: 10px 0;"><strong>Contractor matching system</strong> - Get matched with relevant events</li>
              <li style="margin: 10px 0;"><strong>Portfolio management</strong> - Showcase your work effectively</li>
              <li style="margin: 10px 0;"><strong>Analytics dashboard</strong> - Track your performance</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://eventprosnz.com/dashboard" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
                Explore Features
              </a>
              <a href="https://eventprosnz.com/support" style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Get Help
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
              Feel free to reach out if you have any questions!
            </p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center;">
              Best regards,<br>
              <strong>The EventProsNZ Team</strong>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${sanitizedFirstName}! You're halfway through your trial! How has your experience been so far? We'd love to hear your feedback and help you make the most of the platform.

Your Progress So Far:
- Profile Completion: ${profileCompletion}%
- Engagement Score: ${engagementScore}%

Features to Explore:
- Advanced search filters - Find the perfect opportunities
- Contractor matching system - Get matched with relevant events
- Portfolio management - Showcase your work effectively
- Analytics dashboard - Track your performance

Explore features at: https://eventprosnz.com/dashboard
Get help at: https://eventprosnz.com/support

Feel free to reach out if you have any questions!

Best regards,
The EventProsNZ Team`,
    };
  }

  private generateDay12Email(userData: TrialEmailData): EmailContent {
    const { firstName, lastName, daysRemaining, conversionLikelihood } =
      userData;

    // Sanitize user input to prevent XSS
    const sanitizedFirstName = this.sanitizeHtml(firstName);
    const sanitizedLastName = this.sanitizeHtml(lastName);
    const conversionScore = Math.round(conversionLikelihood * 100);
    const isHighConversion = conversionLikelihood > 0.7;

    return {
      subject: "Your trial ends soon - Don't miss out!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;">
          <title>Day 12 Trial Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Hi ${sanitizedFirstName}!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your trial ends in ${daysRemaining} days!</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; margin-bottom: 20px;">
              We hope you've enjoyed using EventProsNZ. ${isHighConversion ? "You're getting great value from the platform!" : "We'd love to help you get more value from the platform."}
            </p>
            
            ${
              isHighConversion
                ? `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">🎉 Great Progress!</h3>
              <p style="color: #155724; margin: 0;">Your conversion likelihood is ${conversionScore}% - you're clearly getting value from the platform!</p>
            </div>
            `
                : ''
            }
            
            <h3 style="color: #495057;">To continue getting the most out of the platform, consider upgrading:</h3>
            
            <div style="display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 250px; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center;">
                <h4 style="color: #007bff; margin-top: 0;">Showcase Plan</h4>
                <div style="font-size: 24px; font-weight: bold; color: #007bff;">$29/month</div>
                <ul style="text-align: left; font-size: 14px; margin: 15px 0;">
                  <li>Enhanced visibility</li>
                  <li>Up to 20 portfolio items</li>
                  <li>Advanced analytics</li>
                  <li>Direct contact info</li>
                </ul>
                <a href="https://eventprosnz.com/upgrade?tier=showcase" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Choose Showcase
                </a>
              </div>
              
              <div style="flex: 1; min-width: 250px; border: 2px solid #6f42c1; border-radius: 8px; padding: 20px; text-align: center;">
                <h4 style="color: #6f42c1; margin-top: 0;">Spotlight Plan</h4>
                <div style="font-size: 24px; font-weight: bold; color: #6f42c1;">$69/month</div>
                <ul style="text-align: left; font-size: 14px; margin: 15px 0;">
                  <li>Top search visibility</li>
                  <li>Unlimited portfolio</li>
                  <li>Premium analytics</li>
                  <li>Priority support</li>
                </ul>
                <a href="https://eventprosnz.com/upgrade?tier=spotlight" style="background: #6f42c1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Choose Spotlight
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://eventprosnz.com/upgrade" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Upgrade Now
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
              Upgrade now to keep your profile active and continue growing your business!
            </p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center;">
              Best regards,<br>
              <strong>The EventProsNZ Team</strong>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${sanitizedFirstName}! Your trial ends in ${daysRemaining} days! We hope you've enjoyed using EventProsNZ. ${isHighConversion ? "You're getting great value from the platform!" : "We'd love to help you get more value from the platform."}

${isHighConversion ? `Great Progress! Your conversion likelihood is ${conversionScore}% - you're clearly getting value from the platform!` : ''}

To continue getting the most out of the platform, consider upgrading:

Showcase Plan - $29/month:
- Enhanced visibility
- Up to 20 portfolio items
- Advanced analytics
- Direct contact info
Upgrade at: https://eventprosnz.com/upgrade?tier=showcase

Spotlight Plan - $69/month:
- Top search visibility
- Unlimited portfolio
- Premium analytics
- Priority support
Upgrade at: https://eventprosnz.com/upgrade?tier=spotlight

Upgrade now at: https://eventprosnz.com/upgrade

Upgrade now to keep your profile active and continue growing your business!

Best regards,
The EventProsNZ Team`,
    };
  }

  private generateDefaultEmail(userData: TrialEmailData): EmailContent {
    const { firstName, lastName } = userData;

    // Sanitize user input to prevent XSS
    const sanitizedFirstName = this.sanitizeHtml(firstName);
    const sanitizedLastName = this.sanitizeHtml(lastName);

    return {
      subject: 'Your EventProsNZ Trial',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;">
          <title>Trial Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Hi ${sanitizedFirstName}!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for using EventProsNZ!
            </p>
            
            <p style="font-size: 14px; color: #6c757d; text-align: center;">
              Best regards,<br>
              <strong>The EventProsNZ Team</strong>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${sanitizedFirstName}! Thank you for using EventProsNZ!

Best regards,
The EventProsNZ Team`,
    };
  }

  private async sendEmailViaSendGrid(
    email: string,
    emailContent: EmailContent
  ): Promise<void> {
    try {
      const sendGridApiKey = process.env.SENDGRID_API_KEY;
      if (!sendGridApiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(sendGridApiKey);

      const msg = {
        to: email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@eventprosnz.com',
          name: 'EventProsNZ Team',
        },
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
        trackingSettings: {
          clickTracking: {
            enable: true,
            enableText: true,
          },
          openTracking: {
            enable: true,
          },
        },
        categories: ['trial-email'],
      };

      await sgMail.send(msg);
      console.log(`Trial email sent successfully to ${email}`);
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send email via SendGrid:', error);
      }
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Queue email for async processing
   */
  private async queueEmailForProcessing(
    userId: string,
    emailType: string,
    email: string,
    emailContent: EmailContent
  ): Promise<void> {
    try {
      // Store email in queue for background processing
      const { error } = await this.supabase.from('email_queue').insert({
        user_id: userId,
        email_type: emailType,
        recipient_email: email,
        subject: emailContent.subject,
        html_content: emailContent.html,
        text_content: emailContent.text,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(`Failed to queue email: ${error.message}`);
      }

      // Trigger background job processing
      await this.triggerBackgroundEmailProcessing();
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to queue email for processing:', error);
      }
      throw error;
    }
  }

  /**
   * Trigger background email processing
   */
  private async triggerBackgroundEmailProcessing(): Promise<void> {
    try {
      // In a real implementation, this would trigger a background job
      // For now, we'll process emails immediately but in a non-blocking way
      setTimeout(() => {
        this.processEmailQueue().catch(error => {
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.error('Background email processing failed:', error);
          }
        });
      }, 0);
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to trigger background email processing:', error);
      }
    }
  }

  /**
   * Process queued emails
   */
  private async processEmailQueue(): Promise<void> {
    try {
      // Get pending emails from queue
      const { data: queuedEmails, error } = await this.supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch queued emails:', error);
        }
        return;
      }

      if (!queuedEmails || queuedEmails.length === 0) {
        return;
      }

      // Process each email
      for (const emailJob of queuedEmails) {
        try {
          await this.processEmailJob(emailJob);
        } catch (error) {
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.error(`Failed to process email job ${emailJob.id}:`, error);
          }
          // Mark as failed
          await this.supabase
            .from('email_queue')
            .update({ status: 'failed', error_message: error.message })
            .eq('id', emailJob.id);
        }
      }
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to process email queue:', error);
      }
    }
  }

  /**
   * Process individual email job
   */
  private async processEmailJob(emailJob: any): Promise<void> {
    try {
      // Update status to processing
      await this.supabase
        .from('email_queue')
        .update({ status: 'processing' })
        .eq('id', emailJob.id);

      // Send email via SendGrid
      await this.sendEmailViaSendGrid(emailJob.recipient_email, {
        subject: emailJob.subject,
        html: emailJob.html_content,
        text: emailJob.text_content,
      });

      // Update status to sent
      await this.supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', emailJob.id);

      // Update trial email status
      await this.updateEmailStatus(
        emailJob.user_id,
        emailJob.email_type,
        'sent'
      );
    } catch (error) {
      // Update status to failed
      await this.supabase
        .from('email_queue')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', emailJob.id);

      // Update trial email status
      await this.updateEmailStatus(
        emailJob.user_id,
        emailJob.email_type,
        'failed'
      );
      throw error;
    }
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  private sanitizeHtml(input: string): string {
    if (!input) return '';

    // Use DOMPurify for comprehensive XSS protection
    let sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });

    // Additional protection against javascript: URLs and other XSS vectors
    sanitized = sanitized
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe/gi, '&lt;iframe')
      .replace(/<object/gi, '&lt;object')
      .replace(/<embed/gi, '&lt;embed');

    return sanitized;
  }
}

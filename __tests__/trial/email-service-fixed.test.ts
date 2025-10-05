import { TrialEmailService } from '@/lib/trial/email-service';
import { createClient } from '@/lib/supabase/server';
import { createFinalSupabaseMock } from '../mocks/supabase-final-mock';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([
    {
      statusCode: 202,
      body: 'mock-body',
      headers: {},
    },
  ]),
}));

describe('TrialEmailService - Fixed Tests', () => {
  let emailService: TrialEmailService;
  let mockSupabase: any;

  beforeEach(() => {
    // Create final mock for Supabase
    mockSupabase = createFinalSupabaseMock();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    emailService = new TrialEmailService();

    // Mock the getUserData method to return valid data
    jest.spyOn(emailService as any, 'getUserData').mockResolvedValue({
      email: 'test@example.com',
      profiles: { first_name: 'John', last_name: 'Doe' },
      trialConversion: {
        trial_end_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      analytics: {
        trial_day: 2,
        feature_usage: {
          profile_completion: 0.8,
          portfolio_uploads: 3,
          search_usage: 5,
        },
        platform_engagement: {
          login_frequency: 0.7,
          feature_usage_score: 0.6,
          session_duration: 1200,
        },
      },
    });
  });

  describe('Email Sending', () => {
    it('should send trial email successfully', async () => {
      const userId = 'test-user-id';
      const emailType = 'day_2_optimization';

      // Mock successful user data retrieval
      jest.spyOn(emailService as any, 'getUserData').mockResolvedValue({
        userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        trialDay: 2,
        daysRemaining: 12,
        conversionLikelihood: 0.8,
        featureUsage: {
          profile_completion: 0.8,
          portfolio_uploads: 3,
          search_usage: 5,
          contact_usage: 2,
        },
        platformEngagement: {
          login_frequency: 0.7,
          feature_usage_score: 0.6,
          time_spent: 1200,
        },
      });

      await emailService.sendTrialEmail(userId, emailType);

      expect(mockSupabase.from).toHaveBeenCalledWith('email_queue');
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_emails');
    });

    it('should handle user not found error', async () => {
      // Override the getUserData mock to return null for this test
      jest.spyOn(emailService as any, 'getUserData').mockResolvedValue(null);

      const userId = 'non-existent-user';
      const emailType = 'day_2_optimization';

      await expect(
        emailService.sendTrialEmail(userId, emailType)
      ).rejects.toThrow('User not found');
    });
  });

  describe('Email Retrieval', () => {
    it('should get trial emails successfully', async () => {
      const userId = 'test-user-id';
      const result = await emailService.getTrialEmails(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_emails');
    });
  });

  describe('Email Status Updates', () => {
    it('should update email status successfully', async () => {
      const userId = 'test-user-id';
      const emailType = 'day_2_optimization';
      const status = 'sent';

      await expect(
        emailService.updateEmailStatus(userId, emailType, status)
      ).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error by overriding the getUserData method
      jest.spyOn(emailService as any, 'getUserData').mockResolvedValue({
        userId: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        trialDay: 2,
        daysRemaining: 12,
        conversionLikelihood: 0.8,
        featureUsage: {
          profile_completion: 0.8,
          portfolio_uploads: 3,
          search_usage: 5,
          contact_usage: 2,
        },
        platformEngagement: {
          login_frequency: 0.7,
          feature_usage_score: 0.6,
          time_spent: 1200,
        },
      });

      // Mock database error for email queue insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      });

      const userId = 'test-user-id';
      const emailType = 'day_2_optimization';

      await expect(
        emailService.sendTrialEmail(userId, emailType)
      ).rejects.toThrow('Database connection failed');
    });
  });
});

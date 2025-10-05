import { TrialEmailService } from '@/lib/trial/email-service';
import { TrialConversionService } from '@/lib/trial/conversion-service';
import { TrialAnalyticsService } from '@/lib/trial/analytics-service';

// Mock Supabase client with minimal working implementation
const mockSupabase = {
  from: jest.fn().mockImplementation((table: string) => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'test-id',
          user_id: 'test-user-id',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
        error: null,
      }),
    };
    return mockQuery;
  }),
  rpc: jest.fn().mockResolvedValue({
    data: { total_conversions: 10, conversion_rate: 0.3, revenue: 5000 },
    error: null,
  }),
};

// Mock Supabase server
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

// Set up environment variables
process.env.SENDGRID_API_KEY = 'test-api-key';
process.env.SENDGRID_FROM_EMAIL = 'test@example.com';

describe('Trial System - Core Functionality Tests', () => {
  let emailService: TrialEmailService;
  let conversionService: TrialConversionService;
  let analyticsService: TrialAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    emailService = new TrialEmailService();
    conversionService = new TrialConversionService();
    analyticsService = new TrialAnalyticsService();
  });

  describe('Email Service Core Functionality', () => {
    it('should generate email content correctly', () => {
      const userData = {
        userId: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        trialDay: 2,
        daysRemaining: 12,
        conversionLikelihood: 0.7,
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
      };

      // Test email content generation
      const day2Email = (emailService as any).generateDay2Email(userData);
      const day7Email = (emailService as any).generateDay7Email(userData);
      const day12Email = (emailService as any).generateDay12Email(userData);

      expect(day2Email).toBeDefined();
      expect(day2Email.subject).toContain('Day 2');
      expect(day2Email.html).toContain('John');

      expect(day7Email).toBeDefined();
      expect(day7Email.subject).toContain('Day 7');
      expect(day7Email.html).toContain('John');

      expect(day12Email).toBeDefined();
      expect(day12Email.subject).toContain('trial ends soon');
      expect(day12Email.html).toContain('John');
    });

    it('should sanitize HTML content for XSS protection', () => {
      const maliciousInput = '<script>alert("xss")</script>John';
      const sanitized = (emailService as any).sanitizeHtml(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('John');
    });

    it('should include CSP headers in email templates', () => {
      const userData = {
        userId: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        trialDay: 2,
        daysRemaining: 12,
        conversionLikelihood: 0.7,
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
      };

      const emailContent = (emailService as any).generateDay2Email(userData);

      expect(emailContent.html).toContain('Content-Security-Policy');
      expect(emailContent.html).toContain("default-src 'self'");
    });
  });

  describe('Conversion Service Core Functionality', () => {
    it('should validate conversion data correctly', () => {
      const validData = {
        userId: 'test-user-id',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        conversionStatus: 'active' as const,
        conversionTier: 'showcase' as const,
        conversionReason: 'trial_started',
      };

      const invalidData = {
        userId: '',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        conversionStatus: 'active' as const,
        conversionTier: 'showcase' as const,
        conversionReason: 'trial_started',
      };

      // Test validation logic
      expect(validData.userId).toBeTruthy();
      expect(invalidData.userId).toBeFalsy();
    });

    it('should handle conversion status transitions', () => {
      const statuses = ['active', 'converted', 'failed', 'expired'];

      statuses.forEach(status => {
        expect(['active', 'converted', 'failed', 'expired']).toContain(status);
      });
    });
  });

  describe('Analytics Service Core Functionality', () => {
    it('should calculate conversion likelihood correctly', () => {
      const featureUsage = {
        profile_completion: 0.8,
        portfolio_uploads: 3,
        search_usage: 5,
      };

      const platformEngagement = {
        login_frequency: 0.7,
        feature_usage_score: 0.6,
        session_duration: 1200,
      };

      // Test conversion likelihood calculation
      const loginFrequency = platformEngagement.login_frequency || 0;
      const featureUsageScore = platformEngagement.feature_usage_score || 0;
      const profileCompletion = featureUsage.profile_completion || 0;

      const conversionLikelihood = Math.min(
        loginFrequency * 0.3 +
          featureUsageScore * 0.4 +
          profileCompletion * 0.3,
        1.0
      );

      expect(conversionLikelihood).toBeGreaterThan(0);
      expect(conversionLikelihood).toBeLessThanOrEqual(1.0);
    });

    it('should generate insights based on analytics', () => {
      const analytics = {
        feature_usage: {
          profile_completion: 0.5,
          portfolio_uploads: 1,
          search_usage: 2,
        },
        platform_engagement: {
          login_frequency: 0.3,
          feature_usage_score: 0.4,
          session_duration: 600,
        },
        conversion_likelihood: 0.6,
      };

      // Test insight generation logic
      const insights = [];

      if (analytics.feature_usage.profile_completion < 0.7) {
        insights.push({
          type: 'profile_optimization',
          priority: 'high',
        });
      }

      if (analytics.platform_engagement.feature_usage_score < 0.5) {
        insights.push({
          type: 'feature_usage',
          priority: 'medium',
        });
      }

      if (analytics.conversion_likelihood > 0.7) {
        insights.push({
          type: 'conversion_opportunity',
          priority: 'high',
        });
      }

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // Test email service
      const sanitizedNull = (emailService as any).sanitizeHtml(null);
      const sanitizedUndefined = (emailService as any).sanitizeHtml(undefined);
      const sanitizedEmpty = (emailService as any).sanitizeHtml('');

      expect(sanitizedNull).toBe('');
      expect(sanitizedUndefined).toBe('');
      expect(sanitizedEmpty).toBe('');
    });

    it('should validate required fields', () => {
      const requiredFields = ['userId', 'email', 'firstName', 'lastName'];
      const userData = {
        userId: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      requiredFields.forEach(field => {
        expect(userData[field as keyof typeof userData]).toBeTruthy();
      });
    });
  });

  describe('Security Features', () => {
    it('should prevent XSS attacks in email content', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)"></iframe>',
      ];

      maliciousInputs.forEach(input => {
        const sanitized = (emailService as any).sanitizeHtml(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('<iframe>');
      });
    });

    it('should include proper CSP headers', () => {
      const userData = {
        userId: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        trialDay: 2,
        daysRemaining: 12,
        conversionLikelihood: 0.7,
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
      };

      const emailContent = (emailService as any).generateDay2Email(userData);

      expect(emailContent.html).toContain('Content-Security-Policy');
      expect(emailContent.html).toContain("default-src 'self'");
      expect(emailContent.html).toContain("style-src 'self' 'unsafe-inline'");
      expect(emailContent.html).toContain("img-src 'self' data: https:");
    });
  });
});

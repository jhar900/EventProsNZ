import { TrialEmailService } from '@/lib/trial/email-service';

// Mock Supabase client with minimal implementation
const mockSupabase = {
  from: jest.fn().mockImplementation((table: string) => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    };

    // Configure specific table behaviors
    if (table === 'users') {
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          profiles: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
        error: null,
      });
    } else if (table === 'trial_emails') {
      mockQuery.single.mockResolvedValue({
        data: [
          {
            id: 'email-1',
            user_id: 'test-user-id',
            email_type: 'day_2_optimization',
            email_status: 'sent',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      });
    }

    return mockQuery;
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

// Set up environment variables for testing
process.env.SENDGRID_API_KEY = 'test-api-key';
process.env.SENDGRID_FROM_EMAIL = 'test@example.com';

describe('TrialEmailService - Simple Tests', () => {
  let emailService: TrialEmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    emailService = new TrialEmailService();
  });

  describe('Email Content Generation', () => {
    it('should generate Day 2 email content', () => {
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

      // Test the private method by accessing it through the class
      const emailContent = (emailService as any).generateDay2Email(userData);

      expect(emailContent).toBeDefined();
      expect(emailContent.subject).toContain('Day 2');
      expect(emailContent.html).toContain('John');
      expect(emailContent.text).toBeDefined();
    });

    it('should generate Day 7 email content', () => {
      const userData = {
        userId: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        trialDay: 7,
        daysRemaining: 7,
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

      const emailContent = (emailService as any).generateDay7Email(userData);

      expect(emailContent).toBeDefined();
      expect(emailContent.subject).toContain('Day 7');
      expect(emailContent.html).toContain('John');
      expect(emailContent.text).toBeDefined();
    });

    it('should generate Day 12 email content', () => {
      const userData = {
        userId: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        trialDay: 12,
        daysRemaining: 2,
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

      const emailContent = (emailService as any).generateDay12Email(userData);

      expect(emailContent).toBeDefined();
      expect(emailContent.subject).toContain('trial ends soon');
      expect(emailContent.html).toContain('John');
      expect(emailContent.text).toBeDefined();
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize HTML content', () => {
      const maliciousInput = '<script>alert("xss")</script>John';
      const sanitized = (emailService as any).sanitizeHtml(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('John');
    });

    it('should handle empty input', () => {
      const sanitized = (emailService as any).sanitizeHtml('');
      expect(sanitized).toBe('');
    });

    it('should handle null input', () => {
      const sanitized = (emailService as any).sanitizeHtml(null as any);
      expect(sanitized).toBe('');
    });
  });

  describe('Email Templates', () => {
    it('should include CSP headers in HTML emails', () => {
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
});

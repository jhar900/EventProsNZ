import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/features/access/route';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          in: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn(),
              })),
            })),
          })),
        })),
        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(),
          })),
        })),
        insert: jest.fn(),
      })),
      rpc: jest.fn(),
    })),
  })),
}));

const mockRateLimit = jest.fn(() => ({
  allowed: true,
  headers: {},
}));

jest.mock('@/lib/rate-limiting', () => ({
  rateLimit: mockRateLimit,
}));

jest.mock('@/lib/features/feature-access-service', () => ({
  featureAccessService: {
    validateFeatureAccess: jest.fn(),
    getAccessibleFeatures: jest.fn(),
    getTierFeatures: jest.fn(),
    grantFeatureAccess: jest.fn(),
  },
}));

describe('Feature Access Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset rate limit to allow by default
    mockRateLimit.mockReturnValue({
      allowed: true,
      headers: {},
    });
  });

  describe('Server-side Validation Security', () => {
    it('should prevent client-side bypass attempts', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Mock service response denying access regardless of client manipulation
      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: false,
        tier: 'essential',
        reason: 'Feature requires showcase tier or higher',
      });

      featureAccessService.getTierFeatures.mockResolvedValue([]);

      // Simulate client trying to bypass with manipulated request
      const request = new NextRequest(
        'http://localhost:3000/api/features/access?feature_name=advanced_analytics&user_id=admin&tier=spotlight'
      );
      const response = await GET(request);
      const data = await response.json();

      // Server-side validation should prevent access
      expect(response.status).toBe(200);
      expect(data.accessible).toBe(false);
      expect(data.features).toHaveLength(0);

      // Verify server-side validation was called
      expect(featureAccessService.validateFeatureAccess).toHaveBeenCalledWith(
        'user-123', // Actual user ID from auth, not client-provided
        'advanced_analytics'
      );
    });

    it('should validate feature access on every API call', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: true,
        tier: 'showcase',
        reason: null,
      });

      featureAccessService.getAccessibleFeatures.mockResolvedValue([
        'advanced_analytics',
      ]);
      featureAccessService.getTierFeatures.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/features/access'
      );
      await GET(request);

      // Verify server-side validation is called for every request
      expect(featureAccessService.validateFeatureAccess).toHaveBeenCalled();
    });

    it('should enforce authorization checks for admin access', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Mock user role check - non-admin
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { role: 'contractor' },
          error: null,
        });

      const request = new NextRequest(
        'http://localhost:3000/api/features/access?user_id=other-user-456'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('Feature Access Service Security', () => {
    it('should validate subscription status server-side', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Mock service response for expired subscription
      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: false,
        tier: 'showcase',
        reason: 'Subscription expired',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/features/access?feature_name=advanced_analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.accessible).toBe(false);
      expect(data.features).toHaveLength(0);
    });

    it('should validate tier requirements server-side', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Mock service response for insufficient tier
      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: false,
        tier: 'essential',
        reason: 'Feature requires showcase tier or higher',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/features/access?feature_name=advanced_analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.accessible).toBe(false);
      expect(data.features).toHaveLength(0);
    });

    it('should prevent unauthorized feature access grants', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Mock service response denying access
      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: false,
        tier: 'essential',
        reason: 'Feature requires showcase tier or higher',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/features/access',
        {
          method: 'POST',
          body: JSON.stringify({
            feature_name: 'advanced_analytics',
            tier_required: 'showcase',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Feature access denied');
      expect(data.reason).toContain('requires showcase tier');
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits to prevent abuse', async () => {
      const { rateLimit } = require('@/lib/rate-limiting');

      // Mock rate limit exceeded
      rateLimit.mockReturnValue({
        allowed: false,
        message: 'Rate limit exceeded',
        headers: { 'Retry-After': '60' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/features/access'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
    });
  });

  describe('Authentication Security', () => {
    it('should require authentication for all requests', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/features/access'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Input Validation Security', () => {
    it('should validate required fields', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/features/access',
        {
          method: 'POST',
          body: JSON.stringify({
            feature_name: 'advanced_analytics',
            // Missing tier_required
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should sanitize input parameters', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: false,
        tier: 'essential',
        reason: 'Feature not available',
      });

      featureAccessService.getTierFeatures.mockResolvedValue([]);

      // Test with potentially malicious input
      const request = new NextRequest(
        'http://localhost:3000/api/features/access?feature_name=<script>alert("xss")</script>'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should handle malicious input gracefully
      expect(data.accessible).toBe(false);
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in errors', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Mock service error
      featureAccessService.validateFeatureAccess.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/features/access?feature_name=advanced_analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get feature access');
      // Should not expose internal error details
      expect(data.error).not.toContain('Database connection failed');
    });
  });
});

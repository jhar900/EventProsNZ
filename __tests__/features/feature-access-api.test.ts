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

jest.mock('@/lib/rate-limiting', () => ({
  rateLimit: jest.fn(() => ({
    allowed: true,
    headers: {},
  })),
}));

jest.mock('@/lib/features/feature-access-service', () => ({
  featureAccessService: {
    validateFeatureAccess: jest.fn(),
    getAccessibleFeatures: jest.fn(),
    getTierFeatures: jest.fn(),
    grantFeatureAccess: jest.fn(),
  },
}));

describe('Feature Access API Integration Tests', () => {
  let mockSupabase: any;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      tier: 'showcase',
                      status: 'active',
                    },
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        })),
        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'access-123',
                user_id: 'user-123',
                feature_name: 'advanced_analytics',
                is_accessible: true,
              },
              error: null,
            }),
          })),
        })),
      })),
    };
  });

  describe('GET /api/features/access', () => {
    it('should return feature access for authenticated user', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Mock service responses
      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: true,
        tier: 'showcase',
        reason: null,
      });

      featureAccessService.getAccessibleFeatures.mockResolvedValue([
        'advanced_analytics',
        'priority_support',
      ]);

      featureAccessService.getTierFeatures.mockResolvedValue([
        {
          feature_name: 'advanced_analytics',
          tier_required: 'showcase',
          is_included: true,
        },
      ]);

      const request = new NextRequest(
        'http://localhost:3000/api/features/access'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.accessible).toBe(true);
      expect(data.tier).toBe('showcase');
      expect(data.features).toHaveLength(2);
      expect(data.tierFeatures).toHaveLength(1);
    });

    it('should return specific feature access when feature_name is provided', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Mock service response for specific feature
      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: true,
        tier: 'showcase',
        reason: null,
      });

      featureAccessService.getTierFeatures.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/features/access?feature_name=advanced_analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.accessible).toBe(true);
      expect(data.features).toHaveLength(1);
      expect(data.features[0].feature_name).toBe('advanced_analytics');
    });

    it('should return 401 for unauthenticated user', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

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

    it('should return 403 for non-admin accessing other user data', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

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

    it('should handle service errors gracefully', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Mock service error
      featureAccessService.validateFeatureAccess.mockRejectedValue(
        new Error('Service unavailable')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/features/access?feature_name=advanced_analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get feature access');
    });
  });

  describe('POST /api/features/access', () => {
    it('should grant feature access for valid request', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Mock service responses
      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: true,
        tier: 'showcase',
        reason: null,
      });

      featureAccessService.grantFeatureAccess.mockResolvedValue(true);

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

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.featureAccess).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
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

    it('should return 403 for insufficient subscription tier', async () => {
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

    it('should return 400 for user without active subscription', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
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

      expect(response.status).toBe(400);
      expect(data.error).toBe('No active subscription found');
    });

    it('should handle service errors during feature access grant', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Mock service responses
      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: true,
        tier: 'showcase',
        reason: null,
      });

      featureAccessService.grantFeatureAccess.mockResolvedValue(false);

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

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to grant feature access');
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limits on GET requests', async () => {
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

    it('should enforce rate limits on POST requests', async () => {
      const { rateLimit } = require('@/lib/rate-limiting');

      // Mock rate limit exceeded
      rateLimit.mockReturnValue({
        allowed: false,
        message: 'Rate limit exceeded',
        headers: { 'Retry-After': '60' },
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

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
    });
  });

  describe('Security Integration', () => {
    it('should prevent client-side bypass attempts', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Mock service response denying access
      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: false,
        tier: 'essential',
        reason: 'Feature requires showcase tier or higher',
      });

      // Even if client sends manipulated data, server-side validation should prevent access
      const request = new NextRequest(
        'http://localhost:3000/api/features/access?feature_name=advanced_analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.accessible).toBe(false);
      expect(data.features).toHaveLength(0);
    });

    it('should validate all feature access through server-side middleware', async () => {
      const {
        featureAccessService,
      } = require('@/lib/features/feature-access-service');

      // Verify that validateFeatureAccess is called for every request
      featureAccessService.validateFeatureAccess.mockResolvedValue({
        hasAccess: true,
        tier: 'showcase',
        reason: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/features/access?feature_name=advanced_analytics'
      );
      await GET(request);

      expect(featureAccessService.validateFeatureAccess).toHaveBeenCalledWith(
        'user-123',
        'advanced_analytics'
      );
    });
  });
});

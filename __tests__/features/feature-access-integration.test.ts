import { NextRequest } from 'next/server';
import { featureAccessService } from '@/lib/features/feature-access-service';
import { FeatureAccessMiddleware } from '@/lib/middleware/featureAccess';
import { FeatureAccessCacheService } from '@/lib/cache/feature-access-cache';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
      })),
      order: jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(),
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
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('Feature Access Integration Tests', () => {
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'contractor',
    };

    // Reset all mocks
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Clear cache before each test
    FeatureAccessCacheService.invalidateAllCache();
  });

  describe('Server-side Feature Access Validation', () => {
    it('should validate feature access with server-side checks', async () => {
      const middleware = new FeatureAccessMiddleware();

      // Mock subscription data
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: {
            tier: 'showcase',
            status: 'active',
            end_date: null,
          },
          error: null,
        });

      // Mock feature requirements
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: {
            tier_required: 'showcase',
            is_included: true,
            limit_value: 10,
          },
          error: null,
        });

      const validation = await middleware.validateFeatureAccess(
        'user-123',
        'advanced_analytics'
      );

      expect(validation.hasAccess).toBe(true);
      expect(validation.tier).toBe('showcase');
    });

    it('should deny access for insufficient tier', async () => {
      const middleware = new FeatureAccessMiddleware();

      // Mock subscription with lower tier
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: {
            tier: 'essential',
            status: 'active',
            end_date: null,
          },
          error: null,
        });

      // Mock feature requirements for higher tier
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: {
            tier_required: 'spotlight',
            is_included: true,
            limit_value: 10,
          },
          error: null,
        });

      const validation = await middleware.validateFeatureAccess(
        'user-123',
        'advanced_analytics'
      );

      expect(validation.hasAccess).toBe(false);
      expect(validation.reason).toContain('requires spotlight tier');
    });

    it('should deny access for expired subscription', async () => {
      const middleware = new FeatureAccessMiddleware();

      // Mock expired subscription
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      mockSupabase
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: {
            tier: 'showcase',
            status: 'active',
            end_date: expiredDate.toISOString(),
          },
          error: null,
        });

      const validation = await middleware.validateFeatureAccess(
        'user-123',
        'advanced_analytics'
      );

      expect(validation.hasAccess).toBe(false);
      expect(validation.reason).toBe('Subscription expired');
    });
  });

  describe('Feature Access Service Integration', () => {
    it('should get accessible features for user', async () => {
      // Mock subscription
      mockSupabase
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: {
            tier: 'showcase',
            status: 'active',
          },
          error: null,
        });

      // Mock tier features
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .order.mockResolvedValue({
          data: [
            {
              feature_name: 'advanced_analytics',
              tier_required: 'showcase',
              is_included: true,
            },
            {
              feature_name: 'priority_support',
              tier_required: 'showcase',
              is_included: true,
            },
          ],
          error: null,
        });

      // Mock feature validation for each feature
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: {
            tier_required: 'showcase',
            is_included: true,
          },
          error: null,
        });

      const accessibleFeatures =
        await featureAccessService.getAccessibleFeatures('user-123');

      expect(accessibleFeatures).toContain('advanced_analytics');
      expect(accessibleFeatures).toContain('priority_support');
    });

    it('should grant feature access with proper validation', async () => {
      // Mock subscription
      mockSupabase
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: {
            tier: 'showcase',
            status: 'active',
          },
          error: null,
        });

      // Mock feature requirements
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: {
            tier_required: 'showcase',
            is_included: true,
          },
          error: null,
        });

      // Mock upsert operation
      mockSupabase
        .from()
        .upsert()
        .select()
        .single.mockResolvedValue({
          data: {
            id: 'access-123',
            user_id: 'user-123',
            feature_name: 'advanced_analytics',
            is_accessible: true,
          },
          error: null,
        });

      const success = await featureAccessService.grantFeatureAccess(
        'user-123',
        'advanced_analytics',
        'showcase'
      );

      expect(success).toBe(true);
    });

    it('should revoke feature access', async () => {
      // Mock update operation
      mockSupabase.from().update().eq().eq.mockResolvedValue({
        data: null,
        error: null,
      });

      const success = await featureAccessService.revokeFeatureAccess(
        'user-123',
        'advanced_analytics'
      );

      expect(success).toBe(true);
    });
  });

  describe('Caching Integration', () => {
    it('should cache feature access validation results', async () => {
      // Mock subscription
      mockSupabase
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: {
            tier: 'showcase',
            status: 'active',
          },
          error: null,
        });

      // Mock feature requirements
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: {
            tier_required: 'showcase',
            is_included: true,
          },
          error: null,
        });

      // First call should hit database
      const validation1 = await featureAccessService.validateFeatureAccess(
        'user-123',
        'advanced_analytics'
      );

      // Second call should hit cache
      const validation2 = await featureAccessService.validateFeatureAccess(
        'user-123',
        'advanced_analytics'
      );

      expect(validation1).toEqual(validation2);

      // Verify cache statistics
      const stats = featureAccessService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should invalidate cache when feature access changes', async () => {
      // Mock subscription
      mockSupabase
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: {
            tier: 'showcase',
            status: 'active',
          },
          error: null,
        });

      // Mock feature requirements
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: {
            tier_required: 'showcase',
            is_included: true,
          },
          error: null,
        });

      // Mock upsert operation
      mockSupabase
        .from()
        .upsert()
        .select()
        .single.mockResolvedValue({
          data: {
            id: 'access-123',
            user_id: 'user-123',
            feature_name: 'advanced_analytics',
            is_accessible: true,
          },
          error: null,
        });

      // Grant access (should invalidate cache)
      await featureAccessService.grantFeatureAccess(
        'user-123',
        'advanced_analytics',
        'showcase'
      );

      // Cache should be invalidated
      const stats = featureAccessService.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Security Integration', () => {
    it('should prevent unauthorized access to other users data', async () => {
      const middleware = new FeatureAccessMiddleware();

      // Mock subscription for different user
      mockSupabase
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: {
            tier: 'essential',
            status: 'active',
          },
          error: null,
        });

      // Mock feature requirements
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: {
            tier_required: 'showcase',
            is_included: true,
          },
          error: null,
        });

      const validation = await middleware.validateFeatureAccess(
        'other-user-456',
        'advanced_analytics'
      );

      expect(validation.hasAccess).toBe(false);
      expect(validation.reason).toContain('requires showcase tier');
    });

    it('should log feature access attempts for security monitoring', async () => {
      // Mock subscription
      mockSupabase
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: {
            tier: 'showcase',
            status: 'active',
          },
          error: null,
        });

      // Mock feature requirements
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: {
            tier_required: 'showcase',
            is_included: true,
          },
          error: null,
        });

      // Mock audit log insert
      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: null,
      });

      await featureAccessService.validateFeatureAccess(
        'user-123',
        'advanced_analytics'
      );

      // Verify audit log was called
      expect(mockSupabase.from().insert).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        });

      const validation = await featureAccessService.validateFeatureAccess(
        'user-123',
        'advanced_analytics'
      );

      expect(validation.hasAccess).toBe(false);
      expect(validation.reason).toBe('Validation error occurred');
    });

    it('should handle missing subscription gracefully', async () => {
      // Mock no subscription found
      mockSupabase
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // No rows returned
        });

      const validation = await featureAccessService.validateFeatureAccess(
        'user-123',
        'advanced_analytics'
      );

      expect(validation.hasAccess).toBe(false);
      expect(validation.reason).toBe('No active subscription found');
    });
  });

  describe('Performance Integration', () => {
    it('should handle high volume of concurrent requests', async () => {
      // Mock subscription
      mockSupabase
        .from()
        .select()
        .eq()
        .in()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: {
            tier: 'showcase',
            status: 'active',
          },
          error: null,
        });

      // Mock feature requirements
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: {
            tier_required: 'showcase',
            is_included: true,
          },
          error: null,
        });

      // Create multiple concurrent requests
      const promises = Array.from({ length: 10 }, (_, i) =>
        featureAccessService.validateFeatureAccess(
          `user-${i}`,
          'advanced_analytics'
        )
      );

      const results = await Promise.all(promises);

      // All requests should complete successfully
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.hasAccess).toBe(true);
      });
    });
  });
});

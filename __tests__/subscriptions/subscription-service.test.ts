import { SubscriptionService } from '@/lib/subscriptions/subscription-service';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { code: 'PGRST116' },
              })),
            })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-subscription-id',
              user_id: 'test-user-id',
              tier: 'showcase',
              status: 'trial',
              billing_cycle: 'monthly',
              price: 0,
              start_date: new Date().toISOString(),
              trial_end_date: new Date(
                Date.now() + 14 * 24 * 60 * 60 * 1000
              ).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'test-subscription-id',
                user_id: 'test-user-id',
                tier: 'spotlight',
                status: 'active',
                billing_cycle: 'monthly',
                price: 69,
                start_date: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            })),
          })),
        })),
      })),
      rpc: jest.fn(() => ({
        data: true,
        error: null,
      })),
    })),
  }),
}));

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    subscriptionService = new SubscriptionService();
  });

  describe('getCurrentSubscription', () => {
    it('should return null when no subscription exists', async () => {
      const result =
        await subscriptionService.getCurrentSubscription('test-user-id');
      expect(result).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should create a new subscription', async () => {
      const result = await subscriptionService.createSubscription(
        'test-user-id',
        {
          tier: 'showcase',
          billing_cycle: 'monthly',
        }
      );

      expect(result).toBeDefined();
      expect(result.tier).toBe('showcase');
      expect(result.status).toBe('trial');
    });
  });

  describe('startTrial', () => {
    it('should start a trial for a new user', async () => {
      const result = await subscriptionService.startTrial(
        'test-user-id',
        'showcase'
      );

      expect(result).toBeDefined();
      expect(result.tier).toBe('showcase');
      expect(result.is_active).toBe(true);
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade a subscription', async () => {
      const result = await subscriptionService.upgradeSubscription(
        'test-subscription-id',
        'spotlight'
      );

      expect(result).toBeDefined();
      expect(result.subscription.tier).toBe('spotlight');
      expect(result.proration).toBeDefined();
    });
  });

  describe('validatePromotionalCode', () => {
    it('should validate a promotional code', async () => {
      const result = await subscriptionService.validatePromotionalCode(
        'TESTCODE',
        'showcase'
      );

      expect(result).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('hasFeatureAccess', () => {
    it('should check feature access', async () => {
      const result = await subscriptionService.hasFeatureAccess(
        'test-user-id',
        'premium_analytics'
      );

      expect(result).toBe(true);
    });
  });
});

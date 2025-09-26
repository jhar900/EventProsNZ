import { ContractorMatchingService } from '@/lib/matching/matching-service';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('ContractorMatchingService', () => {
  let matchingService: ContractorMatchingService;

  beforeEach(() => {
    matchingService = new ContractorMatchingService();
  });

  describe('findMatches', () => {
    it('should find contractor matches for an event', async () => {
      const mockEvent = {
        id: 'event-1',
        event_type: 'wedding',
        event_date: '2024-12-25',
        duration_hours: 8,
        budget_total: 10000,
        location_data: { lat: -36.8485, lng: 174.7633 },
      };

      const mockContractors = [
        {
          id: 'contractor-1',
          business_profiles: [
            {
              company_name: 'Test Company',
              service_categories: ['photography', 'videography'],
              service_areas: ['Auckland'],
              is_verified: true,
              subscription_tier: 'professional',
              average_rating: 4.5,
              review_count: 10,
            },
          ],
          services: [
            {
              price_range_min: 1000,
              price_range_max: 5000,
            },
          ],
        },
      ];

      // Mock Supabase responses
      const mockSupabase = createClient() as any;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockEvent,
              error: null,
            })),
          })),
        })),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                data: mockContractors,
                error: null,
              })),
            })),
          })),
        })),
      });

      const result = await matchingService.findMatches({
        event_id: 'event-1',
        page: 1,
        limit: 20,
      });

      expect(result).toBeDefined();
      expect(result.matches).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should handle errors when finding matches', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: new Error('Event not found'),
            })),
          })),
        })),
      });

      await expect(
        matchingService.findMatches({
          event_id: 'invalid-event',
          page: 1,
          limit: 20,
        })
      ).rejects.toThrow('Failed to find contractor matches');
    });
  });

  describe('calculateCompatibility', () => {
    it('should calculate compatibility score between event and contractor', async () => {
      const eventRequirements = {
        event_id: 'event-1',
        event_type: 'wedding',
        event_date: '2024-12-25',
        duration_hours: 8,
        location: { lat: -36.8485, lng: 174.7633, address: 'Auckland' },
        budget_total: 10000,
        service_requirements: [],
        special_requirements: 'Outdoor ceremony',
      };

      const contractorProfile = {
        contractor_id: 'contractor-1',
        company_name: 'Test Company',
        service_categories: ['photography', 'videography'],
        service_areas: ['Auckland'],
        pricing_range: { min: 1000, max: 5000 },
        availability: 'flexible',
        is_verified: true,
        subscription_tier: 'professional',
        average_rating: 4.5,
        review_count: 10,
      };

      const result = await matchingService.calculateCompatibility(
        eventRequirements,
        contractorProfile
      );

      expect(result).toBeDefined();
      expect(result.service_type_score).toBeGreaterThanOrEqual(0);
      expect(result.service_type_score).toBeLessThanOrEqual(1);
      expect(result.experience_score).toBeGreaterThanOrEqual(0);
      expect(result.experience_score).toBeLessThanOrEqual(1);
      expect(result.pricing_score).toBeGreaterThanOrEqual(0);
      expect(result.pricing_score).toBeLessThanOrEqual(1);
      expect(result.location_score).toBeGreaterThanOrEqual(0);
      expect(result.location_score).toBeLessThanOrEqual(1);
      expect(result.performance_score).toBeGreaterThanOrEqual(0);
      expect(result.performance_score).toBeLessThanOrEqual(1);
      expect(result.availability_score).toBeGreaterThanOrEqual(0);
      expect(result.availability_score).toBeLessThanOrEqual(1);
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(1);
    });
  });

  describe('checkAvailability', () => {
    it('should check contractor availability', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                data: [{ is_available: true }],
                error: null,
              })),
            })),
          })),
        })),
      });

      const result = await matchingService.checkAvailability(
        'contractor-1',
        '2024-12-25',
        8
      );

      expect(result).toBeDefined();
      expect(result.contractor_id).toBe('contractor-1');
      expect(result.available).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(result.availability_score).toBeGreaterThanOrEqual(0);
      expect(result.availability_score).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateBudgetCompatibility', () => {
    it('should calculate budget compatibility', async () => {
      const result = await matchingService.calculateBudgetCompatibility(10000, {
        min: 1000,
        max: 5000,
      });

      expect(result).toBeDefined();
      expect(result.budget_range_match).toBe(true);
      expect(result.price_affordability).toBeGreaterThanOrEqual(0);
      expect(result.price_affordability).toBeLessThanOrEqual(1);
      expect(result.value_score).toBeGreaterThanOrEqual(0);
      expect(result.budget_flexibility).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateLocationMatch', () => {
    it('should calculate location match', async () => {
      const result = await matchingService.calculateLocationMatch(
        { lat: -36.8485, lng: 174.7633 },
        ['Auckland', 'North Shore']
      );

      expect(result).toBeDefined();
      expect(result.distance_km).toBeGreaterThanOrEqual(0);
      expect(result.service_area_coverage).toBeGreaterThanOrEqual(0);
      expect(result.service_area_coverage).toBeLessThanOrEqual(1);
      expect(result.proximity_score).toBeGreaterThanOrEqual(0);
      expect(result.proximity_score).toBeLessThanOrEqual(1);
      expect(result.accessibility_score).toBeGreaterThanOrEqual(0);
      expect(result.accessibility_score).toBeLessThanOrEqual(1);
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(1);
    });
  });

  describe('calculatePerformanceScore', () => {
    it('should calculate performance score', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                response_time_hours: 4,
                reliability_score: 0.9,
                quality_score: 0.85,
                communication_score: 0.88,
                overall_performance_score: 0.87,
                total_projects: 20,
                successful_projects: 18,
              },
              error: null,
            })),
          })),
        })),
      });

      const result =
        await matchingService.calculatePerformanceScore('contractor-1');

      expect(result).toBeDefined();
      expect(result.contractor_id).toBe('contractor-1');
      expect(result.response_time_hours).toBeGreaterThanOrEqual(0);
      expect(result.reliability_score).toBeGreaterThanOrEqual(0);
      expect(result.reliability_score).toBeLessThanOrEqual(1);
      expect(result.quality_score).toBeGreaterThanOrEqual(0);
      expect(result.quality_score).toBeLessThanOrEqual(1);
      expect(result.communication_score).toBeGreaterThanOrEqual(0);
      expect(result.communication_score).toBeLessThanOrEqual(1);
      expect(result.overall_performance_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_performance_score).toBeLessThanOrEqual(1);
      expect(result.total_projects).toBeGreaterThanOrEqual(0);
      expect(result.successful_projects).toBeGreaterThanOrEqual(0);
      expect(result.success_rate).toBeGreaterThanOrEqual(0);
      expect(result.success_rate).toBeLessThanOrEqual(1);
    });
  });

  describe('rankContractors', () => {
    it('should rank contractors by overall score', async () => {
      const matches = [
        {
          id: 'match-1',
          event_id: 'event-1',
          contractor_id: 'contractor-1',
          compatibility_score: 0.8,
          availability_score: 0.9,
          budget_score: 0.7,
          location_score: 0.8,
          performance_score: 0.85,
          overall_score: 0.8,
          is_premium: false,
          match_algorithm: 'default',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'match-2',
          event_id: 'event-1',
          contractor_id: 'contractor-2',
          compatibility_score: 0.9,
          availability_score: 0.8,
          budget_score: 0.8,
          location_score: 0.9,
          performance_score: 0.9,
          overall_score: 0.9,
          is_premium: true,
          match_algorithm: 'default',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const result = await matchingService.rankContractors(matches, 'default');

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].contractor_id).toBe('contractor-2'); // Higher score should be first
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
      expect(result[0].score).toBe(0.9);
      expect(result[1].score).toBe(0.8);
    });
  });
});

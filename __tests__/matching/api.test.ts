import { NextRequest } from 'next/server';
import {
  GET as contractorsGET,
  POST as contractorsPOST,
} from '@/app/api/matching/contractors/route';
import { POST as feedbackPOST } from '@/app/api/matching/contractors/feedback/route';
import {
  GET as compatibilityGET,
  POST as compatibilityPOST,
} from '@/app/api/matching/compatibility/route';
import {
  GET as availabilityGET,
  POST as availabilityPOST,
} from '@/app/api/matching/availability/route';
import {
  GET as budgetGET,
  POST as budgetPOST,
} from '@/app/api/matching/budget/route';
import {
  GET as locationGET,
  POST as locationPOST,
} from '@/app/api/matching/location/route';
import {
  GET as performanceGET,
  POST as performancePOST,
} from '@/app/api/matching/performance/route';
import {
  GET as rankingGET,
  POST as rankingPOST,
} from '@/app/api/matching/ranking/route';
import {
  POST as inquiryPOST,
  GET as inquiryGET,
} from '@/app/api/matching/inquiry/route';

// Mock Supabase
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
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
}));

// Mock matching service
jest.mock('@/lib/matching/matching-service', () => ({
  matchingService: {
    findMatches: jest.fn(),
    calculateCompatibility: jest.fn(),
    checkAvailability: jest.fn(),
    calculateBudgetCompatibility: jest.fn(),
    calculateLocationMatch: jest.fn(),
    calculatePerformanceScore: jest.fn(),
    rankContractors: jest.fn(),
  },
}));

describe('Matching API Routes', () => {
  describe('GET /api/matching/contractors', () => {
    it('should return contractor matches', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/contractors?event_id=event-1&page=1&limit=20'
      );

      const response = await contractorsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeDefined();
    });

    it('should return 400 when event_id is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/contractors'
      );

      const response = await contractorsGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Event ID is required');
    });
  });

  describe('POST /api/matching/contractors', () => {
    it('should return contractor matches with filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/contractors',
        {
          method: 'POST',
          body: JSON.stringify({
            event_id: 'event-1',
            filters: { service_types: ['photography'] },
            page: 1,
            limit: 20,
          }),
        }
      );

      const response = await contractorsPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeDefined();
    });

    it('should return 400 when event_id is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/contractors',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await contractorsPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Event ID is required');
    });
  });

  describe('POST /api/matching/contractors/feedback', () => {
    it('should update match feedback', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/contractors/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            match_id: 'match-1',
            feedback_type: 'positive',
            rating: 5,
            comments: 'Great match!',
          }),
        }
      );

      const response = await feedbackPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/contractors/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            match_id: 'match-1',
          }),
        }
      );

      const response = await feedbackPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Match ID, feedback type, and rating are required'
      );
    });
  });

  describe('GET /api/matching/compatibility', () => {
    it('should return compatibility score', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/compatibility?event_id=event-1&contractor_id=contractor-1'
      );

      const response = await compatibilityGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.compatibility).toBeDefined();
      expect(data.breakdown).toBeDefined();
    });

    it('should return 400 when required parameters are missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/compatibility?event_id=event-1'
      );

      const response = await compatibilityGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Event ID and Contractor ID are required');
    });
  });

  describe('POST /api/matching/compatibility', () => {
    it('should calculate compatibility score', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/compatibility',
        {
          method: 'POST',
          body: JSON.stringify({
            event_requirements: {
              event_id: 'event-1',
              event_type: 'wedding',
              event_date: '2024-12-25',
              duration_hours: 8,
              location: { lat: -36.8485, lng: 174.7633, address: 'Auckland' },
              budget_total: 10000,
              service_requirements: [],
              special_requirements: 'Outdoor ceremony',
            },
            contractor_profile: {
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
            },
          }),
        }
      );

      const response = await compatibilityPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.compatibility).toBeDefined();
      expect(data.breakdown).toBeDefined();
    });
  });

  describe('GET /api/matching/availability', () => {
    it('should return availability status', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/availability?contractor_id=contractor-1&event_date=2024-12-25&duration=8'
      );

      const response = await availabilityGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contractor_id).toBe('contractor-1');
      expect(data.available).toBeDefined();
      expect(data.conflicts).toBeDefined();
      expect(data.availability_score).toBeDefined();
    });

    it('should return 400 when required parameters are missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/availability?contractor_id=contractor-1'
      );

      const response = await availabilityGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Contractor ID and event date are required');
    });
  });

  describe('POST /api/matching/availability', () => {
    it('should check multiple contractor availability', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/availability',
        {
          method: 'POST',
          body: JSON.stringify({
            contractor_ids: ['contractor-1', 'contractor-2'],
            event_date: '2024-12-25',
            duration: 8,
          }),
        }
      );

      const response = await availabilityPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.availability).toBeDefined();
      expect(Array.isArray(data.availability)).toBe(true);
    });
  });

  describe('GET /api/matching/budget', () => {
    it('should return budget compatibility', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/budget?event_id=event-1&contractor_id=contractor-1'
      );

      const response = await budgetGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.budget_compatibility).toBeDefined();
      expect(data.score).toBeDefined();
    });
  });

  describe('GET /api/matching/location', () => {
    it('should return location match', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/location?event_location={"lat":-36.8485,"lng":174.7633}&contractor_id=contractor-1'
      );

      const response = await locationGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.location_match).toBeDefined();
      expect(data.score).toBeDefined();
    });
  });

  describe('GET /api/matching/performance', () => {
    it('should return performance score', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/performance?contractor_id=contractor-1'
      );

      const response = await performanceGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.performance).toBeDefined();
      expect(data.score).toBeDefined();
    });
  });

  describe('GET /api/matching/ranking', () => {
    it('should return contractor ranking', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/ranking?event_id=event-1&algorithm=default'
      );

      const response = await rankingGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ranking).toBeDefined();
      expect(data.algorithm).toBeDefined();
    });
  });

  describe('POST /api/matching/inquiry', () => {
    it('should create inquiry', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/inquiry',
        {
          method: 'POST',
          body: JSON.stringify({
            event_id: 'event-1',
            contractor_id: 'contractor-1',
            message: 'Test inquiry message',
          }),
        }
      );

      const response = await inquiryPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.inquiry).toBeDefined();
    });

    it('should return 400 when required fields are missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/inquiry',
        {
          method: 'POST',
          body: JSON.stringify({
            event_id: 'event-1',
          }),
        }
      );

      const response = await inquiryPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Event ID, Contractor ID, and message are required'
      );
    });
  });

  describe('GET /api/matching/inquiry', () => {
    it('should return enquiries', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/matching/inquiry?event_id=event-1'
      );

      const response = await inquiryGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.enquiries).toBeDefined();
      expect(Array.isArray(data.enquiries)).toBe(true);
    });
  });
});

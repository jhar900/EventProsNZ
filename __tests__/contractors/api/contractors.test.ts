import { NextRequest } from 'next/server';
import { GET as getContractors } from '@/app/api/contractors/route';
import { GET as searchContractors } from '@/app/api/contractors/search/route';
import { GET as getFeaturedContractors } from '@/app/api/contractors/featured/route';
import { createClient } from '@/lib/supabase/server';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

// Mock contractor data
const mockContractorData = {
  id: '1',
  email: 'john@eventsolutions.co.nz',
  created_at: '2024-01-01T00:00:00Z',
  profiles: {
    first_name: 'John',
    last_name: 'Doe',
    avatar_url: null,
    location: 'Auckland',
    bio: 'Professional event planner',
  },
  business_profiles: {
    company_name: 'Event Solutions Ltd',
    description: 'Professional event planning services',
    location: 'Auckland',
    service_categories: ['planning', 'catering'],
    average_rating: 4.5,
    review_count: 12,
    is_verified: true,
    subscription_tier: 'professional',
    business_address: '123 Queen Street, Auckland',
    service_areas: ['Auckland', 'Wellington'],
    social_links: null,
    verification_date: '2024-01-15T00:00:00Z',
  },
  services: [
    {
      service_type: 'Event Planning',
      description: 'Full event planning services',
      price_range_min: 1000,
      price_range_max: 5000,
      availability: 'Monday to Friday',
    },
  ],
};

describe('/api/contractors', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    mockCreateClient.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/contractors', () => {
    it('returns contractors with pagination', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockContractorData],
        error: null,
        count: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors?page=1&limit=12'
      );
      const response = await getContractors(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contractors).toHaveLength(1);
      expect(data.total).toBe(1);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(12);
      expect(data.contractors[0]).toMatchObject({
        id: '1',
        name: 'John Doe',
        companyName: 'Event Solutions Ltd',
        isPremium: true,
      });
    });

    it('filters for approved contractors only', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockContractorData],
        error: null,
        count: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/contractors');
      await getContractors(request);

      expect(mockSupabase.eq).toHaveBeenCalledWith('role', 'contractor');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_verified', true);
    });

    it('sorts by premium first by default', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockContractorData],
        error: null,
        count: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/contractors');
      await getContractors(request);

      expect(mockSupabase.order).toHaveBeenCalledWith(
        'business_profiles.subscription_tier',
        { ascending: false }
      );
    });

    it('handles premium only filter', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockContractorData],
        error: null,
        count: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors?premium_only=true'
      );
      await getContractors(request);

      expect(mockSupabase.in).toHaveBeenCalledWith(
        'business_profiles.subscription_tier',
        ['professional', 'enterprise']
      );
    });

    it('handles different sort options', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockContractorData],
        error: null,
        count: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors?sort=rating'
      );
      await getContractors(request);

      expect(mockSupabase.order).toHaveBeenCalledWith(
        'business_profiles.average_rating',
        { ascending: false }
      );
    });

    it('handles errors gracefully', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      const request = new NextRequest('http://localhost:3000/api/contractors');
      const response = await getContractors(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch contractors');
    });
  });

  describe('GET /api/contractors/search', () => {
    it('performs text search', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockContractorData],
        error: null,
        count: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/search?q=event'
      );
      await searchContractors(request);

      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining('event')
      );
    });

    it('filters by service type', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockContractorData],
        error: null,
        count: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/search?service_type=planning'
      );
      await searchContractors(request);

      expect(mockSupabase.contains).toHaveBeenCalledWith(
        'business_profiles.service_categories',
        ['planning']
      );
    });

    it('filters by location', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockContractorData],
        error: null,
        count: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/search?location=Auckland'
      );
      await searchContractors(request);

      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining('Auckland')
      );
    });

    it('filters by rating', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockContractorData],
        error: null,
        count: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/search?rating_min=4'
      );
      await searchContractors(request);

      expect(mockSupabase.gte).toHaveBeenCalledWith(
        'business_profiles.average_rating',
        4
      );
    });

    it('filters by price range', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockContractorData],
        error: null,
        count: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/search?price_min=1000&price_max=5000'
      );
      await searchContractors(request);

      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining('1000')
      );
    });
  });

  describe('GET /api/contractors/featured', () => {
    it('returns featured contractors', async () => {
      mockSupabase.limit.mockResolvedValue({
        data: [mockContractorData],
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/featured'
      );
      const response = await getFeaturedContractors(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contractors).toHaveLength(1);
      expect(data.contractors[0].isFeatured).toBe(true);
    });

    it('filters for premium contractors with high ratings', async () => {
      mockSupabase.limit.mockResolvedValue({
        data: [mockContractorData],
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/featured'
      );
      await getFeaturedContractors(request);

      expect(mockSupabase.in).toHaveBeenCalledWith(
        'business_profiles.subscription_tier',
        ['professional', 'enterprise']
      );
      expect(mockSupabase.gte).toHaveBeenCalledWith(
        'business_profiles.average_rating',
        4.0
      );
      expect(mockSupabase.gte).toHaveBeenCalledWith(
        'business_profiles.review_count',
        5
      );
    });
  });
});

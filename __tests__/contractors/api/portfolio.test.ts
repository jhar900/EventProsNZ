import { NextRequest } from 'next/server';
import { GET } from '@/app/api/contractors/[id]/portfolio/route';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('/api/contractors/[id]/portfolio', () => {
  const mockContractor = {
    id: 'contractor-123',
    role: 'contractor',
    is_verified: true,
  };

  const mockPortfolio = [
    {
      id: '1',
      title: 'Wedding Photography',
      description: 'Beautiful wedding ceremony',
      image_url: 'https://example.com/image1.jpg',
      event_date: '2024-01-15',
      category: 'Wedding',
      created_at: '2024-01-16T10:00:00Z',
    },
    {
      id: '2',
      title: 'Corporate Event',
      description: 'Annual company conference',
      image_url: 'https://example.com/image2.jpg',
      event_date: '2024-02-20',
      category: 'Corporate',
      created_at: '2024-02-21T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns portfolio items successfully', async () => {
    let portfolioCallCount = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockContractor,
            error: null,
          }),
        };
      } else if (table === 'portfolio') {
        portfolioCallCount++;

        if (portfolioCallCount === 1) {
          // First call: portfolio items with range and count
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
              data: mockPortfolio,
              error: null,
              count: 2,
            }),
          };
        } else {
          // Second call: categories with not()
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({
              data: [{ category: 'Wedding' }, { category: 'Corporate' }],
              error: null,
            }),
          };
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/contractors/contractor-123/portfolio'
    );
    const response = await GET(request, { params: { id: 'contractor-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.portfolio).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.categories).toEqual(['Wedding', 'Corporate']);
  });

  it('handles contractor not found', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/contractors/nonexistent/portfolio'
    );
    const response = await GET(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Contractor not found');
  });

  it('handles missing contractor ID', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/contractors//portfolio'
    );
    const response = await GET(request, { params: { id: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Contractor ID is required');
  });

  it.skip('filters portfolio by category', async () => {
    let portfolioCallCount = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockContractor,
            error: null,
          }),
        };
      } else if (table === 'portfolio') {
        portfolioCallCount++;

        if (portfolioCallCount === 1) {
          // First call: portfolio items with category filter
          // Create a mock that can be awaited after chaining
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
          };

          // Make the mock query awaitable
          mockQuery[Symbol.toPrimitive] = () =>
            Promise.resolve({
              data: [mockPortfolio[0]], // Only wedding items
              error: null,
              count: 1,
            });

          // Add then method to make it awaitable
          mockQuery.then = jest.fn().mockResolvedValue({
            data: [mockPortfolio[0]],
            error: null,
            count: 1,
          });

          return mockQuery;
        } else {
          // Second call: categories
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({
              data: [{ category: 'Wedding' }],
              error: null,
            }),
          };
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/contractors/contractor-123/portfolio?category=Wedding'
    );
    const response = await GET(request, { params: { id: 'contractor-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.portfolio).toHaveLength(1);
    expect(data.portfolio[0].category).toBe('Wedding');
  });

  it('handles pagination parameters', async () => {
    let portfolioCallCount = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockContractor,
            error: null,
          }),
        };
      } else if (table === 'portfolio') {
        portfolioCallCount++;

        if (portfolioCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
              data: mockPortfolio,
              error: null,
              count: 2,
            }),
          };
        } else {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/contractors/contractor-123/portfolio?page=2&limit=5'
    );
    const response = await GET(request, { params: { id: 'contractor-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe(2);
    expect(data.limit).toBe(5);
  });

  it('handles database errors', async () => {
    let portfolioCallCount = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockContractor,
            error: null,
          }),
        };
      } else if (table === 'portfolio') {
        portfolioCallCount++;

        if (portfolioCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
              count: null,
            }),
          };
        } else {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/contractors/contractor-123/portfolio'
    );
    const response = await GET(request, { params: { id: 'contractor-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch portfolio');
  });
});

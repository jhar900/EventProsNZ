import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PortfolioGallery } from '@/components/features/contractors/profile/PortfolioGallery';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock fetch
global.fetch = jest.fn();

const mockPortfolioItems = [
  {
    id: '1',
    title: 'Wedding Photography',
    description: 'Beautiful wedding ceremony',
    imageUrl: 'https://example.com/image1.jpg',
    eventDate: '2024-01-15',
    category: 'Wedding',
    createdAt: '2024-01-16T10:00:00Z',
  },
  {
    id: '2',
    title: 'Corporate Event',
    description: 'Annual company conference',
    imageUrl: 'https://example.com/image2.jpg',
    eventDate: '2024-02-20',
    category: 'Corporate',
    createdAt: '2024-02-21T10:00:00Z',
  },
];

// Test wrapper with QueryClient
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('PortfolioGallery', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders portfolio items correctly', async () => {
    const mockResponse = {
      portfolio: mockPortfolioItems,
      total: 2,
      page: 1,
      limit: 12,
      totalPages: 1,
      categories: ['Wedding', 'Corporate'],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <TestWrapper>
        <PortfolioGallery
          contractorId="test-contractor-id"
          initialPortfolio={mockPortfolioItems}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
    });

    expect(screen.getByText('Corporate Event')).toBeInTheDocument();
    expect(screen.getByText('Beautiful wedding ceremony')).toBeInTheDocument();
    expect(screen.getByText('Annual company conference')).toBeInTheDocument();
  });

  it('displays category filters when categories are available', async () => {
    const mockResponse = {
      portfolio: mockPortfolioItems,
      total: 2,
      page: 1,
      limit: 12,
      totalPages: 1,
      categories: ['Wedding', 'Corporate'],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <TestWrapper>
        <PortfolioGallery
          contractorId="test-contractor-id"
          initialPortfolio={mockPortfolioItems}
        />
      </TestWrapper>
    );

    // Wait for the component to load and show categories
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    // Use getAllByText to handle multiple elements with same text
    expect(screen.getAllByText('Wedding')).toHaveLength(2); // Filter button + category badge
    expect(screen.getAllByText('Corporate')).toHaveLength(2); // Filter button + category badge
  });

  it('opens lightbox when portfolio item is clicked', async () => {
    const mockResponse = {
      portfolio: mockPortfolioItems,
      total: 2,
      page: 1,
      limit: 12,
      totalPages: 1,
      categories: ['Wedding', 'Corporate'],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <TestWrapper>
        <PortfolioGallery
          contractorId="test-contractor-id"
          initialPortfolio={mockPortfolioItems}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
    });

    const portfolioItem = screen
      .getByText('Wedding Photography')
      .closest('.group');
    fireEvent.click(portfolioItem!);

    // Check for lightbox-specific content (Share button indicates lightbox is open)
    expect(screen.getByText('Share')).toBeInTheDocument();
    // Use getAllByText to handle multiple elements with same text
    expect(screen.getAllByText('Beautiful wedding ceremony')).toHaveLength(2); // Grid item + lightbox
  });

  it('handles empty portfolio state', async () => {
    const mockResponse = {
      portfolio: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
      categories: [],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <TestWrapper>
        <PortfolioGallery
          contractorId="test-contractor-id"
          initialPortfolio={[]}
        />
      </TestWrapper>
    );

    // Wait for the component to load and show empty state
    await waitFor(() => {
      expect(screen.getByText('No Portfolio Items')).toBeInTheDocument();
    });

    expect(
      screen.getByText("This contractor hasn't added any portfolio items yet.")
    ).toBeInTheDocument();
  });

  it('loads more portfolio items when load more button is clicked', async () => {
    // Mock initial load response
    const initialResponse = {
      portfolio: mockPortfolioItems,
      total: 3,
      page: 1,
      limit: 12,
      totalPages: 2, // This will show the Load More button
      categories: ['Wedding', 'Corporate'],
    };

    // Mock load more response
    const loadMoreResponse = {
      portfolio: [
        {
          id: '3',
          title: 'Birthday Party',
          description: 'Fun birthday celebration',
          imageUrl: 'https://example.com/image3.jpg',
          eventDate: '2024-03-10',
          category: 'Birthday',
          createdAt: '2024-03-11T10:00:00Z',
        },
      ],
      total: 3,
      page: 2,
      limit: 12,
      totalPages: 2,
      categories: ['Wedding', 'Corporate', 'Birthday'],
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => loadMoreResponse,
      });

    render(
      <TestWrapper>
        <PortfolioGallery
          contractorId="test-contractor-id"
          initialPortfolio={mockPortfolioItems}
        />
      </TestWrapper>
    );

    // Wait for the component to render and show the load more button
    await waitFor(() => {
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/contractors/test-contractor-id/portfolio')
      );
    });
  });

  it('filters portfolio items by category', async () => {
    // Mock initial load response
    const initialResponse = {
      portfolio: mockPortfolioItems,
      total: 2,
      page: 1,
      limit: 12,
      totalPages: 1,
      categories: ['Wedding', 'Corporate'],
    };

    // Mock filtered response
    const filteredResponse = {
      portfolio: [mockPortfolioItems[0]], // Only wedding items
      total: 1,
      page: 1,
      limit: 12,
      totalPages: 1,
      categories: ['Wedding', 'Corporate'],
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => filteredResponse,
      });

    render(
      <TestWrapper>
        <PortfolioGallery
          contractorId="test-contractor-id"
          initialPortfolio={mockPortfolioItems}
        />
      </TestWrapper>
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getAllByText('Wedding')).toHaveLength(2); // Filter button + category badge
    });

    // Get the filter button specifically (not the category badge)
    const weddingFilter = screen
      .getAllByText('Wedding')
      .find(element => element.tagName === 'BUTTON');
    expect(weddingFilter).toBeInTheDocument();
    fireEvent.click(weddingFilter!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=Wedding')
      );
    });
  });

  it('handles keyboard navigation in lightbox', async () => {
    const mockResponse = {
      portfolio: mockPortfolioItems,
      total: 2,
      page: 1,
      limit: 12,
      totalPages: 1,
      categories: ['Wedding', 'Corporate'],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <TestWrapper>
        <PortfolioGallery
          contractorId="test-contractor-id"
          initialPortfolio={mockPortfolioItems}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
    });

    const portfolioItem = screen
      .getByText('Wedding Photography')
      .closest('.group');
    fireEvent.click(portfolioItem!);

    // Test escape key
    fireEvent.keyDown(document, { key: 'Escape' });

    // Lightbox should be closed - check for the lightbox content specifically
    expect(screen.queryByText('Wedding Photography')).toBeInTheDocument(); // This is still in the grid
    // The lightbox content should be gone
    expect(screen.queryByText('Share')).not.toBeInTheDocument();
  });

  it('handles share functionality', async () => {
    // Mock navigator.share
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
    });

    const mockResponse = {
      portfolio: mockPortfolioItems,
      total: 2,
      page: 1,
      limit: 12,
      totalPages: 1,
      categories: ['Wedding', 'Corporate'],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <TestWrapper>
        <PortfolioGallery
          contractorId="test-contractor-id"
          initialPortfolio={mockPortfolioItems}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
    });

    const portfolioItem = screen
      .getByText('Wedding Photography')
      .closest('.group');
    fireEvent.click(portfolioItem!);

    const shareButton = screen.getByText('Share');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Wedding Photography',
        text: 'Beautiful wedding ceremony',
        url: 'https://example.com/image1.jpg',
      });
    });
  });
});

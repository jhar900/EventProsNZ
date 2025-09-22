import { renderHook, act, waitFor } from '@testing-library/react';
import { useContractors } from '@/hooks/useContractors';
import { ContractorDirectoryService } from '@/lib/contractors/directory-service';

// Mock the ContractorDirectoryService
jest.mock('@/lib/contractors/directory-service');
const mockContractorDirectoryService =
  ContractorDirectoryService as jest.Mocked<typeof ContractorDirectoryService>;

describe('useContractors', () => {
  const mockContractors = [
    {
      id: '1',
      name: 'John Doe',
      companyName: 'Event Solutions Ltd',
      description: 'Professional event planning services',
      location: 'Auckland',
      avatarUrl: null,
      serviceCategories: ['planning'],
      averageRating: 4.5,
      reviewCount: 12,
      isVerified: true,
      subscriptionTier: 'professional' as const,
      isPremium: true,
      email: 'john@eventsolutions.co.nz',
      bio: null,
      website: null,
      phone: null,
      address: null,
      timezone: 'Pacific/Auckland',
      businessAddress: null,
      nzbn: null,
      serviceAreas: [],
      socialLinks: null,
      verificationDate: null,
      services: [],
      portfolio: [],
      testimonials: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockResponse = {
    contractors: mockContractors,
    total: 1,
    page: 1,
    limit: 12,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContractorDirectoryService.getContractors.mockResolvedValue(
      mockResponse
    );
    mockContractorDirectoryService.searchContractors.mockResolvedValue(
      mockResponse
    );
    mockContractorDirectoryService.getFeaturedContractors.mockResolvedValue({
      contractors: mockContractors,
      total: 1,
    });
    mockContractorDirectoryService.getContractorDetails.mockResolvedValue({
      contractor: mockContractors[0],
    });
  });

  it('initializes with default state and fetches data on mount', async () => {
    const { result } = renderHook(() => useContractors());

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.contractors).toEqual(mockContractors);
    });

    // After mount, contractors should be populated from the mock
    expect(result.current.contractors).toEqual(mockContractors);
    expect(result.current.featuredContractors).toEqual(mockContractors);
    expect(result.current.currentContractor).toBeNull();
    expect(result.current.filters).toEqual({});
    expect(result.current.pagination).toEqual({
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });
    expect(result.current.viewMode).toBe('grid');
    expect(result.current.isLoading).toBe(false); // Should be false after initial fetch
    expect(result.current.error).toBeNull();
  });

  it('fetches contractors on mount', async () => {
    const { result } = renderHook(() => useContractors());

    await waitFor(() => {
      expect(
        mockContractorDirectoryService.getContractors
      ).toHaveBeenCalledWith({}, 1, 12, 'premium_first');
    });
  });

  it('fetches featured contractors on mount', async () => {
    const { result } = renderHook(() => useContractors());

    await waitFor(() => {
      expect(
        mockContractorDirectoryService.getFeaturedContractors
      ).toHaveBeenCalledWith(6);
    });
  });

  it('updates contractors when fetchContractors is called', async () => {
    const { result } = renderHook(() => useContractors());

    await act(async () => {
      await result.current.fetchContractors();
    });

    expect(result.current.contractors).toEqual(mockContractors);
    expect(result.current.pagination).toEqual({
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });
  });

  it('appends contractors when loading more', async () => {
    // Mock response with multiple pages for initial load
    const mockResponseWithPages = {
      contractors: [mockContractors[0]],
      total: 2,
      page: 1,
      limit: 12,
      totalPages: 2,
    };

    const mockResponsePage2 = {
      contractors: [mockContractors[0]], // Same contractor for simplicity
      total: 2,
      page: 2,
      limit: 12,
      totalPages: 2,
    };

    mockContractorDirectoryService.getContractors
      .mockResolvedValueOnce(mockResponseWithPages) // First call (mount)
      .mockResolvedValueOnce(mockResponsePage2); // Second call (loadMore)

    const { result } = renderHook(() => useContractors());

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.contractors).toEqual([mockContractors[0]]);
    });

    // Load more
    await act(async () => {
      await result.current.loadMore();
    });

    expect(mockContractorDirectoryService.getContractors).toHaveBeenCalledTimes(
      2
    );
    expect(
      mockContractorDirectoryService.getContractors
    ).toHaveBeenLastCalledWith({}, 2, 12, 'premium_first');
  });

  it('searches contractors when searchContractors is called', async () => {
    const { result } = renderHook(() => useContractors());

    const filters = { q: 'event' };
    await act(async () => {
      await result.current.searchContractors(filters);
    });

    expect(
      mockContractorDirectoryService.searchContractors
    ).toHaveBeenCalledWith(filters, 1, 12);
    expect(result.current.contractors).toEqual(mockContractors);
  });

  it('fetches contractor details', async () => {
    const { result } = renderHook(() => useContractors());

    await act(async () => {
      await result.current.fetchContractorDetails('1');
    });

    expect(
      mockContractorDirectoryService.getContractorDetails
    ).toHaveBeenCalledWith('1');
    expect(result.current.currentContractor).toEqual(mockContractors[0]);
  });

  it('updates view mode', () => {
    const { result } = renderHook(() => useContractors());

    act(() => {
      result.current.setViewMode('list');
    });

    expect(result.current.viewMode).toBe('list');
  });

  it('updates filters and resets pagination', () => {
    const { result } = renderHook(() => useContractors());

    act(() => {
      result.current.updateFilters({ serviceType: 'photography' });
    });

    expect(result.current.filters).toEqual({ serviceType: 'photography' });
    expect(result.current.pagination.page).toBe(1);
  });

  it('handles errors gracefully', async () => {
    const errorMessage = 'Failed to fetch contractors';
    mockContractorDirectoryService.getContractors.mockRejectedValueOnce(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useContractors());

    await act(async () => {
      await result.current.fetchContractors();
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
  });

  it('clears error when clearError is called', async () => {
    const { result } = renderHook(() => useContractors());

    // Set an error
    await act(async () => {
      await result.current.fetchContractors();
    });

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('resets state when reset is called', async () => {
    const { result } = renderHook(() => useContractors());

    // Set some state
    await act(async () => {
      await result.current.fetchContractors();
    });

    act(() => {
      result.current.setViewMode('list');
      result.current.updateFilters({ serviceType: 'photography' });
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.contractors).toEqual([]);
    expect(result.current.currentContractor).toBeNull();
    expect(result.current.filters).toEqual({});
    expect(result.current.pagination).toEqual({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
    });
    expect(result.current.error).toBeNull();
  });

  it('does not load more when already at last page', async () => {
    const { result } = renderHook(() => useContractors());

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.contractors).toEqual(mockContractors);
    });

    // Try to load more (should not call again since we're at last page)
    await act(async () => {
      await result.current.loadMore();
    });

    // Should not call getContractors again (only the initial call)
    expect(mockContractorDirectoryService.getContractors).toHaveBeenCalledTimes(
      1
    );
  });

  it('does not load more when already loading', async () => {
    const { result } = renderHook(() => useContractors());

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.contractors).toEqual(mockContractors);
    });

    // Start another fetch (this will set loading to true)
    act(() => {
      result.current.fetchContractors();
    });

    // Try to load more while loading
    await act(async () => {
      await result.current.loadMore();
    });

    // Should not call getContractors again (only the initial call and the manual fetch)
    expect(mockContractorDirectoryService.getContractors).toHaveBeenCalledTimes(
      2
    );
  });
});

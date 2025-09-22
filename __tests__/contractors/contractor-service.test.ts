import { ContractorDirectoryService } from '@/lib/contractors/directory-service';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ContractorDirectoryService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getContractors', () => {
    it('fetches contractors with default parameters', async () => {
      const mockResponse = {
        contractors: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await ContractorDirectoryService.getContractors();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/contractors?page=1&limit=12&sort=premium_first'
      );
      expect(result).toEqual(mockResponse);
    });

    it('fetches contractors with custom parameters', async () => {
      const mockResponse = {
        contractors: [],
        total: 0,
        page: 2,
        limit: 24,
        totalPages: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const filters = { serviceType: 'photography' };
      const result = await ContractorDirectoryService.getContractors(
        filters,
        2,
        24,
        'rating'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/contractors?page=2&limit=24&sort=rating&serviceType=photography'
      );
      expect(result).toEqual(mockResponse);
    });

    it('handles fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(ContractorDirectoryService.getContractors()).rejects.toThrow(
        'Failed to fetch contractors: Internal Server Error'
      );
    });
  });

  describe('searchContractors', () => {
    it('searches contractors with filters', async () => {
      const mockResponse = {
        contractors: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
        searchQuery: { q: 'event' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const filters = { q: 'event', serviceType: 'planning' };
      const result =
        await ContractorDirectoryService.searchContractors(filters);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/contractors/search?page=1&limit=12&q=event&serviceType=planning'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFeaturedContractors', () => {
    it('fetches featured contractors', async () => {
      const mockResponse = {
        contractors: [],
        total: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await ContractorDirectoryService.getFeaturedContractors(6);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/contractors/featured?limit=6'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getContractorDetails', () => {
    it('fetches contractor details', async () => {
      const mockResponse = {
        contractor: {
          id: '1',
          name: 'John Doe',
          companyName: 'Event Solutions Ltd',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await ContractorDirectoryService.getContractorDetails('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/contractors/1');
      expect(result).toEqual(mockResponse);
    });

    it('handles 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(
        ContractorDirectoryService.getContractorDetails('1')
      ).rejects.toThrow('Contractor not found');
    });
  });

  describe('formatPriceRange', () => {
    it('formats price range with both min and max', () => {
      expect(ContractorDirectoryService.formatPriceRange(1000, 5000)).toBe(
        '$1000 - $5000'
      );
    });

    it('formats price range with only min', () => {
      expect(ContractorDirectoryService.formatPriceRange(1000, null)).toBe(
        'From $1000'
      );
    });

    it('formats price range with only max', () => {
      expect(ContractorDirectoryService.formatPriceRange(null, 5000)).toBe(
        'Up to $5000'
      );
    });

    it('formats equal min and max', () => {
      expect(ContractorDirectoryService.formatPriceRange(1000, 1000)).toBe(
        '$1000'
      );
    });

    it('handles no pricing', () => {
      expect(ContractorDirectoryService.formatPriceRange(null, null)).toBe(
        'Contact for pricing'
      );
    });
  });

  describe('formatRating', () => {
    it('formats rating to one decimal place', () => {
      expect(ContractorDirectoryService.formatRating(4.567)).toBe('4.6');
    });
  });

  describe('getServiceCategoryDisplayName', () => {
    it('returns formatted category name', () => {
      expect(
        ContractorDirectoryService.getServiceCategoryDisplayName('catering')
      ).toBe('Catering');
      expect(
        ContractorDirectoryService.getServiceCategoryDisplayName('photography')
      ).toBe('Photography');
    });

    it('returns original name for unknown categories', () => {
      expect(
        ContractorDirectoryService.getServiceCategoryDisplayName('unknown')
      ).toBe('unknown');
    });
  });

  describe('isPremium', () => {
    it('returns true for premium contractors', () => {
      const contractor = {
        subscriptionTier: 'professional',
      } as any;

      expect(ContractorDirectoryService.isPremium(contractor)).toBe(true);
    });

    it('returns false for essential contractors', () => {
      const contractor = {
        subscriptionTier: 'essential',
      } as any;

      expect(ContractorDirectoryService.isPremium(contractor)).toBe(false);
    });
  });

  describe('getDisplayName', () => {
    it('returns company name when available', () => {
      const contractor = {
        companyName: 'Event Solutions Ltd',
        name: 'John Doe',
      } as any;

      expect(ContractorDirectoryService.getDisplayName(contractor)).toBe(
        'Event Solutions Ltd'
      );
    });

    it('returns name when no company name', () => {
      const contractor = {
        companyName: null,
        name: 'John Doe',
      } as any;

      expect(ContractorDirectoryService.getDisplayName(contractor)).toBe(
        'John Doe'
      );
    });
  });

  describe('getLocationDisplay', () => {
    it('returns business location when available', () => {
      const contractor = {
        location: 'Auckland',
        businessAddress: '123 Queen Street, Auckland',
      } as any;

      expect(ContractorDirectoryService.getLocationDisplay(contractor)).toBe(
        'Auckland'
      );
    });

    it('returns business address when no location', () => {
      const contractor = {
        location: null,
        businessAddress: '123 Queen Street, Auckland',
      } as any;

      expect(ContractorDirectoryService.getLocationDisplay(contractor)).toBe(
        '123 Queen Street, Auckland'
      );
    });

    it('returns default message when no location info', () => {
      const contractor = {
        location: null,
        businessAddress: null,
      } as any;

      expect(ContractorDirectoryService.getLocationDisplay(contractor)).toBe(
        'Location not specified'
      );
    });
  });
});

import {
  Contractor,
  ContractorFilters,
  ContractorDirectoryResponse,
  ContractorDetailsResponse,
  ContractorServicesResponse,
  ContractorReviewsResponse,
} from '@/types/contractors';

const API_BASE_URL = '/api/contractors';

// Profile caching configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const profileCache = new Map<string, { data: any; timestamp: number }>();

// Cache management utilities
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

function getCachedProfile(id: string): any | null {
  const cached = profileCache.get(id);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  // Remove expired cache entry
  if (cached) {
    profileCache.delete(id);
  }
  return null;
}

function setCachedProfile(id: string, data: any): void {
  profileCache.set(id, { data, timestamp: Date.now() });
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of profileCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      profileCache.delete(key);
    }
  }
}, CACHE_TTL);

export class ContractorDirectoryService {
  /**
   * Convert ContractorFilters to search API parameters
   */
  private static convertFiltersToSearchParams(
    filters: ContractorFilters
  ): Record<string, string> {
    const params: Record<string, string> = {};

    if (filters.q) {
      params.q = filters.q;
    }

    // Convert serviceType to service_types parameter
    // serviceType is a single string, but API expects comma-separated list
    if (filters.serviceType) {
      params.service_types = filters.serviceType; // API will split this
    }

    if (filters.location) {
      params.location = filters.location;
    }

    // Price, rating, and premium filters removed per user request

    return params;
  }

  /**
   * Fetch contractors with optional filters and pagination
   * If filters are present, uses the search endpoint
   */
  static async getContractors(
    filters: ContractorFilters = {},
    page: number = 1,
    limit: number = 12,
    sort: string = 'premium_first'
  ): Promise<ContractorDirectoryResponse> {
    // Check if we have any filters - if so, use search endpoint
    const hasFilters = filters.q || filters.serviceType || filters.location;

    if (hasFilters) {
      // Use search endpoint when filters are present
      return this.searchContractors(filters, page, limit);
    }

    // No filters, use basic endpoint
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort,
    });

    const response = await fetch(`${API_BASE_URL}?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch contractors: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search contractors with filters
   */
  static async searchContractors(
    filters: ContractorFilters = {},
    page: number = 1,
    limit: number = 12
  ): Promise<ContractorDirectoryResponse> {
    // Convert filter names to match search API expectations
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...this.convertFiltersToSearchParams(filters),
    });

    const response = await fetch(`${API_BASE_URL}/search?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Failed to search contractors: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch featured contractors
   */
  static async getFeaturedContractors(
    limit: number = 6
  ): Promise<{ contractors: Contractor[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/featured?limit=${limit}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch featured contractors: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Fetch contractor details by ID with caching
   */
  static async getContractorDetails(
    id: string
  ): Promise<ContractorDetailsResponse> {
    // Check cache first
    const cached = getCachedProfile(id);
    if (cached) {
      return cached;
    }

    const response = await fetch(`${API_BASE_URL}/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Contractor not found');
      }
      throw new Error(
        `Failed to fetch contractor details: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Cache the result
    setCachedProfile(id, data);

    return data;
  }

  /**
   * Fetch contractor services by ID
   */
  static async getContractorServices(
    id: string
  ): Promise<ContractorServicesResponse> {
    const response = await fetch(`${API_BASE_URL}/${id}/services`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch contractor services: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Fetch contractor reviews by ID
   */
  static async getContractorReviews(
    id: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ContractorReviewsResponse> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/${id}/reviews?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch contractor reviews: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Format price range for display
   */
  static formatPriceRange(
    priceMin: number | null,
    priceMax: number | null
  ): string {
    if (priceMin === null && priceMax === null) {
      return 'Contact for pricing';
    }

    if (priceMin === null) {
      return `Up to $${priceMax}`;
    }

    if (priceMax === null) {
      return `From $${priceMin}`;
    }

    if (priceMin === priceMax) {
      return `$${priceMin}`;
    }

    return `$${priceMin} - $${priceMax}`;
  }

  /**
   * Format rating for display
   */
  static formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  /**
   * Get service category display name
   */
  static getServiceCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      catering: 'Catering',
      photography: 'Photography',
      videography: 'Videography',
      music: 'Music & Entertainment',
      decorations: 'Decorations & Styling',
      venue: 'Venue & Location',
      planning: 'Event Planning',
      security: 'Security',
      transportation: 'Transportation',
      flowers: 'Flowers & Floral',
      lighting: 'Lighting & Sound',
      other: 'Other Services',
    };

    return categoryMap[category.toLowerCase()] || category;
  }

  /**
   * Check if contractor is premium
   */
  static isPremium(contractor: Contractor): boolean {
    return ['professional', 'enterprise'].includes(contractor.subscriptionTier);
  }

  /**
   * Get contractor display name
   */
  static getDisplayName(contractor: Contractor): string {
    return contractor.companyName || contractor.name;
  }

  /**
   * Get contractor location display (city only)
   */
  static getLocationDisplay(contractor: Contractor): string {
    const location = contractor.location || contractor.businessAddress || '';

    if (!location) {
      return 'Location not specified';
    }

    // Extract city from location string
    // New Zealand addresses are often:
    // - "Street, Suburb, City 1234, New Zealand"
    // - "Street, City, Region"
    // - "City, Region"
    // - "City"
    const parts = location.split(',').map(p => p.trim());

    if (parts.length === 1) {
      // Single part - might be just city or city with postal code
      const singlePart = parts[0];
      // Remove postal code (numbers) if present
      return singlePart.replace(/\s*\d{4,6}\s*$/, '').trim();
    } else if (parts.length === 2) {
      // "City, Region" format - return the first part (city)
      const cityPart = parts[0];
      // Remove postal code if present
      return cityPart.replace(/\s*\d{4,6}\s*$/, '').trim();
    } else {
      // Multiple parts format - find the city (usually 2nd or 3rd part)
      // Common format: "Street, Suburb, City 1234, Country"
      // City is typically the second-to-last part (before country) or third-to-last
      let cityPart = '';

      if (parts.length >= 3) {
        // For "Street, Suburb, City 1234, New Zealand" format
        // Try second-to-last part first (before "New Zealand")
        if (parts[parts.length - 1].toLowerCase().includes('zealand')) {
          cityPart = parts[parts.length - 2];
        } else {
          // Otherwise, try third-to-last part
          cityPart = parts[parts.length - 2] || parts[1] || parts[0];
        }
      } else {
        cityPart = parts[parts.length - 2] || parts[0];
      }

      // Remove postal code (numbers) if present in city name
      return cityPart.replace(/\s*\d{4,6}\s*$/, '').trim();
    }
  }

  /**
   * Invalidate cache for a specific contractor
   */
  static invalidateCache(id: string): void {
    profileCache.delete(id);
  }

  /**
   * Clear all cached profiles
   */
  static clearCache(): void {
    profileCache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: profileCache.size,
      entries: Array.from(profileCache.keys()),
    };
  }
}

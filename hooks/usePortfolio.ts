import { useQuery } from '@tanstack/react-query';

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoPlatform?: string;
  eventDate?: string;
  category?: string;
  createdAt: string;
}

interface PortfolioResponse {
  portfolio: PortfolioItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: string[];
}

interface PortfolioFilters {
  page?: number;
  limit?: number;
  category?: string;
}

async function fetchPortfolio(
  contractorId: string,
  filters: PortfolioFilters = {}
): Promise<PortfolioResponse> {
  const params = new URLSearchParams({
    page: (filters.page || 1).toString(),
    limit: (filters.limit || 12).toString(),
  });

  if (filters.category) {
    params.append('category', filters.category);
  }

  const response = await fetch(
    `/api/contractors/${contractorId}/portfolio?${params}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function usePortfolio(
  contractorId: string,
  filters: PortfolioFilters = {}
) {
  return useQuery({
    queryKey: ['portfolio', contractorId, filters],
    queryFn: () => fetchPortfolio(contractorId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!contractorId,
  });
}

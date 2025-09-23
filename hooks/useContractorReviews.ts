import { useQuery } from '@tanstack/react-query';

interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment?: string;
  eventTitle?: string;
  eventDate?: string;
  isVerified: boolean;
  createdAt: string;
}

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  averageRating: number;
  ratingDistribution: Array<{ rating: number; count: number }>;
  totalPages: number;
}

interface ReviewsFilters {
  page?: number;
  limit?: number;
  rating?: string;
}

async function fetchContractorReviews(
  contractorId: string,
  filters: ReviewsFilters = {}
): Promise<ReviewsResponse> {
  const params = new URLSearchParams({
    page: (filters.page || 1).toString(),
    limit: (filters.limit || 10).toString(),
  });

  if (filters.rating) {
    params.append('rating', filters.rating);
  }

  const response = await fetch(
    `/api/contractors/${contractorId}/reviews?${params}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function useContractorReviews(
  contractorId: string,
  filters: ReviewsFilters = {}
) {
  return useQuery({
    queryKey: ['contractor-reviews', contractorId, filters],
    queryFn: () => fetchContractorReviews(contractorId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - reviews change more frequently
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!contractorId,
  });
}

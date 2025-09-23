import { useQuery } from '@tanstack/react-query';

interface Service {
  id: string;
  serviceType: string;
  description?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  availability?: string;
  isVisible: boolean;
  createdAt: string;
}

interface ServicesResponse {
  services: Service[];
}

async function fetchContractorServices(
  contractorId: string
): Promise<ServicesResponse> {
  const response = await fetch(`/api/contractors/${contractorId}/services`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function useContractorServices(contractorId: string) {
  return useQuery({
    queryKey: ['contractor-services', contractorId],
    queryFn: () => fetchContractorServices(contractorId),
    staleTime: 15 * 60 * 1000, // 15 minutes - services change less frequently
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!contractorId,
  });
}

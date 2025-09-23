import { useQuery } from '@tanstack/react-query';

interface VerificationBadge {
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
}

interface VerificationStatus {
  isVerified: boolean;
  verificationDate?: string;
  badges: VerificationBadge[];
  metrics: {
    portfolioCount: number;
    reviewCount: number;
    serviceCount: number;
    accountAge: number;
  };
}

interface VerificationResponse {
  verificationStatus: VerificationStatus;
}

async function fetchContractorVerification(
  contractorId: string
): Promise<VerificationResponse> {
  const response = await fetch(`/api/contractors/${contractorId}/verification`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function useContractorVerification(contractorId: string) {
  return useQuery({
    queryKey: ['contractor-verification', contractorId],
    queryFn: () => fetchContractorVerification(contractorId),
    staleTime: 30 * 60 * 1000, // 30 minutes - verification data changes very rarely
    cacheTime: 60 * 60 * 1000, // 1 hour
    enabled: !!contractorId,
  });
}

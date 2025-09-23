import { useQuery } from '@tanstack/react-query';

interface ContractorProfileData {
  contractor: any;
  profile: any;
  businessProfile: any;
  verificationStatus: any;
}

async function fetchContractorProfile(
  contractorId: string
): Promise<ContractorProfileData> {
  const response = await fetch(`/api/contractors/${contractorId}/profile`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function useContractorProfile(contractorId: string) {
  return useQuery({
    queryKey: ['contractor-profile', contractorId],
    queryFn: () => fetchContractorProfile(contractorId),
    staleTime: 10 * 60 * 1000, // 10 minutes - profile data changes less frequently
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!contractorId,
  });
}

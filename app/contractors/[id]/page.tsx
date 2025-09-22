import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContractorDetails } from '@/components/features/contractors/ContractorDetails';
import { ContractorDirectoryService } from '@/lib/contractors/directory-service';

interface ContractorPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ContractorPageProps): Promise<Metadata> {
  try {
    const response = await ContractorDirectoryService.getContractorDetails(
      params.id
    );
    const contractor = response.contractor;
    const displayName = ContractorDirectoryService.getDisplayName(contractor);

    return {
      title: `${displayName} | Contractor Profile | EventPros NZ`,
      description:
        contractor.description ||
        `Professional event services by ${displayName}. ${contractor.serviceCategories.join(', ')} services available.`,
      keywords: `${contractor.serviceCategories.join(', ')}, ${displayName}, event services, contractor, ${contractor.location}`,
      openGraph: {
        title: `${displayName} | Contractor Profile`,
        description:
          contractor.description ||
          `Professional event services by ${displayName}`,
        type: 'profile',
        images: contractor.avatarUrl
          ? [{ url: contractor.avatarUrl }]
          : undefined,
      },
    };
  } catch (error) {
    return {
      title: 'Contractor Not Found | EventPros NZ',
      description: 'The requested contractor profile could not be found.',
    };
  }
}

export default async function ContractorPage({ params }: ContractorPageProps) {
  try {
    const response = await ContractorDirectoryService.getContractorDetails(
      params.id
    );
    const contractor = response.contractor;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <ContractorDetails contractor={contractor} />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

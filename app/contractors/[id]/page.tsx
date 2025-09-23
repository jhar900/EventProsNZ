import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContractorProfile } from '@/components/features/contractors/profile/ContractorProfile';
import { ContractorDirectoryService } from '@/lib/contractors/directory-service';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Enable static generation with revalidation and caching
export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = 'force-dynamic'; // Ensure dynamic rendering for real-time data

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
          <ErrorBoundary
            fallback={
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Profile Unavailable
                </h1>
                <p className="text-gray-600 mb-6">
                  There was an error loading this contractor&apos;s profile.
                  Please try again later.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Refresh Page
                </button>
              </div>
            }
          >
            <ContractorProfile contractor={contractor} />
          </ErrorBoundary>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

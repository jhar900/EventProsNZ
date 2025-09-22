'use client';

import { Contractor } from '@/types/contractors';
import { ContractorCard } from './ContractorCard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ContractorListProps {
  contractors: Contractor[];
  viewMode?: 'grid' | 'list';
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ContractorList({
  contractors,
  viewMode = 'list',
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className = '',
}: ContractorListProps) {
  return (
    <div className={className}>
      <div className="space-y-4">
        {contractors.map(contractor => (
          <ContractorCard
            key={contractor.id}
            contractor={contractor}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            variant="outline"
            className="px-8 py-2"
          >
            {isLoading ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </div>
            ) : (
              'Load More Contractors'
            )}
          </Button>
        </div>
      )}

      {/* Loading State for Initial Load */}
      {isLoading && contractors.length === 0 && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  );
}

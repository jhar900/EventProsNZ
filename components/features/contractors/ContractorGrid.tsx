'use client';

import { Contractor } from '@/types/contractors';
import { ContractorCard } from './ContractorCard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ContractorGridProps {
  contractors: Contractor[];
  viewMode?: 'grid' | 'list';
  isFeatured?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ContractorGrid({
  contractors,
  viewMode = 'grid',
  isFeatured = false,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className = '',
}: ContractorGridProps) {
  const gridClasses = isFeatured
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-12'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-12';

  return (
    <div className={className}>
      <div className={gridClasses}>
        {contractors.map(contractor => (
          <ContractorCard
            key={contractor.id}
            contractor={contractor}
            viewMode={viewMode}
            isFeatured={isFeatured}
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

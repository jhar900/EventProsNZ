import { DashboardSkeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Dashboard Content Skeleton */}
        <DashboardSkeleton />
      </div>
    </DashboardLayout>
  );
}

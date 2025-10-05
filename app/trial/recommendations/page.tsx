import { Suspense } from 'react';
import { Metadata } from 'next';
import TrialRecommendations from '@/components/features/trial/TrialRecommendations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Trial Recommendations - EventProsNZ',
  description: 'Get personalized recommendations for your trial',
};

interface TrialRecommendationsPageProps {
  searchParams: {
    user_id?: string;
  };
}

export default function TrialRecommendationsPage({
  searchParams,
}: TrialRecommendationsPageProps) {
  const userId = searchParams.user_id || 'current-user'; // In a real app, this would come from auth

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Trial Recommendations
        </h1>
        <p className="text-gray-600">
          Get personalized recommendations to maximize your trial value
        </p>
      </div>

      <Suspense fallback={<TrialRecommendationsPageSkeleton />}>
        <TrialRecommendations userId={userId} />
      </Suspense>
    </div>
  );
}

function TrialRecommendationsPageSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <ul className="space-y-1">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-4 w-48" />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

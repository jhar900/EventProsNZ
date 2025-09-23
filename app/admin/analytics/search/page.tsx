import { Metadata } from 'next';
import SearchAnalyticsDashboard from '@/components/features/analytics/SearchAnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Search Analytics | EventProsNZ Admin',
  description: 'Monitor search performance and user behavior analytics',
};

export default function SearchAnalyticsPage() {
  return (
    <div className="container mx-auto py-6">
      <SearchAnalyticsDashboard />
    </div>
  );
}

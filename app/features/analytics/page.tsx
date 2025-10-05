import { Metadata } from 'next';
import { AdvancedAnalytics } from '@/components/features/premium/AdvancedAnalytics';

export const metadata: Metadata = {
  title: 'Advanced Analytics | EventPros NZ',
  description:
    'Detailed insights into your profile performance and business metrics.',
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get detailed insights into your profile performance and optimize your
          business.
        </p>
      </div>

      <AdvancedAnalytics />
    </div>
  );
}

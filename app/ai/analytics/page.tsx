'use client';

import { RecommendationAnalytics } from '@/components/features/ai/RecommendationAnalytics';

export default function AIAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor the performance and effectiveness of AI recommendations
          </p>
        </div>

        <RecommendationAnalytics
          eventType="wedding" // This would come from URL params or context
          onClose={() => {
            // Handle close - in a real app, this might navigate back
            }}
        />
      </div>
    </div>
  );
}

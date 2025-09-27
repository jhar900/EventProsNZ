'use client';

import { ServiceRecommendations } from '@/components/features/ai/ServiceRecommendations';

export default function AIRecommendationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Recommendations Hub
          </h1>
          <p className="text-gray-600">
            Discover intelligent service recommendations powered by machine
            learning
          </p>
        </div>

        <ServiceRecommendations
          eventType="corporate" // This would come from URL params or context
          eventData={{
            attendee_count: 50,
            budget: 8000,
            location: 'Wellington, New Zealand',
            event_date: '2024-07-20T09:00:00Z',
          }}
          onServiceSelect={service => {
            // Handle service selection
          }}
          onServiceRemove={serviceId => {
            // Handle service removal
          }}
          selectedServices={[]}
        />
      </div>
    </div>
  );
}

import { Metadata } from 'next';
import { ServiceRecommendations } from '@/components/features/ai/ServiceRecommendations';

export const metadata: Metadata = {
  title: 'AI Service Recommendations | Event Pros NZ',
  description:
    'Get intelligent service recommendations for your event using AI-powered suggestions.',
};

export default function ServiceRecommendationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Service Recommendations
          </h1>
          <p className="text-gray-600">
            Get intelligent suggestions for the services you need for your event
          </p>
        </div>

        <ServiceRecommendations
          eventType="wedding" // This would come from URL params or context
          eventData={{
            attendee_count: 100,
            budget: 15000,
            location: 'Auckland, New Zealand',
            event_date: '2024-06-15T18:00:00Z',
          }}
          onServiceSelect={service => {
            console.log('Service selected:', service);
            // Handle service selection
          }}
          onServiceRemove={serviceId => {
            console.log('Service removed:', serviceId);
            // Handle service removal
          }}
          selectedServices={[]}
        />
      </div>
    </div>
  );
}

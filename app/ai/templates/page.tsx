import { Metadata } from 'next';
import { ServiceTemplates } from '@/components/features/ai/ServiceTemplates';

export const metadata: Metadata = {
  title: 'Service Templates | Event Pros NZ',
  description: 'Browse and create service templates for your events.',
};

export default function ServiceTemplatesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Service Templates
          </h1>
          <p className="text-gray-600">
            Browse pre-configured service packages and create your own templates
          </p>
        </div>

        <ServiceTemplates
          eventType="wedding" // This would come from URL params or context
          onTemplateSelect={template => {
            console.log('Template selected:', template);
            // Handle template selection
          }}
          onTemplateCreate={template => {
            console.log('Template created:', template);
            // Handle template creation
          }}
        />
      </div>
    </div>
  );
}

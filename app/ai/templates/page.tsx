'use client';

import { ServiceTemplates } from '@/components/features/ai/ServiceTemplates';

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
            // Handle template selection
          }}
          onTemplateCreate={template => {
            // Handle template creation
          }}
        />
      </div>
    </div>
  );
}

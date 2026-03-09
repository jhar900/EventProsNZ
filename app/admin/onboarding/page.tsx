'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ContractorOnboardingPreview } from '@/components/features/admin/ContractorOnboardingPreview';
import { EventManagerOnboardingPreview } from '@/components/features/admin/EventManagerOnboardingPreview';
import { AlertTriangle } from 'lucide-react';

type OnboardingType = 'contractor' | 'event_manager';

export default function AdminOnboardingPage() {
  const [selected, setSelected] = useState<OnboardingType>('contractor');

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Onboarding Preview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Preview the onboarding experience as seen by users. No data is
            saved.
          </p>
        </div>

        {/* Preview banner */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Admin Preview Mode</span> — form
            submissions are intercepted and no data is saved to the database.
            Use the amber &ldquo;Skip&rdquo; bar below each form to advance
            without filling in required fields.
          </div>
        </div>

        {/* Toggle */}
        <div className="mb-8 inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setSelected('contractor')}
            className={`rounded-md px-5 py-2 text-sm font-medium transition-colors ${
              selected === 'contractor'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Contractor Onboarding
          </button>
          <button
            onClick={() => setSelected('event_manager')}
            className={`rounded-md px-5 py-2 text-sm font-medium transition-colors ${
              selected === 'event_manager'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Event Manager Onboarding
          </button>
        </div>

        {/* Preview */}
        {selected === 'contractor' ? (
          <ContractorOnboardingPreview />
        ) : (
          <EventManagerOnboardingPreview />
        )}
      </div>
    </DashboardLayout>
  );
}

import React from 'react';
import { ContractorMatching } from '@/components/features/matching/ContractorMatching';

interface ContractorsPageProps {
  searchParams: {
    eventId?: string;
  };
}

export default function ContractorsPage({
  searchParams,
}: ContractorsPageProps) {
  const eventId = searchParams.eventId;

  if (!eventId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Event ID Required
          </h1>
          <p className="text-muted-foreground">
            Please provide a valid event ID to view matching results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Contractor Matching Results</h1>
          <p className="text-muted-foreground">
            View and analyze contractor matches for your event
          </p>
        </div>

        <ContractorMatching eventId={eventId} />
      </div>
    </div>
  );
}

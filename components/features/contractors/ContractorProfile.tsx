'use client';

import React, { useState, useEffect } from 'react';
import { Contractor } from '@/types/contractors';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ContractorProfileDisplay } from './ContractorProfileDisplay';

interface ContractorProfileProps {
  contractorId: string;
}

export function ContractorProfile({ contractorId }: ContractorProfileProps) {
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractor = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/contractors/${contractorId}`);

        if (!response.ok) {
          throw new Error('Contractor not found');
        }

        const data = await response.json();
        setContractor(data.contractor);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load contractor'
        );
      } finally {
        setLoading(false);
      }
    };

    if (contractorId) {
      fetchContractor();
    }
  }, [contractorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">
          Loading contractor profile...
        </span>
      </div>
    );
  }

  if (error || !contractor) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Contractor Not Found
        </h3>
        <p className="text-gray-600 mb-4">
          {error || 'This contractor profile does not exist.'}
        </p>
        <Link href="/contractors">
          <Button>Back to Contractors</Button>
        </Link>
      </div>
    );
  }

  return <ContractorProfileDisplay contractor={contractor} isPreview={false} />;
}

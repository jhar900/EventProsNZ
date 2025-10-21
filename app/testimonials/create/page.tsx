'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TestimonialCreation } from '@/components/features/testimonials/TestimonialCreation';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

interface EligibilityCheck {
  eligible: boolean;
  inquiry_id?: string;
  contractor_name?: string;
  reason?: string;
}

export default function CreateTestimonialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractorId = searchParams.get('contractor_id');

  const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractorId) {
      checkEligibility();
    } else {
      setError('Contractor ID is required');
      setIsCheckingEligibility(false);
    }
  }, [contractorId]);

  const checkEligibility = async () => {
    try {
      setIsCheckingEligibility(true);
      const response = await fetch(
        `/api/testimonials/create/eligibility?contractor_id=${contractorId}`
      );

      if (!response.ok) {
        throw new Error('Failed to check eligibility');
      }

      const data = await response.json();
      setEligibility(data);
    } catch (err) {
      console.error('Error checking eligibility:', err);
      setError('Failed to check eligibility');
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleSuccess = () => {
    // Redirect to contractor profile or testimonials page
    router.push(`/contractors/${contractorId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isCheckingEligibility) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Checking eligibility...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !contractorId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p className="text-gray-600 mb-4">
                {error || 'Contractor ID is required'}
              </p>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Testimonial
            </h1>
            <p className="text-gray-600 mt-2">
              Share your experience with this contractor
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-lg font-semibold mb-2">
                  Cannot Create Testimonial
                </h3>
                <p className="text-gray-600 mb-4">{eligibility?.reason}</p>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Requirements
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1 text-left">
                    <li>• You must be an event manager</li>
                    <li>• You must have made an inquiry to this contractor</li>
                    <li>• The contractor must be verified</li>
                    <li>• The inquiry must have been responded to</li>
                  </ul>
                </div>
                <Button onClick={() => router.back()} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <div className="flex items-center space-x-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Create Testimonial
            </h1>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Eligible
            </Badge>
          </div>
          <p className="text-gray-600">
            Share your experience with {eligibility.contractor_name}
          </p>
        </div>

        <TestimonialCreation
          contractorId={contractorId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

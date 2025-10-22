'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JobForm } from '@/components/features/jobs/JobForm';
import { JobPreview } from '@/components/features/jobs/JobPreview';
import { JobFormData } from '@/types/jobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Edit } from 'lucide-react';

export default function CreateJobPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [jobData, setJobData] = useState<JobFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleFormSubmit = (data: JobFormData) => {
    setJobData(data);
    setStep('preview');
  };

  // Handle preview submission
  const handlePreviewSubmit = async () => {
    if (!jobData) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create job');
      }

      // Redirect to job details page
      router.push(`/jobs/${result.job.id}`);
    } catch (error) {
      console.error('Job creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit from preview
  const handleEdit = () => {
    setStep('form');
  };

  // Handle cancel
  const handleCancel = () => {
    router.push('/jobs');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {step === 'form' ? 'Create Job Posting' : 'Preview Job Posting'}
            </h1>
            <p className="text-gray-600 mt-2">
              {step === 'form'
                ? 'Fill out the form below to create your job posting'
                : 'Review your job posting before publishing'}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`flex items-center gap-2 ${
              step === 'form' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'form' ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Edit className="h-4 w-4" />
            </div>
            <span className="font-medium">Create</span>
          </div>
          <div className="flex-1 h-px bg-gray-200"></div>
          <div
            className={`flex items-center gap-2 ${
              step === 'preview' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'preview' ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Eye className="h-4 w-4" />
            </div>
            <span className="font-medium">Preview</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {step === 'form' ? (
        <JobForm onSuccess={handleFormSubmit} onCancel={handleCancel} />
      ) : (
        jobData && (
          <JobPreview
            jobData={jobData}
            onEdit={handleEdit}
            onSubmit={handlePreviewSubmit}
            isEditing={false}
          />
        )
      )}

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6">
            <CardContent className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Creating job posting...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

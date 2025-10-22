'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Job, JobApplicationFormData } from '@/types/jobs';
import { useApplicationLimits } from '@/hooks/useApplicationLimits';

interface BulkActionsProps {
  selectedJobs: Job[];
  onJobsSelect: (jobs: Job[]) => void;
  onBulkApply: (
    applications: Array<{ jobId: string; application: JobApplicationFormData }>
  ) => void;
  onClearSelection: () => void;
  className?: string;
}

interface SimilarJob {
  job: Job;
  similarity: number;
  reasons: string[];
}

export function BulkActions({
  selectedJobs,
  onJobsSelect,
  onBulkApply,
  onClearSelection,
  className = '',
}: BulkActionsProps) {
  const [similarJobs, setSimilarJobs] = useState<SimilarJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkApplicationData, setBulkApplicationData] =
    useState<JobApplicationFormData>({
      cover_letter: '',
      proposed_budget: undefined,
      availability_start_date: '',
      availability_end_date: '',
      attachments: [],
    });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);

  const { limits, canApply, getRemainingApplications } = useApplicationLimits();

  // Find similar jobs when selection changes
  useEffect(() => {
    if (selectedJobs.length > 0) {
      findSimilarJobs();
    } else {
      setSimilarJobs([]);
    }
  }, [selectedJobs]);

  const findSimilarJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/jobs/similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_ids: selectedJobs.map(job => job.id),
          limit: 10,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to find similar jobs');
      }

      const data = await response.json();

      if (data.success) {
        setSimilarJobs(data.similar_jobs || []);
      } else {
        throw new Error(data.error || 'Failed to find similar jobs');
      }
    } catch (error) {
      console.error('Error finding similar jobs:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to find similar jobs'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkApply = async () => {
    if (selectedJobs.length === 0) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Check if user can apply to all selected jobs
      const canApplyToAll = selectedJobs.every(job =>
        canApply(job.service_category)
      );

      if (!canApplyToAll) {
        setError(
          'You cannot apply to all selected jobs due to service category restrictions or application limits.'
        );
        return;
      }

      // Check application limits
      const remainingApplications = getRemainingApplications();
      if (
        remainingApplications !== -1 &&
        selectedJobs.length > remainingApplications
      ) {
        setError(
          `You can only apply to ${remainingApplications} more jobs this month.`
        );
        return;
      }

      // Prepare bulk applications
      const bulkApplications = selectedJobs.map(job => ({
        jobId: job.id,
        application: bulkApplicationData,
      }));

      onBulkApply(bulkApplications);
      setShowBulkForm(false);
      onClearSelection();
    } catch (error) {
      console.error('Error submitting bulk applications:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to submit bulk applications'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 80) return 'bg-green-100 text-green-800';
    if (similarity >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 80) return 'Very Similar';
    if (similarity >= 60) return 'Similar';
    return 'Somewhat Similar';
  };

  if (selectedJobs.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Selection Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''}{' '}
                selected
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-600 hover:text-gray-900"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowBulkForm(true)}
              disabled={!canApply(selectedJobs[0]?.service_category)}
            >
              <DocumentTextIcon className="h-4 w-4 mr-1" />
              Apply to All
            </Button>
          </div>
        </div>

        {/* Application Limits Warning */}
        {limits && (
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              Remaining applications:{' '}
              {getRemainingApplications() === -1
                ? 'Unlimited'
                : getRemainingApplications()}
            </div>
            {selectedJobs.length > getRemainingApplications() &&
              getRemainingApplications() !== -1 && (
                <Alert className="mt-2">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    You can only apply to {getRemainingApplications()} more jobs
                    this month.
                  </AlertDescription>
                </Alert>
              )}
          </div>
        )}
      </Card>

      {/* Similar Jobs */}
      {similarJobs.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Similar Jobs
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={findSimilarJobs}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                )}
                Find More
              </Button>
            </div>

            <div className="space-y-3">
              {similarJobs.map(similarJob => (
                <div
                  key={similarJob.job.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedJobs.some(
                        job => job.id === similarJob.job.id
                      )}
                      onCheckedChange={checked => {
                        if (checked) {
                          onJobsSelect([...selectedJobs, similarJob.job]);
                        } else {
                          onJobsSelect(
                            selectedJobs.filter(
                              job => job.id !== similarJob.job.id
                            )
                          );
                        }
                      }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {similarJob.job.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {similarJob.job.location}
                      </div>
                      <div className="text-xs text-gray-500">
                        {similarJob.reasons.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={getSimilarityColor(similarJob.similarity)}
                    >
                      {getSimilarityLabel(similarJob.similarity)}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {similarJob.similarity}% match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Bulk Application Form */}
      {showBulkForm && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Bulk Application
              </h3>
              <Button variant="ghost" onClick={() => setShowBulkForm(false)}>
                Cancel
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Cover Letter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Cover Letter (will be used for all applications)
              </label>
              <textarea
                value={bulkApplicationData.cover_letter}
                onChange={e =>
                  setBulkApplicationData(prev => ({
                    ...prev,
                    cover_letter: e.target.value,
                  }))
                }
                placeholder="Enter your cover letter. Use placeholders like {job_title}, {company_name}, etc."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
              />
              <p className="text-sm text-gray-500">
                Use placeholders like {'{job_title}'}, {'{company_name}'},{' '}
                {'{location}'} for dynamic content
              </p>
            </div>

            {/* Proposed Budget */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Proposed Budget (Optional)
              </label>
              <input
                type="number"
                value={bulkApplicationData.proposed_budget || ''}
                onChange={e =>
                  setBulkApplicationData(prev => ({
                    ...prev,
                    proposed_budget: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="Enter your proposed budget"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Availability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Available From
                </label>
                <input
                  type="date"
                  value={bulkApplicationData.availability_start_date || ''}
                  onChange={e =>
                    setBulkApplicationData(prev => ({
                      ...prev,
                      availability_start_date: e.target.value,
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Available Until
                </label>
                <input
                  type="date"
                  value={bulkApplicationData.availability_end_date || ''}
                  onChange={e =>
                    setBulkApplicationData(prev => ({
                      ...prev,
                      availability_end_date: e.target.value,
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowBulkForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkApply}
                disabled={isSubmitting || !bulkApplicationData.cover_letter}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  `Apply to ${selectedJobs.length} Jobs`
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

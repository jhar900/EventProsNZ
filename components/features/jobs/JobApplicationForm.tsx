'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PaperClipIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { JobApplicationFormData } from '@/types/jobs';

// Validation schema
const jobApplicationSchema = z.object({
  cover_letter: z
    .string()
    .min(50, 'Cover letter must be at least 50 characters')
    .max(2000, 'Cover letter must be less than 2000 characters'),
  proposed_budget: z
    .number()
    .min(0, 'Proposed budget must be positive')
    .optional(),
  availability_start_date: z.string().optional(),
  availability_end_date: z.string().optional(),
  attachments: z
    .array(z.string())
    .max(3, 'Maximum 3 attachments allowed')
    .optional(),
});

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  onSuccess?: (application: any) => void;
  onCancel?: () => void;
  onSaveDraft?: (draft: JobApplicationFormData) => void;
  initialData?: Partial<JobApplicationFormData>;
  isDraft?: boolean;
}

export function JobApplicationForm({
  jobId,
  jobTitle,
  onSuccess,
  onCancel,
  onSaveDraft,
  initialData,
  isDraft = false,
}: JobApplicationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<string[]>(
    initialData?.attachments || []
  );
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [applicationLimits, setApplicationLimits] = useState<{
    remaining: number;
    total: number;
    resetDate: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<JobApplicationFormData>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      cover_letter: initialData?.cover_letter || '',
      proposed_budget: initialData?.proposed_budget,
      availability_start_date: initialData?.availability_start_date,
      availability_end_date: initialData?.availability_end_date,
      attachments: attachments,
    },
  });

  const watchedCoverLetter = watch('cover_letter');
  const watchedProposedBudget = watch('proposed_budget');

  // Load application limits on mount
  useEffect(() => {
    loadApplicationLimits();
  }, []);

  const loadApplicationLimits = async () => {
    try {
      const response = await fetch('/api/contractors/application-limits');
      if (response.ok) {
        const data = await response.json();
        setApplicationLimits(data);
      }
    } catch (error) {
      console.error('Error loading application limits:', error);
    }
  };

  const onSubmit = async (data: JobApplicationFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/${jobId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          attachments,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit application');
      }

      onSuccess?.(result.application);
    } catch (error) {
      console.error('Job application submission error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to submit application'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const formData = {
        cover_letter: watchedCoverLetter,
        proposed_budget: watchedProposedBudget,
        availability_start_date: watch('availability_start_date'),
        availability_end_date: watch('availability_end_date'),
        attachments,
      };

      if (onSaveDraft) {
        onSaveDraft(formData);
      } else {
        // Save to localStorage as fallback
        localStorage.setItem(
          `job-application-draft-${jobId}`,
          JSON.stringify(formData)
        );
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (attachments.length >= 3) {
      setError('Maximum 3 attachments allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        'File type not supported. Allowed: PDF, JPG, PNG, GIF, DOC, DOCX'
      );
      return;
    }

    try {
      setUploadingFiles(prev => [...prev, file.name]);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/jobs/${jobId}/applications/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const result = await response.json();
      const newAttachments = [...attachments, result.url];
      setAttachments(newAttachments);
      setValue('attachments', newAttachments);
    } catch (error) {
      console.error('File upload error:', error);
      setError(error instanceof Error ? error.message : 'File upload failed');
    } finally {
      setUploadingFiles(prev => prev.filter(name => name !== file.name));
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    setValue('attachments', newAttachments);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(handleFileUpload);
    }
  };

  const getCharacterCount = () => {
    return watchedCoverLetter?.length || 0;
  };

  const getCharacterCountColor = () => {
    const count = getCharacterCount();
    if (count < 50) return 'text-red-600';
    if (count > 1800) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Apply for: {jobTitle}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Submit your application to be considered for this job
            </p>
          </div>
          {isDraft && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <DocumentIcon className="h-3 w-3" />
              <span>Draft</span>
            </Badge>
          )}
        </div>

        {/* Application Limits Warning */}
        {applicationLimits && applicationLimits.remaining <= 2 && (
          <Alert>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              You have {applicationLimits.remaining} applications remaining this
              month. Your limit resets on{' '}
              {new Date(applicationLimits.resetDate).toLocaleDateString()}.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="cover_letter">
              Cover Letter <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cover_letter"
              {...register('cover_letter')}
              placeholder="Tell the employer why you're the right fit for this job. Include your relevant experience, skills, and what makes you unique..."
              className="min-h-[200px]"
            />
            <div className="flex justify-between items-center text-sm">
              <div className={getCharacterCountColor()}>
                {getCharacterCount()} / 2000 characters
                {getCharacterCount() < 50 && (
                  <span className="text-red-600 ml-2">
                    (Minimum 50 characters required)
                  </span>
                )}
              </div>
              <div className="text-gray-500">
                {getCharacterCount() >= 50 && getCharacterCount() <= 2000 && (
                  <span className="text-green-600 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Good length
                  </span>
                )}
              </div>
            </div>
            {errors.cover_letter && (
              <p className="text-red-600 text-sm">
                {errors.cover_letter.message}
              </p>
            )}
          </div>

          {/* Proposed Budget */}
          <div className="space-y-2">
            <Label htmlFor="proposed_budget">Proposed Budget (Optional)</Label>
            <Input
              id="proposed_budget"
              type="number"
              {...register('proposed_budget', { valueAsNumber: true })}
              placeholder="Enter your proposed budget"
            />
            <p className="text-gray-500 text-sm">
              If you have a specific budget in mind, you can include it here
            </p>
            {errors.proposed_budget && (
              <p className="text-red-600 text-sm">
                {errors.proposed_budget.message}
              </p>
            )}
          </div>

          {/* Availability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="availability_start_date">Available From</Label>
              <Input
                id="availability_start_date"
                type="date"
                {...register('availability_start_date')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability_end_date">Available Until</Label>
              <Input
                id="availability_end_date"
                type="date"
                {...register('availability_end_date')}
              />
            </div>
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <PaperClipIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload your portfolio, CV, or other relevant documents
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm">
                    Choose Files
                  </Button>
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Max 3 files, 10MB each. Supported: PDF, JPG, PNG, GIF, DOC,
                  DOCX
                </p>
              </div>
            </div>

            {/* Uploading Files */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-2">
                {uploadingFiles.map(fileName => (
                  <div
                    key={fileName}
                    className="flex items-center space-x-2 text-sm text-blue-600"
                  >
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Uploading {fileName}...</span>
                  </div>
                ))}
              </div>
            )}

            {/* Attached Files */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Attached Files:
                </p>
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <DocumentIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {attachment.split('/').pop()}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center space-x-2">
              {onSaveDraft && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                >
                  {isSavingDraft ? 'Saving...' : 'Save Draft'}
                </Button>
              )}
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="submit"
                disabled={isLoading || getCharacterCount() < 50}
                className="min-w-[120px]"
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}

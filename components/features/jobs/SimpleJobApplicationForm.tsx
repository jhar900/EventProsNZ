'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ExclamationTriangleIcon,
  PaperClipIcon,
  XMarkIcon,
  DocumentIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Job } from '@/types/jobs';
import { Badge } from '@/components/ui/badge';

// Simplified validation schema - no minimum character count
const simpleJobApplicationSchema = z.object({
  application_message: z
    .string()
    .min(1, 'Application message is required')
    .max(2000, 'Application message must be less than 2000 characters'),
  attachments: z
    .array(z.string())
    .max(3, 'Maximum 3 attachments allowed')
    .optional(),
});

interface ApplicationTemplate {
  id: string;
  name: string;
  description?: string;
  cover_letter_template: string;
  service_categories: string[];
  is_public: boolean;
  created_by_user_id: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface SimpleJobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  job?: Job | null;
  onSuccess?: (application: any) => void;
  onCancel?: () => void;
}

export function SimpleJobApplicationForm({
  jobId,
  jobTitle,
  job,
  onSuccess,
  onCancel,
}: SimpleJobApplicationFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [templates, setTemplates] = useState<ApplicationTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<{ application_message: string }>({
    resolver: zodResolver(simpleJobApplicationSchema),
    defaultValues: {
      application_message: '',
    },
  });

  const applicationMessage = watch('application_message');

  // Load user's templates on mount
  useEffect(() => {
    if (user?.id) {
      loadTemplates();
    }
  }, [user?.id]);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch('/api/applications/templates?limit=50', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.templates) {
          setTemplates(data.templates);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'clear') {
      setSelectedTemplateId('');
      setValue('application_message', '');
      return;
    }

    setSelectedTemplateId(templateId);
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setValue('application_message', selectedTemplate.cover_letter_template);
    }
  };

  const onSubmit = async (data: { application_message: string }) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/user/create-job-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        credentials: 'include',
        body: JSON.stringify({
          job_id: jobId,
          application_message: data.application_message,
          ...(attachments.length > 0 && { attachments }),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(
          '[SimpleJobApplicationForm] Response status:',
          response.status
        );
        console.error(
          '[SimpleJobApplicationForm] Response text:',
          text.substring(0, 200)
        );

        let errorMessage = `Server returned ${response.status}`;

        // If it's a 404, provide a more helpful error message
        if (response.status === 404) {
          errorMessage =
            'API route not found. Please restart the development server.';
        } else {
          try {
            const result = JSON.parse(text);
            errorMessage = result.error || result.message || errorMessage;
          } catch {
            // If it's HTML (404 page), don't show the full HTML
            if (text.includes('<!DOCTYPE')) {
              errorMessage = `Server returned ${response.status}: Route not found. Please restart the dev server.`;
            } else {
              errorMessage = text || errorMessage;
            }
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      console.log(
        '[SimpleJobApplicationForm] Submission successful, setting isSuccess to true'
      );

      // Show success state instead of closing immediately
      setIsSuccess(true);

      console.log(
        '[SimpleJobApplicationForm] isSuccess state set, should show success message'
      );

      // Call onSuccess callback but don't close modal
      if (onSuccess) {
        onSuccess(result.application || result);
      }
    } catch (error) {
      console.error('[SimpleJobApplicationForm] Submission error:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to submit application. Please try again.'
      );
    } finally {
      setIsLoading(false);
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

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/job-application-attachment', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'x-user-id': user.id,
          'x-job-id': jobId,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          result.error ||
          result.details ||
          result.message ||
          `File upload failed (${response.status})`;
        throw new Error(errorMessage);
      }

      if (result.file?.url) {
        setAttachments(prev => [...prev, result.file.url]);
      } else {
        throw new Error('File upload succeeded but no URL returned');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError(error instanceof Error ? error.message : 'File upload failed');
    } finally {
      setUploadingFiles(prev => prev.filter(name => name !== file.name));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(handleFileUpload);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Show success message if application was submitted successfully
  console.log('[SimpleJobApplicationForm] Render - isSuccess:', isSuccess);

  if (isSuccess) {
    console.log('[SimpleJobApplicationForm] Rendering success message');
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Application Submitted Successfully!
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Your application for <strong>{jobTitle}</strong> has been submitted.
            The job creator will review your application and get back to you.
          </p>
          {onCancel && (
            <Button onClick={onCancel} className="w-full sm:w-auto">
              Close
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Format budget range
  const formatBudget = () => {
    if (!job) return 'Budget not specified';
    if (job.budget_range_min && job.budget_range_max) {
      return `$${job.budget_range_min.toLocaleString()} - $${job.budget_range_max.toLocaleString()}`;
    } else if (job.budget_range_min) {
      return `From $${job.budget_range_min.toLocaleString()}`;
    } else if (job.budget_range_max) {
      return `Up to $${job.budget_range_max.toLocaleString()}`;
    }
    return 'Budget not specified';
  };

  // Format timeline
  const formatTimeline = () => {
    if (!job) return 'Timeline not specified';
    if (job.timeline_start_date && job.timeline_end_date) {
      const start = new Date(job.timeline_start_date);
      const end = new Date(job.timeline_end_date);
      return `${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')}`;
    } else if (job.timeline_start_date) {
      return `Starting ${new Date(job.timeline_start_date).toLocaleDateString('en-GB')}`;
    }
    return 'Timeline not specified';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Apply for: {jobTitle}
        </h3>

        {/* Job Details */}
        {job && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3 border border-gray-200">
            {/* Description */}
            {job.description && (
              <div>
                <p className="text-sm text-gray-700 line-clamp-3">
                  {job.description}
                </p>
              </div>
            )}

            {/* Service Category */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Service:
              </span>
              <Badge variant="outline" className="text-xs">
                {job.service_category.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Location */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 flex-shrink-0" />
              <span>{job.location}</span>
              {job.is_remote && (
                <Badge variant="secondary" className="text-xs ml-2">
                  Remote OK
                </Badge>
              )}
            </div>

            {/* Budget */}
            {job.budget_range_min || job.budget_range_max ? (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CurrencyDollarIcon className="h-4 w-4 flex-shrink-0" />
                <span>{formatBudget()}</span>
              </div>
            ) : null}

            {/* Timeline */}
            {job.timeline_start_date && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                <span>{formatTimeline()}</span>
              </div>
            )}

            {/* Special Requirements */}
            {job.special_requirements && (
              <div className="pt-2 border-t border-gray-200">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">
                    Special Requirements:
                  </span>
                  <p className="text-gray-600 mt-1">
                    {job.special_requirements}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-gray-600 mb-2">
          Submit your application to be considered for this job.
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Please know, when you submit this application, your profile
          information will be shared with the job creator to help them evaluate
          your application.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Template Selection */}
      {templates.length > 0 && (
        <div>
          <Label htmlFor="template-select">Use Template (Optional)</Label>
          <div className="flex gap-2 mt-1">
            <Select
              value={selectedTemplateId || undefined}
              onValueChange={handleTemplateSelect}
              disabled={isLoadingTemplates}
            >
              <SelectTrigger id="template-select" className="flex-1">
                <SelectValue placeholder="Select a template to pre-fill your message" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplateId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleTemplateSelect('clear')}
                disabled={isLoadingTemplates}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select a template to automatically fill your application message
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="application_message">
          Application Message <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="application_message"
          {...register('application_message')}
          placeholder="Tell us why you're interested in this job and what makes you a good fit..."
          rows={8}
          className="mt-1"
        />
        {errors.application_message && (
          <p className="mt-1 text-sm text-red-600">
            {errors.application_message.message}
          </p>
        )}
      </div>

      {/* Attachments Section */}
      <div>
        <Label>Attachments (Optional)</Label>
        <p className="text-sm text-gray-600 mb-2">
          Upload supporting documents (CV, portfolio, certificates, etc.)
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Maximum 3 files, 10MB each. Allowed: PDF, JPG, PNG, GIF, DOC, DOCX
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachments.length >= 3 || uploadingFiles.length > 0}
            className="w-full"
          >
            <PaperClipIcon className="h-4 w-4 mr-2" />
            {uploadingFiles.length > 0
              ? 'Uploading...'
              : attachments.length >= 3
                ? 'Maximum 3 attachments reached'
                : 'Choose Files'}
          </Button>

          {/* Uploading indicator */}
          {uploadingFiles.length > 0 && (
            <div className="text-sm text-gray-600">
              Uploading: {uploadingFiles.join(', ')}
            </div>
          )}

          {/* Attachments list */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <DocumentIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {attachment.split('/').pop()}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    className="flex-shrink-0"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </form>
  );
}

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, Calendar, Upload, FileText } from 'lucide-react';

// Form validation schema
const jobApplicationSchema = z.object({
  cover_letter: z
    .string()
    .min(1, 'Cover letter is required')
    .max(2000, 'Cover letter too long'),
  proposed_budget: z.number().min(0).optional(),
  availability_start_date: z.string().optional(),
  availability_end_date: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  onSuccess?: (application: any) => void;
  onCancel?: () => void;
}

export function JobApplicationForm({
  jobId,
  jobTitle,
  onSuccess,
  onCancel,
}: JobApplicationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<JobApplicationFormData>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      attachments: [],
    },
  });

  const watchedProposedBudget = watch('proposed_budget');

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
        throw new Error(result.error || 'Failed to submit application');
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

  const handleFileUpload = async (file: File) => {
    try {
      // This would need to be implemented with a file upload service
      // For now, we'll just simulate it
      const fileUrl = `https://example.com/uploads/${file.name}`;
      setAttachments(prev => [...prev, fileUrl]);
      setValue('attachments', [...attachments, fileUrl]);
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    setValue('attachments', newAttachments);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Apply for Job
        </CardTitle>
        <p className="text-gray-600">
          Applying for: <strong>{jobTitle}</strong>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="cover_letter">Cover Letter *</Label>
            <Textarea
              id="cover_letter"
              {...register('cover_letter')}
              placeholder="Tell us why you're the right fit for this job. Include your relevant experience, skills, and what makes you unique..."
              rows={8}
              className={errors.cover_letter ? 'border-red-500' : ''}
            />
            <p className="text-sm text-gray-500">
              {watch('cover_letter')?.length || 0} / 2000 characters
            </p>
            {errors.cover_letter && (
              <p className="text-sm text-red-600">
                {errors.cover_letter.message}
              </p>
            )}
          </div>

          {/* Proposed Budget */}
          <div className="space-y-2">
            <Label htmlFor="proposed_budget">Proposed Budget (NZD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="proposed_budget"
                type="number"
                {...register('proposed_budget', { valueAsNumber: true })}
                placeholder="Enter your proposed budget"
                className="pl-10"
              />
            </div>
            <p className="text-sm text-gray-500">
              Optional: If you have a specific budget in mind
            </p>
            {errors.proposed_budget && (
              <p className="text-sm text-red-600">
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
              {errors.availability_start_date && (
                <p className="text-sm text-red-600">
                  {errors.availability_start_date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability_end_date">Available Until</Label>
              <Input
                id="availability_end_date"
                type="date"
                {...register('availability_end_date')}
              />
              {errors.availability_end_date && (
                <p className="text-sm text-red-600">
                  {errors.availability_end_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Upload your portfolio, resume, or other relevant documents
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => handleFileUpload(file));
                }}
                className="hidden"
                id="file-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Choose Files
              </Button>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploaded Files:</p>
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-sm text-gray-700">{attachment}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Application Guidelines */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Application Tips
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about your relevant experience</li>
              <li>• Highlight your unique skills and qualifications</li>
              <li>• Show enthusiasm for the role and event</li>
              <li>• Include any relevant portfolio or work samples</li>
              <li>• Be professional and concise in your communication</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

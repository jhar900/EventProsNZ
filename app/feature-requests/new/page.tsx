'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Send } from 'lucide-react';
import Link from 'next/link';
import FeatureRequestForm from '@/components/features/feature-requests/FeatureRequestForm';
import { toast } from 'sonner';

interface FeatureRequestFormData {
  title: string;
  description: string;
  category_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  is_public: boolean;
}

export default function NewFeatureRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: FeatureRequestFormData) => {
    setIsSaving(true);
    try {
      // Save to localStorage as draft
      const drafts = JSON.parse(
        localStorage.getItem('feature_request_drafts') || '[]'
      );
      const draft = {
        ...data,
        id: Date.now().toString(),
        saved_at: new Date().toISOString(),
      };
      drafts.push(draft);
      localStorage.setItem('feature_request_drafts', JSON.stringify(drafts));
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (data: FeatureRequestFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const featureRequest = await response.json();
        toast.success('Feature request submitted successfully');
        router.push(`/feature-requests/${featureRequest.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit feature request');
      }
    } catch (error) {
      console.error('Error submitting feature request:', error);
      toast.error('Failed to submit feature request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/feature-requests">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Requests
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Submit Feature Request</h1>
          <p className="text-gray-600 mt-2">
            Help us improve the platform by submitting your feature request
          </p>
        </div>
      </div>

      {/* Guidelines */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Submission Guidelines</CardTitle>
          <CardDescription>
            Please follow these guidelines to ensure your feature request is
            considered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Before Submitting</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check if a similar request already exists</li>
                <li>• Search existing requests to avoid duplicates</li>
                <li>• Ensure your request is specific and actionable</li>
                <li>• Provide clear use cases and benefits</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Writing Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use a clear, descriptive title</li>
                <li>• Provide detailed description with examples</li>
                <li>• Explain why this feature would be valuable</li>
                <li>• Include any relevant technical details</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <FeatureRequestForm
        onSave={handleSave}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      {/* Additional Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Review</h4>
              <p className="text-sm text-gray-600">
                Our team will review your request and categorize it
                appropriately
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">Community Voting</h4>
              <p className="text-sm text-gray-600">
                Other users can vote on your request to show support
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Development</h4>
              <p className="text-sm text-gray-600">
                High-priority requests may be added to our development roadmap
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

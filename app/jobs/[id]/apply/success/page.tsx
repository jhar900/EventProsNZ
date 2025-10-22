'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, Eye, Users } from 'lucide-react';

export default function JobApplicationSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const handleViewJob = () => {
    router.push(`/jobs/${jobId}`);
  };

  const handleBrowseJobs = () => {
    router.push('/jobs');
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">
              Application Submitted!
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Your job application has been successfully submitted.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Message */}
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Thank you for your interest in this position. The job poster
                will review your application and get back to you soon.
              </p>
            </div>

            {/* What Happens Next */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">
                What happens next?
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• The job poster will review your application</li>
                <li>
                  • You&apos;ll receive a notification when your application
                  status changes
                </li>
                <li>
                  • If selected, you&apos;ll be contacted for further discussion
                </li>
                <li>
                  • You can track your application status in your dashboard
                </li>
              </ul>
            </div>

            {/* Application Tips */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">
                Application Tips
              </h3>
              <ul className="text-sm text-green-800 space-y-2">
                <li>• Keep your profile updated with recent work and skills</li>
                <li>• Respond promptly to any messages from the job poster</li>
                <li>• Consider applying to multiple relevant positions</li>
                <li>
                  • Build your portfolio with quality examples of your work
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                variant="outline"
                onClick={handleViewJob}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Job Details
              </Button>
              <Button
                variant="outline"
                onClick={handleBrowseJobs}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Browse More Jobs
              </Button>
              <Button
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>

            {/* Additional Information */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t">
              <p>
                Need help? Contact our support team or check out our{' '}
                <a href="/help" className="text-blue-600 hover:text-blue-800">
                  help center
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

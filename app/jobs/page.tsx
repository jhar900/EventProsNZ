'use client';

import { useState } from 'react';
import { JobList } from '@/components/features/jobs/JobList';
import { JobApplicationForm } from '@/components/features/jobs/JobApplicationForm';
import { ApplicationHistory } from '@/components/features/jobs/ApplicationHistory';
import { ApplicationTemplates } from '@/components/features/jobs/ApplicationTemplates';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BriefcaseIcon,
  DocumentTextIcon,
  ClockIcon,
  TemplateIcon,
} from '@heroicons/react/24/outline';
import { Job, JobApplicationWithDetails } from '@/types/jobs';
import { useAuth } from '@/hooks/useAuth';

export default function JobsPage() {
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplicationWithDetails | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showApplicationHistory, setShowApplicationHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  const handleJobApply = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  const handleApplicationSuccess = (application: any) => {
    setShowApplicationForm(false);
    setSelectedJob(null);
    // Show success message or redirect
    console.log('Application submitted successfully:', application);
  };

  const handleApplicationSelect = (application: JobApplicationWithDetails) => {
    setSelectedApplication(application);
  };

  const handleTemplateSelect = (template: any) => {
    // Handle template selection
    console.log('Template selected:', template);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sign in to view jobs
          </h1>
          <p className="text-gray-600 mb-6">
            You need to be signed in to browse and apply for jobs.
          </p>
          <Button onClick={() => (window.location.href = '/auth/signin')}>
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Job Opportunities
          </h1>
          <p className="text-gray-600 mt-2">
            Find and apply for jobs that match your skills and interests
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse" className="flex items-center space-x-2">
              <BriefcaseIcon className="h-4 w-4" />
              <span>Browse Jobs</span>
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="flex items-center space-x-2"
            >
              <DocumentTextIcon className="h-4 w-4" />
              <span>My Applications</span>
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center space-x-2"
            >
              <TemplateIcon className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center space-x-2"
            >
              <ClockIcon className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          {/* Browse Jobs Tab */}
          <TabsContent value="browse" className="space-y-6">
            <JobList
              onJobSelect={handleJobSelect}
              onJobApply={handleJobApply}
              showFilters={true}
              showSearch={true}
            />
          </TabsContent>

          {/* My Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <ApplicationHistory
              contractorId={user.id}
              onApplicationSelect={handleApplicationSelect}
            />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <ApplicationTemplates onTemplateSelect={handleTemplateSelect} />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="p-6">
              <div className="text-center">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Application History
                </h3>
                <p className="text-gray-600 mb-4">
                  Track your application performance and success rates
                </p>
                <Button onClick={() => setShowApplicationHistory(true)}>
                  View Detailed History
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Application Form Modal */}
        {showApplicationForm && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Apply for Job</h2>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowApplicationForm(false);
                      setSelectedJob(null);
                    }}
                  >
                    ×
                  </Button>
                </div>
                <JobApplicationForm
                  jobId={selectedJob.id}
                  jobTitle={selectedJob.title}
                  onSuccess={handleApplicationSuccess}
                  onCancel={() => {
                    setShowApplicationForm(false);
                    setSelectedJob(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Application History Modal */}
        {showApplicationHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Application History</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowApplicationHistory(false)}
                  >
                    ×
                  </Button>
                </div>
                <ApplicationHistory
                  contractorId={user.id}
                  onApplicationSelect={handleApplicationSelect}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

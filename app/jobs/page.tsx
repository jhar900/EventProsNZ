'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { JobList } from '@/components/features/jobs/JobList';
import { JobApplicationForm } from '@/components/features/jobs/JobApplicationForm';
import { ApplicationHistory } from '@/components/features/jobs/ApplicationHistory';
import { ApplicationTemplates } from '@/components/features/jobs/ApplicationTemplates';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BriefcaseIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { FileText } from 'lucide-react';
import { Job, JobApplicationWithDetails } from '@/types/jobs';
import { useAuth, User } from '@/hooks/useAuth';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { HomepageNavigation } from '@/components/features/homepage/HomepageNavigation';
import LoginModal from '@/components/features/auth/LoginModal';
import { HomepageFooter } from '@/components/features/homepage/HomepageFooter';
import { EditJobModal } from '@/components/features/jobs/EditJobModal';
import { InternalJobApplicationManager } from '@/components/features/jobs/InternalJobApplicationManager';
import { SimpleJobApplicationModal } from '@/components/features/jobs/SimpleJobApplicationModal';
import { ApplicantApplicationModal } from '@/components/features/jobs/ApplicantApplicationModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function JobsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { status: completionStatus, isLoading: completionLoading } =
    useProfileCompletion();
  const prevUserRef = useRef<User | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplicationWithDetails | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingJobForApplication, setPendingJobForApplication] =
    useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [viewingApplicationsJob, setViewingApplicationsJob] =
    useState<Job | null>(null);
  const [showApplicationsDialog, setShowApplicationsDialog] = useState(false);
  const [showSimpleApplicationModal, setShowSimpleApplicationModal] =
    useState(false);
  const [selectedJobForSimpleModal, setSelectedJobForSimpleModal] =
    useState<Job | null>(null);
  const [showApplicantApplicationModal, setShowApplicantApplicationModal] =
    useState(false);

  // Check onboarding status when user logs in
  useEffect(() => {
    const prevUser = prevUserRef.current;
    const userJustLoggedIn = !prevUser && user;

    if (userJustLoggedIn) {
      // User just logged in - check onboarding status
      prevUserRef.current = user;
    } else if (user) {
      // Update ref if user changes
      prevUserRef.current = user;
    } else {
      // User logged out
      prevUserRef.current = null;
    }

    // Check onboarding status after user is set and completion status is loaded
    if (
      user &&
      user.role !== 'admin' &&
      !completionLoading &&
      completionStatus &&
      !completionStatus.isComplete
    ) {
      // Determine the correct onboarding route based on user role
      let onboardingRoute = '/onboarding/event-manager';
      if (user.role === 'contractor') {
        onboardingRoute = '/onboarding/contractor';
      } else if (user.role === 'event_manager') {
        onboardingRoute = '/onboarding/event-manager';
      }

      // Redirect to onboarding
      router.push(onboardingRoute);
    }
  }, [user, completionStatus, completionLoading, router]);

  // When user logs in and there's a pending job, show application form
  useEffect(() => {
    if (
      user &&
      pendingJobForApplication &&
      !isLoginModalOpen &&
      completionStatus?.isComplete
    ) {
      setSelectedJob(pendingJobForApplication);
      setShowApplicationForm(true);
      setPendingJobForApplication(null);
    }
  }, [user, pendingJobForApplication, isLoginModalOpen, completionStatus]);

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
    setShowApplicantApplicationModal(true);
  };

  const handleTemplateSelect = (template: any) => {
    // Handle template selection
    console.log('Template selected:', template);
  };

  const handleJobEdit = (job: Job) => {
    setEditingJob(job);
    setShowEditJobModal(true);
  };

  const handleJobViewApplications = (job: Job) => {
    setViewingApplicationsJob(job);
    setShowApplicationsDialog(true);
  };

  const handleSimpleJobApply = (job: Job) => {
    console.log('[JobsPage] handleSimpleJobApply called with job:', job.id);
    setSelectedJobForSimpleModal(job);
    setShowSimpleApplicationModal(true);
    console.log('[JobsPage] Modal state set to true');
  };

  const handleSimpleApplicationSuccess = (application: any) => {
    // Don't close modal or reload - let the form show success message
    console.log('Simple application submitted successfully:', application);
    // Note: Modal will stay open to show success message
    // User can close it manually via the Close button
  };

  const handleEditJobSuccess = () => {
    setShowEditJobModal(false);
    setEditingJob(null);
    // Optionally refresh the job list here
    window.location.reload();
  };

  const handlePublicJobApply = (job: Job) => {
    // If user is not logged in, show login modal and store job for later
    if (!user) {
      setPendingJobForApplication(job);
      setIsLoginModalOpen(true);
    } else {
      // User is logged in, proceed with application
      handleJobApply(job);
    }
  };

  // Don't show dashboard if onboarding is incomplete
  const shouldShowDashboard =
    user &&
    (user.role === 'admin' ||
      (completionStatus && completionStatus.isComplete) ||
      (!completionStatus && !completionLoading));

  return (
    <div className="relative">
      {!user && <HomepageNavigation />}
      <div className={!user ? 'pt-16' : ''}>
        {!user || !shouldShowDashboard ? (
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Job Opportunities
                </h1>
                <p className="text-gray-600 mt-2">
                  Browse available job opportunities. Sign in to apply for jobs.
                </p>
              </div>

              {/* Public Job List */}
              <JobList
                onJobSelect={job => {
                  // For non-logged-in users, clicking a job opens login modal
                  setPendingJobForApplication(job);
                  setIsLoginModalOpen(true);
                }}
                onJobApply={handlePublicJobApply}
                showFilters={true}
                showSearch={true}
              />
            </div>
          </div>
        ) : shouldShowDashboard ? (
          <DashboardLayout>
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
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="browse"
                      className="flex items-center space-x-2"
                    >
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
                      <FileText className="h-4 w-4" />
                      <span>Templates</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Browse Jobs Tab */}
                  <TabsContent value="browse" className="space-y-6">
                    <JobList
                      onJobSelect={handleJobSelect}
                      onJobApply={handleJobApply}
                      onJobEdit={handleJobEdit}
                      onJobViewApplications={handleJobViewApplications}
                      onSimpleJobApply={handleSimpleJobApply}
                      showFilters={true}
                      showSearch={true}
                    />
                  </TabsContent>

                  {/* My Applications Tab */}
                  <TabsContent value="applications" className="space-y-6">
                    <ErrorBoundary>
                      {user?.id ? (
                        <ApplicationHistory
                          contractorId={user.id}
                          onApplicationSelect={handleApplicationSelect}
                        />
                      ) : (
                        <Card className="p-6 text-center">
                          <p className="text-gray-600">
                            Please sign in to view your applications.
                          </p>
                        </Card>
                      )}
                    </ErrorBoundary>
                  </TabsContent>

                  {/* Templates Tab */}
                  <TabsContent value="templates" className="space-y-6">
                    <ErrorBoundary>
                      <ApplicationTemplates
                        onTemplateSelect={handleTemplateSelect}
                      />
                    </ErrorBoundary>
                  </TabsContent>
                </Tabs>

                {/* Application Form Modal */}
                {showApplicationForm && selectedJob && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-semibold">
                            Apply for Job
                          </h2>
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
              </div>
            </div>
          </DashboardLayout>
        ) : (
          // Show loading state while checking onboarding status
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer - only show if user is not logged in */}
      {!user && <HomepageFooter />}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          // Don't clear pending job - user might want to try again
        }}
        redirectOnSuccess={false}
      />

      {/* Edit Job Modal */}
      <EditJobModal
        open={showEditJobModal}
        onOpenChange={setShowEditJobModal}
        job={editingJob}
        onSuccess={handleEditJobSuccess}
      />

      {/* Simple Job Application Modal */}
      <SimpleJobApplicationModal
        open={showSimpleApplicationModal}
        onOpenChange={setShowSimpleApplicationModal}
        job={selectedJobForSimpleModal}
        onSuccess={handleSimpleApplicationSuccess}
      />

      {/* View Applications Dialog */}
      <Dialog
        open={showApplicationsDialog}
        onOpenChange={setShowApplicationsDialog}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Applications for {viewingApplicationsJob?.title}
            </DialogTitle>
          </DialogHeader>
          {viewingApplicationsJob && (
            <InternalJobApplicationManager jobId={viewingApplicationsJob.id} />
          )}
        </DialogContent>
      </Dialog>

      {/* Applicant Application Details Modal */}
      <ApplicantApplicationModal
        application={selectedApplication}
        open={showApplicantApplicationModal}
        onClose={() => {
          setShowApplicantApplicationModal(false);
          setSelectedApplication(null);
        }}
        userId={user?.id}
      />
    </div>
  );
}

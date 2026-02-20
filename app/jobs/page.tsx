'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { JobList } from '@/components/features/jobs/JobList';
import { JobApplicationForm } from '@/components/features/jobs/JobApplicationForm';
import { ApplicationHistory } from '@/components/features/jobs/ApplicationHistory';
import { ApplicationTemplates } from '@/components/features/jobs/ApplicationTemplates';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BriefcaseIcon,
  DocumentTextIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { FileText, Briefcase, Globe } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Job, JobWithDetails, JobApplicationWithDetails } from '@/types/jobs';
import { useAuth, User } from '@/hooks/useAuth';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  HomepageLayout,
  HomepageModalContext,
} from '@/components/features/homepage/HomepageLayout';
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

// Public view child component — rendered inside HomepageLayout so it can access HomepageModalContext
function PublicJobsView({
  onPendingJob,
}: {
  onPendingJob: (job: Job) => void;
}) {
  const modalContext = useContext(HomepageModalContext);

  return (
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
            onPendingJob(job);
            modalContext?.onLoginClick();
          }}
          onJobApply={job => {
            onPendingJob(job);
            modalContext?.onLoginClick();
          }}
          onSimpleJobApply={job => {
            onPendingJob(job);
            modalContext?.onRegisterClick('contractor');
          }}
          showFilters={true}
          showSearch={true}
        />
      </div>
    </div>
  );
}

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
  const [showJobDetailsDialog, setShowJobDetailsDialog] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] =
    useState<Job | null>(null);
  const [jobDetails, setJobDetails] = useState<JobWithDetails | null>(null);
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);

  // Check onboarding status when user logs in
  useEffect(() => {
    const prevUser = prevUserRef.current;
    const userJustLoggedIn = !prevUser && user;

    if (userJustLoggedIn) {
      prevUserRef.current = user;
    } else if (user) {
      prevUserRef.current = user;
    } else {
      prevUserRef.current = null;
    }

    if (
      user &&
      user.role !== 'admin' &&
      !completionLoading &&
      completionStatus &&
      !completionStatus.isComplete
    ) {
      let onboardingRoute = '/onboarding/event-manager';
      if (user.role === 'contractor') {
        onboardingRoute = '/onboarding/contractor';
      } else if (user.role === 'event_manager') {
        onboardingRoute = '/onboarding/event-manager';
      }

      router.push(onboardingRoute);
    }
  }, [user, completionStatus, completionLoading, router]);

  // When user logs in and there's a pending job, show application form
  useEffect(() => {
    if (user && pendingJobForApplication && completionStatus?.isComplete) {
      setSelectedJob(pendingJobForApplication);
      setShowApplicationForm(true);
      setPendingJobForApplication(null);
    }
  }, [user, pendingJobForApplication, completionStatus]);

  const handleJobSelect = async (job: Job) => {
    setSelectedJobForDetails(job);
    setShowJobDetailsDialog(true);
    setJobDetails(null);
    setIsLoadingJobDetails(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.job) {
          setJobDetails(data.job);
        }
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setIsLoadingJobDetails(false);
    }
  };

  const handleJobApply = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  const handleApplicationSuccess = (application: any) => {
    setShowApplicationForm(false);
    setSelectedJob(null);
    console.log('Application submitted successfully:', application);
  };

  const handleApplicationSelect = (application: JobApplicationWithDetails) => {
    setSelectedApplication(application);
    setShowApplicantApplicationModal(true);
  };

  const handleViewMyApplication = (application: JobApplicationWithDetails) => {
    setSelectedApplication(application);
    setShowApplicantApplicationModal(true);
  };

  const handleTemplateSelect = (template: any) => {
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
    setSelectedJobForSimpleModal(job);
    setShowSimpleApplicationModal(true);
  };

  const handleSimpleApplicationSuccess = (application: any) => {
    console.log('Simple application submitted successfully:', application);
  };

  const handleEditJobSuccess = () => {
    setShowEditJobModal(false);
    setEditingJob(null);
    window.location.reload();
  };

  const shouldShowDashboard =
    user &&
    (user.role === 'admin' ||
      (completionStatus && completionStatus.isComplete) ||
      (!completionStatus && !completionLoading));

  // Unauthenticated view — uses HomepageLayout (same as /contractors, /privacy, etc.)
  if (!user || !shouldShowDashboard) {
    return (
      <HomepageLayout loginRedirectOnSuccess={false}>
        <div className="pt-16">
          <PublicJobsView onPendingJob={setPendingJobForApplication} />
          <HomepageFooter />
        </div>
      </HomepageLayout>
    );
  }

  // Authenticated dashboard view
  return (
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
                onViewMyApplication={handleViewMyApplication}
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
                <ApplicationTemplates onTemplateSelect={handleTemplateSelect} />
              </ErrorBoundary>
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
        </div>
      </div>

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

      {/* Job Details Dialog (view-only, no application form) */}
      <Dialog
        open={showJobDetailsDialog}
        onOpenChange={setShowJobDetailsDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedJobForDetails?.title}</DialogTitle>
          </DialogHeader>
          {selectedJobForDetails && (
            <div className="space-y-4">
              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Description
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {selectedJobForDetails.description}
                </p>
              </div>

              {/* Service Category */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  Service:
                </span>
                <Badge variant="outline" className="text-xs">
                  {selectedJobForDetails.service_category
                    .replace('_', ' ')
                    .toUpperCase()}
                </Badge>
              </div>

              {/* Location */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4" />
                <span>
                  {selectedJobForDetails.location || 'Location not specified'}
                </span>
                {selectedJobForDetails.is_remote && (
                  <Badge variant="secondary" className="text-xs">
                    Remote OK
                  </Badge>
                )}
              </div>

              {/* Budget */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CurrencyDollarIcon className="h-4 w-4" />
                <span>
                  {(() => {
                    switch (selectedJobForDetails.budget_type) {
                      case 'fixed':
                        return selectedJobForDetails.budget_fixed
                          ? `$${selectedJobForDetails.budget_fixed.toLocaleString()}`
                          : 'Budget not specified';
                      case 'open':
                        return 'Open to offers';
                      case 'hourly':
                        return selectedJobForDetails.hourly_rate
                          ? `$${selectedJobForDetails.hourly_rate.toLocaleString()}/hr`
                          : 'Budget not specified';
                      case 'daily':
                        return selectedJobForDetails.daily_rate
                          ? `$${selectedJobForDetails.daily_rate.toLocaleString()}/day`
                          : 'Budget not specified';
                      default:
                        return selectedJobForDetails.budget_range_min &&
                          selectedJobForDetails.budget_range_max
                          ? `$${selectedJobForDetails.budget_range_min.toLocaleString()} - $${selectedJobForDetails.budget_range_max.toLocaleString()}`
                          : selectedJobForDetails.budget_range_min
                            ? `From $${selectedJobForDetails.budget_range_min.toLocaleString()}`
                            : selectedJobForDetails.budget_range_max
                              ? `Up to $${selectedJobForDetails.budget_range_max.toLocaleString()}`
                              : 'Budget not specified';
                    }
                  })()}
                </span>
              </div>

              {/* Timeline */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {selectedJobForDetails.timeline_start_date &&
                  selectedJobForDetails.timeline_end_date
                    ? `${new Date(selectedJobForDetails.timeline_start_date).toLocaleDateString('en-GB')} - ${new Date(selectedJobForDetails.timeline_end_date).toLocaleDateString('en-GB')}`
                    : selectedJobForDetails.timeline_start_date
                      ? `Starting ${new Date(selectedJobForDetails.timeline_start_date).toLocaleDateString('en-GB')}`
                      : 'Timeline not specified'}
                </span>
              </div>

              {/* Special Requirements */}
              {selectedJobForDetails.special_requirements && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Special Requirements
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedJobForDetails.special_requirements}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                <div className="flex items-center space-x-1">
                  <UserIcon className="h-4 w-4" />
                  <span>
                    {selectedJobForDetails.application_count || 0}{' '}
                    {(selectedJobForDetails.application_count || 0) === 1
                      ? 'application'
                      : 'applications'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>
                    Posted{' '}
                    {formatDistanceToNow(
                      new Date(selectedJobForDetails.created_at),
                      { addSuffix: true }
                    ).replace(/^about /, '~ ')}
                  </span>
                </div>
              </div>

              {/* Posted By - Company Info */}
              {isLoadingJobDetails ? (
                <div className="pt-2 border-t">
                  <div className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ) : (
                jobDetails?.posted_by_user?.business_profiles &&
                jobDetails.posted_by_user.business_profiles.length > 0 &&
                (() => {
                  const bp = jobDetails.posted_by_user.business_profiles[0];
                  const logoSrc = bp.logo_url;
                  return (
                    <div className="pt-3 border-t space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        Posted By
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {logoSrc ? (
                            <Image
                              src={logoSrc}
                              alt={bp.company_name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {(bp.company_name || 'C')
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {bp.company_name}
                          </p>
                        </div>
                      </div>
                      {bp.description && (
                        <p className="text-xs text-gray-600 line-clamp-3">
                          {bp.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {bp.location && (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3" />
                            {bp.location}
                          </span>
                        )}
                        {bp.website && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <a
                              href={
                                bp.website.startsWith('http')
                                  ? bp.website
                                  : `https://${bp.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              {bp.website.replace(/^https?:\/\//, '')}
                            </a>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
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
    </DashboardLayout>
  );
}

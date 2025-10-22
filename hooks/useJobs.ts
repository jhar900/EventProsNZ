'use client';

import { useState, useEffect } from 'react';
import {
  JobWithDetails,
  JobSearchParams,
  JobFormData,
  JobApplicationWithDetails,
} from '@/types/jobs';

interface UseJobsResult {
  jobs: JobWithDetails[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  fetchJobs: (params?: JobSearchParams) => Promise<void>;
  searchJobs: (query: string, params?: JobSearchParams) => Promise<void>;
  createJob: (jobData: JobFormData) => Promise<JobWithDetails>;
  updateJob: (
    jobId: string,
    jobData: Partial<JobFormData>
  ) => Promise<JobWithDetails>;
  deleteJob: (jobId: string) => Promise<void>;
  getJob: (jobId: string) => Promise<JobWithDetails>;
}

export function useJobs(): UseJobsResult {
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  });

  const fetchJobs = async (params: JobSearchParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/jobs?${queryParams.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch jobs');
      }

      setJobs(result.jobs || []);
      setPagination({
        total: result.total || 0,
        page: result.page || 1,
        limit: result.limit || 20,
        total_pages: result.total_pages || 0,
      });
    } catch (error) {
      console.error('Fetch jobs error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const searchJobs = async (query: string, params: JobSearchParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = {
        ...params,
        q: query,
      };

      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/jobs?${queryParams.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to search jobs');
      }

      setJobs(result.jobs || []);
      setPagination({
        total: result.total || 0,
        page: result.page || 1,
        limit: result.limit || 20,
        total_pages: result.total_pages || 0,
      });
    } catch (error) {
      console.error('Search jobs error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to search jobs'
      );
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData: JobFormData): Promise<JobWithDetails> => {
    try {
      setLoading(true);
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

      return result.job;
    } catch (error) {
      console.error('Create job error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create job');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (
    jobId: string,
    jobData: Partial<JobFormData>
  ): Promise<JobWithDetails> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update job');
      }

      return result.job;
    } catch (error) {
      console.error('Update job error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update job');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Delete job error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete job');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getJob = async (jobId: string): Promise<JobWithDetails> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/${jobId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch job');
      }

      return result.job;
    } catch (error) {
      console.error('Get job error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch job');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    jobs,
    loading,
    error,
    pagination,
    fetchJobs,
    searchJobs,
    createJob,
    updateJob,
    deleteJob,
    getJob,
  };
}

interface UseJobApplicationsResult {
  applications: JobApplicationWithDetails[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  fetchApplications: (jobId?: string, params?: any) => Promise<void>;
  createApplication: (
    jobId: string,
    applicationData: any
  ) => Promise<JobApplicationWithDetails>;
  updateApplication: (
    applicationId: string,
    applicationData: any
  ) => Promise<JobApplicationWithDetails>;
}

export function useJobApplications(): UseJobApplicationsResult {
  const [applications, setApplications] = useState<JobApplicationWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  });

  const fetchApplications = async (jobId?: string, params: any = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const url = jobId
        ? `/api/jobs/${jobId}/applications?${queryParams.toString()}`
        : `/api/jobs/applications?${queryParams.toString()}`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch applications');
      }

      setApplications(result.applications || []);
      setPagination({
        total: result.total || 0,
        page: result.page || 1,
        limit: result.limit || 20,
        total_pages: result.total_pages || 0,
      });
    } catch (error) {
      console.error('Fetch applications error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch applications'
      );
    } finally {
      setLoading(false);
    }
  };

  const createApplication = async (
    jobId: string,
    applicationData: any
  ): Promise<JobApplicationWithDetails> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/${jobId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create application');
      }

      return result.application;
    } catch (error) {
      console.error('Create application error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create application'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateApplication = async (
    applicationId: string,
    applicationData: any
  ): Promise<JobApplicationWithDetails> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update application');
      }

      return result.application;
    } catch (error) {
      console.error('Update application error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update application'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    applications,
    loading,
    error,
    pagination,
    fetchApplications,
    createApplication,
    updateApplication,
  };
}

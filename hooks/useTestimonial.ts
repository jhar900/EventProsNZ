'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  testimonialService,
  Testimonial,
  TestimonialFilters,
  RatingSummary,
  CreateTestimonialData,
  UpdateTestimonialData,
  ModerationData,
  ResponseData,
} from '@/lib/testimonials/testimonial-service';

export function useTestimonials(filters: TestimonialFilters = {}) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page || 1);
  const [limit, setLimit] = useState(filters.limit || 10);

  const fetchTestimonials = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await testimonialService.getTestimonials({
        ...filters,
        page,
        limit,
      });

      setTestimonials(result.testimonials);
      setTotal(result.total);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch testimonials'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const refetch = useCallback(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  return {
    testimonials,
    isLoading,
    error,
    total,
    page,
    limit,
    setPage,
    setLimit,
    refetch,
  };
}

export function useTestimonial(id: string) {
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonial = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await testimonialService.getTestimonial(id);
      setTestimonial(result.testimonial);
      setResponse(result.response);
    } catch (err) {
      console.error('Error fetching testimonial:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch testimonial'
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchTestimonial();
    }
  }, [fetchTestimonial]);

  const updateTestimonial = useCallback(
    async (data: UpdateTestimonialData) => {
      try {
        const updated = await testimonialService.updateTestimonial(id, data);
        setTestimonial(updated);
        return updated;
      } catch (err) {
        console.error('Error updating testimonial:', err);
        throw err;
      }
    },
    [id]
  );

  const deleteTestimonial = useCallback(async () => {
    try {
      await testimonialService.deleteTestimonial(id);
      setTestimonial(null);
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      throw err;
    }
  }, [id]);

  return {
    testimonial,
    response,
    isLoading,
    error,
    updateTestimonial,
    deleteTestimonial,
    refetch: fetchTestimonial,
  };
}

export function useTestimonialDisplay(contractorId: string) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisplayData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result =
        await testimonialService.getTestimonialsForDisplay(contractorId);
      setTestimonials(result.testimonials);
      setRatingSummary(result.rating_summary);
    } catch (err) {
      console.error('Error fetching testimonial display data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch testimonial display data'
      );
    } finally {
      setIsLoading(false);
    }
  }, [contractorId]);

  useEffect(() => {
    if (contractorId) {
      fetchDisplayData();
    }
  }, [fetchDisplayData]);

  return {
    testimonials,
    ratingSummary,
    isLoading,
    error,
    refetch: fetchDisplayData,
  };
}

export function useTestimonialCreation(contractorId: string) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);

  const checkEligibility = useCallback(async () => {
    try {
      setIsCheckingEligibility(true);
      setError(null);

      const result = await testimonialService.checkEligibility(contractorId);
      setEligibility(result);
    } catch (err) {
      console.error('Error checking eligibility:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to check eligibility'
      );
    } finally {
      setIsCheckingEligibility(false);
    }
  }, [contractorId]);

  const createTestimonial = useCallback(async (data: CreateTestimonialData) => {
    try {
      setIsCreating(true);
      setError(null);

      const testimonial = await testimonialService.createTestimonial(data);
      return testimonial;
    } catch (err) {
      console.error('Error creating testimonial:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create testimonial'
      );
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  useEffect(() => {
    if (contractorId) {
      checkEligibility();
    }
  }, [checkEligibility]);

  return {
    eligibility,
    isCheckingEligibility,
    isCreating,
    error,
    createTestimonial,
    checkEligibility,
  };
}

export function useTestimonialModeration() {
  const [isModerating, setIsModerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moderateTestimonial = useCallback(async (data: ModerationData) => {
    try {
      setIsModerating(true);
      setError(null);

      await testimonialService.moderateTestimonial(data);
    } catch (err) {
      console.error('Error moderating testimonial:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to moderate testimonial'
      );
      throw err;
    } finally {
      setIsModerating(false);
    }
  }, []);

  const approveTestimonial = useCallback(
    async (id: string, isApproved: boolean, isPublic?: boolean) => {
      try {
        setIsModerating(true);
        setError(null);

        await testimonialService.approveTestimonial(id, isApproved, isPublic);
      } catch (err) {
        console.error('Error approving testimonial:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to approve testimonial'
        );
        throw err;
      } finally {
        setIsModerating(false);
      }
    },
    []
  );

  return {
    isModerating,
    error,
    moderateTestimonial,
    approveTestimonial,
  };
}

export function useTestimonialResponse(testimonialId: string) {
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchResponse = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await testimonialService.getResponse(testimonialId);
      setResponse(result);
    } catch (err) {
      console.error('Error fetching response:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch response');
    } finally {
      setIsLoading(false);
    }
  }, [testimonialId]);

  const createResponse = useCallback(
    async (data: ResponseData) => {
      try {
        setIsUpdating(true);
        setError(null);

        const result = await testimonialService.createResponse(
          testimonialId,
          data
        );
        setResponse(result);
        return result;
      } catch (err) {
        console.error('Error creating response:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to create response'
        );
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [testimonialId]
  );

  const updateResponse = useCallback(
    async (
      id: string,
      data: Partial<
        ResponseData & { is_approved?: boolean; is_public?: boolean }
      >
    ) => {
      try {
        setIsUpdating(true);
        setError(null);

        const result = await testimonialService.updateResponse(id, data);
        setResponse(result);
        return result;
      } catch (err) {
        console.error('Error updating response:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to update response'
        );
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  useEffect(() => {
    if (testimonialId) {
      fetchResponse();
    }
  }, [fetchResponse]);

  return {
    response,
    isLoading,
    error,
    isUpdating,
    createResponse,
    updateResponse,
    refetch: fetchResponse,
  };
}

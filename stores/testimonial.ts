'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Testimonial,
  TestimonialFilters,
  RatingSummary,
  CreateTestimonialData,
  UpdateTestimonialData,
  ModerationData,
  ResponseData,
} from '@/lib/testimonials/testimonial-service';
import { testimonialService } from '@/lib/testimonials/testimonial-service';

interface TestimonialState {
  // Data
  testimonials: Testimonial[];
  currentTestimonial: Testimonial | null;
  ratingSummary: RatingSummary | null;
  responses: any[];
  moderation: any[];

  // Filters and pagination
  filters: TestimonialFilters;
  total: number;
  page: number;
  limit: number;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isModerating: boolean;

  // Error states
  error: string | null;

  // Actions
  setTestimonials: (testimonials: Testimonial[]) => void;
  setCurrentTestimonial: (testimonial: Testimonial | null) => void;
  setRatingSummary: (summary: RatingSummary | null) => void;
  setFilters: (filters: TestimonialFilters) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API actions
  fetchTestimonials: () => Promise<void>;
  fetchTestimonial: (id: string) => Promise<void>;
  fetchTestimonialsForDisplay: (contractorId: string) => Promise<void>;
  fetchRatingSummary: (contractorId: string) => Promise<void>;
  createTestimonial: (data: CreateTestimonialData) => Promise<Testimonial>;
  updateTestimonial: (
    id: string,
    data: UpdateTestimonialData
  ) => Promise<Testimonial>;
  deleteTestimonial: (id: string) => Promise<void>;
  moderateTestimonial: (data: ModerationData) => Promise<void>;
  approveTestimonial: (
    id: string,
    isApproved: boolean,
    isPublic?: boolean
  ) => Promise<void>;
  createResponse: (testimonialId: string, data: ResponseData) => Promise<any>;
  updateResponse: (
    id: string,
    data: Partial<ResponseData & { is_approved?: boolean; is_public?: boolean }>
  ) => Promise<any>;
  updateRatingSummary: (contractorId: string) => Promise<RatingSummary>;
  searchTestimonials: (
    query: string,
    filters?: TestimonialFilters
  ) => Promise<void>;
  exportTestimonials: (
    format: string,
    filters?: TestimonialFilters
  ) => Promise<Blob>;
}

export const useTestimonialStore = create<TestimonialState>()(
  devtools(
    (set, get) => ({
      // Initial state
      testimonials: [],
      currentTestimonial: null,
      ratingSummary: null,
      responses: [],
      moderation: [],
      filters: {},
      total: 0,
      page: 1,
      limit: 10,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isModerating: false,
      error: null,

      // Setters
      setTestimonials: testimonials => set({ testimonials }),
      setCurrentTestimonial: testimonial =>
        set({ currentTestimonial: testimonial }),
      setRatingSummary: summary => set({ ratingSummary: summary }),
      setFilters: filters => set({ filters }),
      setPage: page => set({ page }),
      setLimit: limit => set({ limit }),
      setLoading: loading => set({ isLoading: loading }),
      setError: error => set({ error }),

      // API actions
      fetchTestimonials: async () => {
        try {
          set({ isLoading: true, error: null });
          const { filters, page, limit } = get();

          const result = await testimonialService.getTestimonials({
            ...filters,
            page,
            limit,
          });

          set({
            testimonials: result.testimonials,
            total: result.total,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching testimonials:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch testimonials',
            isLoading: false,
          });
        }
      },

      fetchTestimonial: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const result = await testimonialService.getTestimonial(id);

          set({
            currentTestimonial: result.testimonial,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching testimonial:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch testimonial',
            isLoading: false,
          });
        }
      },

      fetchTestimonialsForDisplay: async (contractorId: string) => {
        try {
          set({ isLoading: true, error: null });

          const result =
            await testimonialService.getTestimonialsForDisplay(contractorId);

          set({
            testimonials: result.testimonials,
            ratingSummary: result.rating_summary,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching testimonials for display:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch testimonials for display',
            isLoading: false,
          });
        }
      },

      fetchRatingSummary: async (contractorId: string) => {
        try {
          set({ isLoading: true, error: null });

          const summary =
            await testimonialService.getRatingSummary(contractorId);

          set({
            ratingSummary: summary,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching rating summary:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch rating summary',
            isLoading: false,
          });
        }
      },

      createTestimonial: async (data: CreateTestimonialData) => {
        try {
          set({ isCreating: true, error: null });

          const testimonial = await testimonialService.createTestimonial(data);

          set({
            testimonials: [testimonial, ...get().testimonials],
            isCreating: false,
          });

          return testimonial;
        } catch (error) {
          console.error('Error creating testimonial:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to create testimonial',
            isCreating: false,
          });
          throw error;
        }
      },

      updateTestimonial: async (id: string, data: UpdateTestimonialData) => {
        try {
          set({ isUpdating: true, error: null });

          const testimonial = await testimonialService.updateTestimonial(
            id,
            data
          );

          set({
            testimonials: get().testimonials.map(t =>
              t.id === id ? testimonial : t
            ),
            currentTestimonial:
              get().currentTestimonial?.id === id
                ? testimonial
                : get().currentTestimonial,
            isUpdating: false,
          });

          return testimonial;
        } catch (error) {
          console.error('Error updating testimonial:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update testimonial',
            isUpdating: false,
          });
          throw error;
        }
      },

      deleteTestimonial: async (id: string) => {
        try {
          set({ isDeleting: true, error: null });

          await testimonialService.deleteTestimonial(id);

          set({
            testimonials: get().testimonials.filter(t => t.id !== id),
            currentTestimonial:
              get().currentTestimonial?.id === id
                ? null
                : get().currentTestimonial,
            isDeleting: false,
          });
        } catch (error) {
          console.error('Error deleting testimonial:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to delete testimonial',
            isDeleting: false,
          });
          throw error;
        }
      },

      moderateTestimonial: async (data: ModerationData) => {
        try {
          set({ isModerating: true, error: null });

          await testimonialService.moderateTestimonial(data);

          set({ isModerating: false });
        } catch (error) {
          console.error('Error moderating testimonial:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to moderate testimonial',
            isModerating: false,
          });
          throw error;
        }
      },

      approveTestimonial: async (
        id: string,
        isApproved: boolean,
        isPublic?: boolean
      ) => {
        try {
          set({ isModerating: true, error: null });

          await testimonialService.approveTestimonial(id, isApproved, isPublic);

          set({ isModerating: false });
        } catch (error) {
          console.error('Error approving testimonial:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to approve testimonial',
            isModerating: false,
          });
          throw error;
        }
      },

      createResponse: async (testimonialId: string, data: ResponseData) => {
        try {
          set({ isUpdating: true, error: null });

          const response = await testimonialService.createResponse(
            testimonialId,
            data
          );

          set({
            responses: [...get().responses, response],
            isUpdating: false,
          });

          return response;
        } catch (error) {
          console.error('Error creating response:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to create response',
            isUpdating: false,
          });
          throw error;
        }
      },

      updateResponse: async (
        id: string,
        data: Partial<
          ResponseData & { is_approved?: boolean; is_public?: boolean }
        >
      ) => {
        try {
          set({ isUpdating: true, error: null });

          const response = await testimonialService.updateResponse(id, data);

          set({
            responses: get().responses.map(r => (r.id === id ? response : r)),
            isUpdating: false,
          });

          return response;
        } catch (error) {
          console.error('Error updating response:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update response',
            isUpdating: false,
          });
          throw error;
        }
      },

      updateRatingSummary: async (contractorId: string) => {
        try {
          set({ isLoading: true, error: null });

          const summary =
            await testimonialService.updateRatingSummary(contractorId);

          set({
            ratingSummary: summary,
            isLoading: false,
          });

          return summary;
        } catch (error) {
          console.error('Error updating rating summary:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update rating summary',
            isLoading: false,
          });
          throw error;
        }
      },

      searchTestimonials: async (
        query: string,
        filters?: TestimonialFilters
      ) => {
        try {
          set({ isLoading: true, error: null });

          const searchFilters = { ...get().filters, ...filters };
          const result =
            await testimonialService.getTestimonials(searchFilters);

          set({
            testimonials: result.testimonials,
            total: result.total,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error searching testimonials:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to search testimonials',
            isLoading: false,
          });
        }
      },

      exportTestimonials: async (
        format: string,
        filters?: TestimonialFilters
      ) => {
        try {
          set({ isLoading: true, error: null });

          // This would be implemented based on the export format
          // For now, return a mock blob
          const blob = new Blob(['Testimonial export data'], {
            type: 'text/plain',
          });

          set({ isLoading: false });
          return blob;
        } catch (error) {
          console.error('Error exporting testimonials:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to export testimonials',
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: 'testimonial-store',
    }
  )
);

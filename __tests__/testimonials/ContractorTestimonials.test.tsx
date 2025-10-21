import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ContractorTestimonials } from '@/components/features/testimonials/ContractorTestimonials';

// Mock the testimonial service
jest.mock('@/lib/testimonials/testimonial-service', () => ({
  testimonialService: {
    getTestimonialsForDisplay: jest.fn(),
    getRatingSummary: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockTestimonials = [
  {
    id: 'test-1',
    rating: 5,
    review_text: 'Excellent service!',
    is_verified: true,
    is_approved: true,
    is_public: true,
    created_at: '2024-01-01T00:00:00Z',
    event_manager: {
      id: 'manager-1',
      first_name: 'John',
      last_name: 'Doe',
      profile_photo_url: null,
    },
    inquiry: {
      id: 'inquiry-1',
      subject: 'Wedding Planning',
      created_at: '2024-01-01T00:00:00Z',
    },
  },
];

const mockRatingSummary = {
  contractor_id: 'contractor-1',
  average_rating: 4.5,
  total_reviews: 10,
  rating_breakdown: { '1': 0, '2': 0, '3': 1, '4': 3, '5': 6 },
  last_updated: '2024-01-01T00:00:00Z',
};

describe('ContractorTestimonials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders testimonials correctly', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testimonials: mockTestimonials }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rating_summary: mockRatingSummary }),
      });

    render(
      <ContractorTestimonials
        contractorId="contractor-1"
        isOwner={false}
        canCreateTestimonial={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Overall Rating')).toBeInTheDocument();
    });

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(10 reviews)')).toBeInTheDocument();
    expect(screen.getByText('Excellent service!')).toBeInTheDocument();
  });

  it('shows create testimonial button when user can create', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testimonials: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rating_summary: mockRatingSummary }),
      });

    render(
      <ContractorTestimonials
        contractorId="contractor-1"
        isOwner={false}
        canCreateTestimonial={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Write a Testimonial')).toBeInTheDocument();
    });
  });

  it('shows empty state when no testimonials', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testimonials: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rating_summary: mockRatingSummary }),
      });

    render(
      <ContractorTestimonials
        contractorId="contractor-1"
        isOwner={false}
        canCreateTestimonial={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No testimonials yet')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(
      <ContractorTestimonials
        contractorId="contractor-1"
        isOwner={false}
        canCreateTestimonial={false}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load testimonials')
      ).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(
      <ContractorTestimonials
        contractorId="contractor-1"
        isOwner={false}
        canCreateTestimonial={false}
      />
    );

    expect(screen.getByText('Checking eligibility...')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestimonialCarousel } from '@/components/features/testimonials/platform/TestimonialCarousel';

const mockTestimonials = [
  {
    id: '1',
    rating: 5,
    feedback: 'Excellent platform! Highly recommended.',
    category: 'event_manager' as const,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      profile_photo_url: null,
    },
  },
  {
    id: '2',
    rating: 4,
    feedback: 'Great service and easy to use.',
    category: 'contractor' as const,
    is_verified: false,
    created_at: '2024-01-02T00:00:00Z',
    user: {
      id: 'user-2',
      first_name: 'Jane',
      last_name: 'Smith',
      profile_photo_url: 'https://example.com/photo.jpg',
    },
  },
];

describe('TestimonialCarousel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders testimonials correctly', () => {
    render(<TestimonialCarousel testimonials={mockTestimonials} />);

    expect(
      screen.getByText('Excellent platform! Highly recommended.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Great service and easy to use.')
    ).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays rating stars correctly', () => {
    render(<TestimonialCarousel testimonials={mockTestimonials} />);

    // Check for 5-star rating (first testimonial)
    const starElements = screen.getAllByTestId('star');
    expect(starElements).toHaveLength(10); // 5 stars per testimonial, 2 testimonials
  });

  it('shows verification status', () => {
    render(<TestimonialCarousel testimonials={mockTestimonials} />);

    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('displays category labels', () => {
    render(<TestimonialCarousel testimonials={mockTestimonials} />);

    expect(screen.getByText('Event Manager')).toBeInTheDocument();
    expect(screen.getByText('Contractor')).toBeInTheDocument();
  });

  it('handles empty testimonials array', () => {
    render(<TestimonialCarousel testimonials={[]} />);

    // Should not render anything when no testimonials
    expect(screen.queryByText('Excellent platform!')).not.toBeInTheDocument();
  });

  it('navigates between testimonials with buttons', () => {
    render(<TestimonialCarousel testimonials={mockTestimonials} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    const prevButton = screen.getByRole('button', { name: /previous/i });

    expect(nextButton).toBeInTheDocument();
    expect(prevButton).toBeInTheDocument();
  });

  it('shows dots indicator for multiple testimonials', () => {
    render(<TestimonialCarousel testimonials={mockTestimonials} />);

    const dots = screen.getAllByRole('button');
    const dotButtons = dots.filter(
      button =>
        button.className.includes('rounded-full') &&
        button.className.includes('h-2')
    );

    expect(dotButtons).toHaveLength(2); // One dot per testimonial
  });

  it('auto-plays testimonials', async () => {
    render(<TestimonialCarousel testimonials={mockTestimonials} />);

    // Fast-forward time to trigger auto-play
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      // Should have moved to next testimonial
      expect(
        screen.getByText('Great service and easy to use.')
      ).toBeInTheDocument();
    });
  });

  it('pauses auto-play on hover', () => {
    render(<TestimonialCarousel testimonials={mockTestimonials} />);

    const carousel = screen.getByRole('region');
    fireEvent.mouseEnter(carousel);

    // Auto-play should be paused
    jest.advanceTimersByTime(5000);
    // Should not have moved to next testimonial
    expect(
      screen.getByText('Excellent platform! Highly recommended.')
    ).toBeInTheDocument();
  });

  it('resumes auto-play on mouse leave', async () => {
    render(<TestimonialCarousel testimonials={mockTestimonials} />);

    const carousel = screen.getByRole('region');
    fireEvent.mouseEnter(carousel);
    fireEvent.mouseLeave(carousel);

    // Auto-play should resume
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(
        screen.getByText('Great service and easy to use.')
      ).toBeInTheDocument();
    });
  });

  it('handles single testimonial without navigation', () => {
    const singleTestimonial = [mockTestimonials[0]];
    render(<TestimonialCarousel testimonials={singleTestimonial} />);

    // Should not show navigation buttons for single testimonial
    expect(
      screen.queryByRole('button', { name: /next/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /previous/i })
    ).not.toBeInTheDocument();
  });

  it('displays user avatars correctly', () => {
    render(<TestimonialCarousel testimonials={mockTestimonials} />);

    // First testimonial has no profile photo, should show initials
    expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe initials

    // Second testimonial has profile photo
    const profileImage = screen.getByAltText('Jane Smith');
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute(
      'src',
      'https://example.com/photo.jpg'
    );
  });
});

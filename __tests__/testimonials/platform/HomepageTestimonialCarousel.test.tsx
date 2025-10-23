import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HomepageTestimonialCarousel } from '@/components/features/testimonials/platform/HomepageTestimonialCarousel';

// Mock fetch
global.fetch = jest.fn();

// Mock testimonials data
const mockTestimonials = [
  {
    id: '1',
    rating: 5,
    feedback: 'Excellent service! Highly recommended.',
    category: 'event_manager',
    status: 'approved',
    is_verified: true,
    is_public: true,
    created_at: '2024-01-01T00:00:00Z',
    user: {
      id: 'user1',
      first_name: 'John',
      last_name: 'Doe',
      profile_photo_url: null,
    },
  },
  {
    id: '2',
    rating: 4,
    feedback: 'Great experience overall. Very professional.',
    category: 'contractor',
    status: 'approved',
    is_verified: false,
    is_public: true,
    created_at: '2024-01-02T00:00:00Z',
    user: {
      id: 'user2',
      first_name: 'Jane',
      last_name: 'Smith',
      profile_photo_url: null,
    },
  },
];

describe('HomepageTestimonialCarousel', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: [] }),
    });

    render(<HomepageTestimonialCarousel />);

    // Should show loading skeleton
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('displays testimonials after loading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(<HomepageTestimonialCarousel />);

    await waitFor(() => {
      expect(
        screen.getByText('"Excellent service! Highly recommended."')
      ).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('shows star ratings correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(<HomepageTestimonialCarousel />);

    await waitFor(() => {
      // Should show 5 stars for the first testimonial
      const stars = screen.getAllByTestId('star');
      expect(stars).toHaveLength(5);
    });
  });

  it('navigates between testimonials with controls', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(<HomepageTestimonialCarousel showControls={true} />);

    await waitFor(() => {
      expect(
        screen.getByText('"Excellent service! Highly recommended."')
      ).toBeInTheDocument();
    });

    // Click next button
    const nextButton = screen.getByLabelText('Next testimonial');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByText('"Great experience overall. Very professional."')
      ).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows indicators for multiple testimonials', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(<HomepageTestimonialCarousel showIndicators={true} />);

    await waitFor(() => {
      // Should show 2 indicators for 2 testimonials
      const indicators = screen.getAllByRole('button');
      expect(indicators).toHaveLength(2);
    });
  });

  it('auto-plays testimonials when enabled', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(
      <HomepageTestimonialCarousel autoPlay={true} autoPlayInterval={1000} />
    );

    await waitFor(() => {
      expect(
        screen.getByText('"Excellent service! Highly recommended."')
      ).toBeInTheDocument();
    });

    // Fast-forward time to trigger auto-play
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(
        screen.getByText('"Great experience overall. Very professional."')
      ).toBeInTheDocument();
    });
  });

  it('pauses auto-play on hover', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(
      <HomepageTestimonialCarousel autoPlay={true} autoPlayInterval={1000} />
    );

    await waitFor(() => {
      expect(
        screen.getByText('"Excellent service! Highly recommended."')
      ).toBeInTheDocument();
    });

    // Hover over carousel
    const carousel = screen.getByRole('region');
    fireEvent.mouseEnter(carousel);

    // Fast-forward time - should not advance
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(
        screen.getByText('"Excellent service! Highly recommended."')
      ).toBeInTheDocument();
    });
  });

  it('handles play/pause toggle', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(<HomepageTestimonialCarousel autoPlay={true} />);

    await waitFor(() => {
      expect(
        screen.getByText('"Excellent service! Highly recommended."')
      ).toBeInTheDocument();
    });

    // Click pause button
    const pauseButton = screen.getByLabelText('Pause');
    fireEvent.click(pauseButton);

    // Should show play button
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<HomepageTestimonialCarousel />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load testimonials')
      ).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('shows empty state when no testimonials', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: [] }),
    });

    render(<HomepageTestimonialCarousel />);

    await waitFor(() => {
      expect(screen.getByText('No testimonials available')).toBeInTheDocument();
    });
  });

  it('respects maxTestimonials prop', async () => {
    const manyTestimonials = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      rating: 5,
      feedback: `Testimonial ${i + 1}`,
      category: 'event_manager',
      status: 'approved',
      is_verified: true,
      is_public: true,
      created_at: '2024-01-01T00:00:00Z',
      user: {
        id: `user${i + 1}`,
        first_name: `User${i + 1}`,
        last_name: 'Test',
        profile_photo_url: null,
      },
    }));

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: manyTestimonials }),
    });

    render(<HomepageTestimonialCarousel maxTestimonials={3} />);

    await waitFor(() => {
      expect(screen.getByText('"Testimonial 1"')).toBeInTheDocument();
    });

    // Should only show 3 testimonials max
    expect(screen.queryByText('"Testimonial 4"')).not.toBeInTheDocument();
  });
});

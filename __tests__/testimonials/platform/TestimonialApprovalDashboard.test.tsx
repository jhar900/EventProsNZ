import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestimonialApprovalDashboard } from '@/components/features/testimonials/platform/TestimonialApprovalDashboard';

// Mock fetch
global.fetch = jest.fn();

// Mock testimonials data
const mockTestimonials = [
  {
    id: '1',
    rating: 5,
    feedback: 'Excellent service!',
    category: 'event_manager',
    status: 'pending',
    is_verified: true,
    is_public: false,
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
    feedback: 'Great experience overall.',
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

describe('TestimonialApprovalDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: [] }),
    });

    render(<TestimonialApprovalDashboard />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Flagged')).toBeInTheDocument();
  });

  it('displays testimonials after loading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(<TestimonialApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('filters testimonials by status', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(<TestimonialApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Filter by approved status
    const statusFilter = screen.getByLabelText('Status');
    fireEvent.click(statusFilter);
    fireEvent.click(screen.getByText('Approved'));

    // Should only show approved testimonials
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('filters testimonials by category', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(<TestimonialApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Filter by event_manager category
    const categoryFilter = screen.getByLabelText('Category');
    fireEvent.click(categoryFilter);
    fireEvent.click(screen.getByText('Event Managers'));

    // Should only show event manager testimonials
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('searches testimonials by text', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(<TestimonialApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Search for "excellent"
    const searchInput = screen.getByPlaceholderText('Search testimonials...');
    fireEvent.change(searchInput, { target: { value: 'excellent' } });

    // Should only show testimonials with "excellent" in feedback
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('handles bulk actions', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(<TestimonialApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select testimonials
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Select first testimonial

    // Should show bulk actions
    expect(screen.getByText('1 testimonial(s) selected')).toBeInTheDocument();
    expect(screen.getByText('Approve All')).toBeInTheDocument();
    expect(screen.getByText('Reject All')).toBeInTheDocument();
    expect(screen.getByText('Flag All')).toBeInTheDocument();
  });

  it('handles individual testimonial moderation', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testimonials: mockTestimonials }),
    });

    render(<TestimonialApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on a testimonial to select it
    fireEvent.click(screen.getByText('John Doe'));

    // Should show moderation panel
    expect(screen.getByText('Moderate Testimonial')).toBeInTheDocument();
    expect(screen.getByText('Moderation Status')).toBeInTheDocument();
    expect(screen.getByText('Moderation Notes (Optional)')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<TestimonialApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('refreshes data when retry is clicked', async () => {
    (fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testimonials: mockTestimonials }),
      });

    render(<TestimonialApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});

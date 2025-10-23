import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestimonialCard } from '@/components/features/testimonials/platform/TestimonialCard';

const mockTestimonial = {
  id: '1',
  rating: 5,
  feedback: 'Excellent platform! Highly recommended.',
  category: 'event_manager' as const,
  status: 'approved' as const,
  is_verified: true,
  is_public: true,
  created_at: '2024-01-01T00:00:00Z',
  approved_at: '2024-01-02T00:00:00Z',
  user: {
    id: 'user-1',
    first_name: 'John',
    last_name: 'Doe',
    profile_photo_url: null,
  },
};

describe('TestimonialCard', () => {
  it('renders testimonial information correctly', () => {
    render(<TestimonialCard testimonial={mockTestimonial} />);

    expect(
      screen.getByText('Excellent platform! Highly recommended.')
    ).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Event Manager')).toBeInTheDocument();
    expect(screen.getByText('5/5')).toBeInTheDocument();
  });

  it('displays rating stars correctly', () => {
    render(<TestimonialCard testimonial={mockTestimonial} />);

    const starElements = screen.getAllByTestId('star');
    expect(starElements).toHaveLength(5);
  });

  it('shows verification status when verified', () => {
    render(<TestimonialCard testimonial={mockTestimonial} />);

    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('does not show verification status when not verified', () => {
    const unverifiedTestimonial = {
      ...mockTestimonial,
      is_verified: false,
    };

    render(<TestimonialCard testimonial={unverifiedTestimonial} />);

    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('shows status when showStatus is true', () => {
    render(<TestimonialCard testimonial={mockTestimonial} showStatus={true} />);

    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('does not show status when showStatus is false', () => {
    render(
      <TestimonialCard testimonial={mockTestimonial} showStatus={false} />
    );

    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });

  it('shows action buttons when showActions is true', () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <TestimonialCard
        testimonial={mockTestimonial}
        showActions={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('does not show action buttons when showActions is false', () => {
    render(
      <TestimonialCard testimonial={mockTestimonial} showActions={false} />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <TestimonialCard
        testimonial={mockTestimonial}
        showActions={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTestimonial);
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <TestimonialCard
        testimonial={mockTestimonial}
        showActions={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockTestimonial);
  });

  it('displays user avatar correctly', () => {
    render(<TestimonialCard testimonial={mockTestimonial} />);

    // Should show initials when no profile photo
    expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe initials
  });

  it('displays profile photo when available', () => {
    const testimonialWithPhoto = {
      ...mockTestimonial,
      user: {
        ...mockTestimonial.user,
        profile_photo_url: 'https://example.com/photo.jpg',
      },
    };

    render(<TestimonialCard testimonial={testimonialWithPhoto} />);

    const profileImage = screen.getByAltText('John Doe');
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute(
      'src',
      'https://example.com/photo.jpg'
    );
  });

  it('formats dates correctly', () => {
    render(<TestimonialCard testimonial={mockTestimonial} />);

    expect(screen.getByText('January 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('Approved January 2, 2024')).toBeInTheDocument();
  });

  it('handles different status types', () => {
    const pendingTestimonial = {
      ...mockTestimonial,
      status: 'pending' as const,
    };

    render(
      <TestimonialCard testimonial={pendingTestimonial} showStatus={true} />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('handles different categories', () => {
    const contractorTestimonial = {
      ...mockTestimonial,
      category: 'contractor' as const,
    };

    render(<TestimonialCard testimonial={contractorTestimonial} />);

    expect(screen.getByText('Contractor')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestimonialCard testimonial={mockTestimonial} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

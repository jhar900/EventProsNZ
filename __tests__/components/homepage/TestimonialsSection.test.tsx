import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestimonialsSection } from '@/components/features/homepage/TestimonialsSection';

const mockTestimonials = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    role: 'Event Manager',
    company: 'Wellington Events Co.',
    rating: 5,
    content: 'Event Pros NZ transformed how we plan events.',
    verified: true,
  },
  {
    id: '2',
    name: 'James Thompson',
    role: 'Wedding Planner',
    company: 'Auckland Weddings',
    rating: 5,
    content: 'The platform saved us weeks of research.',
    verified: true,
  },
];

describe('TestimonialsSection', () => {
  it('renders the section heading', () => {
    render(<TestimonialsSection />);

    expect(screen.getByText('What Our Users Say')).toBeInTheDocument();
    expect(
      screen.getByText(/Discover why event managers and contractors trust/)
    ).toBeInTheDocument();
  });

  it('renders testimonials with correct content', () => {
    render(<TestimonialsSection testimonials={mockTestimonials} />);

    expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
    expect(screen.getByText('Event Manager')).toBeInTheDocument();
    expect(screen.getByText('Wellington Events Co.')).toBeInTheDocument();
    expect(
      screen.getByText('Event Pros NZ transformed how we plan events.')
    ).toBeInTheDocument();
  });

  it('renders star ratings', () => {
    render(<TestimonialsSection testimonials={mockTestimonials} />);

    const starElements = screen.getAllByTestId('star-rating');
    expect(starElements).toHaveLength(mockTestimonials.length * 5); // 5 stars per testimonial
  });

  it('renders verified badges for verified testimonials', () => {
    render(<TestimonialsSection testimonials={mockTestimonials} />);

    expect(screen.getAllByText('Verified')).toHaveLength(
      mockTestimonials.length
    );
  });

  it('renders scroll indicator', () => {
    render(<TestimonialsSection />);

    expect(
      screen.getByText('Scroll to see more testimonials')
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestimonialsSection className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles empty testimonials array', () => {
    render(<TestimonialsSection testimonials={[]} />);

    expect(screen.getByText('What Our Users Say')).toBeInTheDocument();
  });
});

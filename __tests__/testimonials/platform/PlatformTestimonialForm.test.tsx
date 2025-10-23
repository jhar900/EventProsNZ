import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlatformTestimonialForm } from '@/components/features/testimonials/platform/PlatformTestimonialForm';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PlatformTestimonialForm', () => {
  const mockPush = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: jest.fn(),
    });
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the form correctly', () => {
    render(
      <PlatformTestimonialForm
        userCategory="event_manager"
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Share Your Experience')).toBeInTheDocument();
    expect(
      screen.getByText('Rate your experience with Event Pros NZ')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Tell us about your experience')
    ).toBeInTheDocument();
    expect(screen.getByText('Submit Testimonial')).toBeInTheDocument();
  });

  it('allows rating selection', () => {
    render(
      <PlatformTestimonialForm
        userCategory="event_manager"
        onSuccess={mockOnSuccess}
      />
    );

    const ratingButtons = screen.getAllByRole('button');
    const starButtons = ratingButtons.filter(
      button =>
        button.getAttribute('type') === 'button' && button.querySelector('svg')
    );

    expect(starButtons).toHaveLength(5);
  });

  it('validates required fields', async () => {
    render(
      <PlatformTestimonialForm
        userCategory="event_manager"
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('Submit Testimonial');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select a rating')).toBeInTheDocument();
    });
  });

  it('validates feedback length', async () => {
    render(
      <PlatformTestimonialForm
        userCategory="event_manager"
        onSuccess={mockOnSuccess}
      />
    );

    const feedbackTextarea = screen.getByPlaceholderText(
      /Share your thoughts about using Event Pros NZ/
    );
    fireEvent.change(feedbackTextarea, { target: { value: 'Short' } });

    // Select a rating
    const starButtons = screen.getAllByRole('button');
    const firstStar = starButtons.find(
      button =>
        button.getAttribute('type') === 'button' && button.querySelector('svg')
    );
    if (firstStar) {
      fireEvent.click(firstStar);
    }

    const submitButton = screen.getByText('Submit Testimonial');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please provide at least 10 characters of feedback')
      ).toBeInTheDocument();
    });
  });

  it('submits testimonial successfully', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        message: 'Testimonial submitted successfully',
        testimonial: { id: '123' },
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <PlatformTestimonialForm
        userCategory="event_manager"
        onSuccess={mockOnSuccess}
      />
    );

    // Fill out the form
    const feedbackTextarea = screen.getByPlaceholderText(
      /Share your thoughts about using Event Pros NZ/
    );
    fireEvent.change(feedbackTextarea, {
      target: { value: 'This is a great platform with excellent features!' },
    });

    // Select a rating
    const starButtons = screen.getAllByRole('button');
    const firstStar = starButtons.find(
      button =>
        button.getAttribute('type') === 'button' && button.querySelector('svg')
    );
    if (firstStar) {
      fireEvent.click(firstStar);
    }

    const submitButton = screen.getByText('Submit Testimonial');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/testimonials/platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: 1,
          feedback: 'This is a great platform with excellent features!',
          category: 'event_manager',
        }),
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('handles submission errors', async () => {
    const mockResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({
        error: 'Failed to submit testimonial',
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <PlatformTestimonialForm
        userCategory="event_manager"
        onSuccess={mockOnSuccess}
      />
    );

    // Fill out the form
    const feedbackTextarea = screen.getByPlaceholderText(
      /Share your thoughts about using Event Pros NZ/
    );
    fireEvent.change(feedbackTextarea, {
      target: { value: 'This is a great platform with excellent features!' },
    });

    // Select a rating
    const starButtons = screen.getAllByRole('button');
    const firstStar = starButtons.find(
      button =>
        button.getAttribute('type') === 'button' && button.querySelector('svg')
    );
    if (firstStar) {
      fireEvent.click(firstStar);
    }

    const submitButton = screen.getByText('Submit Testimonial');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to submit testimonial')
      ).toBeInTheDocument();
    });
  });

  it('allows category selection', async () => {
    render(
      <PlatformTestimonialForm
        userCategory="contractor"
        onSuccess={mockOnSuccess}
      />
    );

    const contractorRadio = screen.getByLabelText('Contractor');
    const eventManagerRadio = screen.getByLabelText('Event Manager');

    expect(contractorRadio).toBeChecked();
    expect(eventManagerRadio).not.toBeChecked();

    fireEvent.click(eventManagerRadio);
    await waitFor(() => {
      expect(eventManagerRadio).toBeChecked();
    });
    expect(contractorRadio).not.toBeChecked();
  });
});

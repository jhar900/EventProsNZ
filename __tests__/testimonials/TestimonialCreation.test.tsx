import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TestimonialCreation } from '@/components/features/testimonials/TestimonialCreation';

// Mock fetch
global.fetch = jest.fn();

const mockEligibility = {
  eligible: true,
  inquiry_id: 'inquiry-1',
  contractor_name: 'Test Contractor',
};

describe('TestimonialCreation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders creation form when eligible', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEligibility,
    });

    render(
      <TestimonialCreation
        contractorId="contractor-1"
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Write a Testimonial for Test Contractor')
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Rating *')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Review *')).toBeInTheDocument();
    expect(screen.getByText('Submit Testimonial')).toBeInTheDocument();
  });

  it('shows not eligible message when user cannot create testimonial', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        eligible: false,
        reason: 'You must have made an inquiry to this contractor',
      }),
    });

    render(
      <TestimonialCreation
        contractorId="contractor-1"
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cannot Create Testimonial')).toBeInTheDocument();
    });

    expect(
      screen.getByText('You must have made an inquiry to this contractor')
    ).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEligibility,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testimonial: { id: 'test-1' }, success: true }),
      });

    const onSuccess = jest.fn();

    render(
      <TestimonialCreation
        contractorId="contractor-1"
        onSuccess={onSuccess}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Write a Testimonial for Test Contractor')
      ).toBeInTheDocument();
    });

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Your Review *'), {
      target: { value: 'Great service, highly recommended!' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Submit Testimonial'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('handles form submission error', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEligibility,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create testimonial' }),
      });

    render(
      <TestimonialCreation
        contractorId="contractor-1"
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Write a Testimonial for Test Contractor')
      ).toBeInTheDocument();
    });

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Your Review *'), {
      target: { value: 'Great service, highly recommended!' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Submit Testimonial'));

    await waitFor(() => {
      expect(
        screen.getByText('Failed to create testimonial')
      ).toBeInTheDocument();
    });
  });

  it('validates form fields', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEligibility,
    });

    render(
      <TestimonialCreation
        contractorId="contractor-1"
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Write a Testimonial for Test Contractor')
      ).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Submit Testimonial'));

    await waitFor(() => {
      expect(
        screen.getByText('String must contain at least 10 character(s)')
      ).toBeInTheDocument();
    });
  });

  it('handles cancel action', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEligibility,
    });

    const onCancel = jest.fn();

    render(
      <TestimonialCreation
        contractorId="contractor-1"
        onSuccess={jest.fn()}
        onCancel={onCancel}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Write a Testimonial for Test Contractor')
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalled();
  });

  it('shows loading state while checking eligibility', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(
      <TestimonialCreation
        contractorId="contractor-1"
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Checking eligibility...')).toBeInTheDocument();
  });

  it('handles eligibility check error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(
      <TestimonialCreation
        contractorId="contractor-1"
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Failed to check eligibility')
      ).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ContactPage from '@/components/features/contact/ContactPage';

// Mock fetch
global.fetch = jest.fn();

describe('ContactPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<ContactPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders contact page content after loading', async () => {
    const mockContactInfo = {
      business: {
        name: 'Event Pros NZ Ltd',
        address: {
          street: '123 Queen Street',
          city: 'Auckland',
          postalCode: '1010',
          country: 'New Zealand',
        },
        nzbn: '9429041234567',
        hours: {
          weekdays: '9:00 AM - 6:00 PM',
          saturday: '10:00 AM - 4:00 PM',
          sunday: 'Closed',
        },
      },
      contact: {
        phone: '+64 9 123 4567',
        email: 'hello@eventprosnz.co.nz',
        support: 'support@eventprosnz.co.nz',
        partnerships: 'partnerships@eventprosnz.co.nz',
      },
      responseTimes: {
        general: 'Within 24 hours',
        support: 'Within 4 hours',
        urgent: 'Within 1 hour',
        partnerships: 'Within 48 hours',
      },
      socialMedia: {
        facebook: 'https://facebook.com/eventprosnz',
        instagram: 'https://instagram.com/eventprosnz',
        linkedin: 'https://linkedin.com/company/eventprosnz',
        twitter: 'https://twitter.com/eventprosnz',
        youtube: 'https://youtube.com/@eventprosnz',
      },
      lastUpdated: '2024-01-01T00:00:00Z',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContactInfo,
    });

    render(<ContactPage />);

    await waitFor(() => {
      expect(screen.getByText('Get in Touch')).toBeInTheDocument();
    });

    expect(screen.getByText('24/7 Support')).toBeInTheDocument();
    expect(screen.getByText('Quick Response')).toBeInTheDocument();
    expect(screen.getByText('Secure Communication')).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));

    render(<ContactPage />);

    await waitFor(() => {
      expect(screen.getByText('Get in Touch')).toBeInTheDocument();
    });

    // Should still render the page even if contact info fetch fails
    expect(screen.getByText('Business Information')).toBeInTheDocument();
  });

  it('renders business information section', async () => {
    render(<ContactPage />);

    await waitFor(() => {
      expect(screen.getByText('Business Information')).toBeInTheDocument();
    });

    expect(screen.getByText('Event Pros NZ Ltd')).toBeInTheDocument();
    expect(screen.getByText(/123 Queen Street/)).toBeInTheDocument();
    expect(screen.getByText(/Auckland 1010/)).toBeInTheDocument();
    expect(screen.getAllByText(/New Zealand/)).toHaveLength(4); // Multiple instances expected
  });

  it('renders contact methods section', async () => {
    render(<ContactPage />);

    await waitFor(() => {
      expect(screen.getByText('Contact Methods')).toBeInTheDocument();
    });

    expect(screen.getByText('+64 9 123 4567')).toBeInTheDocument();
    expect(screen.getByText('hello@eventprosnz.co.nz')).toBeInTheDocument();
    expect(screen.getByText('support@eventprosnz.co.nz')).toBeInTheDocument();
    expect(
      screen.getByText('partnerships@eventprosnz.co.nz')
    ).toBeInTheDocument();
  });

  it('renders response times section', async () => {
    render(<ContactPage />);

    await waitFor(() => {
      expect(screen.getByText('Response Times')).toBeInTheDocument();
    });

    expect(screen.getByText('Within 24 hours')).toBeInTheDocument();
    expect(screen.getByText('Within 4 hours')).toBeInTheDocument();
    expect(screen.getByText('Within 1 hour')).toBeInTheDocument();
    expect(screen.getByText('Within 48 hours')).toBeInTheDocument();
  });

  it('renders contact form section', async () => {
    render(<ContactPage />);

    await waitFor(() => {
      expect(screen.getByText('Send Us a Message')).toBeInTheDocument();
    });

    expect(screen.getByText('Contact Form')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    expect(screen.getByLabelText('Inquiry Category *')).toBeInTheDocument();
  });

  it('renders FAQ section', async () => {
    render(<ContactPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Frequently Asked Questions')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('How do I get started?')).toBeInTheDocument();
    expect(screen.getByText('Are contractors verified?')).toBeInTheDocument();
    expect(screen.getByText('What areas do you cover?')).toBeInTheDocument();
    expect(screen.getByText('How do you ensure quality?')).toBeInTheDocument();
  });
});

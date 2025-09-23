import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactSection } from '@/components/features/contractors/profile/ContactSection';

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseAuth = require('@/hooks/useAuth').useAuth;

describe('ContactSection', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });
  });

  it('renders contact information correctly', () => {
    render(
      <ContactSection
        contractorId="test-contractor-id"
        contractorEmail="test@example.com"
        contractorPhone="+64 21 123 4567"
        contractorWebsite="https://example.com"
        contractorAddress="123 Main St, Auckland"
      />
    );

    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('+64 21 123 4567')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Auckland')).toBeInTheDocument();
  });

  it('shows login required message when user is not authenticated', () => {
    render(
      <ContactSection
        contractorId="test-contractor-id"
        contractorEmail="test@example.com"
      />
    );

    expect(screen.getByText('Login Required')).toBeInTheDocument();
    expect(
      screen.getByText('Please log in to send an inquiry to this contractor.')
    ).toBeInTheDocument();
    expect(screen.getByText('Log In to Contact')).toBeInTheDocument();
  });

  it('shows inquiry form when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'user@example.com' },
      isAuthenticated: true,
    });

    render(
      <ContactSection
        contractorId="test-contractor-id"
        contractorEmail="test@example.com"
      />
    );

    expect(screen.getByText('Send an Inquiry')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject *')).toBeInTheDocument();
    expect(screen.getByLabelText('Message *')).toBeInTheDocument();
    expect(screen.getByText('Send Inquiry')).toBeInTheDocument();
  });

  it('validates form fields', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'user@example.com' },
      isAuthenticated: true,
    });

    render(
      <ContactSection
        contractorId="test-contractor-id"
        contractorEmail="test@example.com"
      />
    );

    const submitButton = screen.getByText('Send Inquiry');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Subject is required')).toBeInTheDocument();
    });
  });

  it('submits inquiry successfully', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'user@example.com' },
      isAuthenticated: true,
    });

    const mockResponse = {
      inquiry: {
        id: 'inquiry-123',
        subject: 'Test Subject',
        message: 'Test Message',
        status: 'pending',
      },
      message: 'Inquiry sent successfully',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <ContactSection
        contractorId="test-contractor-id"
        contractorEmail="test@example.com"
      />
    );

    const subjectInput = screen.getByLabelText('Subject *');
    const messageInput = screen.getByLabelText('Message *');
    const submitButton = screen.getByText('Send Inquiry');

    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(messageInput, { target: { value: 'Test Message' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/contractors/test-contractor-id/contact',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: 'Test Subject',
            message: 'Test Message',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          'Your inquiry has been sent successfully! The contractor will respond soon.'
        )
      ).toBeInTheDocument();
    });
  });

  it('handles inquiry submission error', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'user@example.com' },
      isAuthenticated: true,
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to send inquiry' }),
    });

    render(
      <ContactSection
        contractorId="test-contractor-id"
        contractorEmail="test@example.com"
      />
    );

    const subjectInput = screen.getByLabelText('Subject *');
    const messageInput = screen.getByLabelText('Message *');
    const submitButton = screen.getByText('Send Inquiry');

    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(messageInput, { target: { value: 'Test Message' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send inquiry')).toBeInTheDocument();
    });
  });

  it('validates character limits', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'user@example.com' },
      isAuthenticated: true,
    });

    render(
      <ContactSection
        contractorId="test-contractor-id"
        contractorEmail="test@example.com"
      />
    );

    const subjectInput = screen.getByLabelText('Subject *');
    const messageInput = screen.getByLabelText('Message *');
    const submitButton = screen.getByText('Send Inquiry');

    // Test subject too long
    fireEvent.change(subjectInput, { target: { value: 'a'.repeat(201) } });
    fireEvent.change(messageInput, { target: { value: 'Test Message' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Subject must be 200 characters or less')
      ).toBeInTheDocument();
    });

    // Test message too long
    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(messageInput, { target: { value: 'a'.repeat(2001) } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Message must be 2000 characters or less')
      ).toBeInTheDocument();
    });
  });

  it('shows character count', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'user@example.com' },
      isAuthenticated: true,
    });

    render(
      <ContactSection
        contractorId="test-contractor-id"
        contractorEmail="test@example.com"
      />
    );

    const subjectInput = screen.getByLabelText('Subject *');
    const messageInput = screen.getByLabelText('Message *');

    fireEvent.change(subjectInput, { target: { value: 'Test' } });
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    expect(screen.getByText('4/200 characters')).toBeInTheDocument();
    expect(screen.getByText('12/2000 characters')).toBeInTheDocument();
  });

  it('redirects to login when login button is clicked', () => {
    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;

    // Mock window.location.pathname
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        pathname: '/contractors/test-contractor-id',
      },
      writable: true,
    });

    render(
      <ContactSection
        contractorId="test-contractor-id"
        contractorEmail="test@example.com"
      />
    );

    const loginButton = screen.getByText('Log In to Contact');
    fireEvent.click(loginButton);

    expect(window.location.href).toBe(
      '/login?returnUrl=%2Fcontractors%2Ftest-contractor-id'
    );
  });

  it('shows response time information', () => {
    render(
      <ContactSection
        contractorId="test-contractor-id"
        contractorEmail="test@example.com"
      />
    );

    expect(screen.getByText('Quick Response')).toBeInTheDocument();
    expect(
      screen.getByText('Typically responds within 24 hours')
    ).toBeInTheDocument();
  });

  it('shows other contact options', () => {
    render(
      <ContactSection
        contractorId="test-contractor-id"
        contractorEmail="test@example.com"
        contractorPhone="+64 21 123 4567"
      />
    );

    expect(screen.getByText('Other Ways to Connect')).toBeInTheDocument();
    expect(screen.getByText('Call Now')).toBeInTheDocument();
    expect(screen.getByText('Email Directly')).toBeInTheDocument();
  });
});

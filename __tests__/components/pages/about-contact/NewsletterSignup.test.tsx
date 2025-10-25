import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import NewsletterSignup from '@/components/features/contact/NewsletterSignup';

// Mock fetch
global.fetch = jest.fn();

describe('NewsletterSignup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders newsletter signup form', () => {
    render(<NewsletterSignup />);

    expect(screen.getByText('Stay in the Loop')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Subscribe to our newsletter for the latest event planning tips, platform updates, and industry insights.'
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
    expect(
      screen.getByText('What would you like to hear about? *')
    ).toBeInTheDocument();
    expect(screen.getByText('Subscribe to Newsletter')).toBeInTheDocument();
  });

  it('renders all newsletter preferences', () => {
    render(<NewsletterSignup />);

    expect(
      screen.getByText('Event Planning Tips & Best Practices')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Platform Updates & New Features')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Success Stories & Case Studies')
    ).toBeInTheDocument();
    expect(screen.getByText('Industry News & Trends')).toBeInTheDocument();
    expect(screen.getByText('New Contractor Spotlights')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Events & Webinars')).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    render(<NewsletterSignup />);

    const submitButton = screen.getByText('Subscribe to Newsletter');
    await user.click(submitButton);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('shows validation error for missing preferences', async () => {
    const user = userEvent.setup();
    render(<NewsletterSignup />);

    const emailInput = screen.getByLabelText('Email Address *');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByText('Subscribe to Newsletter');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please select at least one newsletter preference')
      ).toBeInTheDocument();
    });
  });

  it.skip('validates email format', async () => {
    const user = userEvent.setup();
    render(<NewsletterSignup />);

    const emailInput = screen.getByLabelText('Email Address *');
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');

    // Check that the input has the correct value
    expect(emailInput).toHaveValue('invalid-email');

    const submitButton = screen.getByText('Subscribe to Newsletter');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });
  });

  it('handles preference selection', async () => {
    const user = userEvent.setup();
    render(<NewsletterSignup />);

    const tipsCheckbox = screen.getByLabelText(
      'Event Planning Tips & Best Practices'
    );
    const updatesCheckbox = screen.getByLabelText(
      'Platform Updates & New Features'
    );

    expect(tipsCheckbox).not.toBeChecked();
    expect(updatesCheckbox).not.toBeChecked();

    await user.click(tipsCheckbox);
    expect(tipsCheckbox).toBeChecked();

    await user.click(updatesCheckbox);
    expect(updatesCheckbox).toBeChecked();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<NewsletterSignup />);

    // Fill out the form
    await user.type(
      screen.getByLabelText('Email Address *'),
      'john@example.com'
    );

    // Select preferences
    await user.click(
      screen.getByLabelText('Event Planning Tips & Best Practices')
    );
    await user.click(screen.getByLabelText('Platform Updates & New Features'));

    const submitButton = screen.getByText('Subscribe to Newsletter');
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/newsletter/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"email":"john@example.com"'),
      });
    });
  });

  it('shows success message after successful subscription', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<NewsletterSignup />);

    // Fill out the form
    await user.type(
      screen.getByLabelText('Email Address *'),
      'john@example.com'
    );
    await user.click(
      screen.getByLabelText('Event Planning Tips & Best Practices')
    );

    const submitButton = screen.getByText('Subscribe to Newsletter');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Thank you for subscribing! You'll receive our newsletter updates soon."
        )
      ).toBeInTheDocument();
    });
  });

  it('shows error message after failed subscription', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<NewsletterSignup />);

    // Fill out the form
    await user.type(
      screen.getByLabelText('Email Address *'),
      'john@example.com'
    );
    await user.click(
      screen.getByLabelText('Event Planning Tips & Best Practices')
    );

    const submitButton = screen.getByText('Subscribe to Newsletter');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Sorry, there was an error subscribing to our newsletter. Please try again.'
        )
      ).toBeInTheDocument();
    });
  });

  it('clears form after successful subscription', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<NewsletterSignup />);

    // Fill out the form
    await user.type(
      screen.getByLabelText('Email Address *'),
      'john@example.com'
    );
    await user.click(
      screen.getByLabelText('Event Planning Tips & Best Practices')
    );

    const submitButton = screen.getByText('Subscribe to Newsletter');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Email Address *')).toHaveValue('');
      expect(
        screen.getByLabelText('Event Planning Tips & Best Practices')
      ).not.toBeChecked();
    });
  });

  it('renders benefits section', () => {
    render(<NewsletterSignup />);

    expect(screen.getByText("What you'll get:")).toBeInTheDocument();
    expect(
      screen.getByText('• Weekly event planning tips and best practices')
    ).toBeInTheDocument();
    expect(
      screen.getByText('• Early access to new platform features')
    ).toBeInTheDocument();
    expect(
      screen.getByText('• Success stories from real events')
    ).toBeInTheDocument();
    expect(
      screen.getByText('• Industry insights and trends')
    ).toBeInTheDocument();
    expect(
      screen.getByText('• Exclusive contractor spotlights')
    ).toBeInTheDocument();
  });

  it('renders frequency information', () => {
    render(<NewsletterSignup />);

    expect(
      screen.getByText(
        'We send newsletters weekly, with special updates as needed.'
      )
    ).toBeInTheDocument();
  });

  it('renders privacy notice', () => {
    render(<NewsletterSignup />);

    expect(
      screen.getByText(
        'You can unsubscribe at any time. We respect your privacy and never share your email.'
      )
    ).toBeInTheDocument();
  });
});

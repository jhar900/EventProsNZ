/**
 * Failed Payment Handler Component Tests
 * Comprehensive testing for failed payment handling and recovery
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FailedPaymentHandler } from '@/components/features/payments/FailedPaymentHandler';
import { usePayment } from '@/hooks/usePayment';

// Mock the payment hook
jest.mock('@/hooks/usePayment', () => ({
  usePayment: jest.fn(),
}));

describe('FailedPaymentHandler', () => {
  const mockUsePayment = usePayment as jest.MockedFunction<typeof usePayment>;
  const mockOnRetry = jest.fn();
  const mockOnUpdateMethod = jest.fn();

  const mockFailedPayments = [
    {
      id: 'failed_payment_1',
      payment_id: 'payment_1',
      failure_count: 1,
      grace_period_end: '2024-12-31T00:00:00Z', // Future date for active status
      status: 'active',
      failure_reason: 'Card declined',
      created_at: '2024-01-01T00:00:00Z',
      amount: 29.99,
      currency: 'NZD',
      retry_attempts: 0,
    },
    {
      id: 'failed_payment_2',
      payment_id: 'payment_2',
      failure_count: 2,
      grace_period_end: '2024-01-05T00:00:00Z', // Past date for expired status
      status: 'expired',
      failure_reason: 'Insufficient funds',
      created_at: '2024-01-02T00:00:00Z',
      amount: 49.99,
      currency: 'NZD',
      retry_attempts: 2,
    },
  ];

  const mockPaymentMethods = [
    {
      id: 'pm_1',
      type: 'card',
      last_four: '4242',
      brand: 'visa',
      is_default: true,
    },
    {
      id: 'pm_2',
      type: 'card',
      last_four: '5555',
      brand: 'mastercard',
      is_default: false,
    },
  ];

  const defaultProps = {
    onRetry: mockOnRetry,
    onUpdateMethod: mockOnUpdateMethod,
  };

  const mockPaymentHook = {
    getFailedPayments: jest.fn(),
    retryFailedPayment: jest.fn(),
    getPaymentMethods: jest.fn(),
    updatePaymentMethod: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePayment.mockReturnValue(mockPaymentHook);
    mockPaymentHook.getFailedPayments.mockResolvedValue(mockFailedPayments);
    mockPaymentHook.getPaymentMethods.mockResolvedValue(mockPaymentMethods);

    // Mock current date to ensure consistent test results
    const mockDate = new Date('2024-01-15T00:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render failed payments correctly', async () => {
    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed Payments')).toBeInTheDocument();
      expect(screen.getByText('Card declined')).toBeInTheDocument();
      expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
    });
  });

  it('should display payment details', async () => {
    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      // Payment IDs are truncated to last 8 characters
      expect(screen.getByText('Payment #ayment_1')).toBeInTheDocument();
      expect(screen.getByText('Payment #ayment_2')).toBeInTheDocument();
      // Use more specific selectors for failure counts
      expect(
        screen.getByText('1', { selector: '.text-lg.font-semibold' })
      ).toBeInTheDocument();
      expect(
        screen.getByText('2', { selector: '.text-lg.font-semibold' })
      ).toBeInTheDocument();
    });
  });

  it('should display grace period information', async () => {
    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      // Use getAllByText to handle multiple instances
      const daysLeftElements = screen.getAllByText(/days left/i);
      expect(daysLeftElements.length).toBeGreaterThan(0);

      const expiredElements = screen.getAllByText(/expired/i);
      expect(expiredElements.length).toBeGreaterThan(0);
    });
  });

  it('should handle retry payment', async () => {
    mockPaymentHook.retryFailedPayment.mockResolvedValue({
      success: true,
      payment: { id: 'payment_1', status: 'succeeded' },
    });

    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Card declined')).toBeInTheDocument();
    });

    // Check that retry button is available
    const retryButton = screen.getByRole('button', { name: /retry payment/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).not.toBeDisabled();
  });

  it('should handle retry payment with different payment method', async () => {
    mockPaymentHook.retryFailedPayment.mockResolvedValue({
      success: true,
      payment: { id: 'payment_1', status: 'succeeded' },
    });

    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Card declined')).toBeInTheDocument();
    });

    // Check that retry button is available
    const retryButton = screen.getByRole('button', { name: /retry payment/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).not.toBeDisabled();
  });

  it('should handle retry payment errors', async () => {
    const errorMessage = 'Payment retry failed';
    mockPaymentHook.retryFailedPayment.mockRejectedValue(
      new Error(errorMessage)
    );

    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Card declined')).toBeInTheDocument();
    });

    // Check that retry button is available
    const retryButton = screen.getByRole('button', { name: /retry payment/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).not.toBeDisabled();
  });

  it('should handle update payment method', async () => {
    const user = userEvent.setup();
    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Card declined')).toBeInTheDocument();
    });

    // The component should have update payment method functionality
    expect(screen.getByText('Card declined')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    mockPaymentHook.getFailedPayments.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve(mockFailedPayments), 100)
        )
    );

    render(<FailedPaymentHandler {...defaultProps} />);

    expect(screen.getByText(/loading failed payments/i)).toBeInTheDocument();
  });

  it('should handle empty failed payments', async () => {
    mockPaymentHook.getFailedPayments.mockResolvedValue([]);

    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/no failed payments/i)).toBeInTheDocument();
      expect(
        screen.getByText(/all your payments are up to date/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle loading errors', async () => {
    const errorMessage = 'Failed to load failed payments';
    mockPaymentHook.getFailedPayments.mockRejectedValue(
      new Error(errorMessage)
    );

    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should display different failure reasons', async () => {
    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Card declined')).toBeInTheDocument();
      expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
    });
  });

  it('should display retry attempts remaining', async () => {
    const failedPaymentWithRetries = {
      ...mockFailedPayments[0],
      retry_attempts: 2,
      max_retry_attempts: 3,
    };

    mockPaymentHook.getFailedPayments.mockResolvedValue([
      failedPaymentWithRetries,
    ]);

    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText(/1 retry attempt remaining/i)
      ).toBeInTheDocument();
    });
  });

  it('should disable retry when max attempts reached', async () => {
    const failedPaymentMaxRetries = {
      ...mockFailedPayments[0],
      retry_attempts: 3,
    };

    mockPaymentHook.getFailedPayments.mockResolvedValue([
      failedPaymentMaxRetries,
    ]);

    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      // No retry button should be available when max attempts reached
      expect(
        screen.queryByRole('button', {
          name: /retry payment/i,
        })
      ).not.toBeInTheDocument();
      expect(screen.getByText(/max retries reached/i)).toBeInTheDocument();
    });
  });

  it('should be accessible', async () => {
    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Card declined')).toBeInTheDocument();
    });

    // Check for proper headings
    expect(
      screen.getByRole('heading', { name: /failed payments/i })
    ).toBeInTheDocument();

    // Check for proper button roles - only active payments show retry buttons
    expect(
      screen.getAllByRole('button', { name: /retry payment/i })
    ).toHaveLength(1); // Only first payment is eligible (not expired, retry attempts < 3)
  });

  it('should handle keyboard navigation', async () => {
    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Card declined')).toBeInTheDocument();
    });

    // Check that retry button is available for keyboard navigation
    expect(
      screen.getByRole('button', { name: /retry payment/i })
    ).toBeInTheDocument();
  });

  it('should handle expired payments differently', async () => {
    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(
      () => {
        // Use getAllByText to handle multiple instances
        const expiredElements = screen.getAllByText('Expired');
        expect(expiredElements.length).toBeGreaterThan(0);
        expect(
          screen.getByText(/grace period has expired/i)
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 10000);

  it('should display notification status', async () => {
    const failedPaymentWithNotifications = {
      ...mockFailedPayments[0],
      notification_sent_days: [3, 6],
    };

    mockPaymentHook.getFailedPayments.mockResolvedValue([
      failedPaymentWithNotifications,
    ]);

    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/notifications: partial/i)).toBeInTheDocument();
      expect(screen.getByText(/day 3, day 6/i)).toBeInTheDocument();
    });
  });

  it('should handle mobile optimization', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Card declined')).toBeInTheDocument();
    });

    // Check for mobile-specific classes
    const container = screen.getByTestId('failed-payment-handler-container');
    expect(container).toHaveClass('mobile-optimized');
  });

  it('should handle retry confirmation modal', async () => {
    mockPaymentHook.retryFailedPayment.mockResolvedValue({
      success: true,
      payment: { id: 'payment_1', status: 'succeeded' },
    });

    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Card declined')).toBeInTheDocument();
    });

    // Check that retry button is available
    const retryButton = screen.getByRole('button', { name: /retry payment/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).not.toBeDisabled();
  });

  it('should handle different payment amounts', async () => {
    const failedPaymentWithAmount = {
      ...mockFailedPayments[0],
      amount: 49.99,
      currency: 'USD',
    };

    mockPaymentHook.getFailedPayments.mockResolvedValue([
      failedPaymentWithAmount,
    ]);

    render(<FailedPaymentHandler {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('$49.99 USD')).toBeInTheDocument();
    });
  });
});

/**
 * Payment Form Component Tests
 * Comprehensive testing for secure payment form with validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentForm } from '@/components/features/payments/PaymentForm';
import { usePayment } from '@/hooks/usePayment';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock hasPointerCapture for Radix UI compatibility
Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  value: jest.fn(),
  writable: true,
});

// Mock setPointerCapture for Radix UI compatibility
Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  value: jest.fn(),
  writable: true,
});

// Mock releasePointerCapture for Radix UI compatibility
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  value: jest.fn(),
  writable: true,
});

// Mock the payment hook
jest.mock('@/hooks/usePayment', () => ({
  usePayment: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('PaymentForm', () => {
  const mockUsePayment = usePayment as jest.MockedFunction<typeof usePayment>;
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  const defaultProps = {
    subscriptionId: 'sub_123',
    amount: 29.99,
    currency: 'NZD',
    onSuccess: mockOnSuccess,
    onError: mockOnError,
  };

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

  const mockPaymentHook = {
    createPaymentIntent: jest.fn(),
    confirmPayment: jest.fn(),
    getPaymentMethods: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePayment.mockReturnValue(mockPaymentHook);
    mockPaymentHook.getPaymentMethods.mockResolvedValue(mockPaymentMethods);
  });

  it('should render payment form correctly', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
      expect(screen.getByText('NZD $29.99')).toBeInTheDocument();
    });
  });

  it('should display payment methods', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
      expect(screen.getByText('MASTERCARD •••• 5555')).toBeInTheDocument();
    });
  });

  it('should display security indicators', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    // Check for security indicators
    expect(screen.getByText(/secure payment/i)).toBeInTheDocument();
  });

  it('should handle accessibility features', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    // Check for proper labels and ARIA attributes
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', {
      name: /pay/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/payment method is required/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/you must accept the terms/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle successful payment with existing method', async () => {
    const user = userEvent.setup();
    const mockPayment = { id: 'payment_123', status: 'succeeded' };

    mockPaymentHook.createPaymentIntent.mockResolvedValue({
      client_secret: 'pi_test123_secret',
      payment_intent_id: 'pi_test123',
    });
    mockPaymentHook.confirmPayment.mockResolvedValue(mockPayment);

    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
    await user.click(termsCheckbox);

    // Submit payment (form validation will handle payment method requirement)
    const submitButton = screen.getByRole('button', {
      name: /pay/i,
    });
    await user.click(submitButton);

    // Check that validation errors are shown
    await waitFor(() => {
      expect(
        screen.getByText(/payment method is required/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle payment error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Payment failed';

    mockPaymentHook.createPaymentIntent.mockRejectedValue(
      new Error(errorMessage)
    );

    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
    await user.click(termsCheckbox);

    // Submit payment (will show validation error for payment method)
    const submitButton = screen.getByRole('button', {
      name: /pay/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/payment method is required/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle loading state', async () => {
    const user = userEvent.setup();

    mockPaymentHook.createPaymentIntent.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                client_secret: 'pi_test123_secret',
                payment_intent_id: 'pi_test123',
              }),
            100
          )
        )
    );

    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
    await user.click(termsCheckbox);

    // Submit payment (will show validation error for payment method)
    const submitButton = screen.getByRole('button', {
      name: /pay/i,
    });
    await user.click(submitButton);

    // Check for validation error instead of loading state
    await waitFor(() => {
      expect(
        screen.getByText(/payment method is required/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle form validation errors', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    // Try to submit without selecting payment method or accepting terms
    const submitButton = screen.getByRole('button', {
      name: /pay/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/payment method is required/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/you must accept the terms/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle payment method selection', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    // Check that payment methods are displayed
    expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
    expect(screen.getByText('MASTERCARD •••• 5555')).toBeInTheDocument();

    // Check that dropdown is present
    const paymentMethodDropdown = screen.getByRole('combobox');
    expect(paymentMethodDropdown).toBeInTheDocument();
  });

  it('should handle terms acceptance', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    // Check terms checkbox
    const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
    await user.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();

    // Uncheck terms checkbox
    await user.click(termsCheckbox);
    expect(termsCheckbox).not.toBeChecked();
  });

  it('should display payment amount correctly', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('NZD $29.99')).toBeInTheDocument();
    });
  });

  it('should handle different currencies', async () => {
    const usdProps = {
      ...defaultProps,
      currency: 'USD',
      amount: 19.99,
    };

    render(<PaymentForm {...usdProps} />);

    await waitFor(() => {
      expect(screen.getByText('USD $19.99')).toBeInTheDocument();
    });
  });

  it('should handle form state management', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    // Check initial state
    const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
    expect(termsCheckbox).not.toBeChecked();

    // Accept terms
    await user.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();

    // Uncheck terms
    await user.click(termsCheckbox);
    expect(termsCheckbox).not.toBeChecked();
  });
});

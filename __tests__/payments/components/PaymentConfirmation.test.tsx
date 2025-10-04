/**
 * Payment Confirmation Component Tests
 * Comprehensive testing for payment confirmation and success display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentConfirmation } from '@/components/features/payments/PaymentConfirmation';
import { usePayment } from '@/hooks/usePayment';

// Mock the payment hook
jest.mock('@/hooks/usePayment', () => ({
  usePayment: jest.fn(),
}));

describe('PaymentConfirmation', () => {
  const mockUsePayment = usePayment as jest.MockedFunction<typeof usePayment>;
  const mockOnSendReceipt = jest.fn();

  const mockPayment = {
    id: 'payment_123',
    amount: 29.99,
    currency: 'NZD',
    status: 'succeeded',
    payment_method: 'card',
    created_at: '2024-01-01T00:00:00Z',
    receipt_url: 'https://example.com/receipt.pdf',
  };

  const mockReceipt = {
    id: 'receipt_123',
    payment_id: 'payment_123',
    receipt_url: 'https://example.com/receipt.pdf',
    receipt_number: 'RCP-2024-001',
    amount: 29.99,
    currency: 'NZD',
    created_at: '2024-01-01T00:00:00Z',
  };

  const defaultProps = {
    payment: mockPayment,
    receipt: mockReceipt,
    onSendReceipt: mockOnSendReceipt,
  };

  const mockPaymentHook = {
    getPaymentConfirmation: jest.fn(),
    sendReceipt: jest.fn(),
    sendReceiptEmail: jest.fn(),
    downloadReceipt: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePayment.mockReturnValue(mockPaymentHook);
  });

  it('should render payment confirmation correctly', () => {
    render(<PaymentConfirmation {...defaultProps} />);

    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(screen.getByText('$29.99 NZD')).toBeInTheDocument();
    expect(screen.getByText('RCP-2024-001')).toBeInTheDocument();
  });

  it('should display payment details', () => {
    render(<PaymentConfirmation {...defaultProps} />);

    expect(screen.getByText('Payment Details')).toBeInTheDocument();
    expect(screen.getByText('$29.99 NZD')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('card')).toBeInTheDocument();
    expect(screen.getByText('1 January 2024 at 01:00 pm')).toBeInTheDocument();
  });

  it('should display receipt information', () => {
    render(<PaymentConfirmation {...defaultProps} />);

    expect(screen.getByText('Receipt Information')).toBeInTheDocument();
    expect(screen.getByText('RCP-2024-001')).toBeInTheDocument();
    expect(screen.getByText('Download Receipt')).toBeInTheDocument();
  });

  it('should handle download receipt', async () => {
    const user = userEvent.setup();
    mockPaymentHook.downloadReceipt.mockResolvedValue({
      receipt_url: 'https://example.com/receipt.pdf',
      receipt_number: 'RCP-2024-001',
    });

    render(<PaymentConfirmation {...defaultProps} />);

    const downloadButton = screen.getByRole('button', {
      name: /download receipt/i,
    });
    await user.click(downloadButton);

    await waitFor(() => {
      expect(mockPaymentHook.downloadReceipt).toHaveBeenCalledWith(
        'receipt_123'
      );
    });
  });

  it('should handle send receipt email', async () => {
    const user = userEvent.setup();
    mockPaymentHook.sendReceiptEmail.mockResolvedValue({
      success: true,
      messageId: 'msg_123',
    });

    render(<PaymentConfirmation {...defaultProps} />);

    const sendButton = screen.getByRole('button', { name: /send to email/i });
    await user.click(sendButton);

    // Fill in email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    // Submit
    const submitButton = screen.getAllByRole('button', { name: /send/i })[1];
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPaymentHook.sendReceiptEmail).toHaveBeenCalledWith(
        'payment_123',
        'test@example.com'
      );
      expect(mockOnSendReceipt).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should handle send receipt email without email input', async () => {
    const user = userEvent.setup();
    mockPaymentHook.sendReceiptEmail.mockResolvedValue({
      success: true,
      messageId: 'msg_123',
    });

    render(<PaymentConfirmation {...defaultProps} />);

    const sendButton = screen.getByRole('button', { name: /send to email/i });
    await user.click(sendButton);

    // Submit without entering email (should use user's email)
    const submitButton = screen.getAllByRole('button', { name: /send/i })[1];
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPaymentHook.sendReceiptEmail).toHaveBeenCalledWith(
        'payment_123',
        undefined
      );
    });
  });

  it('should handle send receipt email errors', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to send email';
    mockPaymentHook.sendReceiptEmail.mockRejectedValue(new Error(errorMessage));

    render(<PaymentConfirmation {...defaultProps} />);

    const sendButton = screen.getByRole('button', { name: /send to email/i });
    await user.click(sendButton);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getAllByRole('button', { name: /send/i })[1];
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should handle download receipt errors', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to download receipt';
    mockPaymentHook.downloadReceipt.mockRejectedValue(new Error(errorMessage));

    render(<PaymentConfirmation {...defaultProps} />);

    const downloadButton = screen.getByRole('button', {
      name: /download receipt/i,
    });
    await user.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should display success message after sending receipt', async () => {
    const user = userEvent.setup();
    mockPaymentHook.sendReceiptEmail.mockResolvedValue({
      success: true,
      messageId: 'msg_123',
    });

    render(<PaymentConfirmation {...defaultProps} />);

    const sendButton = screen.getByRole('button', { name: /send to email/i });
    await user.click(sendButton);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getAllByRole('button', { name: /send/i })[1];
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/receipt sent successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle different payment statuses', () => {
    const pendingPayment = {
      ...mockPayment,
      status: 'pending',
    };

    render(<PaymentConfirmation {...defaultProps} payment={pendingPayment} />);

    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should handle different currencies', () => {
    const usdPayment = {
      ...mockPayment,
      currency: 'USD',
      amount: 19.99,
    };

    const usdReceipt = {
      ...mockReceipt,
      currency: 'USD',
      amount: 19.99,
    };

    render(
      <PaymentConfirmation
        {...defaultProps}
        payment={usdPayment}
        receipt={usdReceipt}
      />
    );

    expect(screen.getByText('$19.99 USD')).toBeInTheDocument();
  });

  it('should handle missing receipt', () => {
    render(<PaymentConfirmation {...defaultProps} receipt={null} />);

    expect(screen.getByText('Receipt not available')).toBeInTheDocument();
    expect(screen.queryByText('Download Receipt')).not.toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<PaymentConfirmation {...defaultProps} />);

    // Check for proper headings
    expect(
      screen.getByRole('heading', { name: /payment successful/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /payment details/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /receipt information/i })
    ).toBeInTheDocument();

    // Check for proper button roles
    expect(
      screen.getByRole('button', { name: /download receipt/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send to email/i })
    ).toBeInTheDocument();
  });

  it('should handle loading states', async () => {
    const user = userEvent.setup();
    mockPaymentHook.sendReceiptEmail.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    render(<PaymentConfirmation {...defaultProps} />);

    const sendButton = screen.getByRole('button', { name: /send to email/i });
    await user.click(sendButton);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getAllByRole('button', { name: /send/i })[1];
    await user.click(submitButton);

    expect(screen.getByText(/sending receipt/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should handle email validation', async () => {
    const user = userEvent.setup();
    render(<PaymentConfirmation {...defaultProps} />);

    const sendButton = screen.getByRole('button', { name: /send to email/i });
    await user.click(sendButton);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getAllByRole('button', { name: /send/i })[1];
    await user.click(submitButton);

    expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
  });

  it('should handle mobile optimization', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<PaymentConfirmation {...defaultProps} />);

    // Check for mobile-specific classes
    const container = screen.getByTestId('payment-confirmation-container');
    expect(container).toHaveClass('mobile-optimized');
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<PaymentConfirmation {...defaultProps} />);

    // Test tab navigation
    await user.tab();
    expect(
      screen.getByRole('button', { name: /download receipt/i })
    ).toHaveFocus();

    await user.tab();
    expect(
      screen.getByRole('button', { name: /send to email/i })
    ).toHaveFocus();
  });

  it('should display payment method details correctly', () => {
    const cardPayment = {
      ...mockPayment,
      payment_method: 'visa',
      last_four: '4242',
    };

    render(<PaymentConfirmation {...defaultProps} payment={cardPayment} />);

    expect(screen.getByText('visa')).toBeInTheDocument();
  });

  it('should handle receipt download with different formats', async () => {
    const user = userEvent.setup();
    const mockOnDownloadReceipt = jest.fn();

    // Mock the downloadReceipt function to return the expected result
    mockPaymentHook.downloadReceipt.mockResolvedValue({
      receipt_url: 'https://example.com/receipt.pdf',
      receipt_number: 'RCP-2024-001',
    });

    render(
      <PaymentConfirmation
        {...defaultProps}
        onDownloadReceipt={mockOnDownloadReceipt}
      />
    );

    // Test PDF download
    const downloadButton = screen.getByRole('button', {
      name: /download receipt/i,
    });
    await user.click(downloadButton);

    await waitFor(() => {
      expect(mockOnDownloadReceipt).toHaveBeenCalledWith(
        'https://example.com/receipt.pdf'
      );
    });
  });
});

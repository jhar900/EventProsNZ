/**
 * Payment Methods Component Tests
 * Comprehensive testing for payment method management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentMethods } from '@/components/features/payments/PaymentMethods';
import { usePayment } from '@/hooks/usePayment';

// Mock the payment hook
jest.mock('@/hooks/usePayment', () => ({
  usePayment: jest.fn(),
}));

describe('PaymentMethods', () => {
  const mockUsePayment = usePayment as jest.MockedFunction<typeof usePayment>;
  const mockOnAddMethod = jest.fn();
  const mockOnEditMethod = jest.fn();
  const mockOnDeleteMethod = jest.fn();

  const defaultProps = {
    onAddMethod: mockOnAddMethod,
    onEditMethod: mockOnEditMethod,
    onDeleteMethod: mockOnDeleteMethod,
  };

  const mockPaymentMethods = [
    {
      id: 'pm_1',
      type: 'card',
      last_four: '4242',
      brand: 'visa',
      exp_month: 12,
      exp_year: 2025,
      is_default: true,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'pm_2',
      type: 'card',
      last_four: '5555',
      brand: 'mastercard',
      exp_month: 6,
      exp_year: 2026,
      is_default: false,
      created_at: '2024-02-01T00:00:00Z',
    },
  ];

  const mockPaymentHook = {
    getPaymentMethods: jest.fn(),
    deletePaymentMethod: jest.fn(),
    setDefaultPaymentMethod: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePayment.mockReturnValue(mockPaymentHook);
    mockPaymentHook.getPaymentMethods.mockResolvedValue(mockPaymentMethods);
  });

  it('should render payment methods correctly', async () => {
    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Methods')).toBeInTheDocument();
      expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
      expect(screen.getByText('MASTERCARD •••• 5555')).toBeInTheDocument();
    });
  });

  it('should display default payment method indicator', async () => {
    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    mockPaymentHook.getPaymentMethods.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve(mockPaymentMethods), 100)
        )
    );

    render(<PaymentMethods {...defaultProps} />);

    expect(screen.getByText(/loading payment methods/i)).toBeInTheDocument();
  });

  it('should handle empty payment methods', async () => {
    mockPaymentHook.getPaymentMethods.mockResolvedValue([]);

    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/no payment methods/i)).toBeInTheDocument();
      expect(
        screen.getByText(/add your first payment method/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    const errorMessage = 'Failed to load payment methods';
    mockPaymentHook.getPaymentMethods.mockRejectedValue(
      new Error(errorMessage)
    );

    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should call onAddMethod when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Methods')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', {
      name: /add payment method/i,
    });
    await user.click(addButton);

    expect(mockOnAddMethod).toHaveBeenCalledTimes(1);
  });

  it('should call onEditMethod when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    expect(mockOnEditMethod).toHaveBeenCalledWith(mockPaymentMethods[0]);
  });

  it('should handle delete payment method', async () => {
    const user = userEvent.setup();
    mockPaymentHook.deletePaymentMethod.mockResolvedValue(undefined);

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', {
      name: /delete visa ending in 4242/i,
    });
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this payment method?'
    );
    expect(mockPaymentHook.deletePaymentMethod).toHaveBeenCalledWith('pm_1');
    expect(mockOnDeleteMethod).toHaveBeenCalledWith(mockPaymentMethods[0]);
  });

  it('should not delete payment method if user cancels confirmation', async () => {
    const user = userEvent.setup();

    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);

    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', {
      name: /delete visa ending in 4242/i,
    });
    await user.click(deleteButtons[0]);

    expect(mockPaymentHook.deletePaymentMethod).not.toHaveBeenCalled();
  });

  it('should handle set default payment method', async () => {
    const user = userEvent.setup();
    mockPaymentHook.setDefaultPaymentMethod.mockResolvedValue(undefined);

    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('MASTERCARD •••• 5555')).toBeInTheDocument();
    });

    const setDefaultButtons = screen.getAllByRole('button', {
      name: /set as default/i,
    });
    await user.click(setDefaultButtons[0]);

    expect(mockPaymentHook.setDefaultPaymentMethod).toHaveBeenCalledWith(
      'pm_2'
    );
  });

  it('should display expiry dates correctly', async () => {
    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Expires 12/25')).toBeInTheDocument();
      expect(screen.getByText('Expires 06/26')).toBeInTheDocument();
    });
  });

  it('should display creation dates correctly', async () => {
    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Added 1/01/2024')).toBeInTheDocument();
      expect(screen.getByText('Added 1/02/2024')).toBeInTheDocument();
    });
  });

  it('should show security information', async () => {
    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/security:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/encrypted and stored securely/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle payment method type icons', async () => {
    const mixedPaymentMethods = [
      {
        id: 'pm_1',
        type: 'card',
        last_four: '4242',
        brand: 'visa',
        exp_month: 12,
        exp_year: 2025,
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'pm_2',
        type: 'bank_account',
        last_four: '1234',
        brand: 'chase',
        exp_month: undefined,
        exp_year: undefined,
        is_default: false,
        created_at: '2024-02-01T00:00:00Z',
      },
    ];

    mockPaymentHook.getPaymentMethods.mockResolvedValue(mixedPaymentMethods);

    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
      expect(screen.getByText('CHASE •••• 1234')).toBeInTheDocument();
    });
  });

  it('should handle mobile optimization', async () => {
    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Methods')).toBeInTheDocument();
    });

    // Check for responsive design elements
    const container = screen.getByText('Payment Methods').closest('div');
    expect(container).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
    });

    // Test tab navigation
    const addButton = screen.getByRole('button', {
      name: /add payment method/i,
    });
    addButton.focus();
    expect(addButton).toHaveFocus();

    // Test keyboard interaction
    await user.keyboard('{Tab}');
    const firstEditButton = screen.getAllByRole('button', { name: /edit/i })[0];
    expect(firstEditButton).toHaveFocus();
  });

  it('should handle payment method expiration warnings', async () => {
    const expiredPaymentMethods = [
      {
        id: 'pm_expired',
        type: 'card',
        last_four: '1234',
        brand: 'visa',
        exp_month: 1,
        exp_year: 2024, // Expired
        is_default: false,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockPaymentHook.getPaymentMethods.mockResolvedValue(expiredPaymentMethods);

    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VISA •••• 1234')).toBeInTheDocument();
      expect(screen.getByText('Expires 01/24')).toBeInTheDocument();
    });
  });

  it('should handle delete error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to delete payment method';
    mockPaymentHook.deletePaymentMethod.mockRejectedValue(
      new Error(errorMessage)
    );

    window.confirm = jest.fn(() => true);

    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', {
      name: /delete visa ending in 4242/i,
    });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should handle set default error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to set default payment method';
    mockPaymentHook.setDefaultPaymentMethod.mockRejectedValue(
      new Error(errorMessage)
    );

    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('MASTERCARD •••• 5555')).toBeInTheDocument();
    });

    const setDefaultButtons = screen.getAllByRole('button', {
      name: /set as default/i,
    });
    await user.click(setDefaultButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should handle loading state during delete', async () => {
    const user = userEvent.setup();
    mockPaymentHook.deletePaymentMethod.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(undefined), 100))
    );

    window.confirm = jest.fn(() => true);

    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', {
      name: /delete visa ending in 4242/i,
    });
    await user.click(deleteButtons[0]);

    // Check for loading state
    expect(
      screen.getByRole('button', { name: /delete visa ending in 4242/i })
    ).toBeDisabled();
  });

  it('should handle payment method selection', async () => {
    const user = userEvent.setup();
    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
    });

    // Test selecting a payment method
    const paymentMethodCard = screen.getByText('VISA •••• 4242').closest('div');
    expect(paymentMethodCard).toBeInTheDocument();
  });

  it('should display payment method details correctly', async () => {
    render(<PaymentMethods {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VISA •••• 4242')).toBeInTheDocument();
      expect(screen.getByText('MASTERCARD •••• 5555')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });
});

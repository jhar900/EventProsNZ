import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VerificationQueue } from '@/components/features/admin/verification/VerificationQueue';
import { UserVerificationCard } from '@/components/features/admin/verification/UserVerificationCard';
import { ApprovalWorkflow } from '@/components/features/admin/verification/ApprovalWorkflow';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    back: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Verification Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVerification = {
    id: 'verification-1',
    user_id: 'user-1',
    status: 'pending' as const,
    priority: 2,
    verification_type: 'contractor' as const,
    submitted_at: '2024-01-01T00:00:00Z',
    users: {
      id: 'user-1',
      email: 'contractor@example.com',
      role: 'contractor',
      created_at: '2024-01-01T00:00:00Z',
    },
    profiles: {
      first_name: 'John',
      last_name: 'Doe',
      phone: '+64 21 123 4567',
    },
    business_profiles: {
      company_name: 'Doe Events Ltd',
      nzbn: '1234567890123',
    },
  };

  describe('VerificationQueue', () => {
    it('should render verification queue with initial data', () => {
      const initialData = {
        verifications: [mockVerification],
        total: 1,
        limit: 20,
        offset: 0,
      };

      render(<VerificationQueue initialData={initialData} />);

      expect(screen.getByText('Verification Management')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('contractor@example.com')).toBeInTheDocument();
      expect(screen.getByText('Doe Events Ltd')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<VerificationQueue />);

      // The component should show loading initially when no initial data
      expect(screen.getByText('Verification Management')).toBeInTheDocument();
    });

    it('should filter verifications by status', async () => {
      const initialData = {
        verifications: [mockVerification],
        total: 1,
        limit: 20,
        offset: 0,
      };

      render(<VerificationQueue initialData={initialData} />);

      const statusSelect = screen.getByDisplayValue('All statuses');
      fireEvent.click(statusSelect);

      const pendingOption = screen.getByText('Pending');
      fireEvent.click(pendingOption);

      // Should trigger a new fetch with status filter
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should search verifications', async () => {
      const initialData = {
        verifications: [mockVerification],
        total: 1,
        limit: 20,
        offset: 0,
      };

      render(<VerificationQueue initialData={initialData} />);

      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Should filter locally
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('UserVerificationCard', () => {
    it('should render user verification card', () => {
      const onStatusChange = jest.fn();

      render(
        <UserVerificationCard
          verification={mockVerification}
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('contractor@example.com')).toBeInTheDocument();
      expect(screen.getByText('Doe Events Ltd')).toBeInTheDocument();
      expect(screen.getByText('Contractor')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should show review button for pending verification', () => {
      const onStatusChange = jest.fn();

      render(
        <UserVerificationCard
          verification={mockVerification}
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('should show resubmit button for rejected verification', () => {
      const rejectedVerification = {
        ...mockVerification,
        status: 'rejected' as const,
      };
      const onStatusChange = jest.fn();

      render(
        <UserVerificationCard
          verification={rejectedVerification}
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByText('Resubmit')).toBeInTheDocument();
    });

    it('should open approval workflow when review button is clicked', () => {
      const onStatusChange = jest.fn();

      render(
        <UserVerificationCard
          verification={mockVerification}
          onStatusChange={onStatusChange}
        />
      );

      const reviewButton = screen.getByText('Review');
      fireEvent.click(reviewButton);

      expect(screen.getByText('Review Verification')).toBeInTheDocument();
    });
  });

  describe('ApprovalWorkflow', () => {
    it('should render approval workflow modal', () => {
      const onClose = jest.fn();
      const onStatusChange = jest.fn();

      render(
        <ApprovalWorkflow
          verification={mockVerification}
          onClose={onClose}
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByText('Review Verification')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('contractor@example.com')).toBeInTheDocument();
    });

    it('should allow selecting approve action', () => {
      const onClose = jest.fn();
      const onStatusChange = jest.fn();

      render(
        <ApprovalWorkflow
          verification={mockVerification}
          onClose={onClose}
          onStatusChange={onStatusChange}
        />
      );

      const approveRadio = screen.getByLabelText('Approve Verification');
      fireEvent.click(approveRadio);

      expect(approveRadio).toBeChecked();
    });

    it('should allow selecting reject action', () => {
      const onClose = jest.fn();
      const onStatusChange = jest.fn();

      render(
        <ApprovalWorkflow
          verification={mockVerification}
          onClose={onClose}
          onStatusChange={onStatusChange}
        />
      );

      const rejectRadio = screen.getByLabelText('Reject Verification');
      fireEvent.click(rejectRadio);

      expect(rejectRadio).toBeChecked();
      expect(screen.getByText('Rejection Reason')).toBeInTheDocument();
    });

    it('should show rejection reasons when reject is selected', () => {
      const onClose = jest.fn();
      const onStatusChange = jest.fn();

      render(
        <ApprovalWorkflow
          verification={mockVerification}
          onClose={onClose}
          onStatusChange={onStatusChange}
        />
      );

      const rejectRadio = screen.getByLabelText('Reject Verification');
      fireEvent.click(rejectRadio);

      expect(
        screen.getByText('Incomplete profile information')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Invalid business registration')
      ).toBeInTheDocument();
    });

    it('should close modal when cancel is clicked', () => {
      const onClose = jest.fn();
      const onStatusChange = jest.fn();

      render(
        <ApprovalWorkflow
          verification={mockVerification}
          onClose={onClose}
          onStatusChange={onStatusChange}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should disable submit button when no action is selected', () => {
      const onClose = jest.fn();
      const onStatusChange = jest.fn();

      render(
        <ApprovalWorkflow
          verification={mockVerification}
          onClose={onClose}
          onStatusChange={onStatusChange}
        />
      );

      const submitButton = screen.getByRole('button', {
        name: /approve|reject/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when reject is selected but no reason is provided', () => {
      const onClose = jest.fn();
      const onStatusChange = jest.fn();

      render(
        <ApprovalWorkflow
          verification={mockVerification}
          onClose={onClose}
          onStatusChange={onStatusChange}
        />
      );

      const rejectRadio = screen.getByLabelText('Reject Verification');
      fireEvent.click(rejectRadio);

      const submitButton = screen.getByRole('button', { name: /reject/i });
      expect(submitButton).toBeDisabled();
    });
  });
});

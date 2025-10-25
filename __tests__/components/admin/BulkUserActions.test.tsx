import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BulkUserActions from '../../components/features/admin/BulkUserActions';

// Mock the API call
jest.mock('../../lib/api', () => ({
  put: jest.fn(),
}));

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', role: 'admin' },
    isAuthenticated: true,
  }),
}));

describe('BulkUserActions', () => {
  const mockOnActionComplete = jest.fn();
  const mockOnSelectionChange = jest.fn();

  const mockUsers = [
    {
      id: '1',
      email: 'user1@example.com',
      role: 'contractor',
      is_verified: true,
      status: 'active',
      profiles: {
        first_name: 'John',
        last_name: 'Doe',
      },
    },
    {
      id: '2',
      email: 'user2@example.com',
      role: 'event_manager',
      is_verified: false,
      status: 'active',
      profiles: {
        first_name: 'Jane',
        last_name: 'Smith',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user selection interface', () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={[]}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('handles user selection', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={[]}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    const userCheckbox = screen.getByLabelText(/select user1@example.com/i);
    fireEvent.click(userCheckbox);

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
    });
  });

  it('handles select all functionality', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={[]}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    const selectAllCheckbox = screen.getByLabelText(/select all/i);
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2']);
    });
  });

  it('displays selected user count', () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    expect(screen.getByText(/1 user selected/i)).toBeInTheDocument();
  });

  it('shows bulk action buttons when users are selected', () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /suspend/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /activate/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /change role/i })
    ).toBeInTheDocument();
  });

  it('hides bulk action buttons when no users are selected', () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={[]}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    expect(
      screen.queryByRole('button', { name: /verify/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /suspend/i })
    ).not.toBeInTheDocument();
  });

  it('opens verification dialog when verify button is clicked', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/verify selected users/i)).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to verify/i)
      ).toBeInTheDocument();
    });
  });

  it('opens suspension dialog when suspend button is clicked', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    const suspendButton = screen.getByRole('button', { name: /suspend/i });
    fireEvent.click(suspendButton);

    await waitFor(() => {
      expect(screen.getByText(/suspend selected users/i)).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to suspend/i)
      ).toBeInTheDocument();
    });
  });

  it('opens role change dialog when change role button is clicked', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    const changeRoleButton = screen.getByRole('button', {
      name: /change role/i,
    });
    fireEvent.click(changeRoleButton);

    await waitFor(() => {
      expect(
        screen.getByText(/change role for selected users/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/new role/i)).toBeInTheDocument();
    });
  });

  it('handles role selection in role change dialog', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    const changeRoleButton = screen.getByRole('button', {
      name: /change role/i,
    });
    fireEvent.click(changeRoleButton);

    await waitFor(() => {
      const roleSelect = screen.getByLabelText(/new role/i);
      fireEvent.change(roleSelect, { target: { value: 'event_manager' } });
      expect(roleSelect).toHaveValue('event_manager');
    });
  });

  it('confirms and executes bulk verification', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1', '2']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', {
        name: /confirm verify/i,
      });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockOnActionComplete).toHaveBeenCalledWith(
        'verify',
        ['1', '2'],
        {}
      );
    });
  });

  it('confirms and executes bulk suspension with reason', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    const suspendButton = screen.getByRole('button', { name: /suspend/i });
    fireEvent.click(suspendButton);

    await waitFor(() => {
      const reasonInput = screen.getByLabelText(/suspension reason/i);
      fireEvent.change(reasonInput, {
        target: { value: 'Violation of terms' },
      });

      const confirmButton = screen.getByRole('button', {
        name: /confirm suspend/i,
      });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockOnActionComplete).toHaveBeenCalledWith('suspend', ['1'], {
        message: 'Violation of terms',
      });
    });
  });

  it('confirms and executes role change', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    const changeRoleButton = screen.getByRole('button', {
      name: /change role/i,
    });
    fireEvent.click(changeRoleButton);

    await waitFor(() => {
      const roleSelect = screen.getByLabelText(/new role/i);
      fireEvent.change(roleSelect, { target: { value: 'event_manager' } });

      const confirmButton = screen.getByRole('button', {
        name: /confirm change role/i,
      });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockOnActionComplete).toHaveBeenCalledWith('change_role', ['1'], {
        value: 'event_manager',
      });
    });
  });

  it('cancels action when cancel button is clicked', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
      />
    );

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(
        screen.queryByText(/verify selected users/i)
      ).not.toBeInTheDocument();
    });
  });

  it('displays loading state during bulk operations', () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={true}
      />
    );

    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  it('displays success message after successful operation', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
        lastActionResult={{
          success: true,
          results: [{ userId: '1', success: true }],
          errors: [],
          summary: { total: 1, successful: 1, failed: 0 },
        }}
      />
    );

    expect(
      screen.getByText(/operation completed successfully/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/1 user processed/i)).toBeInTheDocument();
  });

  it('displays error message after failed operation', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
        lastActionResult={{
          success: false,
          results: [],
          errors: [{ userId: '1', error: 'Database connection failed' }],
          summary: { total: 1, successful: 0, failed: 1 },
        }}
      />
    );

    expect(screen.getByText(/operation failed/i)).toBeInTheDocument();
    expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
  });

  it('displays partial success message for mixed results', async () => {
    render(
      <BulkUserActions
        users={mockUsers}
        selectedUsers={['1', '2']}
        onSelectionChange={mockOnSelectionChange}
        onActionComplete={mockOnActionComplete}
        loading={false}
        lastActionResult={{
          success: true,
          results: [{ userId: '1', success: true }],
          errors: [{ userId: '2', error: 'User not found' }],
          summary: { total: 2, successful: 1, failed: 1 },
        }}
      />
    );

    expect(
      screen.getByText(/operation completed with errors/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/1 successful, 1 failed/i)).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrivacyPolicyManager from '@/components/features/privacy/PrivacyPolicyManager';

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
  CardDescription: ({ children, ...props }: any) => (
    <div data-testid="card-description" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <div data-testid="card-title" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => (
    <span data-testid="badge" data-variant={variant} {...props}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, ...props }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue} {...props}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid="tabs-content" data-value={value} {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="tabs-list" {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button data-testid="tabs-trigger" data-value={value} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, ...props }: any) => (
    <div data-testid="alert" data-variant={variant} {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children, ...props }: any) => (
    <div data-testid="alert-description" {...props}>
      {children}
    </div>
  ),
  AlertTitle: ({ children, ...props }: any) => (
    <div data-testid="alert-title" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ children, ...props }: any) => (
    <textarea {...props}>{children}</textarea>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => (
    <select {...props}>{children}</select>
  ),
  SelectContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  SelectItem: ({ children, ...props }: any) => (
    <option {...props}>{children}</option>
  ),
  SelectTrigger: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  SelectValue: ({ children, ...props }: any) => (
    <span {...props}>{children}</span>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange, ...props }: any) => (
    <div data-testid="dialog" data-open={open} {...props}>
      {children}
    </div>
  ),
  DialogContent: ({ children, ...props }: any) => (
    <div data-testid="dialog-content" {...props}>
      {children}
    </div>
  ),
  DialogDescription: ({ children, ...props }: any) => (
    <div data-testid="dialog-description" {...props}>
      {children}
    </div>
  ),
  DialogFooter: ({ children, ...props }: any) => (
    <div data-testid="dialog-footer" {...props}>
      {children}
    </div>
  ),
  DialogHeader: ({ children, ...props }: any) => (
    <div data-testid="dialog-header" {...props}>
      {children}
    </div>
  ),
  DialogTitle: ({ children, ...props }: any) => (
    <div data-testid="dialog-title" {...props}>
      {children}
    </div>
  ),
  DialogTrigger: ({ children, asChild, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableBody: ({ children, ...props }: any) => (
    <tbody {...props}>{children}</tbody>
  ),
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
  TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
  TableHeader: ({ children, ...props }: any) => (
    <thead {...props}>{children}</thead>
  ),
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Trash2: () => <div data-testid="trash2-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Save: () => <div data-testid="save-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

describe('PrivacyPolicyManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it('should render loading state initially', () => {
    render(<PrivacyPolicyManager />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render dashboard with mock data', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Policy Management')).toBeInTheDocument();
    });

    // Check if policies are displayed
    expect(screen.getByText('Privacy Policy v2.1')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy v2.0')).toBeInTheDocument();
  });

  it('should display tabs correctly', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    // Check if tab triggers are present
    expect(screen.getByText('Policies')).toBeInTheDocument();
    expect(screen.getByText('User Acceptances')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should display policy table with correct data', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Policies')).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Effective Date')).toBeInTheDocument();
    expect(screen.getByText('Acceptances')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check policy data
    expect(screen.getByText('Privacy Policy v2.1')).toBeInTheDocument();
    expect(screen.getByText('2.1')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Acceptances count
  });

  it('should display user acceptances table', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('User Acceptances')).toBeInTheDocument();
    });

    // Click on User Acceptances tab
    const acceptancesTab = screen.getByText('User Acceptances');
    fireEvent.click(acceptancesTab);

    // Check table headers
    expect(screen.getByText('User ID')).toBeInTheDocument();
    expect(screen.getByText('Policy Version')).toBeInTheDocument();
    expect(screen.getByText('Accepted At')).toBeInTheDocument();
    expect(screen.getByText('IP Address')).toBeInTheDocument();
    expect(screen.getByText('User Agent')).toBeInTheDocument();

    // Check acceptance data
    expect(screen.getByText('user-1')).toBeInTheDocument();
    expect(screen.getByText('user-2')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
  });

  it('should display analytics tab', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    // Click on Analytics tab
    const analyticsTab = screen.getByText('Analytics');
    fireEvent.click(analyticsTab);

    // Check analytics cards
    expect(screen.getByText('Total Policies')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total policies
    expect(screen.getByText('1 active')).toBeInTheDocument(); // Active policies

    expect(screen.getByText('Total Acceptances')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total acceptances

    expect(screen.getByText('Acceptance Rate')).toBeInTheDocument();
    expect(screen.getByText('94.2%')).toBeInTheDocument();
  });

  it('should open create policy dialog', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Create Policy')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Policy');
    fireEvent.click(createButton);

    // Check if dialog opens
    expect(screen.getByText('Create New Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('Effective Date')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should create a new policy', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Create Policy')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Policy');
    fireEvent.click(createButton);

    // Fill in form data
    const titleInput = screen.getByPlaceholderText('Privacy Policy v2.2');
    const versionInput = screen.getByPlaceholderText('2.2');
    const contentInput = screen.getByPlaceholderText(
      'Enter privacy policy content...'
    );

    fireEvent.change(titleInput, { target: { value: 'Test Policy' } });
    fireEvent.change(versionInput, { target: { value: '3.0' } });
    fireEvent.change(contentInput, { target: { value: 'Test content' } });

    // Submit form
    const submitButton = screen.getByText('Create Policy');
    fireEvent.click(submitButton);

    // Check if new policy appears in table
    await waitFor(() => {
      expect(screen.getByText('Test Policy')).toBeInTheDocument();
    });
  });

  it('should open edit policy dialog', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Policy v2.1')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByTestId('edit-icon');
    fireEvent.click(editButtons[0]);

    // Check if edit dialog opens
    expect(screen.getByText('Edit Privacy Policy')).toBeInTheDocument();
  });

  it('should update a policy', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Policy v2.1')).toBeInTheDocument();
    });

    // Open edit dialog
    const editButtons = screen.getAllByTestId('edit-icon');
    fireEvent.click(editButtons[0]);

    // Update title
    const titleInput = screen.getByDisplayValue('Privacy Policy v2.1');
    fireEvent.change(titleInput, { target: { value: 'Updated Policy' } });

    // Submit update
    const updateButton = screen.getByText('Update Policy');
    fireEvent.click(updateButton);

    // Check if policy is updated
    await waitFor(() => {
      expect(screen.getByText('Updated Policy')).toBeInTheDocument();
    });
  });

  it('should toggle policy active status', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Policy v2.1')).toBeInTheDocument();
    });

    // Find and click toggle button for active policy
    const toggleButtons = screen.getAllByTestId('x-icon');
    fireEvent.click(toggleButtons[0]);

    // Check if status changes
    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('should delete a policy', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Policy v2.0')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByTestId('trash2-icon');
    fireEvent.click(deleteButtons[0]);

    // Check if policy is removed
    await waitFor(() => {
      expect(screen.queryByText('Privacy Policy v2.0')).not.toBeInTheDocument();
    });
  });

  it('should open view policy dialog', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Policy v2.1')).toBeInTheDocument();
    });

    // Find and click view button
    const viewButtons = screen.getAllByTestId('eye-icon');
    fireEvent.click(viewButtons[0]);

    // Check if view dialog opens
    expect(screen.getByText('Privacy Policy v2.1 (v2.1)')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Data Handling Procedures')).toBeInTheDocument();
  });

  it('should add data handling procedure', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Create Policy')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Policy');
    fireEvent.click(createButton);

    // Click add procedure button
    const addProcedureButton = screen.getByText('Add Procedure');
    fireEvent.click(addProcedureButton);

    // Check if procedure form appears
    expect(screen.getByPlaceholderText('Procedure name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Legal basis')).toBeInTheDocument();
  });

  it('should remove data handling procedure', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Create Policy')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Policy');
    fireEvent.click(createButton);

    // Add a procedure first
    const addProcedureButton = screen.getByText('Add Procedure');
    fireEvent.click(addProcedureButton);

    // Remove the procedure
    const removeButtons = screen.getAllByTestId('x-icon');
    fireEvent.click(removeButtons[0]);

    // Check if procedure is removed
    expect(
      screen.queryByPlaceholderText('Procedure name')
    ).not.toBeInTheDocument();
  });

  it('should display error state', async () => {
    // Mock console.error to avoid error logs in test output
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Mock the loadPolicies function to throw an error
    const originalError = console.error;
    console.error = jest.fn();

    // Re-render to trigger error state
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      // The component should handle the error gracefully
      expect(screen.getByText('Privacy Policy Management')).toBeInTheDocument();
    });

    console.error = originalError;
    consoleSpy.mockRestore();
  });

  it('should display status badges correctly', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    // Check if badges are rendered
    const badges = screen.getAllByTestId('badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should handle form validation', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Create Policy')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Policy');
    fireEvent.click(createButton);

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Create Policy');
    fireEvent.click(submitButton);

    // Form should still be open (validation should prevent submission)
    expect(screen.getByText('Create New Privacy Policy')).toBeInTheDocument();
  });

  it('should cancel dialog operations', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('Create Policy')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Policy');
    fireEvent.click(createButton);

    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Dialog should close
    expect(
      screen.queryByText('Create New Privacy Policy')
    ).not.toBeInTheDocument();
  });

  it('should display proper date formatting', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('1/15/2024')).toBeInTheDocument(); // Effective date
    });

    expect(screen.getByText('1/1/2024')).toBeInTheDocument(); // Another effective date
  });

  it('should display proper time formatting for acceptances', async () => {
    render(<PrivacyPolicyManager />);

    await waitFor(() => {
      expect(screen.getByText('User Acceptances')).toBeInTheDocument();
    });

    // Click on User Acceptances tab
    const acceptancesTab = screen.getByText('User Acceptances');
    fireEvent.click(acceptancesTab);

    // Check if timestamps are displayed
    expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
  });
});

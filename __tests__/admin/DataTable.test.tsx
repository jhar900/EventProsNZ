import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataTable, {
  StatusBadge,
  DateCell,
  EmailCell,
} from '@/components/features/admin/DataTable';

const mockData = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'inactive',
    role: 'user',
    created_at: '2024-01-02T00:00:00Z',
  },
];

const mockColumns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'role', label: 'Role' },
  { key: 'created_at', label: 'Created' },
];

describe('DataTable', () => {
  it('should render table with data', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    render(<DataTable data={[]} columns={mockColumns} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should render custom empty message', () => {
    render(
      <DataTable
        data={[]}
        columns={mockColumns}
        emptyMessage="No users found"
      />
    );

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('should handle search functionality', () => {
    render(
      <DataTable data={mockData} columns={mockColumns} searchable={true} />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('should handle sorting', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Should sort by name
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should handle pagination', () => {
    const pagination = {
      page: 1,
      limit: 1,
      total: 2,
      onPageChange: jest.fn(),
      onLimitChange: jest.fn(),
    };

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        pagination={pagination}
      />
    );

    expect(screen.getByText('Showing 1 to 1 of 2 entries')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(pagination.onPageChange).toHaveBeenCalledWith(2);
  });

  it('should render custom cell content', () => {
    const columnsWithRender = [
      {
        key: 'name',
        label: 'Name',
        render: (value: string) => <strong>{value}</strong>,
      },
      { key: 'email', label: 'Email' },
    ];

    render(<DataTable data={mockData} columns={columnsWithRender} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('John Doe').tagName).toBe('STRONG');
  });

  it('should handle actions dropdown', () => {
    const actions = (row: any) => (
      <>
        <div>Edit {row.name}</div>
        <div>Delete {row.name}</div>
      </>
    );

    render(
      <DataTable data={mockData} columns={mockColumns} actions={actions} />
    );

    const actionButtons = screen.getAllByRole('button');
    expect(actionButtons).toHaveLength(2); // One for each row
  });

  it('should show loading state', () => {
    render(<DataTable data={[]} columns={mockColumns} loading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle export functionality', () => {
    const onExport = jest.fn();

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        exportable={true}
        onExport={onExport}
      />
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    expect(onExport).toHaveBeenCalled();
  });

  it('should disable search when searchable is false', () => {
    render(
      <DataTable data={mockData} columns={mockColumns} searchable={false} />
    );

    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('should render active status with green color', () => {
    render(<StatusBadge status="active" />);

    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should render pending status with yellow color', () => {
    render(<StatusBadge status="pending" />);

    const badge = screen.getByText('Pending');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('should render rejected status with red color', () => {
    render(<StatusBadge status="rejected" />);

    const badge = screen.getByText('Rejected');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should capitalize status text', () => {
    render(<StatusBadge status="verified" />);

    expect(screen.getByText('Verified')).toBeInTheDocument();
  });
});

describe('DateCell', () => {
  it('should format date correctly', () => {
    const testDate = '2024-01-15T10:30:00Z';
    render(<DateCell date={testDate} />);

    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('should handle Date object', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');
    render(<DateCell date={testDate} />);

    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });
});

describe('EmailCell', () => {
  it('should render email as link', () => {
    const testEmail = 'test@example.com';
    render(<EmailCell email={testEmail} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `mailto:${testEmail}`);
    expect(link).toHaveTextContent(testEmail);
  });

  it('should have proper styling', () => {
    const testEmail = 'test@example.com';
    render(<EmailCell email={testEmail} />);

    const link = screen.getByRole('link');
    expect(link).toHaveClass(
      'text-blue-600',
      'hover:text-blue-800',
      'underline'
    );
  });
});

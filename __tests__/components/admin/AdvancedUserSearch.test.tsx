import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvancedUserSearch from '../../components/features/admin/AdvancedUserSearch';

// Mock the API call
jest.mock('../../lib/api', () => ({
  get: jest.fn(),
}));

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', role: 'admin' },
    isAuthenticated: true,
  }),
}));

describe('AdvancedUserSearch', () => {
  const mockOnSearch = jest.fn();
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search form with all filter options', () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={[]}
        total={0}
      />
    );

    expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/verification/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subscription/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last login/i)).toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={[]}
        total={0}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search users/i);
    fireEvent.change(searchInput, { target: { value: 'john@example.com' } });

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        'search',
        'john@example.com'
      );
    });
  });

  it('handles role filter changes', async () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={[]}
        total={0}
      />
    );

    const roleSelect = screen.getByLabelText(/role/i);
    fireEvent.change(roleSelect, { target: { value: 'contractor' } });

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith('role', 'contractor');
    });
  });

  it('handles status filter changes', async () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={[]}
        total={0}
      />
    );

    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.change(statusSelect, { target: { value: 'verified' } });

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith('status', 'verified');
    });
  });

  it('handles date range filter changes', async () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={[]}
        total={0}
      />
    );

    const dateFromInput = screen.getByLabelText(/date from/i);
    fireEvent.change(dateFromInput, { target: { value: '2024-01-01' } });

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith('dateFrom', '2024-01-01');
    });
  });

  it('handles sort options', async () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={[]}
        total={0}
      />
    );

    const sortBySelect = screen.getByLabelText(/sort by/i);
    fireEvent.change(sortBySelect, { target: { value: 'last_login' } });

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith('sortBy', 'last_login');
    });

    const sortOrderSelect = screen.getByLabelText(/sort order/i);
    fireEvent.change(sortOrderSelect, { target: { value: 'asc' } });

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith('sortOrder', 'asc');
    });
  });

  it('triggers search when search button is clicked', async () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={[]}
        total={0}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });
  });

  it('triggers search when Enter key is pressed in search input', async () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={[]}
        total={0}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search users/i);
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });
  });

  it('clears all filters when clear button is clicked', async () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={[]}
        total={0}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith('search', '');
      expect(mockOnFilterChange).toHaveBeenCalledWith('role', 'all');
      expect(mockOnFilterChange).toHaveBeenCalledWith('status', 'all');
      expect(mockOnFilterChange).toHaveBeenCalledWith('verification', 'all');
    });
  });

  it('displays loading state', () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={true}
        results={[]}
        total={0}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays search results', () => {
    const mockResults = [
      {
        id: '1',
        email: 'user1@example.com',
        role: 'contractor',
        is_verified: true,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
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
        created_at: '2024-01-02T00:00:00Z',
        profiles: {
          first_name: 'Jane',
          last_name: 'Smith',
        },
      },
    ];

    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={mockResults}
        total={2}
      />
    );

    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays no results message when no users found', () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={[]}
        total={0}
      />
    );

    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  it('handles pagination', async () => {
    const mockResults = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: 'contractor',
      is_verified: true,
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
    }));

    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={mockResults}
        total={50}
        limit={10}
        offset={0}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith('offset', 10);
    });
  });

  it('saves and loads search filters', async () => {
    render(
      <AdvancedUserSearch
        onSearch={mockOnSearch}
        onFilterChange={mockOnFilterChange}
        loading={false}
        results={[]}
        total={0}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save search/i });
    fireEvent.click(saveButton);

    // This would test the save functionality
    // Implementation would depend on the actual component logic
  });
});

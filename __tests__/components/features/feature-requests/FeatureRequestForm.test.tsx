import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeatureRequestForm from '@/components/features/feature-requests/FeatureRequestForm';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('FeatureRequestForm', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  const mockCategories = [
    {
      id: '1',
      name: 'UI/UX',
      description: 'User interface improvements',
      color: '#3B82F6',
    },
    {
      id: '2',
      name: 'Performance',
      description: 'Performance optimizations',
      color: '#10B981',
    },
  ];

  it('renders form fields correctly', () => {
    render(<FeatureRequestForm />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<FeatureRequestForm />);

    const submitButton = screen.getByRole('button', {
      name: /submit request/i,
    });
    await user.click(submitButton);

    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    expect(screen.getByText(/category is required/i)).toBeInTheDocument();
  });

  it('validates title length', async () => {
    const user = userEvent.setup();
    render(<FeatureRequestForm />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Short');

    const submitButton = screen.getByRole('button', {
      name: /submit request/i,
    });
    await user.click(submitButton);

    expect(
      screen.getByText(/title must be at least 10 characters/i)
    ).toBeInTheDocument();
  });

  it('validates description length', async () => {
    const user = userEvent.setup();
    render(<FeatureRequestForm />);

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Too short');

    const submitButton = screen.getByRole('button', {
      name: /submit request/i,
    });
    await user.click(submitButton);

    expect(
      screen.getByText(/description must be at least 50 characters/i)
    ).toBeInTheDocument();
  });

  it('loads categories on mount', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    });

    render(<FeatureRequestForm />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/feature-requests/categories');
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', title: 'Test Request' }),
      });

    render(<FeatureRequestForm onSubmit={mockOnSubmit} />);

    // Fill form
    await user.type(screen.getByLabelText(/title/i), 'Test Feature Request');
    await user.type(
      screen.getByLabelText(/description/i),
      'This is a detailed description of the feature request that meets the minimum length requirement'
    );

    // Select category
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('UI/UX'));

    const submitButton = screen.getByRole('button', {
      name: /submit request/i,
    });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'Test Feature Request',
      description:
        'This is a detailed description of the feature request that meets the minimum length requirement',
      category_id: '1',
      priority: 'medium',
      tags: [],
      is_public: true,
    });
  });

  it('adds and removes tags', async () => {
    const user = userEvent.setup();
    render(<FeatureRequestForm />);

    const tagInput = screen.getByPlaceholderText(/add a tag/i);
    await user.type(tagInput, 'test-tag');
    await user.keyboard('{Enter}');

    expect(screen.getByText('test-tag')).toBeInTheDocument();

    const removeButton = screen.getByRole('button', {
      name: /remove test-tag/i,
    });
    await user.click(removeButton);

    expect(screen.queryByText('test-tag')).not.toBeInTheDocument();
  });

  it('saves draft to localStorage', async () => {
    const user = userEvent.setup();
    const mockOnSave = jest.fn();

    render(<FeatureRequestForm onSave={mockOnSave} />);

    // Fill form
    await user.type(screen.getByLabelText(/title/i), 'Test Feature Request');
    await user.type(
      screen.getByLabelText(/description/i),
      'This is a detailed description of the feature request that meets the minimum length requirement'
    );

    const saveButton = screen.getByRole('button', { name: /save draft/i });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('shows character count', async () => {
    const user = userEvent.setup();
    render(<FeatureRequestForm />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Test Title');

    expect(screen.getByText('10/200 characters')).toBeInTheDocument();
  });
});

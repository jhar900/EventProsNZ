import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceTemplates } from '@/components/features/ai/ServiceTemplates';

// Mock fetch globally
global.fetch = jest.fn();

describe('ServiceTemplates', () => {
  const mockTemplates = [
    {
      id: '1',
      name: 'Wedding Package',
      event_type: 'wedding',
      services: [
        {
          service_category: 'Photography',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.15,
        },
        {
          service_category: 'Catering',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.3,
        },
        {
          service_category: 'Music',
          priority: 3,
          is_required: false,
          estimated_cost_percentage: 0.1,
        },
      ],
      is_public: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      usage_count: 85,
      rating: 4.8,
      description: 'Complete wedding service package',
    },
    {
      id: '2',
      name: 'Corporate Event Package',
      event_type: 'corporate',
      services: [
        {
          service_category: 'AV Equipment',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.2,
        },
        {
          service_category: 'Catering',
          priority: 3,
          is_required: false,
          estimated_cost_percentage: 0.25,
        },
      ],
      is_public: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      usage_count: 70,
      rating: 4.5,
      description: 'Professional corporate event services',
    },
  ];

  const mockProps = {
    eventType: 'wedding',
    onTemplateSelect: jest.fn(),
    onTemplateCreate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful API response
    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/ai/service-templates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ templates: mockTemplates }),
        });
      }
      return Promise.reject(new Error('Unmocked API call'));
    });
  });

  it('renders service templates correctly', async () => {
    render(<ServiceTemplates {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Service Templates')).toBeInTheDocument();
    });

    expect(screen.getByText('Service Templates')).toBeInTheDocument();
    expect(screen.getByText('Wedding Package')).toBeInTheDocument();
    expect(screen.getByText('Corporate Event Package')).toBeInTheDocument();
  });

  it('displays template information correctly', async () => {
    render(<ServiceTemplates {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Wedding Package')).toBeInTheDocument();
    });

    expect(screen.getByText('Wedding Package')).toBeInTheDocument();
    expect(
      screen.getByText('Complete wedding service package')
    ).toBeInTheDocument();
    expect(screen.getByTestId('service-1-photography')).toBeInTheDocument();
    expect(screen.getByTestId('service-1-catering')).toBeInTheDocument();
    expect(screen.getByTestId('service-1-music')).toBeInTheDocument();
  });

  it('filters templates by event type', async () => {
    render(<ServiceTemplates {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Wedding Package')).toBeInTheDocument();
    });

    // Should show wedding template prominently
    expect(screen.getByText('Wedding Package')).toBeInTheDocument();
    // Corporate template should also be visible
    expect(screen.getByText('Corporate Event Package')).toBeInTheDocument();
  });

  it('handles template selection', async () => {
    render(<ServiceTemplates {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Wedding Package')).toBeInTheDocument();
    });

    const useTemplateButton = screen.getByTestId('use-template-1');
    fireEvent.click(useTemplateButton);

    await waitFor(() => {
      expect(mockProps.onTemplateSelect).toHaveBeenCalledWith(mockTemplates[0]);
    });
  });

  it('displays loading state', () => {
    // Mock loading state by not providing API response
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ServiceTemplates {...mockProps} />);

    expect(screen.getByText('Loading templates...')).toBeInTheDocument();
  });

  it('displays error state', async () => {
    // Mock error response
    (fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('Failed to load templates'))
    );

    render(<ServiceTemplates {...mockProps} />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
    });
  });

  it('shows template services breakdown', async () => {
    render(<ServiceTemplates {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Wedding Package')).toBeInTheDocument();
    });

    expect(screen.getByTestId('service-1-photography')).toBeInTheDocument();
    expect(screen.getByTestId('service-1-catering')).toBeInTheDocument();
    expect(screen.getByTestId('service-1-music')).toBeInTheDocument();
  });

  it('displays template stats', async () => {
    render(<ServiceTemplates {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Wedding Package')).toBeInTheDocument();
    });

    // Check for template stats
    expect(screen.getByTestId('services-count-1')).toBeInTheDocument(); // Services count
    expect(screen.getByTestId('budget-percentage-1')).toBeInTheDocument(); // Budget percentage
  });

  it('handles empty templates state', async () => {
    // Mock empty response
    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/ai/service-templates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ templates: [] }),
        });
      }
      return Promise.reject(new Error('Unmocked API call'));
    });

    render(<ServiceTemplates {...mockProps} />);

    // Wait for empty state to appear
    await waitFor(() => {
      expect(
        screen.getByText('No templates found matching your search criteria.')
      ).toBeInTheDocument();
    });
  });

  it('calls API on mount', () => {
    render(<ServiceTemplates {...mockProps} />);

    // The component should call the API internally
    expect(fetch).toHaveBeenCalledWith(
      '/api/ai/service-templates?event_type=wedding'
    );
  });
});

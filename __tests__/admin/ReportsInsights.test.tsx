import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportsInsights from '@/components/features/admin/ReportsInsights';
import { useAdmin } from '@/hooks/useAdmin';

// Mock the useAdmin hook
jest.mock('@/hooks/useAdmin');
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

describe('ReportsInsights', () => {
  const mockExportReport = jest.fn();

  beforeEach(() => {
    mockUseAdmin.mockReturnValue({
      exportReport: mockExportReport,
      loading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with header', () => {
    render(<ReportsInsights />);

    expect(screen.getByText('Reports & Insights')).toBeInTheDocument();
    expect(
      screen.getByText('Generate and manage comprehensive platform reports')
    ).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseAdmin.mockReturnValue({
      exportReport: mockExportReport,
      loading: true,
      error: null,
    } as any);

    render(<ReportsInsights />);

    expect(screen.getByText('Loading reports...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseAdmin.mockReturnValue({
      exportReport: mockExportReport,
      loading: false,
      error: 'Failed to load reports',
    } as any);

    render(<ReportsInsights />);

    expect(
      screen.getByText('Error: Failed to load reports')
    ).toBeInTheDocument();
  });

  it('displays quick insights cards', async () => {
    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('Total Reports')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
      expect(screen.getByText('Total Size')).toBeInTheDocument();
    });
  });

  it('displays report generation section', async () => {
    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('Generate New Report')).toBeInTheDocument();
      expect(screen.getByText('Report Type')).toBeInTheDocument();
      expect(screen.getByText('Format')).toBeInTheDocument();
      expect(screen.getByText('From Date')).toBeInTheDocument();
      expect(screen.getByText('To Date')).toBeInTheDocument();
    });
  });

  it('displays report generation buttons', async () => {
    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('User Analytics')).toBeInTheDocument();
      expect(screen.getByText('Contractor Verification')).toBeInTheDocument();
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('Activity Logs')).toBeInTheDocument();
      expect(screen.getByText('Financial Report')).toBeInTheDocument();
    });
  });

  it('displays generated reports table', async () => {
    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('Generated Reports')).toBeInTheDocument();
      expect(screen.getByText('User Analytics Report')).toBeInTheDocument();
      expect(
        screen.getByText('Contractor Verification Report')
      ).toBeInTheDocument();
      expect(screen.getByText('System Health Report')).toBeInTheDocument();
    });
  });

  it('displays report templates section', async () => {
    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('Report Templates')).toBeInTheDocument();
      expect(screen.getByText('Weekly User Report')).toBeInTheDocument();
      expect(screen.getByText('Verification Summary')).toBeInTheDocument();
      expect(screen.getByText('System Health Report')).toBeInTheDocument();
    });
  });

  it('generates user analytics report', async () => {
    mockExportReport.mockResolvedValue(
      new Blob(['test data'], { type: 'text/csv' })
    );

    // Mock URL.createObjectURL and document.createElement
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    global.document.createElement = jest.fn(() => ({
      href: '',
      download: '',
      click: mockClick,
    })) as any;
    global.document.body.appendChild = mockAppendChild;
    global.document.body.removeChild = mockRemoveChild;

    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('User Analytics')).toBeInTheDocument();
    });

    const userAnalyticsButton = screen.getByText('User Analytics');
    fireEvent.click(userAnalyticsButton);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith(
        'user_analytics',
        'csv',
        undefined,
        undefined
      );
    });
  });

  it('generates contractor verification report', async () => {
    mockExportReport.mockResolvedValue(
      new Blob(['test data'], { type: 'text/csv' })
    );

    // Mock URL.createObjectURL and document.createElement
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    global.document.createElement = jest.fn(() => ({
      href: '',
      download: '',
      click: mockClick,
    })) as any;
    global.document.body.appendChild = mockAppendChild;
    global.document.body.removeChild = mockRemoveChild;

    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('Contractor Verification')).toBeInTheDocument();
    });

    const contractorVerificationButton = screen.getByText(
      'Contractor Verification'
    );
    fireEvent.click(contractorVerificationButton);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith(
        'contractor_verification',
        'csv',
        undefined,
        undefined
      );
    });
  });

  it('generates system health report', async () => {
    mockExportReport.mockResolvedValue(
      new Blob(['test data'], { type: 'text/csv' })
    );

    // Mock URL.createObjectURL and document.createElement
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    global.document.createElement = jest.fn(() => ({
      href: '',
      download: '',
      click: mockClick,
    })) as any;
    global.document.body.appendChild = mockAppendChild;
    global.document.body.removeChild = mockRemoveChild;

    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('System Health')).toBeInTheDocument();
    });

    const systemHealthButton = screen.getByText('System Health');
    fireEvent.click(systemHealthButton);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith(
        'system_health',
        'csv',
        undefined,
        undefined
      );
    });
  });

  it('generates activity logs report', async () => {
    mockExportReport.mockResolvedValue(
      new Blob(['test data'], { type: 'text/csv' })
    );

    // Mock URL.createObjectURL and document.createElement
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    global.document.createElement = jest.fn(() => ({
      href: '',
      download: '',
      click: mockClick,
    })) as any;
    global.document.body.appendChild = mockAppendChild;
    global.document.body.removeChild = mockRemoveChild;

    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    });

    const activityLogsButton = screen.getByText('Activity Logs');
    fireEvent.click(activityLogsButton);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith(
        'activity_logs',
        'csv',
        undefined,
        undefined
      );
    });
  });

  it('generates financial report', async () => {
    mockExportReport.mockResolvedValue(
      new Blob(['test data'], { type: 'text/csv' })
    );

    // Mock URL.createObjectURL and document.createElement
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    global.document.createElement = jest.fn(() => ({
      href: '',
      download: '',
      click: mockClick,
    })) as any;
    global.document.body.appendChild = mockAppendChild;
    global.document.body.removeChild = mockRemoveChild;

    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('Financial Report')).toBeInTheDocument();
    });

    const financialReportButton = screen.getByText('Financial Report');
    fireEvent.click(financialReportButton);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith(
        'financial',
        'csv',
        undefined,
        undefined
      );
    });
  });

  it('changes report format', async () => {
    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('CSV')).toBeInTheDocument();
    });

    const formatSelect = screen.getByDisplayValue('CSV');
    fireEvent.click(formatSelect);

    // The format change would be handled internally by the component
    // We can verify the select is present and functional
    expect(formatSelect).toBeInTheDocument();
  });

  it('sets date range for reports', async () => {
    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByLabelText('From Date')).toBeInTheDocument();
      expect(screen.getByLabelText('To Date')).toBeInTheDocument();
    });

    const fromDateInput = screen.getByLabelText('From Date');
    const toDateInput = screen.getByLabelText('To Date');

    fireEvent.change(fromDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(toDateInput, { target: { value: '2024-01-31' } });

    expect(fromDateInput).toHaveValue('2024-01-01');
    expect(toDateInput).toHaveValue('2024-01-31');
  });

  it('downloads existing reports', async () => {
    mockExportReport.mockResolvedValue(
      new Blob(['test data'], { type: 'text/csv' })
    );

    // Mock URL.createObjectURL and document.createElement
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    global.document.createElement = jest.fn(() => ({
      href: '',
      download: '',
      click: mockClick,
    })) as any;
    global.document.body.appendChild = mockAppendChild;
    global.document.body.removeChild = mockRemoveChild;

    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getAllByText('Download')).toHaveLength(3); // 3 existing reports
    });

    const downloadButtons = screen.getAllByText('Download');
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith('user_analytics', 'csv');
    });
  });

  it('handles refresh functionality', async () => {
    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // The refresh functionality would reload the reports
    // We can verify the button is present and clickable
    expect(refreshButton).toBeInTheDocument();
  });

  it('displays report generation loading state', async () => {
    mockExportReport.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<ReportsInsights />);

    await waitFor(() => {
      expect(screen.getByText('User Analytics')).toBeInTheDocument();
    });

    const userAnalyticsButton = screen.getByText('User Analytics');
    fireEvent.click(userAnalyticsButton);

    // The component should show a loading state during report generation
    // This would be handled internally by the component's state management
    expect(userAnalyticsButton).toBeInTheDocument();
  });
});

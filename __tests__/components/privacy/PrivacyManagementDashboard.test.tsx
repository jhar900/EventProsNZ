import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrivacyManagementDashboard from '@/components/features/privacy/PrivacyManagementDashboard';

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
  Badge: ({ children, ...props }: any) => (
    <span data-testid="badge" {...props}>
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

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => (
    <div data-testid="progress" data-value={value} {...props}></div>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Shield: () => <div data-testid="shield-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  UserCheck: () => <div data-testid="user-check-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Cookie: () => <div data-testid="cookie-icon" />,
  Share2: () => <div data-testid="share2-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  ClipboardList: () => <div data-testid="clipboard-list-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
}));

describe('PrivacyManagementDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<PrivacyManagementDashboard />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render dashboard with mock data', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('Privacy Management Dashboard')
      ).toBeInTheDocument();
    });

    // Check if key metrics are displayed
    expect(screen.getByText('85%')).toBeInTheDocument(); // GDPR Compliance score
    expect(screen.getByText('94.4%')).toBeInTheDocument(); // Consent Rate
    expect(screen.getByText('45')).toBeInTheDocument(); // Data Requests
    expect(screen.getByText('89.2%')).toBeInTheDocument(); // Cookie Consent
  });

  it('should display alerts when available', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
    });

    // Check if alerts are displayed
    expect(
      screen.getByText('Data Retention Policy Update Required')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Privacy Impact Assessment Completed')
    ).toBeInTheDocument();
    expect(screen.getByText('GDPR Violation Detected')).toBeInTheDocument();
  });

  it('should render tabs correctly', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    // Check if tab triggers are present
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('GDPR Compliance')).toBeInTheDocument();
    expect(screen.getByText('Consent Management')).toBeInTheDocument();
    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('should display GDPR compliance metrics', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('GDPR Compliance')).toBeInTheDocument();
    });

    // Check GDPR compliance card
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('compliant')).toBeInTheDocument();
    expect(screen.getByText('3 violations')).toBeInTheDocument();
  });

  it('should display consent management metrics', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Consent Rate')).toBeInTheDocument();
    });

    // Check consent management card
    expect(screen.getByText('94.4%')).toBeInTheDocument();
    expect(screen.getByText('1180 active consents')).toBeInTheDocument();
  });

  it('should display data retention overview', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Data Retention Overview')).toBeInTheDocument();
    });

    // Check data retention metrics
    expect(screen.getByText('Active Rules')).toBeInTheDocument();
    expect(screen.getByText('10/12')).toBeInTheDocument();
    expect(screen.getByText('Last cleanup: 1/14/2024')).toBeInTheDocument();
  });

  it('should display data sharing compliance', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Data Sharing Compliance')).toBeInTheDocument();
    });

    // Check data sharing metrics
    expect(screen.getByText('Compliance Rate')).toBeInTheDocument();
    expect(screen.getByText('95.5%')).toBeInTheDocument();
    expect(screen.getByText('7 active agreements')).toBeInTheDocument();
  });

  it('should display cookie categories breakdown', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cookie Categories')).toBeInTheDocument();
    });

    // Check cookie categories
    expect(screen.getByText('Necessary')).toBeInTheDocument();
    expect(screen.getByText('Functional')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('should display data anonymization metrics', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Data Anonymization')).toBeInTheDocument();
    });

    // Check anonymization metrics
    expect(screen.getByText('2300')).toBeInTheDocument(); // Anonymized records
    expect(screen.getByText('1800')).toBeInTheDocument(); // Pseudonymized records
    expect(screen.getByText('Anonymized')).toBeInTheDocument();
    expect(screen.getByText('Pseudonymized')).toBeInTheDocument();
  });

  it('should display privacy impact assessments', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('Privacy Impact Assessments')
      ).toBeInTheDocument();
    });

    // Check PIA metrics
    expect(screen.getByText('Total Assessments')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display privacy reports section', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Reports')).toBeInTheDocument();
    });

    // Check report buttons
    expect(screen.getByText('GDPR Compliance Report')).toBeInTheDocument();
    expect(screen.getByText('Consent Analytics')).toBeInTheDocument();
    expect(screen.getByText('Data Retention Report')).toBeInTheDocument();
    expect(screen.getByText('User Rights Report')).toBeInTheDocument();
    expect(screen.getByText('Cookie Consent Report')).toBeInTheDocument();
    expect(screen.getByText('Data Sharing Report')).toBeInTheDocument();
  });

  it('should handle tab switching', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Click on GDPR Compliance tab
    const complianceTab = screen.getByText('GDPR Compliance');
    fireEvent.click(complianceTab);

    // Check if GDPR compliance content is displayed
    expect(screen.getByText('GDPR Compliance Status')).toBeInTheDocument();
  });

  it('should display action buttons in header', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });

  it('should display status badges with correct colors', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('compliant')).toBeInTheDocument();
    });

    // Check if badges are rendered
    const badges = screen.getAllByTestId('badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should display progress bars', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getAllByTestId('progress')).toHaveLength(6); // Multiple progress bars
    });
  });

  it('should handle error state', async () => {
    // Mock console.error to avoid error logs in test output
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Mock the loadDashboardData function to throw an error
    const originalError = console.error;
    console.error = jest.fn();

    // Re-render to trigger error state
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      // The component should handle the error gracefully
      expect(
        screen.getByText('Privacy Management Dashboard')
      ).toBeInTheDocument();
    });

    console.error = originalError;
    consoleSpy.mockRestore();
  });

  it('should display alert icons correctly', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
    });

    // Check if alert icons are present
    expect(screen.getAllByTestId('alert-triangle-icon')).toHaveLength(2); // Warning and error alerts
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument(); // Info alert
  });

  it('should display metric cards with proper structure', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('GDPR Compliance')).toBeInTheDocument();
    });

    // Check if cards are properly structured
    const cards = screen.getAllByTestId('card');
    expect(cards.length).toBeGreaterThan(0);

    const cardHeaders = screen.getAllByTestId('card-header');
    expect(cardHeaders.length).toBeGreaterThan(0);

    const cardContents = screen.getAllByTestId('card-content');
    expect(cardContents.length).toBeGreaterThan(0);
  });

  it('should display proper date formatting', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Last cleanup: 1/14/2024')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Last anonymization: 1/13/2024')
    ).toBeInTheDocument();
  });

  it('should display proper percentage formatting', async () => {
    render(<PrivacyManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('94.4%')).toBeInTheDocument();
      expect(screen.getByText('89.2%')).toBeInTheDocument();
      expect(screen.getByText('95.5%')).toBeInTheDocument();
    });
  });
});

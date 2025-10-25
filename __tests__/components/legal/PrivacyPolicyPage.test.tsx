import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrivacyPolicyPage } from '@/components/features/legal/PrivacyPolicyPage';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/legal/privacy',
    query: {},
  }),
}));

describe('PrivacyPolicyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the privacy policy page with header', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(
      screen.getByText(
        /How we collect, use, and protect your personal information/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Last updated: December 19, 2024')
    ).toBeInTheDocument();
    expect(screen.getByText('GDPR Compliant')).toBeInTheDocument();
  });

  it('displays navigation sidebar with all sections', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Data Collection')).toBeInTheDocument();
    expect(screen.getByText('Data Usage')).toBeInTheDocument();
    expect(screen.getByText('Data Sharing')).toBeInTheDocument();
    expect(screen.getByText('User Rights')).toBeInTheDocument();
    expect(screen.getByText('Data Retention')).toBeInTheDocument();
    expect(screen.getByText('GDPR Compliance')).toBeInTheDocument();
  });

  it('shows overview section by default', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByText('Privacy Policy Overview')).toBeInTheDocument();
    expect(
      screen.getByText(
        /At EventProsNZ, we are committed to protecting your privacy/
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Data Protection')).toBeInTheDocument();
    expect(screen.getByText('Your Rights')).toBeInTheDocument();
  });

  it('switches to data collection section when clicked', async () => {
    render(<PrivacyPolicyPage />);

    const dataCollectionButton = screen.getByText('Data Collection');
    fireEvent.click(dataCollectionButton);

    await waitFor(() => {
      expect(screen.getByText('Data Collection')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(
        screen.getByText('Automatically Collected Data')
      ).toBeInTheDocument();
      expect(screen.getByText('Third-Party Data')).toBeInTheDocument();
    });
  });

  it('switches to data usage section when clicked', async () => {
    render(<PrivacyPolicyPage />);

    const dataUsageButton = screen.getByText('Data Usage');
    fireEvent.click(dataUsageButton);

    await waitFor(() => {
      expect(screen.getByText('Data Usage')).toBeInTheDocument();
      expect(screen.getByText('Service Provision')).toBeInTheDocument();
      expect(screen.getByText('Platform Improvement')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
    });
  });

  it('switches to data sharing section when clicked', async () => {
    render(<PrivacyPolicyPage />);

    const dataSharingButton = screen.getByText('Data Sharing');
    fireEvent.click(dataSharingButton);

    await waitFor(() => {
      expect(screen.getByText('Data Sharing')).toBeInTheDocument();
      expect(screen.getByText('Platform Users')).toBeInTheDocument();
      expect(screen.getByText('Service Providers')).toBeInTheDocument();
      expect(screen.getByText('Legal Requirements')).toBeInTheDocument();
    });
  });

  it('switches to user rights section when clicked', async () => {
    render(<PrivacyPolicyPage />);

    const userRightsButton = screen.getByText('User Rights');
    fireEvent.click(userRightsButton);

    await waitFor(() => {
      expect(screen.getByText('User Rights')).toBeInTheDocument();
      expect(screen.getByText('Access Rights')).toBeInTheDocument();
      expect(screen.getByText('Control Rights')).toBeInTheDocument();
      expect(
        screen.getByText('How to Exercise Your Rights')
      ).toBeInTheDocument();
    });
  });

  it('switches to data retention section when clicked', async () => {
    render(<PrivacyPolicyPage />);

    const dataRetentionButton = screen.getByText('Data Retention');
    fireEvent.click(dataRetentionButton);

    await waitFor(() => {
      expect(screen.getByText('Data Retention')).toBeInTheDocument();
      expect(screen.getByText('Retention Periods')).toBeInTheDocument();
      expect(screen.getByText('Data Deletion')).toBeInTheDocument();
    });
  });

  it('switches to GDPR compliance section when clicked', async () => {
    render(<PrivacyPolicyPage />);

    const gdprComplianceButton = screen.getByText('GDPR Compliance');
    fireEvent.click(gdprComplianceButton);

    await waitFor(() => {
      expect(screen.getByText('GDPR Compliance')).toBeInTheDocument();
      expect(
        screen.getByText('Legal Basis for Processing')
      ).toBeInTheDocument();
      expect(screen.getByText('Data Protection Measures')).toBeInTheDocument();
      expect(screen.getByText('Data Protection Officer')).toBeInTheDocument();
    });
  });

  it('displays contact information in footer', () => {
    render(<PrivacyPolicyPage />);

    expect(
      screen.getByText(/For privacy-related questions/)
    ).toBeInTheDocument();
    expect(screen.getByText('privacy@eventpros.co.nz')).toBeInTheDocument();
  });

  it('shows GDPR compliance badge', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByText('GDPR Compliant')).toBeInTheDocument();
  });

  it('displays data collection content correctly', async () => {
    render(<PrivacyPolicyPage />);

    const dataCollectionButton = screen.getByText('Data Collection');
    fireEvent.click(dataCollectionButton);

    await waitFor(() => {
      expect(
        screen.getByText(/We collect the following personal information/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Account Information/)).toBeInTheDocument();
      expect(screen.getByText(/Profile Information/)).toBeInTheDocument();
      expect(screen.getByText(/Event Information/)).toBeInTheDocument();
    });
  });

  it('displays user rights content correctly', async () => {
    render(<PrivacyPolicyPage />);

    const userRightsButton = screen.getByText('User Rights');
    fireEvent.click(userRightsButton);

    await waitFor(() => {
      expect(screen.getByText(/You have the right to/)).toBeInTheDocument();
      expect(screen.getByText(/You can/)).toBeInTheDocument();
      expect(screen.getByText(/To exercise your rights/)).toBeInTheDocument();
    });
  });

  it('displays GDPR compliance content correctly', async () => {
    render(<PrivacyPolicyPage />);

    const gdprComplianceButton = screen.getByText('GDPR Compliance');
    fireEvent.click(gdprComplianceButton);

    await waitFor(() => {
      expect(screen.getByText(/We process data based on/)).toBeInTheDocument();
      expect(screen.getByText(/We implement/)).toBeInTheDocument();
      expect(
        screen.getByText(/For GDPR-related inquiries/)
      ).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TermsOfServicePage } from '@/components/features/legal/TermsOfServicePage';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/legal/terms',
    query: {},
  }),
}));

describe('TermsOfServicePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the terms of service page with header', () => {
    render(<TermsOfServicePage />);

    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(
      screen.getByText(/comprehensive legal terms and user agreement/)
    ).toBeInTheDocument();
    expect(
      screen.getByText('Last updated: December 19, 2024')
    ).toBeInTheDocument();
  });

  it('displays navigation sidebar with all sections', () => {
    render(<TermsOfServicePage />);

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('User Agreement')).toBeInTheDocument();
    expect(screen.getByText('Platform Rules')).toBeInTheDocument();
    expect(screen.getByText('Intellectual Property')).toBeInTheDocument();
    expect(screen.getByText('Liability')).toBeInTheDocument();
    expect(screen.getByText('Dispute Resolution')).toBeInTheDocument();
  });

  it('shows overview section by default', () => {
    render(<TermsOfServicePage />);

    expect(screen.getByText('Terms of Service Overview')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to EventProsNZ/)).toBeInTheDocument();
    expect(screen.getByText('User Responsibilities')).toBeInTheDocument();
    expect(screen.getByText('Platform Rights')).toBeInTheDocument();
  });

  it('switches to user agreement section when clicked', async () => {
    render(<TermsOfServicePage />);

    const userAgreementButton = screen.getByText('User Agreement');
    fireEvent.click(userAgreementButton);

    await waitFor(() => {
      expect(screen.getByText('User Agreement')).toBeInTheDocument();
      expect(screen.getByText('Account Registration')).toBeInTheDocument();
      expect(screen.getByText('User Conduct')).toBeInTheDocument();
    });
  });

  it('switches to platform rules section when clicked', async () => {
    render(<TermsOfServicePage />);

    const platformRulesButton = screen.getByText('Platform Rules');
    fireEvent.click(platformRulesButton);

    await waitFor(() => {
      expect(screen.getByText('Platform Rules')).toBeInTheDocument();
      expect(screen.getByText('Content Guidelines')).toBeInTheDocument();
      expect(screen.getByText('Prohibited Activities')).toBeInTheDocument();
    });
  });

  it('switches to intellectual property section when clicked', async () => {
    render(<TermsOfServicePage />);

    const intellectualPropertyButton = screen.getByText(
      'Intellectual Property'
    );
    fireEvent.click(intellectualPropertyButton);

    await waitFor(() => {
      expect(screen.getByText('Intellectual Property')).toBeInTheDocument();
      expect(screen.getByText('Platform Content')).toBeInTheDocument();
      expect(screen.getByText('User Content')).toBeInTheDocument();
      expect(screen.getByText('Copyright Policy')).toBeInTheDocument();
    });
  });

  it('switches to liability section when clicked', async () => {
    render(<TermsOfServicePage />);

    const liabilityButton = screen.getByText('Liability');
    fireEvent.click(liabilityButton);

    await waitFor(() => {
      expect(screen.getByText('Liability Limitations')).toBeInTheDocument();
      expect(screen.getByText('Service Disclaimer')).toBeInTheDocument();
      expect(screen.getByText('Limitation of Liability')).toBeInTheDocument();
      expect(screen.getByText('User Responsibility')).toBeInTheDocument();
    });
  });

  it('switches to dispute resolution section when clicked', async () => {
    render(<TermsOfServicePage />);

    const disputeResolutionButton = screen.getByText('Dispute Resolution');
    fireEvent.click(disputeResolutionButton);

    await waitFor(() => {
      expect(screen.getByText('Dispute Resolution')).toBeInTheDocument();
      expect(screen.getByText('Governing Law')).toBeInTheDocument();
      expect(screen.getByText('Dispute Process')).toBeInTheDocument();
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
    });
  });

  it('displays contact information in footer', () => {
    render(<TermsOfServicePage />);

    expect(
      screen.getByText(
        /By using EventProsNZ, you agree to these Terms of Service/
      )
    ).toBeInTheDocument();
    expect(screen.getByText('legal@eventpros.co.nz')).toBeInTheDocument();
  });

  it('shows version and last updated information', () => {
    render(<TermsOfServicePage />);

    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    expect(
      screen.getByText('Last updated: December 19, 2024')
    ).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<TermsOfServicePage />);

    const navigationButtons = screen.getAllByRole('button');
    expect(navigationButtons.length).toBeGreaterThan(0);

    // Check that buttons have proper text content
    navigationButtons.forEach(button => {
      expect(button).toHaveTextContent();
    });
  });

  it('displays user agreement content correctly', async () => {
    render(<TermsOfServicePage />);

    const userAgreementButton = screen.getByText('User Agreement');
    fireEvent.click(userAgreementButton);

    await waitFor(() => {
      expect(
        screen.getByText(/By creating an account on EventProsNZ/)
      ).toBeInTheDocument();
      expect(screen.getByText(/You agree not to/)).toBeInTheDocument();
      expect(
        screen.getByText(/We reserve the right to suspend/)
      ).toBeInTheDocument();
    });
  });

  it('displays platform rules content correctly', async () => {
    render(<TermsOfServicePage />);

    const platformRulesButton = screen.getByText('Platform Rules');
    fireEvent.click(platformRulesButton);

    await waitFor(() => {
      expect(
        screen.getByText(/All content posted on EventProsNZ must/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/The following activities are strictly prohibited/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/We monitor platform activity/)
      ).toBeInTheDocument();
    });
  });
});

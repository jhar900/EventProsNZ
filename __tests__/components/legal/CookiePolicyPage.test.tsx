import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookiePolicyPage } from '@/components/features/legal/CookiePolicyPage';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/legal/cookies',
    query: {},
  }),
}));

describe('CookiePolicyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the cookie policy page with header', () => {
    render(<CookiePolicyPage />);

    expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
    expect(
      screen.getByText(/How we use cookies and similar technologies/)
    ).toBeInTheDocument();
    expect(
      screen.getByText('Last updated: December 19, 2024')
    ).toBeInTheDocument();
    expect(screen.getByText('GDPR Compliant')).toBeInTheDocument();
  });

  it('displays navigation sidebar with all sections', () => {
    render(<CookiePolicyPage />);

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Cookie Types')).toBeInTheDocument();
    expect(screen.getByText('Cookie Usage')).toBeInTheDocument();
    expect(screen.getByText('Cookie Management')).toBeInTheDocument();
    expect(screen.getByText('Third-Party Cookies')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
  });

  it('shows overview section by default', () => {
    render(<CookiePolicyPage />);

    expect(screen.getByText('Cookie Policy Overview')).toBeInTheDocument();
    expect(
      screen.getByText(
        /This Cookie Policy explains how EventProsNZ uses cookies/
      )
    ).toBeInTheDocument();
    expect(screen.getByText('What Are Cookies?')).toBeInTheDocument();
    expect(screen.getByText('Your Control')).toBeInTheDocument();
  });

  it('switches to cookie types section when clicked', async () => {
    render(<CookiePolicyPage />);

    const cookieTypesButton = screen.getByText('Cookie Types');
    fireEvent.click(cookieTypesButton);

    await waitFor(() => {
      expect(screen.getByText('Cookie Types')).toBeInTheDocument();
      expect(screen.getByText('Essential Cookies')).toBeInTheDocument();
      expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
      expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
      expect(screen.getByText('Functional Cookies')).toBeInTheDocument();
    });
  });

  it('switches to cookie usage section when clicked', async () => {
    render(<CookiePolicyPage />);

    const cookieUsageButton = screen.getByText('Cookie Usage');
    fireEvent.click(cookieUsageButton);

    await waitFor(() => {
      expect(screen.getByText('Cookie Usage')).toBeInTheDocument();
      expect(
        screen.getByText(
          /These cookies are necessary for the website to function/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Help us understand website usage/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Used for advertising and marketing/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Enhance user experience/)).toBeInTheDocument();
    });
  });

  it('switches to cookie management section when clicked', async () => {
    render(<CookiePolicyPage />);

    const cookieManagementButton = screen.getByText('Cookie Management');
    fireEvent.click(cookieManagementButton);

    await waitFor(() => {
      expect(screen.getByText('Cookie Management')).toBeInTheDocument();
      expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
      expect(screen.getByText('Browser Settings')).toBeInTheDocument();
    });
  });

  it('switches to third-party cookies section when clicked', async () => {
    render(<CookiePolicyPage />);

    const thirdPartyButton = screen.getByText('Third-Party Cookies');
    fireEvent.click(thirdPartyButton);

    await waitFor(() => {
      expect(screen.getByText('Third-Party Cookies')).toBeInTheDocument();
      expect(screen.getByText('Google Analytics')).toBeInTheDocument();
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByText('Social Media')).toBeInTheDocument();
    });
  });

  it('switches to compliance section when clicked', async () => {
    render(<CookiePolicyPage />);

    const complianceButton = screen.getByText('Compliance');
    fireEvent.click(complianceButton);

    await waitFor(() => {
      expect(screen.getByText('Compliance')).toBeInTheDocument();
      expect(screen.getByText('GDPR Compliance')).toBeInTheDocument();
      expect(screen.getByText('CCPA Compliance')).toBeInTheDocument();
      expect(screen.getByText('Cookie Consent')).toBeInTheDocument();
    });
  });

  it('displays contact information in footer', () => {
    render(<CookiePolicyPage />);

    expect(
      screen.getByText(/For cookie-related questions/)
    ).toBeInTheDocument();
    expect(screen.getByText('privacy@eventpros.co.nz')).toBeInTheDocument();
  });

  it('shows GDPR compliance badge', () => {
    render(<CookiePolicyPage />);

    expect(screen.getByText('GDPR Compliant')).toBeInTheDocument();
  });

  it('displays cookie management interface', async () => {
    render(<CookiePolicyPage />);

    const cookieManagementButton = screen.getByText('Cookie Management');
    fireEvent.click(cookieManagementButton);

    await waitFor(() => {
      expect(screen.getByText('Essential Cookies')).toBeInTheDocument();
      expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
      expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
      expect(screen.getByText('Functional Cookies')).toBeInTheDocument();
    });
  });

  it('allows toggling cookie preferences', async () => {
    const user = userEvent.setup();
    render(<CookiePolicyPage />);

    const cookieManagementButton = screen.getByText('Cookie Management');
    fireEvent.click(cookieManagementButton);

    await waitFor(() => {
      const analyticsSwitch = screen.getByRole('switch', {
        name: /analytics cookies/i,
      });
      expect(analyticsSwitch).toBeInTheDocument();
    });
  });

  it('displays essential cookies as required', async () => {
    render(<CookiePolicyPage />);

    const cookieManagementButton = screen.getByText('Cookie Management');
    fireEvent.click(cookieManagementButton);

    await waitFor(() => {
      expect(screen.getByText('Required')).toBeInTheDocument();
    });
  });

  it('shows accept essential only button', async () => {
    render(<CookiePolicyPage />);

    const cookieManagementButton = screen.getByText('Cookie Management');
    fireEvent.click(cookieManagementButton);

    await waitFor(() => {
      expect(screen.getByText('Accept Essential Only')).toBeInTheDocument();
      expect(screen.getByText('Accept All')).toBeInTheDocument();
    });
  });

  it('displays third-party cookie information', async () => {
    render(<CookiePolicyPage />);

    const thirdPartyButton = screen.getByText('Third-Party Cookies');
    fireEvent.click(thirdPartyButton);

    await waitFor(() => {
      expect(screen.getByText(/We use Google Analytics/)).toBeInTheDocument();
      expect(
        screen.getByText(/Payment processing cookies/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Social media integration cookies/)
      ).toBeInTheDocument();
    });
  });

  it('displays compliance information', async () => {
    render(<CookiePolicyPage />);

    const complianceButton = screen.getByText('Compliance');
    fireEvent.click(complianceButton);

    await waitFor(() => {
      expect(
        screen.getByText(/We comply with GDPR requirements/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/California Consumer Privacy Act compliance/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Our cookie consent system/)).toBeInTheDocument();
    });
  });
});

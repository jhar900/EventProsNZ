import { render, screen, fireEvent } from '@testing-library/react';
import { FreeTrialSection } from '@/components/features/pricing/FreeTrialSection';

const mockTiers = [
  {
    id: 'showcase',
    name: 'Showcase',
    price: 29,
    price_annual: 299,
    billing_cycle: 'monthly',
    features: ['Enhanced profile', 'Unlimited events'],
    limits: { events: -1 },
    is_trial_eligible: true,
    is_popular: true,
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    price: 69,
    price_annual: 699,
    billing_cycle: 'monthly',
    features: ['Premium profile', 'All features'],
    limits: { events: -1 },
    is_trial_eligible: true,
    is_popular: false,
  },
];

describe('FreeTrialSection', () => {
  it('renders free trial section', () => {
    render(<FreeTrialSection tiers={mockTiers} />);

    expect(
      screen.getAllByText((content, element) => {
        return (
          element?.textContent?.includes('Start Your') &&
          element?.textContent?.includes('Free Trial') &&
          element?.textContent?.includes('Today')
        );
      }).length
    ).toBeGreaterThan(0);
    expect(screen.getByText('14 days')).toBeInTheDocument();
  });

  it('displays trial benefits', () => {
    render(<FreeTrialSection tiers={mockTiers} />);

    expect(screen.getByText('14 Days Free')).toBeInTheDocument();
    expect(screen.getByText('No Commitment')).toBeInTheDocument();
    expect(screen.getByText('Premium Support')).toBeInTheDocument();
  });

  it('shows trial features', () => {
    render(<FreeTrialSection tiers={mockTiers} />);

    expect(
      screen.getByText('Full access to all premium features')
    ).toBeInTheDocument();
    expect(screen.getByText('No credit card required')).toBeInTheDocument();
    expect(screen.getByText('Cancel anytime during trial')).toBeInTheDocument();
  });

  it('displays trial duration', () => {
    render(<FreeTrialSection tiers={mockTiers} />);

    expect(screen.getByText('14 days')).toBeInTheDocument();
  });

  it('shows trial terms', () => {
    render(<FreeTrialSection tiers={mockTiers} />);

    expect(screen.getByText(/Free Trial Terms/)).toBeInTheDocument();
    expect(screen.getByText(/14-day free trial available/)).toBeInTheDocument();
  });

  it('displays trial-eligible tiers', () => {
    render(<FreeTrialSection tiers={mockTiers} />);

    expect(screen.getByText('Showcase')).toBeInTheDocument();
    expect(screen.getByText('Spotlight')).toBeInTheDocument();
  });

  it('handles trial start for eligible tiers', () => {
    render(<FreeTrialSection tiers={mockTiers} />);

    const trialButtons = screen.getAllByText('Start Trial');
    expect(trialButtons.length).toBe(2);

    fireEvent.click(trialButtons[0]);
    // Should not throw error
    expect(trialButtons[0]).toBeInTheDocument();
  });

  it('shows get started free button', () => {
    render(<FreeTrialSection tiers={mockTiers} />);

    expect(screen.getByText('Get Started Free')).toBeInTheDocument();
  });

  it('displays trust indicators', () => {
    render(<FreeTrialSection tiers={mockTiers} />);

    expect(screen.getByText(/No setup fees/)).toBeInTheDocument();
    expect(screen.getAllByText(/Cancel anytime/).length).toBeGreaterThan(0);
    expect(screen.getByText(/30-day money-back guarantee/)).toBeInTheDocument();
  });

  it('handles empty tiers array', () => {
    render(<FreeTrialSection tiers={[]} />);

    expect(
      screen.getAllByText((content, element) => {
        return (
          element?.textContent?.includes('Start Your') &&
          element?.textContent?.includes('Free Trial') &&
          element?.textContent?.includes('Today')
        );
      }).length
    ).toBeGreaterThan(0);
  });

  it('shows trial countdown', () => {
    render(<FreeTrialSection tiers={mockTiers} />);

    // Should display trial duration
    expect(screen.getByText('14 days')).toBeInTheDocument();
  });
});

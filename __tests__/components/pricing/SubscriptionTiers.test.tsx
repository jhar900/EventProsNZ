import { render, screen, fireEvent } from '@testing-library/react';
import { SubscriptionTiers } from '@/components/features/pricing/SubscriptionTiers';

const mockTiers = [
  {
    id: 'essential',
    name: 'Essential',
    price: 0,
    price_annual: 0,
    billing_cycle: 'monthly',
    features: ['Basic profile', '3 events', 'Email support'],
    limits: { events: 3 },
    is_trial_eligible: false,
    is_popular: false,
  },
  {
    id: 'showcase',
    name: 'Showcase',
    price: 29,
    price_annual: 299,
    billing_cycle: 'monthly',
    features: ['Enhanced profile', 'Unlimited events', 'Priority support'],
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
    features: ['Premium profile', 'All features', 'Dedicated support'],
    limits: { events: -1 },
    is_trial_eligible: true,
    is_popular: false,
  },
];

describe('SubscriptionTiers', () => {
  it('renders all subscription tiers', () => {
    render(<SubscriptionTiers tiers={mockTiers} />);

    expect(screen.getByText('Essential')).toBeInTheDocument();
    expect(screen.getByText('Showcase')).toBeInTheDocument();
    expect(screen.getByText('Spotlight')).toBeInTheDocument();
  });

  it('displays correct pricing for each tier', () => {
    render(<SubscriptionTiers tiers={mockTiers} />);

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('$29')).toBeInTheDocument();
    expect(screen.getByText('$69')).toBeInTheDocument();
  });

  it('shows popular badge for popular tier', () => {
    render(<SubscriptionTiers tiers={mockTiers} />);

    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('toggles between monthly and annual billing', () => {
    render(<SubscriptionTiers tiers={mockTiers} />);

    const toggle = screen.getByRole('switch', {
      name: /switch to annual billing/i,
    });
    fireEvent.click(toggle);

    expect(screen.getByText('Annual')).toBeInTheDocument();
  });

  it('displays annual savings for paid tiers', () => {
    render(<SubscriptionTiers tiers={mockTiers} />);

    const toggle = screen.getByRole('switch', {
      name: /switch to annual billing/i,
    });
    fireEvent.click(toggle);

    const savingsTexts = screen.getAllByText(/save.*per year/i);
    expect(savingsTexts.length).toBeGreaterThan(0);
  });

  it('handles tier selection', () => {
    render(<SubscriptionTiers tiers={mockTiers} />);

    const essentialButton = screen.getByText('Get Started Free');
    fireEvent.click(essentialButton);

    // Should not throw error
    expect(essentialButton).toBeInTheDocument();
  });

  it('shows trial button for eligible tiers', () => {
    render(<SubscriptionTiers tiers={mockTiers} />);

    const trialButtons = screen.getAllByText('Start Free Trial');
    expect(trialButtons).toHaveLength(2); // Showcase and Spotlight tiers
  });

  it('displays features for each tier', () => {
    render(<SubscriptionTiers tiers={mockTiers} />);

    expect(screen.getByText('Basic profile')).toBeInTheDocument();
    expect(screen.getByText('Enhanced profile')).toBeInTheDocument();
    expect(screen.getByText('Premium profile')).toBeInTheDocument();
  });

  it('handles empty tiers array', () => {
    render(<SubscriptionTiers tiers={[]} />);

    // Should not crash
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
  });
});

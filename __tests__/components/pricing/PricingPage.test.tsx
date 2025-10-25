import { render, screen, waitFor } from '@testing-library/react';
import { PricingPage } from '@/components/features/pricing/PricingPage';

// Mock fetch
global.fetch = jest.fn();

describe('PricingPage', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders pricing page with loading state', async () => {
    (fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tiers: [] }),
      })
    );

    render(<PricingPage />);

    expect(
      screen.getByText('Loading pricing information...')
    ).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<PricingPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load pricing data')
      ).toBeInTheDocument();
    });
  });

  it('displays retry button on error', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });
});

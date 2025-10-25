import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import AboutPage from '@/components/features/about/AboutPage';

// Mock fetch
global.fetch = jest.fn();

describe('AboutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<AboutPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders about page content after loading', async () => {
    const mockContent = {
      companyStory: {
        title: 'Test Story',
        content: 'Test content',
      },
      mission: {
        title: 'Test Mission',
        content: 'Test mission content',
      },
      vision: {
        title: 'Test Vision',
        content: 'Test vision content',
      },
      values: [],
      lastUpdated: '2024-01-01T00:00:00Z',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContent,
    });

    render(<AboutPage />);

    await waitFor(() => {
      expect(screen.getByText('About Event Pros NZ')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "New Zealand's premier platform connecting event managers with trusted contractors"
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText('Proudly New Zealand')).toHaveLength(2);
    expect(screen.getByText('500+ Verified Contractors')).toBeInTheDocument();
    expect(screen.getByText('Trusted by 1000+ Events')).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));

    render(<AboutPage />);

    await waitFor(() => {
      expect(screen.getByText('About Event Pros NZ')).toBeInTheDocument();
    });

    // Should still render the page even if content fetch fails
    expect(screen.getByText('Our Story')).toBeInTheDocument();
  });

  it('renders company story section', async () => {
    render(<AboutPage />);

    await waitFor(() => {
      expect(screen.getByText('Our Story')).toBeInTheDocument();
    });

    expect(
      screen.getByText("Building New Zealand's Event Community")
    ).toBeInTheDocument();
    expect(screen.getByText('Our Mission')).toBeInTheDocument();
    expect(screen.getByText('Our Vision')).toBeInTheDocument();
  });

  it('renders team section', async () => {
    render(<AboutPage />);

    await waitFor(() => {
      expect(screen.getByText('Meet Our Team')).toBeInTheDocument();
    });

    expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
    expect(screen.getByText('Founder & CEO')).toBeInTheDocument();
    expect(screen.getByText('James Chen')).toBeInTheDocument();
    expect(screen.getByText('CTO')).toBeInTheDocument();
  });

  it('renders company values section', async () => {
    render(<AboutPage />);

    await waitFor(() => {
      expect(screen.getByText('Our Values')).toBeInTheDocument();
    });

    expect(screen.getByText('Passion for Excellence')).toBeInTheDocument();
    expect(screen.getByText('Trust & Reliability')).toBeInTheDocument();
    expect(screen.getByText('Community First')).toBeInTheDocument();
  });

  it('renders New Zealand focus section', async () => {
    render(<AboutPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Proudly New Zealand')).toHaveLength(2);
    });

    expect(screen.getByText('Nationwide Coverage')).toBeInTheDocument();
    expect(screen.getByText('Local Expertise')).toBeInTheDocument();
    expect(screen.getAllByText('Quality Standards')).toHaveLength(2);
  });

  it('renders call to action section', async () => {
    render(<AboutPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Ready to Plan Your Next Event?')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Get Started Today')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });
});

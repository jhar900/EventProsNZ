import React from 'react';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/features/homepage/HeroSection';

describe('HeroSection', () => {
  it('renders the main heading', () => {
    render(<HeroSection />);

    expect(screen.getByText("New Zealand's Premier")).toBeInTheDocument();
    expect(screen.getByText('Event Ecosystem')).toBeInTheDocument();
  });

  it('renders the subheading', () => {
    render(<HeroSection />);

    expect(
      screen.getByText(/Connect with qualified contractors/)
    ).toBeInTheDocument();
  });

  it('renders call-to-action buttons', () => {
    render(<HeroSection />);

    expect(screen.getByText('Get Started Free')).toBeInTheDocument();
    expect(screen.getByText('Browse Contractors')).toBeInTheDocument();
  });

  it('renders trust indicators', () => {
    render(<HeroSection />);

    expect(screen.getByText('5-Star Rated Contractors')).toBeInTheDocument();
    expect(
      screen.getByText('Trusted by 1000+ Event Managers')
    ).toBeInTheDocument();
    expect(screen.getByText('Nationwide Coverage')).toBeInTheDocument();
    expect(screen.getByText('Events Planned Daily')).toBeInTheDocument();
  });

  it('renders statistics', () => {
    render(<HeroSection />);

    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('1000+')).toBeInTheDocument();
    expect(screen.getByText('98%')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
  });

  it('has proper links', () => {
    render(<HeroSection />);

    const getStartedLink = screen.getByText('Get Started Free').closest('a');
    const browseLink = screen.getByText('Browse Contractors').closest('a');

    expect(getStartedLink).toHaveAttribute('href', '/register');
    expect(browseLink).toHaveAttribute('href', '/contractors');
  });

  it('applies custom className', () => {
    const { container } = render(<HeroSection className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

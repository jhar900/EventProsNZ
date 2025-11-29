'use client';

import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeroSection } from './HeroSection';
import { TestimonialsSection } from './TestimonialsSection';
import { InteractiveMapSection } from './InteractiveMapSection';
import { ServiceCategoriesSection } from './ServiceCategoriesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { FeaturedContractorsSection } from './FeaturedContractorsSection';
import { StatisticsSection } from './StatisticsSection';
import { NZPrideSection } from './NZPrideSection';
import { HomepageFooter } from './HomepageFooter';
import { HomepageLayout, HomepageModalContext } from './HomepageLayout';

interface HomepageProps {
  className?: string;
}

// Wrapper component that uses the context
function HeroSectionWithModal() {
  const context = useContext(HomepageModalContext);
  return <HeroSection onRegisterClick={context?.onRegisterClick} />;
}

export function Homepage({ className = '' }: HomepageProps) {
  const router = useRouter();

  // Prefetch the jobs page when homepage loads for faster navigation
  useEffect(() => {
    // Prefetch the jobs page route
    router.prefetch('/jobs');

    // Prefetch the jobs API endpoint to warm up the cache
    fetch('/api/jobs?limit=12', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }).catch(() => {
      // Silently fail - prefetch is best effort
    });
  }, [router]);

  return (
    <HomepageLayout className={`min-h-screen ${className}`}>
      {/* Main content with top padding to account for fixed navigation */}
      <main className="pt-16">
        {/* Hero Section */}
        <HeroSectionWithModal />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Interactive Map Section */}
        <InteractiveMapSection />

        {/* Service Categories Section */}
        <ServiceCategoriesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Featured Contractors Section */}
        <FeaturedContractorsSection />

        {/* Statistics Section */}
        <StatisticsSection />

        {/* New Zealand Pride Section */}
        <NZPrideSection />
      </main>

      {/* Footer */}
      <HomepageFooter />
    </HomepageLayout>
  );
}

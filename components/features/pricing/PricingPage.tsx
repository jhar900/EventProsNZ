'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/ui/container';
import { HomepageNavigation } from '@/components/features/homepage/HomepageNavigation';
import { PricingHero } from './PricingHero';
import { SubscriptionTiers } from './SubscriptionTiers';
import { FeatureComparisonTable } from './FeatureComparisonTable';
import { AnnualPricing } from './AnnualPricing';
import { FreeTrialSection } from './FreeTrialSection';
import { PricingFAQ } from './PricingFAQ';
import { SubscriptionTestimonials } from './SubscriptionTestimonials';
import { UpgradeDowngradeSection } from './UpgradeDowngradeSection';
import { PaymentMethodSection } from './PaymentMethodSection';
import { RefundPolicySection } from './RefundPolicySection';
import { CTASection } from './CTASection';
import { Loader2 } from 'lucide-react';

interface SubscriptionTierInfo {
  id: string;
  name: string;
  price: number;
  price_annual: number;
  billing_cycle: string;
  features: string[];
  limits: Record<string, number>;
  is_trial_eligible: boolean;
  is_popular?: boolean;
}

interface PricingTestimonial {
  id: string;
  contractor_id: string;
  contractor_name: string;
  content: string;
  rating: number;
  tier: string;
  is_featured: boolean;
}

interface PricingFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
}

export function PricingPage() {
  const [tiers, setTiers] = useState<SubscriptionTierInfo[]>([]);
  const [testimonials, setTestimonials] = useState<PricingTestimonial[]>([]);
  const [faqs, setFaqs] = useState<PricingFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tiersResponse, testimonialsResponse, faqsResponse] =
        await Promise.all([
          fetch('/api/pricing/tiers'),
          fetch('/api/pricing/testimonials'),
          fetch('/api/pricing/faq'),
        ]);

      if (!tiersResponse.ok) {
        throw new Error('Failed to load pricing tiers');
      }

      const tiersData = await tiersResponse.json();
      setTiers(tiersData.tiers || []);

      if (testimonialsResponse.ok) {
        const testimonialsData = await testimonialsResponse.json();
        setTestimonials(testimonialsData.testimonials || []);
      }

      if (faqsResponse.ok) {
        const faqsData = await faqsResponse.json();
        setFaqs(faqsData.faqs || []);
      }
    } catch (err) {
      setError('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading pricing information...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={loadPricingData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="pricing-page">
      {/* Navigation */}
      <HomepageNavigation />

      {/* Content with top padding to account for fixed navigation */}
      <div className="pt-16">
        {/* Hero Section */}
        <PricingHero />

        <Container>
          {/* Subscription Tiers */}
          <SubscriptionTiers tiers={tiers} />

          {/* Feature Comparison Table */}
          <FeatureComparisonTable tiers={tiers} />

          {/* Annual Pricing with Discounts */}
          <AnnualPricing tiers={tiers} />

          {/* Free Trial Section */}
          <FreeTrialSection />

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <SubscriptionTestimonials testimonials={testimonials} />
          )}

          {/* Upgrade/Downgrade Information */}
          <UpgradeDowngradeSection />

          {/* Payment Methods */}
          <PaymentMethodSection />

          {/* Refund Policy */}
          <RefundPolicySection />

          {/* FAQ Section */}
          {faqs.length > 0 && <PricingFAQ faqs={faqs} />}

          {/* Call to Action */}
          <CTASection tiers={tiers} />
        </Container>
      </div>
    </div>
  );
}

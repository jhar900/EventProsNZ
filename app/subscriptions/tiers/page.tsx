'use client';

import { useState, useEffect } from 'react';
import { SubscriptionTiers } from '@/components/features/subscriptions/SubscriptionTiers';

// Default tiers data for static generation
const defaultTiers = [
  {
    id: 'essential',
    name: 'Essential',
    price: 0,
    billing_cycle: 'monthly',
    features: [
      'Basic profile listing',
      'Up to 5 portfolio items',
      'Basic search visibility',
      'Email support',
      'Standard verification',
    ],
    limits: {
      portfolio_items: 5,
      events_per_month: 2,
      search_visibility: 'basic',
    },
    is_trial_eligible: false,
  },
  {
    id: 'showcase',
    name: 'Showcase',
    price: 29,
    billing_cycle: 'monthly',
    features: [
      'Enhanced profile listing',
      'Up to 25 portfolio items',
      'Priority search visibility',
      'Priority support',
      'Advanced verification',
      'Analytics dashboard',
    ],
    limits: {
      portfolio_items: 25,
      events_per_month: 10,
      search_visibility: 'priority',
    },
    is_trial_eligible: true,
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    price: 79,
    billing_cycle: 'monthly',
    features: [
      'Premium profile listing',
      'Unlimited portfolio items',
      'Top search visibility',
      'Dedicated support',
      'Premium verification',
      'Advanced analytics',
      'Featured placement',
      'Custom branding',
    ],
    limits: {
      portfolio_items: -1,
      events_per_month: -1,
      search_visibility: 'top',
    },
    is_trial_eligible: true,
  },
];

export default function SubscriptionTiersPage() {
  const [currentSubscription, setCurrentSubscription] = useState(null);

  const handleSubscriptionChange = () => {
    // Refresh subscription data
    setCurrentSubscription(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SubscriptionTiers
        tiers={defaultTiers}
        currentSubscription={currentSubscription}
        onSubscriptionChange={handleSubscriptionChange}
      />
    </div>
  );
}

// Mock data for E2E tests
export const mockTiersData = [
  {
    id: 'essential',
    name: 'Essential',
    price: 0,
    price_annual: 0,
    billing_cycle: 'monthly',
    features: [
      'Basic Profile',
      'Portfolio Upload (5 items)',
      'Basic Search Visibility',
      'Contact Form',
      'Basic Analytics',
    ],
    limits: { portfolio_upload: 5 },
    is_trial_eligible: false,
    is_popular: false,
  },
  {
    id: 'showcase',
    name: 'Showcase',
    price: 29,
    price_annual: 299,
    billing_cycle: 'monthly',
    features: [
      'Enhanced Profile',
      'Portfolio Upload (20 items)',
      'Priority Search Visibility',
      'Direct Contact',
      'Advanced Analytics',
      'Featured Badge',
      'Social Media Integration',
      'Video Portfolio (5 items)',
    ],
    limits: { portfolio_upload: 20, video_portfolio: 5 },
    is_trial_eligible: true,
    is_popular: true,
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    price: 69,
    price_annual: 699,
    billing_cycle: 'monthly',
    features: [
      'Premium Profile',
      'Unlimited Portfolio',
      'Top Search Visibility',
      'Direct Contact',
      'Premium Analytics',
      'Premium Badge',
      'Social Media Integration',
      'Unlimited Video Portfolio',
      'Priority Support',
      'Custom Branding',
      'Advanced Matching',
    ],
    limits: { portfolio_upload: null, video_portfolio: null },
    is_trial_eligible: true,
    is_popular: false,
  },
];

export const mockTestimonialsData = [
  {
    id: '1',
    contractor_id: 'contractor-1',
    contractor_name: 'Sarah Mitchell',
    content:
      'EventProsNZ has transformed how I find and work with contractors. The quality of matches and ease of communication is unmatched.',
    rating: 5,
    tier: 'showcase',
    is_featured: true,
  },
  {
    id: '2',
    contractor_id: 'contractor-2',
    contractor_name: 'James Wilson',
    content:
      'The Spotlight plan gave me everything I needed to grow my event planning business. Highly recommended!',
    rating: 5,
    tier: 'spotlight',
    is_featured: true,
  },
  {
    id: '3',
    contractor_id: 'contractor-3',
    contractor_name: 'Emma Thompson',
    content:
      'Starting with the free plan was perfect. I could test the platform before upgrading to Showcase.',
    rating: 4,
    tier: 'essential',
    is_featured: false,
  },
];

export const mockFaqsData = [
  {
    id: '1',
    question: 'What subscription plan should I choose?',
    answer:
      'Start with Essential (free) to test the platform, then upgrade to Showcase for growing businesses or Spotlight for maximum features.',
    category: 'pricing',
    display_order: 1,
  },
  {
    id: '2',
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, PayPal, and bank transfers for annual plans.',
    category: 'billing',
    display_order: 2,
  },
  {
    id: '3',
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, you can cancel your subscription at any time from your account dashboard.',
    category: 'billing',
    display_order: 3,
  },
  {
    id: '4',
    question: 'Is there a free trial available?',
    answer:
      'Yes, we offer a 14-day free trial for Showcase and Spotlight plans. No credit card required.',
    category: 'trial',
    display_order: 4,
  },
  {
    id: '5',
    question: 'How secure is my payment information?',
    answer:
      'We use industry-standard encryption and are PCI DSS compliant to protect your payment information.',
    category: 'security',
    display_order: 5,
  },
];

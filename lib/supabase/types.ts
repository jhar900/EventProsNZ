import { Database } from '@/types/database';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type User = Tables<'users'>;
export type Profile = Tables<'profiles'>;
export type BusinessProfile = Tables<'business_profiles'>;
export type Event = Tables<'events'>;
export type Enquiry = Tables<'enquiries'>;
export type Job = Tables<'jobs'>;
export type Testimonial = Tables<'testimonials'>;
export type Subscription = Tables<'subscriptions'>;
export type PromotionalCode = Tables<'promotional_codes'>;
export type SubscriptionFeature = Tables<'subscription_features'>;
export type SubscriptionPricing = Tables<'subscription_pricing'>;
export type SubscriptionAnalytics = Tables<'subscription_analytics'>;

export type UserRole = Enums<'user_role'>;
export type EventStatus = Enums<'event_status'>;
export type JobStatus = Enums<'job_status'>;
export type SubscriptionTier = Enums<'subscription_tier'>;
export type SubscriptionStatus = Enums<'subscription_status'>;
export type BillingCycle = Enums<'billing_cycle'>;
export type DiscountType = Enums<'discount_type'>;
export type EnquiryStatus = Enums<'enquiry_status'>;

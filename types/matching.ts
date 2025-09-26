// Types for contractor matching system

export interface ContractorMatch {
  id: string;
  event_id: string;
  contractor_id: string;
  compatibility_score: number;
  availability_score: number;
  budget_score: number;
  location_score: number;
  performance_score: number;
  overall_score: number;
  is_premium: boolean;
  match_algorithm: string;
  created_at: string;
  updated_at: string;
}

export interface MatchingAnalytics {
  id: string;
  event_id: string;
  matching_algorithm: string;
  total_contractors: number;
  matching_contractors: number;
  premium_contractors: number;
  average_score: number;
  processing_time_ms?: number;
  created_at: string;
}

export interface ContractorAvailability {
  id: string;
  contractor_id: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  is_available: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractorPerformance {
  id: string;
  contractor_id: string;
  response_time_hours?: number;
  reliability_score?: number;
  quality_score?: number;
  communication_score?: number;
  overall_performance_score?: number;
  total_projects: number;
  successful_projects: number;
  created_at: string;
  updated_at: string;
}

export interface CompatibilityScore {
  service_type_score: number;
  experience_score: number;
  pricing_score: number;
  location_score: number;
  performance_score: number;
  availability_score: number;
  overall_score: number;
}

export interface ScoreBreakdown {
  service_type: number;
  experience: number;
  pricing: number;
  location: number;
  performance: number;
  availability: number;
  total: number;
}

export interface AvailabilityConflict {
  id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  conflict_type: 'double_booking' | 'unavailable' | 'time_conflict';
  description: string;
}

export interface ContractorAvailabilityResult {
  contractor_id: string;
  available: boolean;
  conflicts: AvailabilityConflict[];
  availability_score: number;
}

export interface BudgetCompatibility {
  budget_range_match: boolean;
  price_affordability: number;
  value_score: number;
  budget_flexibility: number;
  overall_score: number;
}

export interface LocationMatch {
  distance_km: number;
  service_area_coverage: number;
  proximity_score: number;
  accessibility_score: number;
  overall_score: number;
}

export interface ContractorPerformanceResult {
  contractor_id: string;
  response_time_hours: number;
  reliability_score: number;
  quality_score: number;
  communication_score: number;
  overall_performance_score: number;
  total_projects: number;
  successful_projects: number;
  success_rate: number;
}

export interface ContractorRanking {
  contractor_id: string;
  rank: number;
  score: number;
  is_premium: boolean;
  match_reasons: string[];
}

export interface MatchingFilters {
  service_types?: string[];
  budget_range?: {
    min: number;
    max: number;
  };
  location?: {
    lat: number;
    lng: number;
    radius_km: number;
  };
  availability_date?: string;
  min_rating?: number;
  is_premium?: boolean;
  sort_by?: 'score' | 'price' | 'rating' | 'distance';
  sort_order?: 'asc' | 'desc';
}

export interface MatchingRequest {
  event_id: string;
  filters?: MatchingFilters;
  page?: number;
  limit?: number;
  algorithm?: string;
}

export interface MatchingResponse {
  matches: ContractorMatch[];
  total: number;
  page: number;
  limit: number;
  analytics?: MatchingAnalytics;
}

export interface EventRequirements {
  event_id: string;
  event_type: string;
  event_date: string;
  duration_hours: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  budget_total: number;
  service_requirements: {
    category: string;
    type: string;
    priority: 'low' | 'medium' | 'high';
    estimated_budget: number;
  }[];
  special_requirements?: string;
}

export interface ContractorProfile {
  contractor_id: string;
  company_name: string;
  service_categories: string[];
  service_areas: string[];
  pricing_range: {
    min: number;
    max: number;
  };
  availability: string;
  is_verified: boolean;
  subscription_tier: 'essential' | 'professional' | 'enterprise';
  average_rating: number;
  review_count: number;
}

export interface MatchingFeedback {
  match_id: string;
  feedback_type: 'positive' | 'negative' | 'neutral';
  rating: number;
  comments?: string;
}

export interface MatchingAlgorithm {
  name: string;
  description: string;
  weights: {
    compatibility: number;
    availability: number;
    budget: number;
    location: number;
    performance: number;
  };
  is_default: boolean;
}

export interface MatchingConfig {
  algorithms: MatchingAlgorithm[];
  default_algorithm: string;
  cache_ttl_seconds: number;
  max_results: number;
  premium_boost: number;
}

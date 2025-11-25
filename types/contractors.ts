export interface Contractor {
  id: string;
  email: string;
  name: string;
  companyName: string;
  description: string | null;
  website?: string | null;
  location: string | null;
  avatarUrl: string | null;
  logoUrl: string | null;
  bio: string | null;
  phone?: string | null;
  address?: string | null;
  timezone?: string;
  serviceCategories: string[];
  averageRating: number;
  reviewCount: number;
  isVerified: boolean;
  subscriptionTier: 'essential' | 'professional' | 'enterprise';
  businessAddress?: string | null;
  nzbn?: string | null;
  serviceAreas: string[];
  socialLinks?: any | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  verificationDate?: string | null;
  services: Service[];
  portfolio?: PortfolioItem[];
  testimonials?: Testimonial[];
  createdAt: string;
  updatedAt?: string;
  isPremium: boolean;
  isFeatured?: boolean;
}

export interface Service {
  id: string;
  serviceType: string;
  description: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  availability: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  eventDate: string | null;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  rating: number | null;
  comment: string | null;
  eventTitle: string | null;
  eventDate: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface ContractorFilters {
  q?: string;
  serviceType?: string; // Deprecated - use serviceTypes instead
  serviceTypes?: string[]; // Multiple service types
  location?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  premiumOnly?: boolean;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ContractorDirectoryResponse {
  contractors: Contractor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  searchQuery?: ContractorFilters;
}

export interface ContractorDetailsResponse {
  contractor: Contractor;
}

export interface ContractorServicesResponse {
  services: Service[];
}

export interface ContractorReviewsResponse {
  reviews: Testimonial[];
  total: number;
  averageRating: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ViewMode = 'grid' | 'list';
export type SortOption =
  | 'premium_first'
  | 'rating'
  | 'newest'
  | 'oldest'
  | 'name';

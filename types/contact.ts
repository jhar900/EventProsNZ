export interface ContactInfo {
  business: {
    name: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    nzbn: string;
    hours: {
      weekdays: string;
      saturday: string;
      sunday: string;
    };
  };
  contact: {
    phone: string;
    email: string;
    support: string;
    partnerships: string;
  };
  responseTimes: {
    general: string;
    support: string;
    urgent: string;
    partnerships: string;
  };
  socialMedia: {
    facebook: string;
    instagram: string;
    linkedin: string;
    twitter: string;
    youtube: string;
  };
  lastUpdated: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  category: string;
  subject: string;
  message: string;
  newsletter: boolean;
  marketing: boolean;
}

export interface NewsletterSignup {
  email: string;
  preferences: string[];
  source?: string;
}

export interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  followers?: number;
  isActive: boolean;
}

export interface SocialUpdate {
  id: string;
  platform: string;
  content: string;
  image?: string;
  likes: number;
  shares: number;
  publishedAt: string;
  url: string;
}

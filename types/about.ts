export interface AboutContent {
  companyStory: {
    title: string;
    content: string;
  };
  mission: {
    title: string;
    content: string;
  };
  vision: {
    title: string;
    content: string;
  };
  values: Array<{
    title: string;
    description: string;
  }>;
  lastUpdated: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
  location: string;
  linkedin?: string;
  email?: string;
  specialties: string[];
}

export interface CompanyValue {
  icon: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

export interface TimelineEvent {
  year: string;
  month: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  location?: string;
  milestone?: string;
}

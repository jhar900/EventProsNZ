# Data Models

### User

**Purpose:** Core user entity representing both event managers and contractors with role-based access

**Key Attributes:**

- id: string - Unique user identifier from Supabase Auth
- email: string - User's email address
- role: 'event_manager' | 'contractor' | 'admin' - User's role in the system
- created_at: Date - Account creation timestamp
- updated_at: Date - Last profile update timestamp
- is_verified: boolean - Account verification status
- last_login: Date - Last login timestamp

**TypeScript Interface:**

```typescript
interface User {
  id: string;
  email: string;
  role: "event_manager" | "contractor" | "admin";
  created_at: Date;
  updated_at: Date;
  is_verified: boolean;
  last_login: Date | null;
}
```

**Relationships:**

- One-to-one with Profile
- One-to-one with BusinessProfile (required for contractors, optional for event managers)
- One-to-many with Events (for event managers)
- One-to-many with Jobs (for contractors)

### Profile

**Purpose:** Extended user profile information including personal details and preferences

**Key Attributes:**

- user_id: string - Foreign key to User
- first_name: string - User's first name
- last_name: string - User's last name
- phone: string - Contact phone number
- address: string - Physical address with Mapbox integration
- profile_photo_url: string - URL to profile image
- bio: string - Personal description
- preferences: JSON - User-specific settings and preferences

**TypeScript Interface:**

```typescript
interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  profile_photo_url: string | null;
  bio: string | null;
  preferences: Record<string, any>;
}
```

**Relationships:**

- Belongs to User
- One-to-one with BusinessProfile (for contractors)

### BusinessProfile

**Purpose:** Business-specific information for contractors including company details and verification

**Key Attributes:**

- user_id: string - Foreign key to User
- company_name: string - Business name
- business_address: string - Business location
- nzbn: string - New Zealand Business Number (optional)
- description: string - Business description
- service_areas: string[] - Array of regions served
- social_links: JSON - Social media and website links
- is_verified: boolean - Business verification status
- verification_date: Date - When business was verified

**TypeScript Interface:**

```typescript
interface BusinessProfile {
  user_id: string;
  company_name: string;
  business_address: string;
  nzbn: string | null;
  description: string;
  service_areas: string[];
  social_links: {
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  is_verified: boolean;
  verification_date: Date | null;
}
```

**Relationships:**

- Belongs to User
- One-to-many with Services
- One-to-many with PortfolioItems

### Event

**Purpose:** Event planning entity created by event managers with intelligent recommendations

**Key Attributes:**

- id: string - Unique event identifier
- user_id: string - Foreign key to User (event manager)
- title: string - Event title
- event_type: string - Type of event (wedding, corporate, party, etc.)
- event_date: Date - Scheduled event date
- end_date: Date | null - Optional end date for multi-day events
- is_multi_day: boolean - Whether event spans multiple days
- location: string - Event location with Mapbox integration
- attendee_count: number - Expected number of attendees
- duration_hours: number - Event duration
- budget: number - Total event budget
- status: 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled' - Event status
- created_at: Date - Event creation timestamp
- updated_at: Date - Last modification timestamp

**TypeScript Interface:**

```typescript
interface Event {
  id: string;
  user_id: string;
  title: string;
  event_type: string;
  event_date: Date;
  end_date: Date | null;
  is_multi_day: boolean;
  location: string;
  attendee_count: number;
  duration_hours: number;
  budget: number;
  status: "draft" | "planning" | "confirmed" | "completed" | "cancelled";
  created_at: Date;
  updated_at: Date;
}
```

**Relationships:**

- Belongs to User (event manager)
- One-to-many with EventServices
- One-to-many with Enquiries

**Validation Rules:**

- end_date must be after event_date when provided
- is_multi_day must be true when end_date is provided

### Service

**Purpose:** Service offerings provided by contractors with pricing and availability

**Key Attributes:**

- id: string - Unique service identifier
- business_profile_id: string - Foreign key to BusinessProfile
- name: string - Service name
- description: string - Detailed service description
- category: string - Service category (DJ, Photography, Catering, etc.)
- price_range_min: number - Minimum price for service
- price_range_max: number - Maximum price for service
- is_available: boolean - Current availability status
- response_time_hours: number - Typical response time in hours

**TypeScript Interface:**

```typescript
interface Service {
  id: string;
  business_profile_id: string;
  name: string;
  description: string;
  category: string;
  price_range_min: number;
  price_range_max: number;
  is_available: boolean;
  response_time_hours: number;
}
```

**Relationships:**

- Belongs to BusinessProfile
- Many-to-many with Events through EventServices

### EventService

**Purpose:** Many-to-many relationship between Events and Services with additional metadata

**Key Attributes:**

- id: string - Unique relationship identifier
- event_id: string - Foreign key to Event
- service_id: string - Foreign key to Service
- status: 'required' | 'optional' | 'confirmed' | 'rejected' - Service status for this event
- budget_allocated: number | null - Budget allocated for this service
- quoted_price: number | null - The price quoted by the contractor
- quoted_at: Date | null - When the quote was provided
- notes: string | null - Additional notes about this service for the event
- created_at: Date - Relationship creation timestamp
- updated_at: Date - Last update timestamp

**TypeScript Interface:**

```typescript
interface EventService {
  id: string;
  event_id: string;
  service_id: string;
  status: "required" | "optional" | "confirmed" | "rejected";
  budget_allocated: number | null;
  quoted_price: number | null;
  quoted_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}
```

**Relationships:**

- Belongs to Event
- Belongs to Service
- One-to-many with EventServiceAssignment

### EventServiceAssignment

**Purpose:** Tracks contractor assignments to specific event services

**Key Attributes:**

- id: string - Unique assignment identifier
- event_service_id: string - Foreign key to EventService
- contractor_user_id: string - Foreign key to User (assigned contractor)
- status: 'pending' | 'accepted' | 'declined' | 'completed' - Assignment status
- response_deadline: Date | null - When the contractor must respond by
- service_deadline: Date | null - When the service must be completed by
- assigned_at: Date - Assignment timestamp
- responded_at: Date | null - Contractor response timestamp
- completed_at: Date | null - Service completion timestamp
- notes: string | null - Assignment notes

**TypeScript Interface:**

```typescript
interface EventServiceAssignment {
  id: string;
  event_service_id: string;
  contractor_user_id: string;
  status: "pending" | "accepted" | "declined" | "completed";
  response_deadline: Date | null;
  service_deadline: Date | null;
  assigned_at: Date;
  responded_at: Date | null;
  completed_at: Date | null;
  notes: string | null;
}
```

**Relationships:**

- Belongs to EventService
- Belongs to User (contractor)

### Enquiry

**Purpose:** Communication between event managers and contractors for service requests

**Key Attributes:**

- id: string - Unique enquiry identifier
- event_id: string - Foreign key to Event
- contractor_user_id: string - Foreign key to User (contractor)
- message: string - Enquiry message
- status: 'sent' | 'viewed' | 'responded' | 'quoted' - Enquiry status
- created_at: Date - Enquiry creation timestamp
- responded_at: Date - Response timestamp

**TypeScript Interface:**

```typescript
interface Enquiry {
  id: string;
  event_id: string;
  contractor_user_id: string;
  message: string;
  status: "sent" | "viewed" | "responded" | "quoted";
  created_at: Date;
  responded_at: Date | null;
}
```

**Relationships:**

- Belongs to Event
- Belongs to User (contractor)
- One-to-many with EnquiryMessages

### EnquiryMessage

**Purpose:** Detailed conversation threads within enquiries

**Key Attributes:**

- id: string - Unique message identifier
- enquiry_id: string - Foreign key to Enquiry
- sender_user_id: string - Foreign key to User (message sender)
- message: string - Message content
- message_type: 'text' | 'quote' | 'file' | 'phone_call' | 'meeting' - Type of message
- attachment_url: string | null - File attachment URL
- created_at: Date - Message timestamp

**TypeScript Interface:**

```typescript
interface EnquiryMessage {
  id: string;
  enquiry_id: string;
  sender_user_id: string;
  message: string;
  message_type: "text" | "quote" | "file" | "phone_call" | "meeting";
  attachment_url: string | null;
  created_at: Date;
}
```

**Relationships:**

- Belongs to Enquiry
- Belongs to User (sender)

### Job

**Purpose:** Job postings for both event manager requests and contractor opportunities

**Key Attributes:**

- id: string - Unique job identifier
- posted_by_user_id: string - Foreign key to User (poster)
- title: string - Job title
- description: string - Job description
- job_type: 'event_manager' | 'contractor_internal' - Type of job posting
- service_category: string - Required service category
- budget_range_min: number - Minimum budget
- budget_range_max: number - Maximum budget
- location: string | null - Job location (null if remote)
- is_remote: boolean - Whether job can be done remotely
- status: 'active' | 'filled' | 'completed' | 'cancelled' - Job status
- created_at: Date - Job posting timestamp

**TypeScript Interface:**

```typescript
interface Job {
  id: string;
  posted_by_user_id: string;
  title: string;
  description: string;
  job_type: "event_manager" | "contractor_internal";
  service_category: string;
  budget_range_min: number;
  budget_range_max: number;
  location: string | null;
  is_remote: boolean;
  status: "active" | "filled" | "completed" | "cancelled";
  created_at: Date;
}
```

**Relationships:**

- Belongs to User (poster)
- One-to-many with JobApplications

### JobApplication

**Purpose:** Contractor applications to job postings

**Key Attributes:**

- id: string - Unique application identifier
- job_id: string - Foreign key to Job
- contractor_user_id: string - Foreign key to User (applicant)
- cover_letter: string - Application message
- attachment_1_url: string | null - First attachment URL (portfolio sample, CV, etc.)
- attachment_1_name: string | null - Original filename of first attachment
- attachment_2_url: string | null - Second attachment URL
- attachment_2_name: string | null - Original filename of second attachment
- status: 'submitted' | 'viewed' | 'shortlisted' | 'rejected' | 'accepted' - Application status
- submitted_at: Date - Application submission timestamp
- viewed_at: Date | null - When application was viewed by poster
- responded_at: Date | null - When poster responded to application

**TypeScript Interface:**

```typescript
interface JobApplication {
  id: string;
  job_id: string;
  contractor_user_id: string;
  cover_letter: string;
  attachment_1_url: string | null;
  attachment_1_name: string | null;
  attachment_2_url: string | null;
  attachment_2_name: string | null;
  status: "submitted" | "viewed" | "shortlisted" | "rejected" | "accepted";
  submitted_at: Date;
  viewed_at: Date | null;
  responded_at: Date | null;
}
```

**File Limits for Attachments:**

- Max 5MB per attachment
- Allowed formats: PDF, DOC, DOCX, JPG, PNG, WebP
- Max 2 attachments per application

**Relationships:**

- Belongs to Job
- Belongs to User (contractor)

### Testimonial

**Purpose:** Reviews and ratings system for contractors and platform feedback

**Key Attributes:**

- id: string - Unique testimonial identifier
- from_user_id: string - Foreign key to User (reviewer)
- to_user_id: string - Foreign key to User (contractor)
- rating: number - 1-5 star rating
- comment: string - Written review
- response: string | null - Contractor response (max 500 characters)
- response_created_at: Date | null - Response timestamp
- created_at: Date - Review timestamp

**TypeScript Interface:**

```typescript
interface Testimonial {
  id: string;
  from_user_id: string;
  to_user_id: string;
  rating: number;
  comment: string;
  response: string | null;
  response_created_at: Date | null;
  created_at: Date;
}
```

**Relationships:**

- Belongs to User (reviewer)
- Belongs to User (contractor)

### Subscription

**Purpose:** Contractor subscription management for Essential, Showcase, and Spotlight tiers

**Key Attributes:**

- id: string - Unique subscription identifier
- user_id: string - Foreign key to User (contractor)
- tier: 'essential' | 'showcase' | 'spotlight' - Subscription tier
- status: 'active' | 'cancelled' | 'expired' | 'trial' - Subscription status
- billing_cycle: 'monthly' | 'yearly' | '2year' - Billing frequency
- price: number - Subscription price in cents
- payment_method_id: string | null - Stripe payment method reference
- payment_method_type: 'card' | 'bank_transfer' | null - Payment method type
- trial_ends_at: Date | null - Trial expiration date
- current_period_start: Date - Current billing period start
- current_period_end: Date - Current billing period end
- stripe_subscription_id: string | null - Stripe subscription reference
- created_at: Date - Subscription creation timestamp
- updated_at: Date - Last update timestamp

**TypeScript Interface:**

```typescript
interface Subscription {
  id: string;
  user_id: string;
  tier: "essential" | "showcase" | "spotlight";
  status: "active" | "cancelled" | "expired" | "trial";
  billing_cycle: "monthly" | "yearly" | "2year";
  price: number;
  payment_method_id: string | null;
  payment_method_type: "card" | "bank_transfer" | null;
  trial_ends_at: Date | null;
  current_period_start: Date;
  current_period_end: Date;
  stripe_subscription_id: string | null;
  created_at: Date;
  updated_at: Date;
}
```

**Relationships:**

- Belongs to User (contractor)

### PortfolioItem

**Purpose:** Contractor portfolio photos, videos, and media showcasing past work

**Key Attributes:**

- id: string - Unique portfolio item identifier
- business_profile_id: string - Foreign key to BusinessProfile
- title: string - Portfolio item title
- description: string - Item description
- media_type: 'image' | 'youtube' | 'vimeo' - Type of media (no video storage)
- media_url: string - URL to image file or video embed
- thumbnail_url: string | null - Thumbnail image URL
- event_name: string | null - Name of the event this work was for
- event_date: Date | null - Date of the event
- is_featured: boolean - Whether this is a featured portfolio item
- display_order: number - Order for display in portfolio
- created_at: Date - Portfolio item creation timestamp

**File Limits:**

- **Images:** Max 10MB per file, formats: JPG, PNG, WebP
- **YouTube/Vimeo:** Just store the URL, no file size limits
- **Total portfolio:** Max 20 items per contractor (tier-dependent)

**TypeScript Interface:**

```typescript
interface PortfolioItem {
  id: string;
  business_profile_id: string;
  title: string;
  description: string;
  media_type: "image" | "youtube" | "vimeo";
  media_url: string;
  thumbnail_url: string | null;
  event_name: string | null;
  event_date: Date | null;
  is_featured: boolean;
  display_order: number;
  created_at: Date;
}
```

**Relationships:**

- Belongs to BusinessProfile

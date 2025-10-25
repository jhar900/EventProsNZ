# Event Pros NZ Fullstack Architecture Document

**Document Version:** 1.0  
**Date:** 21 Sept 2025  
**Author:** Winston (Architect)  
**Project:** Event Pros NZ - New Zealand's Event Ecosystem

## Introduction

This document outlines the complete fullstack architecture for Event Pros NZ, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

Based on my review of the PRD and front-end spec, this is a **greenfield project** with no existing starter template mentioned. The PRD specifies:

- **Next.js 14** with App Router for frontend
- **Supabase** for backend services (database, auth, storage)
- **Vercel** for deployment
- **TypeScript** throughout

**N/A - Greenfield project**

### Change Log

| Date         | Version | Description                            | Author              |
| ------------ | ------- | -------------------------------------- | ------------------- |
| 21 Sept 2025 | 1.0     | Initial fullstack architecture created | Winston (Architect) |

## High Level Architecture

### Technical Summary

Event Pros NZ is built as a modern Jamstack application using Next.js 14 with App Router for the frontend, integrated with Supabase as the backend-as-a-service platform. The architecture leverages serverless functions for complex business logic while maintaining real-time capabilities through Supabase's built-in real-time subscriptions. The platform is deployed on Vercel with global CDN distribution, ensuring sub-1 second page load times and 99.5% uptime. This architecture achieves the PRD's goals of creating a scalable two-sided marketplace that efficiently connects event managers with contractors while providing intelligent planning assistance and comprehensive business management tools.

### Platform and Infrastructure Choice

**Platform:** Vercel + Supabase  
**Key Services:** Next.js 14, Supabase (PostgreSQL, Auth, Storage, Edge Functions), Vercel (Deployment, CDN), Mapbox, Stripe, SendGrid  
**Deployment Host and Regions:** Vercel global edge network with primary focus on Asia-Pacific region

### Repository Structure

**Structure:** Monorepo with Turborepo  
**Monorepo Tool:** Turborepo for build optimization and task orchestration  
**Package Organization:**

- `apps/web` - Next.js frontend application
- `apps/api` - Supabase Edge Functions (serverless backend)
- `packages/shared` - Shared TypeScript types and utilities
- `packages/ui` - Shared UI components (shadcn/ui based)

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile Browser]
    end

    subgraph "CDN & Edge"
        VERCEL[Vercel Edge Network]
        CDN[Global CDN]
    end

    subgraph "Frontend Application"
        NEXTJS[Next.js 14 App]
        PAGES[Pages & Components]
        STATE[State Management]
    end

    subgraph "Backend Services"
        SUPABASE[Supabase Platform]
        AUTH[Supabase Auth]
        DB[(PostgreSQL Database)]
        STORAGE[Supabase Storage]
        EDGE[Edge Functions]
    end

    subgraph "External Services"
        MAPBOX[Mapbox API]
        STRIPE[Stripe Payments]
        SENDGRID[SendGrid Email]
        ANALYTICS[Google Analytics]
    end

    WEB --> VERCEL
    MOBILE --> VERCEL
    VERCEL --> CDN
    CDN --> NEXTJS
    NEXTJS --> PAGES
    NEXTJS --> STATE
    NEXTJS --> SUPABASE
    SUPABASE --> AUTH
    SUPABASE --> DB
    SUPABASE --> STORAGE
    SUPABASE --> EDGE
    EDGE --> MAPBOX
    EDGE --> STRIPE
    EDGE --> SENDGRID
    NEXTJS --> ANALYTICS
```

### Architectural Patterns

- **Jamstack Architecture:** Static site generation with serverless APIs - _Rationale:_ Optimal performance and scalability for content-heavy applications with real-time features
- **Component-Based UI:** Reusable React components with TypeScript - _Rationale:_ Maintainability and type safety across large codebases
- **Repository Pattern:** Abstract data access logic through Supabase client - _Rationale:_ Enables testing and future database migration flexibility
- **API Gateway Pattern:** Supabase as single entry point for all API calls - _Rationale:_ Centralized auth, rate limiting, and monitoring
- **Serverless Functions:** Edge Functions for complex business logic - _Rationale:_ Scalable, cost-effective processing without server management
- **Real-time Subscriptions:** Supabase real-time for live updates - _Rationale:_ Enables live contractor availability, inquiry notifications, and job board updates

## Tech Stack

| Category             | Technology              | Version  | Purpose                         | Rationale                                              |
| -------------------- | ----------------------- | -------- | ------------------------------- | ------------------------------------------------------ |
| Frontend Language    | TypeScript              | 5.3+     | Type-safe development           | Ensures code quality and developer experience          |
| Frontend Framework   | Next.js                 | 14.0+    | React framework with App Router | Optimal for SEO, performance, and developer experience |
| UI Component Library | shadcn/ui               | Latest   | Component system                | Accessible, customizable, and modern design system     |
| State Management     | Zustand                 | 4.4+     | Client state management         | Lightweight, TypeScript-first, simple API              |
| Backend Language     | TypeScript              | 5.3+     | Serverless functions            | Consistency across fullstack, type safety              |
| Backend Framework    | Supabase Edge Functions | Latest   | Serverless backend              | Integrated with Supabase ecosystem                     |
| API Style            | REST + Real-time        | -        | API communication               | REST for CRUD, real-time for live updates              |
| Database             | PostgreSQL              | 15+      | Primary database                | ACID compliance, full-text search, JSON support        |
| Cache                | Supabase Cache          | Built-in | Query caching                   | Automatic query optimization and caching               |
| File Storage         | Supabase Storage        | Latest   | File management                 | Integrated with auth, CDN distribution                 |
| Authentication       | Supabase Auth           | Latest   | User authentication             | OAuth, email/password, session management              |
| Frontend Testing     | Jest + Testing Library  | Latest   | Unit and integration tests      | Industry standard, React-optimized                     |
| Backend Testing      | Jest + Supertest        | Latest   | API testing                     | Consistent testing framework                           |
| E2E Testing          | Playwright              | Latest   | End-to-end testing              | Cross-browser, reliable, fast                          |
| Build Tool           | Next.js                 | 14.0+    | Frontend build                  | Optimized for React applications                       |
| Bundler              | Turbopack               | Latest   | Fast bundling                   | Next.js 14 default, faster than Webpack                |
| IaC Tool             | Vercel CLI              | Latest   | Infrastructure management       | Platform-specific deployment tooling                   |
| CI/CD                | GitHub Actions          | Latest   | Continuous integration          | Integrated with GitHub, extensive marketplace          |
| Monitoring           | Vercel Analytics        | Latest   | Performance monitoring          | Built-in Next.js integration                           |
| Logging              | Supabase Logs           | Built-in | Application logging             | Centralized logging with Supabase                      |
| CSS Framework        | Tailwind CSS            | 3.4+     | Utility-first CSS               | Rapid development, consistent design                   |

## Data Models

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
  role: 'event_manager' | 'contractor' | 'admin';
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
  status: 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled';
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
  status: 'required' | 'optional' | 'confirmed' | 'rejected';
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
  status: 'pending' | 'accepted' | 'declined' | 'completed';
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
  status: 'sent' | 'viewed' | 'responded' | 'quoted';
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
  message_type: 'text' | 'quote' | 'file' | 'phone_call' | 'meeting';
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
  job_type: 'event_manager' | 'contractor_internal';
  service_category: string;
  budget_range_min: number;
  budget_range_max: number;
  location: string | null;
  is_remote: boolean;
  status: 'active' | 'filled' | 'completed' | 'cancelled';
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
  status: 'submitted' | 'viewed' | 'shortlisted' | 'rejected' | 'accepted';
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
  tier: 'essential' | 'showcase' | 'spotlight';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  billing_cycle: 'monthly' | 'yearly' | '2year';
  price: number;
  payment_method_id: string | null;
  payment_method_type: 'card' | 'bank_transfer' | null;
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
  media_type: 'image' | 'youtube' | 'vimeo';
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

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Event Pros NZ API
  version: 1.0.0
  description: REST API for Event Pros NZ - New Zealand's Event Ecosystem
servers:
  - url: https://api.eventpros.co.nz/v1
    description: Production server
  - url: https://staging-api.eventpros.co.nz/v1
    description: Staging server

security:
  - SupabaseAuth: []

paths:
  # Authentication Endpoints
  /auth/register:
    post:
      summary: Register new user
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                role:
                  type: string
                  enum: [event_manager, contractor]
                first_name:
                  type: string
                last_name:
                  type: string
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'

  /auth/login:
    post:
      summary: User login
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  access_token:
                    type: string
                  refresh_token:
                    type: string

  # User Management
  /users/me:
    get:
      summary: Get current user profile
      tags: [Users]
      responses:
        '200':
          description: User profile retrieved
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/User'
                  - $ref: '#/components/schemas/Profile'
                  - $ref: '#/components/schemas/BusinessProfile'

    put:
      summary: Update user profile
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProfileUpdate'
      responses:
        '200':
          description: Profile updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Profile'

  # Events
  /events:
    get:
      summary: List user's events
      tags: [Events]
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [draft, planning, confirmed, completed, cancelled]
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Events retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  events:
                    type: array
                    items:
                      $ref: '#/components/schemas/Event'
                  total:
                    type: integer

    post:
      summary: Create new event
      tags: [Events]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EventCreate'
      responses:
        '201':
          description: Event created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Event'

  /events/{eventId}:
    get:
      summary: Get event details
      tags: [Events]
      parameters:
        - name: eventId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Event details retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Event'

    put:
      summary: Update event
      tags: [Events]
      parameters:
        - name: eventId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EventUpdate'
      responses:
        '200':
          description: Event updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Event'

    delete:
      summary: Delete event
      tags: [Events]
      parameters:
        - name: eventId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Event deleted successfully

  # Event Service Management
  /events/{eventId}/services:
    get:
      summary: Get event services
      tags: [Events]
      parameters:
        - name: eventId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Event services retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/EventService'

    post:
      summary: Add service to event
      tags: [Events]
      parameters:
        - name: eventId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EventServiceCreate'
      responses:
        '201':
          description: Service added to event
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EventService'

  /events/{eventId}/services/{serviceId}:
    put:
      summary: Update event service
      tags: [Events]
      parameters:
        - name: eventId
          in: path
          required: true
          schema:
            type: string
        - name: serviceId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EventServiceUpdate'
      responses:
        '200':
          description: Event service updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EventService'

    delete:
      summary: Remove service from event
      tags: [Events]
      parameters:
        - name: eventId
          in: path
          required: true
          schema:
            type: string
        - name: serviceId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Service removed from event

  # Contractors Directory
  /contractors:
    get:
      summary: Search contractors
      tags: [Contractors]
      parameters:
        - name: search
          in: query
          schema:
            type: string
        - name: service_category
          in: query
          schema:
            type: string
        - name: location
          in: query
          schema:
            type: string
        - name: min_rating
          in: query
          schema:
            type: number
            minimum: 1
            maximum: 5
        - name: max_price
          in: query
          schema:
            type: number
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Contractors retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  contractors:
                    type: array
                    items:
                      $ref: '#/components/schemas/ContractorSummary'
                  total:
                    type: integer

  /contractors/{contractorId}:
    get:
      summary: Get contractor profile
      tags: [Contractors]
      parameters:
        - name: contractorId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Contractor profile retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContractorProfile'

  # Contractor Service Management
  /contractors/me/services:
    get:
      summary: Get contractor's services
      tags: [Contractors]
      responses:
        '200':
          description: Services retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Service'

    post:
      summary: Create new service
      tags: [Contractors]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ServiceCreate'
      responses:
        '201':
          description: Service created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Service'

  /contractors/me/services/{serviceId}:
    get:
      summary: Get service details
      tags: [Contractors]
      parameters:
        - name: serviceId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Service details retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Service'

    put:
      summary: Update service
      tags: [Contractors]
      parameters:
        - name: serviceId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ServiceUpdate'
      responses:
        '200':
          description: Service updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Service'

    delete:
      summary: Delete service
      tags: [Contractors]
      parameters:
        - name: serviceId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Service deleted

  # Portfolio Management
  /contractors/me/portfolio:
    get:
      summary: Get contractor's portfolio
      tags: [Contractors]
      responses:
        '200':
          description: Portfolio retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/PortfolioItem'

    post:
      summary: Add portfolio item
      tags: [Contractors]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PortfolioItemCreate'
      responses:
        '201':
          description: Portfolio item created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PortfolioItem'

  /contractors/me/portfolio/{itemId}:
    get:
      summary: Get portfolio item
      tags: [Contractors]
      parameters:
        - name: itemId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Portfolio item retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PortfolioItem'

    put:
      summary: Update portfolio item
      tags: [Contractors]
      parameters:
        - name: itemId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PortfolioItemUpdate'
      responses:
        '200':
          description: Portfolio item updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PortfolioItem'

    delete:
      summary: Delete portfolio item
      tags: [Contractors]
      parameters:
        - name: itemId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Portfolio item deleted

  # Enquiries
  /enquiries:
    post:
      summary: Send enquiry to contractor
      tags: [Enquiries]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EnquiryCreate'
      responses:
        '201':
          description: Enquiry sent successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Enquiry'

  /enquiries/{enquiryId}:
    get:
      summary: Get enquiry details
      tags: [Enquiries]
      parameters:
        - name: enquiryId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Enquiry details retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Enquiry'

  /enquiries/{enquiryId}/messages:
    get:
      summary: Get enquiry messages
      tags: [Enquiries]
      parameters:
        - name: enquiryId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Messages retrieved successfully
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/EnquiryMessage'

    post:
      summary: Send message in enquiry
      tags: [Enquiries]
      parameters:
        - name: enquiryId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EnquiryMessageCreate'
      responses:
        '201':
          description: Message sent successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EnquiryMessage'

  # Job Board
  /jobs:
    get:
      summary: List job postings
      tags: [Jobs]
      parameters:
        - name: job_type
          in: query
          schema:
            type: string
            enum: [event_manager, contractor_internal]
        - name: service_category
          in: query
          schema:
            type: string
        - name: location
          in: query
          schema:
            type: string
        - name: is_remote
          in: query
          schema:
            type: boolean
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Jobs retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  jobs:
                    type: array
                    items:
                      $ref: '#/components/schemas/Job'
                  total:
                    type: integer

    post:
      summary: Create job posting
      tags: [Jobs]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JobCreate'
      responses:
        '201':
          description: Job created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Job'

  /jobs/{jobId}:
    get:
      summary: Get job details
      tags: [Jobs]
      parameters:
        - name: jobId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Job details retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Job'

    put:
      summary: Update job posting
      tags: [Jobs]
      parameters:
        - name: jobId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JobUpdate'
      responses:
        '200':
          description: Job updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Job'

    delete:
      summary: Delete job posting
      tags: [Jobs]
      parameters:
        - name: jobId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Job deleted successfully

  /jobs/{jobId}/applications:
    get:
      summary: Get job applications
      tags: [Jobs]
      parameters:
        - name: jobId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Applications retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/JobApplication'

    post:
      summary: Apply to job
      tags: [Jobs]
      parameters:
        - name: jobId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JobApplicationCreate'
      responses:
        '201':
          description: Application submitted successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JobApplication'

  # File Upload
  /upload/profile-photo:
    post:
      summary: Upload profile photo
      tags: [Files]
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        '201':
          description: Profile photo uploaded
          content:
            application/json:
              schema:
                type: object
                properties:
                  url:
                    type: string
                  filename:
                    type: string

  /upload/portfolio:
    post:
      summary: Upload portfolio image
      tags: [Files]
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        '201':
          description: Portfolio image uploaded
          content:
            application/json:
              schema:
                type: object
                properties:
                  url:
                    type: string
                  filename:
                    type: string

  /upload/attachment:
    post:
      summary: Upload file attachment
      tags: [Files]
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        '201':
          description: File uploaded
          content:
            application/json:
              schema:
                type: object
                properties:
                  url:
                    type: string
                  filename:
                    type: string

  # Subscriptions
  /subscriptions:
    get:
      summary: Get user subscription
      tags: [Subscriptions]
      responses:
        '200':
          description: Subscription retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Subscription'

    post:
      summary: Create subscription
      tags: [Subscriptions]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SubscriptionCreate'
      responses:
        '201':
          description: Subscription created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Subscription'

  /subscriptions/{subscriptionId}:
    put:
      summary: Update subscription
      tags: [Subscriptions]
      parameters:
        - name: subscriptionId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SubscriptionUpdate'
      responses:
        '200':
          description: Subscription updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Subscription'

    delete:
      summary: Cancel subscription
      tags: [Subscriptions]
      parameters:
        - name: subscriptionId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Subscription cancelled successfully

  # Testimonials
  /testimonials:
    get:
      summary: List testimonials
      tags: [Testimonials]
      parameters:
        - name: contractor_id
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Testimonials retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  testimonials:
                    type: array
                    items:
                      $ref: '#/components/schemas/Testimonial'
                  total:
                    type: integer

    post:
      summary: Create testimonial
      tags: [Testimonials]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TestimonialCreate'
      responses:
        '201':
          description: Testimonial created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Testimonial'

  /testimonials/{testimonialId}/response:
    post:
      summary: Respond to testimonial
      tags: [Testimonials]
      parameters:
        - name: testimonialId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                response:
                  type: string
                  maxLength: 500
      responses:
        '200':
          description: Response added successfully

  # Admin Endpoints
  /admin/users:
    get:
      summary: List all users (Admin only)
      tags: [Admin]
      parameters:
        - name: role
          in: query
          schema:
            type: string
            enum: [event_manager, contractor, admin]
        - name: status
          in: query
          schema:
            type: string
            enum: [verified, unverified, suspended]
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Users retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  users:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  total:
                    type: integer

  /admin/users/{userId}/verify:
    post:
      summary: Verify user account (Admin only)
      tags: [Admin]
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User verified successfully

  /admin/users/{userId}/suspend:
    post:
      summary: Suspend user account (Admin only)
      tags: [Admin]
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
      responses:
        '200':
          description: User suspended successfully

  /admin/analytics:
    get:
      summary: Get platform analytics (Admin only)
      tags: [Admin]
      parameters:
        - name: period
          in: query
          schema:
            type: string
            enum: [day, week, month, year]
            default: month
      responses:
        '200':
          description: Analytics retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  total_users:
                    type: integer
                  active_contractors:
                    type: integer
                  total_events:
                    type: integer
                  total_jobs:
                    type: integer
                  revenue:
                    type: number

  # Notifications
  /notifications:
    get:
      summary: Get user notifications
      tags: [Notifications]
      parameters:
        - name: unread_only
          in: query
          schema:
            type: boolean
            default: false
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Notifications retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  notifications:
                    type: array
                    items:
                      $ref: '#/components/schemas/Notification'
                  total:
                    type: integer

  /notifications/{notificationId}/read:
    put:
      summary: Mark notification as read
      tags: [Notifications]
      parameters:
        - name: notificationId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Notification marked as read

  # Search & Discovery
  /search/contractors:
    get:
      summary: Advanced contractor search with multiple filters
      tags: [Search]
      parameters:
        - name: q
          in: query
          description: Search query
          schema:
            type: string
        - name: categories
          in: query
          description: Comma-separated service categories
          schema:
            type: string
        - name: price_min
          in: query
          description: Minimum price filter
          schema:
            type: number
        - name: price_max
          in: query
          description: Maximum price filter
          schema:
            type: number
        - name: rating_min
          in: query
          description: Minimum rating filter
          schema:
            type: number
            minimum: 1
            maximum: 5
        - name: availability_date
          in: query
          description: Available on specific date
          schema:
            type: string
            format: date-time
        - name: location
          in: query
          description: Location radius search
          schema:
            type: string
        - name: verified_only
          in: query
          description: Only verified contractors
          schema:
            type: boolean
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Search results retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  contractors:
                    type: array
                    items:
                      $ref: '#/components/schemas/ContractorSummary'
                  total:
                    type: integer
                  filters_applied:
                    type: object
                    description: Summary of applied filters

  /search/suggestions:
    get:
      summary: Get search suggestions for autocomplete
      tags: [Search]
      parameters:
        - name: q
          in: query
          description: Partial search query
          required: true
          schema:
            type: string
            minLength: 1
        - name: type
          in: query
          description: Type of suggestions to return
          schema:
            type: string
            enum: [contractors, services, locations]
        - name: limit
          in: query
          description: Maximum number of suggestions
          schema:
            type: integer
            default: 10
            maximum: 20
      responses:
        '200':
          description: Search suggestions retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  suggestions:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                        text:
                          type: string
                        type:
                          type: string
                        category:
                          type: string
                        metadata:
                          type: object

  # Favorites & Bookmarks
  /favorites/contractors:
    get:
      summary: Get user's favorite contractors
      tags: [Favorites]
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Favorite contractors retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  contractors:
                    type: array
                    items:
                      $ref: '#/components/schemas/ContractorSummary'
                  total:
                    type: integer

    post:
      summary: Add contractor to favorites
      tags: [Favorites]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [contractor_id]
              properties:
                contractor_id:
                  type: string
      responses:
        '201':
          description: Contractor added to favorites
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  contractor_id:
                    type: string

    delete:
      summary: Remove contractor from favorites
      tags: [Favorites]
      parameters:
        - name: contractor_id
          in: query
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Contractor removed from favorites
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string

  /favorites/event-templates:
    get:
      summary: Get saved event templates
      tags: [Favorites]
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Event templates retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  templates:
                    type: array
                    items:
                      $ref: '#/components/schemas/EventTemplate'
                  total:
                    type: integer

    post:
      summary: Save event as template
      tags: [Favorites]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [event_id, template_name]
              properties:
                event_id:
                  type: string
                template_name:
                  type: string
                description:
                  type: string
      responses:
        '201':
          description: Event saved as template
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EventTemplate'

  /favorites/event-templates/{templateId}:
    get:
      summary: Get event template details
      tags: [Favorites]
      parameters:
        - name: templateId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Event template retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EventTemplate'

    put:
      summary: Update event template
      tags: [Favorites]
      parameters:
        - name: templateId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                template_name:
                  type: string
                description:
                  type: string
      responses:
        '200':
          description: Event template updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EventTemplate'

    delete:
      summary: Delete event template
      tags: [Favorites]
      parameters:
        - name: templateId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Event template deleted

    post:
      summary: Create event from template
      tags: [Favorites]
      parameters:
        - name: templateId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                event_date:
                  type: string
                  format: date-time
                location:
                  type: string
                attendee_count:
                  type: integer
                budget:
                  type: number
      responses:
        '201':
          description: Event created from template
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Event'

components:
  securitySchemes:
    SupabaseAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        role:
          type: string
          enum: [event_manager, contractor, admin]
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
        is_verified:
          type: boolean
        last_login:
          type: string
          format: date-time
          nullable: true

    Profile:
      type: object
      properties:
        user_id:
          type: string
        first_name:
          type: string
        last_name:
          type: string
        phone:
          type: string
        address:
          type: string
        profile_photo_url:
          type: string
          nullable: true
        bio:
          type: string
          nullable: true
        preferences:
          type: object

    BusinessProfile:
      type: object
      properties:
        user_id:
          type: string
        company_name:
          type: string
        business_address:
          type: string
        nzbn:
          type: string
          nullable: true
        description:
          type: string
        service_areas:
          type: array
          items:
            type: string
        social_links:
          type: object
        is_verified:
          type: boolean
        verification_date:
          type: string
          format: date-time
          nullable: true

    Event:
      type: object
      properties:
        id:
          type: string
        user_id:
          type: string
        title:
          type: string
        event_type:
          type: string
        event_date:
          type: string
          format: date-time
        end_date:
          type: string
          format: date-time
          nullable: true
        is_multi_day:
          type: boolean
        location:
          type: string
        attendee_count:
          type: integer
        duration_hours:
          type: number
        budget:
          type: number
        status:
          type: string
          enum: [draft, planning, confirmed, completed, cancelled]
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    EventCreate:
      type: object
      required:
        [
          title,
          event_type,
          event_date,
          location,
          attendee_count,
          duration_hours,
          budget,
        ]
      properties:
        title:
          type: string
        event_type:
          type: string
        event_date:
          type: string
          format: date-time
        end_date:
          type: string
          format: date-time
        is_multi_day:
          type: boolean
          default: false
        location:
          type: string
        attendee_count:
          type: integer
          minimum: 1
        duration_hours:
          type: number
          minimum: 0.5
        budget:
          type: number
          minimum: 0

    EventUpdate:
      type: object
      properties:
        title:
          type: string
        event_type:
          type: string
        event_date:
          type: string
          format: date-time
        end_date:
          type: string
          format: date-time
        is_multi_day:
          type: boolean
        location:
          type: string
        attendee_count:
          type: integer
        duration_hours:
          type: number
        budget:
          type: number
        status:
          type: string
          enum: [draft, planning, confirmed, completed, cancelled]

    EventService:
      type: object
      properties:
        id:
          type: string
        event_id:
          type: string
        service_id:
          type: string
        status:
          type: string
          enum: [required, optional, confirmed, rejected]
        budget_allocated:
          type: number
          nullable: true
        quoted_price:
          type: number
          nullable: true
        quoted_at:
          type: string
          format: date-time
          nullable: true
        notes:
          type: string
          nullable: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    EventServiceCreate:
      type: object
      required: [service_id, status]
      properties:
        service_id:
          type: string
        status:
          type: string
          enum: [required, optional]
        budget_allocated:
          type: number
        notes:
          type: string

    EventServiceUpdate:
      type: object
      properties:
        status:
          type: string
          enum: [required, optional, confirmed, rejected]
        budget_allocated:
          type: number
        quoted_price:
          type: number
        notes:
          type: string

    ContractorSummary:
      type: object
      properties:
        id:
          type: string
        company_name:
          type: string
        description:
          type: string
        service_categories:
          type: array
          items:
            type: string
        location:
          type: string
        average_rating:
          type: number
        review_count:
          type: integer
        is_verified:
          type: boolean
        subscription_tier:
          type: string
          enum: [essential, showcase, spotlight]

    ContractorProfile:
      allOf:
        - $ref: '#/components/schemas/ContractorSummary'
        - type: object
          properties:
            services:
              type: array
              items:
                $ref: '#/components/schemas/Service'
            portfolio:
              type: array
              items:
                $ref: '#/components/schemas/PortfolioItem'
            testimonials:
              type: array
              items:
                $ref: '#/components/schemas/Testimonial'

    Service:
      type: object
      properties:
        id:
          type: string
        business_profile_id:
          type: string
        name:
          type: string
        description:
          type: string
        category:
          type: string
        price_range_min:
          type: number
        price_range_max:
          type: number
        is_available:
          type: boolean
        response_time_hours:
          type: number

    ServiceCreate:
      type: object
      required: [name, description, category, price_range_min, price_range_max]
      properties:
        name:
          type: string
        description:
          type: string
        category:
          type: string
        price_range_min:
          type: number
        price_range_max:
          type: number
        is_available:
          type: boolean
          default: true
        response_time_hours:
          type: number
          default: 24

    ServiceUpdate:
      type: object
      properties:
        name:
          type: string
        description:
          type: string
        category:
          type: string
        price_range_min:
          type: number
        price_range_max:
          type: number
        is_available:
          type: boolean
        response_time_hours:
          type: number

    PortfolioItem:
      type: object
      properties:
        id:
          type: string
        business_profile_id:
          type: string
        title:
          type: string
        description:
          type: string
        media_type:
          type: string
          enum: [image, youtube, vimeo]
        media_url:
          type: string
        thumbnail_url:
          type: string
          nullable: true
        event_name:
          type: string
          nullable: true
        event_date:
          type: string
          format: date-time
          nullable: true
        is_featured:
          type: boolean
        display_order:
          type: integer
        created_at:
          type: string
          format: date-time

    PortfolioItemCreate:
      type: object
      required: [title, description, media_type, media_url]
      properties:
        title:
          type: string
        description:
          type: string
        media_type:
          type: string
          enum: [image, youtube, vimeo]
        media_url:
          type: string
        thumbnail_url:
          type: string
        event_name:
          type: string
        event_date:
          type: string
          format: date-time
        is_featured:
          type: boolean
          default: false
        display_order:
          type: integer

    PortfolioItemUpdate:
      type: object
      properties:
        title:
          type: string
        description:
          type: string
        media_type:
          type: string
          enum: [image, youtube, vimeo]
        media_url:
          type: string
        thumbnail_url:
          type: string
        event_name:
          type: string
        event_date:
          type: string
          format: date-time
        is_featured:
          type: boolean
        display_order:
          type: integer

    Enquiry:
      type: object
      properties:
        id:
          type: string
        event_id:
          type: string
        contractor_user_id:
          type: string
        message:
          type: string
        status:
          type: string
          enum: [sent, viewed, responded, quoted]
        created_at:
          type: string
          format: date-time
        responded_at:
          type: string
          format: date-time
          nullable: true

    EnquiryCreate:
      type: object
      required: [event_id, contractor_user_id, message]
      properties:
        event_id:
          type: string
        contractor_user_id:
          type: string
        message:
          type: string

    EnquiryMessage:
      type: object
      properties:
        id:
          type: string
        enquiry_id:
          type: string
        sender_user_id:
          type: string
        message:
          type: string
        message_type:
          type: string
          enum: [text, quote, file, phone_call, meeting]
        attachment_url:
          type: string
          nullable: true
        created_at:
          type: string
          format: date-time

    EnquiryMessageCreate:
      type: object
      required: [message, message_type]
      properties:
        message:
          type: string
        message_type:
          type: string
          enum: [text, quote, file, phone_call, meeting]
        attachment_url:
          type: string

    Job:
      type: object
      properties:
        id:
          type: string
        posted_by_user_id:
          type: string
        title:
          type: string
        description:
          type: string
        job_type:
          type: string
          enum: [event_manager, contractor_internal]
        service_category:
          type: string
        budget_range_min:
          type: number
        budget_range_max:
          type: number
        location:
          type: string
          nullable: true
        is_remote:
          type: boolean
        status:
          type: string
          enum: [active, filled, completed, cancelled]
        created_at:
          type: string
          format: date-time

    JobCreate:
      type: object
      required:
        [
          title,
          description,
          job_type,
          service_category,
          budget_range_min,
          budget_range_max,
        ]
      properties:
        title:
          type: string
        description:
          type: string
        job_type:
          type: string
          enum: [event_manager, contractor_internal]
        service_category:
          type: string
        budget_range_min:
          type: number
        budget_range_max:
          type: number
        location:
          type: string
        is_remote:
          type: boolean
          default: false

    JobUpdate:
      type: object
      properties:
        title:
          type: string
        description:
          type: string
        service_category:
          type: string
        budget_range_min:
          type: number
        budget_range_max:
          type: number
        location:
          type: string
        is_remote:
          type: boolean
        status:
          type: string
          enum: [active, filled, completed, cancelled]

    JobApplication:
      type: object
      properties:
        id:
          type: string
        job_id:
          type: string
        contractor_user_id:
          type: string
        cover_letter:
          type: string
        attachment_1_url:
          type: string
          nullable: true
        attachment_1_name:
          type: string
          nullable: true
        attachment_2_url:
          type: string
          nullable: true
        attachment_2_name:
          type: string
          nullable: true
        status:
          type: string
          enum: [submitted, viewed, shortlisted, rejected, accepted]
        submitted_at:
          type: string
          format: date-time
        viewed_at:
          type: string
          format: date-time
          nullable: true
        responded_at:
          type: string
          format: date-time
          nullable: true

    JobApplicationCreate:
      type: object
      required: [cover_letter]
      properties:
        cover_letter:
          type: string
        attachment_1_url:
          type: string
        attachment_1_name:
          type: string
        attachment_2_url:
          type: string
        attachment_2_name:
          type: string

    Subscription:
      type: object
      properties:
        id:
          type: string
        user_id:
          type: string
        tier:
          type: string
          enum: [essential, showcase, spotlight]
        status:
          type: string
          enum: [active, cancelled, expired, trial]
        billing_cycle:
          type: string
          enum: [monthly, yearly, 2year]
        price:
          type: number
        payment_method_id:
          type: string
          nullable: true
        payment_method_type:
          type: string
          enum: [card, bank_transfer]
          nullable: true
        trial_ends_at:
          type: string
          format: date-time
          nullable: true
        current_period_start:
          type: string
          format: date-time
        current_period_end:
          type: string
          format: date-time
        stripe_subscription_id:
          type: string
          nullable: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    SubscriptionCreate:
      type: object
      required: [tier, billing_cycle]
      properties:
        tier:
          type: string
          enum: [essential, showcase, spotlight]
        billing_cycle:
          type: string
          enum: [monthly, yearly, 2year]
        payment_method_id:
          type: string

    SubscriptionUpdate:
      type: object
      properties:
        tier:
          type: string
          enum: [essential, showcase, spotlight]
        billing_cycle:
          type: string
          enum: [monthly, yearly, 2year]
        payment_method_id:
          type: string

    Testimonial:
      type: object
      properties:
        id:
          type: string
        from_user_id:
          type: string
        to_user_id:
          type: string
        rating:
          type: integer
          minimum: 1
          maximum: 5
        comment:
          type: string
        response:
          type: string
          nullable: true
        response_created_at:
          type: string
          format: date-time
          nullable: true
        created_at:
          type: string
          format: date-time

    TestimonialCreate:
      type: object
      required: [to_user_id, rating, comment]
      properties:
        to_user_id:
          type: string
        rating:
          type: integer
          minimum: 1
          maximum: 5
        comment:
          type: string

    Notification:
      type: object
      properties:
        id:
          type: string
        user_id:
          type: string
        type:
          type: string
          enum: [enquiry, job_application, testimonial, subscription, system]
        title:
          type: string
        message:
          type: string
        is_read:
          type: boolean
        created_at:
          type: string
          format: date-time

    ProfileUpdate:
      type: object
      properties:
        first_name:
          type: string
        last_name:
          type: string
        phone:
          type: string
        address:
          type: string
        profile_photo_url:
          type: string
        bio:
          type: string
        preferences:
          type: object

    EventTemplate:
      type: object
      properties:
        id:
          type: string
        user_id:
          type: string
        template_name:
          type: string
        description:
          type: string
          nullable: true
        original_event_id:
          type: string
          nullable: true
        event_data:
          type: object
          properties:
            title:
              type: string
            event_type:
              type: string
            location:
              type: string
            attendee_count:
              type: integer
            duration_hours:
              type: number
            budget:
              type: number
            services:
              type: array
              items:
                type: object
                properties:
                  service_category:
                    type: string
                  budget_allocated:
                    type: number
                  notes:
                    type: string
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
            timestamp:
              type: string
              format: date-time
            request_id:
              type: string

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Forbidden:
      description: Forbidden
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    NotFound:
      description: Not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    InternalServerError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

### Real-time Subscriptions

The platform will use Supabase's real-time capabilities for live updates:

**Real-time Channels:**

- `enquiries:{enquiry_id}` - Live enquiry message updates
- `events:{event_id}` - Event status and service assignment updates
- `jobs:{job_id}` - Job application status updates
- `contractors:{contractor_id}` - Contractor profile and availability updates
- `notifications:{user_id}` - User-specific notifications

## Components

### Frontend Component Architecture

The frontend follows a component-based architecture using React with Next.js 14 App Router, organized into logical layers and reusable UI components.

#### Component Hierarchy

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── events/
│   │   ├── contractors/
│   │   ├── jobs/
│   │   └── profile/
│   ├── contractors/              # Public contractor pages
│   ├── jobs/                     # Public job board
│   └── globals.css
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui base components
│   ├── forms/                    # Form components
│   ├── layout/                   # Layout components
│   ├── features/                 # Feature-specific components
│   └── common/                   # Common utility components
├── lib/                          # Utilities and configurations
├── hooks/                        # Custom React hooks
├── stores/                       # Zustand state management
├── types/                        # TypeScript type definitions
└── utils/                        # Helper functions
```

#### Core UI Components (shadcn/ui)

**Layout Components:**

- `Header` - Navigation header with user menu
- `Sidebar` - Dashboard navigation sidebar
- `Footer` - Site footer with links
- `Breadcrumb` - Navigation breadcrumbs
- `Container` - Page content wrapper

**Form Components:**

- `Button` - Primary, secondary, ghost, destructive variants
- `Input` - Text input with validation states
- `Textarea` - Multi-line text input
- `Select` - Dropdown selection
- `Checkbox` - Checkbox input
- `RadioGroup` - Radio button group
- `Switch` - Toggle switch
- `DatePicker` - Date selection component
- `FileUpload` - File upload with drag & drop
- `FormField` - Form field wrapper with validation

**Data Display:**

- `Card` - Content card container
- `Table` - Data table with sorting/filtering
- `Badge` - Status and category badges
- `Avatar` - User profile images
- `Progress` - Progress indicators
- `Skeleton` - Loading placeholders
- `Alert` - Alert messages
- `Toast` - Notification toasts

**Navigation:**

- `Tabs` - Tab navigation
- `Pagination` - Page navigation
- `DropdownMenu` - Dropdown menus
- `Command` - Command palette
- `Sheet` - Slide-out panels

**Feedback:**

- `Dialog` - Modal dialogs
- `Sheet` - Slide-out panels
- `Popover` - Popover content
- `Tooltip` - Hover tooltips
- `AlertDialog` - Confirmation dialogs

#### Feature-Specific Components

**Authentication:**

```typescript
// components/features/auth/
-LoginForm -
  RegisterForm -
  ForgotPasswordForm -
  ResetPasswordForm -
  AuthGuard -
  RoleGuard;
```

**Events:**

```typescript
// components/features/events/
-EventCard -
  EventForm -
  EventList -
  EventDetails -
  EventServiceSelector -
  EventTimeline -
  EventStatusBadge -
  EventBudgetTracker;
```

**Contractors:**

```typescript
// components/features/contractors/
-ContractorCard -
  ContractorProfile -
  ContractorSearch -
  ContractorFilters -
  ServiceCard -
  PortfolioGallery -
  TestimonialCard -
  RatingDisplay -
  AvailabilityCalendar;
```

**Jobs:**

```typescript
// components/features/jobs/
-JobCard -
  JobForm -
  JobList -
  JobFilters -
  JobApplicationForm -
  ApplicationCard -
  JobStatusBadge;
```

**Enquiries:**

```typescript
// components/features/enquiries/
-EnquiryCard -
  EnquiryForm -
  EnquiryThread -
  MessageBubble -
  QuoteForm -
  EnquiryStatusBadge;
```

**Dashboard:**

```typescript
// components/features/dashboard/
-DashboardStats -
  RecentActivity -
  QuickActions -
  NotificationsList -
  UserProfile -
  SubscriptionStatus;
```

#### Component Patterns

**Compound Components:**

```typescript
// Example: EventCard with sub-components
<EventCard>
  <EventCard.Header>
    <EventCard.Title />
    <EventCard.Status />
  </EventCard.Header>
  <EventCard.Content>
    <EventCard.Details />
    <EventCard.Services />
  </EventCard.Content>
  <EventCard.Footer>
    <EventCard.Actions />
  </EventCard.Footer>
</EventCard>
```

**Render Props Pattern:**

```typescript
// Example: Data fetching with loading states
<DataFetcher
  url="/api/contractors"
  render={({ data, loading, error }) =>
    loading ? (
      <Skeleton />
    ) : error ? (
      <ErrorState />
    ) : (
      <ContractorList contractors={data} />
    )
  }
/>
```

**Custom Hooks:**

```typescript
// Example: Form management
const { form, handleSubmit, isSubmitting } = useEventForm({
  initialValues: eventData,
  validationSchema: eventSchema,
  onSubmit: handleEventSubmit,
});

// Example: Data fetching
const { data, loading, error, refetch } = useContractors({
  filters: searchFilters,
  pagination: { page, limit },
});
```

#### State Management Architecture

**Zustand Stores:**

```typescript
// stores/auth.ts
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
}

// stores/events.ts
interface EventStore {
  events: Event[];
  currentEvent: Event | null;
  filters: EventFilters;
  fetchEvents: () => Promise<void>;
  createEvent: (data: EventCreate) => Promise<void>;
  updateEvent: (id: string, data: EventUpdate) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

// stores/contractors.ts
interface ContractorStore {
  contractors: Contractor[];
  favorites: string[];
  searchFilters: ContractorFilters;
  fetchContractors: (filters?: ContractorFilters) => Promise<void>;
  addToFavorites: (contractorId: string) => Promise<void>;
  removeFromFavorites: (contractorId: string) => Promise<void>;
}
```

#### Form Management

**React Hook Form Integration:**

```typescript
// components/forms/EventForm.tsx
const EventForm = ({ initialData, onSubmit }: EventFormProps) => {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData || {
      title: "",
      event_type: "",
      event_date: "",
      location: "",
      attendee_count: 0,
      duration_hours: 0,
      budget: 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter event title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Additional form fields */}
      </form>
    </Form>
  );
};
```

#### Responsive Design System

**Breakpoints:**

```typescript
const breakpoints = {
  sm: '640px', // Mobile landscape
  md: '768px', // Tablet
  lg: '1024px', // Desktop
  xl: '1280px', // Large desktop
  '2xl': '1536px', // Extra large
};
```

**Grid System:**

```typescript
// 12-column responsive grid
<Grid container spacing={4}>
  <Grid item xs={12} md={8}>
    <EventDetails />
  </Grid>
  <Grid item xs={12} md={4}>
    <EventSidebar />
  </Grid>
</Grid>
```

#### Component Testing Strategy

**Unit Tests:**

```typescript
// __tests__/components/EventCard.test.tsx
describe("EventCard", () => {
  it("renders event information correctly", () => {
    const mockEvent = {
      id: "1",
      title: "Test Event",
      event_date: "2024-01-01",
      location: "Auckland",
      status: "confirmed",
    };

    render(<EventCard event={mockEvent} />);

    expect(screen.getByText("Test Event")).toBeInTheDocument();
    expect(screen.getByText("Auckland")).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
  });
});
```

**Integration Tests:**

```typescript
// __tests__/features/EventForm.test.tsx
describe("EventForm Integration", () => {
  it("submits form with valid data", async () => {
    const mockSubmit = jest.fn();
    render(<EventForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText("Event Title"), "Test Event");
    await user.click(screen.getByRole("button", { name: "Create Event" }));

    expect(mockSubmit).toHaveBeenCalledWith({
      title: "Test Event",
      // ... other form data
    });
  });
});
```

#### Performance Optimizations

**Code Splitting:**

```typescript
// Lazy loading for heavy components
const ContractorProfile = lazy(() => import('./ContractorProfile'));
const EventTimeline = lazy(() => import('./EventTimeline'));
const PortfolioGallery = lazy(() => import('./PortfolioGallery'));
```

**Memoization:**

```typescript
// Memoized expensive components
const ContractorCard = memo(({ contractor }: ContractorCardProps) => {
  return <Card>{/* Component content */}</Card>;
});

// Memoized callbacks
const handleContractorSelect = useCallback((contractorId: string) => {
  setSelectedContractor(contractorId);
}, []);
```

**Virtual Scrolling:**

```typescript
// For large lists
<VirtualizedList
  items={contractors}
  itemHeight={200}
  renderItem={({ item, index }) => (
    <ContractorCard key={item.id} contractor={item} />
  )}
/>
```

#### Accessibility Features

**ARIA Labels:**

```typescript
<Button aria-label="Add contractor to favorites" onClick={handleAddToFavorites}>
  <HeartIcon />
</Button>
```

**Keyboard Navigation:**

```typescript
// Focus management for modals
const Modal = ({ isOpen, onClose }: ModalProps) => {
  const focusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && focusRef.current) {
      focusRef.current.focus();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent ref={focusRef} tabIndex={-1}>
        {/* Modal content */}
      </DialogContent>
    </Dialog>
  );
};
```

**Screen Reader Support:**

```typescript
// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {notification && <Alert>{notification}</Alert>}
</div>
```

## Security

### Authentication & Authorization

#### Authentication Strategy

**Supabase Auth Integration:**

- **JWT-based authentication** with secure token management
- **Multi-factor authentication (MFA)** support for enhanced security
- **Social login** integration (Google, Facebook, LinkedIn)
- **Email verification** for account activation
- **Password reset** with secure token-based flow

**Authentication Flow:**

```typescript
// Authentication service
class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new AuthError(error.message);

    return {
      user: data.user,
      session: data.session,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
        },
      },
    });

    if (error) throw new AuthError(error.message);
    return data;
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async refreshToken(): Promise<string> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw new AuthError(error.message);
    return data.session.access_token;
  }
}
```

#### Role-Based Access Control (RBAC)

**User Roles:**

```typescript
enum UserRole {
  EVENT_MANAGER = 'event_manager',
  CONTRACTOR = 'contractor',
  ADMIN = 'admin',
}

enum Permission {
  // Event permissions
  CREATE_EVENT = 'create:event',
  READ_EVENT = 'read:event',
  UPDATE_EVENT = 'update:event',
  DELETE_EVENT = 'delete:event',

  // Contractor permissions
  CREATE_CONTRACTOR_PROFILE = 'create:contractor_profile',
  READ_CONTRACTOR_PROFILE = 'read:contractor_profile',
  UPDATE_CONTRACTOR_PROFILE = 'update:contractor_profile',

  // Job permissions
  CREATE_JOB = 'create:job',
  READ_JOB = 'read:job',
  UPDATE_JOB = 'update:job',
  DELETE_JOB = 'delete:job',
  APPLY_JOB = 'apply:job',

  // Admin permissions
  MANAGE_USERS = 'manage:users',
  VIEW_ANALYTICS = 'view:analytics',
  MANAGE_SUBSCRIPTIONS = 'manage:subscriptions',
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.EVENT_MANAGER]: [
    Permission.CREATE_EVENT,
    Permission.READ_EVENT,
    Permission.UPDATE_EVENT,
    Permission.DELETE_EVENT,
    Permission.READ_CONTRACTOR_PROFILE,
    Permission.CREATE_JOB,
    Permission.READ_JOB,
    Permission.UPDATE_JOB,
    Permission.DELETE_JOB,
  ],
  [UserRole.CONTRACTOR]: [
    Permission.CREATE_CONTRACTOR_PROFILE,
    Permission.READ_CONTRACTOR_PROFILE,
    Permission.UPDATE_CONTRACTOR_PROFILE,
    Permission.READ_EVENT,
    Permission.READ_JOB,
    Permission.APPLY_JOB,
  ],
  [UserRole.ADMIN]: [
    // All permissions
    ...Object.values(Permission),
  ],
};
```

**Authorization Middleware:**

```typescript
// API route protection
export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = user;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
}

// Permission-based access control
export function withPermission(permission: Permission) {
  return (handler: NextApiHandler) => {
    return withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
      const userRole = req.user.user_metadata.role as UserRole;
      const userPermissions = ROLE_PERMISSIONS[userRole];

      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      return handler(req, res);
    });
  };
}
```

#### Frontend Route Protection

**Auth Guards:**

```typescript
// components/guards/AuthGuard.tsx
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return <>{children}</>;
}

// components/guards/RoleGuard.tsx
export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const userRole = user.user_metadata.role as UserRole;

  if (!allowedRoles.includes(userRole)) {
    router.push("/unauthorized");
    return null;
  }

  return <>{children}</>;
}

// Usage in pages
export default function EventsPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={[UserRole.EVENT_MANAGER, UserRole.ADMIN]}>
        <EventsDashboard />
      </RoleGuard>
    </AuthGuard>
  );
}
```

### Data Protection

#### Input Validation & Sanitization

**Zod Schema Validation:**

```typescript
// lib/validations/auth.ts
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['event_manager', 'contractor']),
});

// lib/validations/event.ts
export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  event_type: z.string().min(1, 'Event type is required'),
  event_date: z.date().min(new Date(), 'Event date must be in the future'),
  location: z.string().min(1, 'Location is required'),
  attendee_count: z.number().min(1, 'Must have at least 1 attendee'),
  duration_hours: z.number().min(0.5, 'Duration must be at least 30 minutes'),
  budget: z.number().min(0, 'Budget must be positive'),
});
```

**Input Sanitization:**

```typescript
// lib/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

// API route validation
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid input data', error.errors);
    }
    throw error;
  }
}
```

#### SQL Injection Prevention

**Parameterized Queries:**

```typescript
// Using Supabase client with parameterized queries
export async function getContractors(filters: ContractorFilters) {
  let query = supabase.from('contractors').select(`
      id,
      company_name,
      description,
      service_categories,
      location,
      average_rating,
      is_verified
    `);

  // Safe parameter binding
  if (filters.search) {
    query = query.ilike('company_name', `%${filters.search}%`);
  }

  if (filters.categories?.length) {
    query = query.overlaps('service_categories', filters.categories);
  }

  if (filters.min_rating) {
    query = query.gte('average_rating', filters.min_rating);
  }

  const { data, error } = await query;

  if (error) throw new DatabaseError(error.message);
  return data;
}
```

#### XSS Protection

**Content Security Policy (CSP):**

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

**XSS Prevention in Components:**

```typescript
// Safe rendering of user content
export function UserContent({ content }: { content: string }) {
  const sanitizedContent = useMemo(() => sanitizeHtml(content), [content]);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      className="prose prose-sm max-w-none"
    />
  );
}

// Safe form inputs
export function SafeInput({ value, onChange, ...props }: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = sanitizeText(e.target.value);
    onChange(sanitizedValue);
  };

  return <Input value={value} onChange={handleChange} {...props} />;
}
```

### API Security

#### Rate Limiting

**API Rate Limiting:**

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
});

// API route protection
export async function withRateLimit(req: NextApiRequest, res: NextApiResponse) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const { success, limit, reset, remaining } = await ratelimit.limit(
    ip as string
  );

  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', new Date(reset).toISOString());

  if (!success) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round((reset - Date.now()) / 1000),
    });
  }
}
```

#### CORS Configuration

**CORS Settings:**

```typescript
// lib/cors.ts
import Cors from 'cors';

const cors = Cors({
  origin: [
    'https://eventpros.co.nz',
    'https://www.eventpros.co.nz',
    'https://staging.eventpros.co.nz',
    ...(process.env.NODE_ENV === 'development'
      ? ['http://localhost:3000']
      : []),
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
});

export function withCors(handler: NextApiHandler) {
  return (req: NextApiRequest, res: NextApiResponse) => {
    return new Promise((resolve, reject) => {
      cors(req, res, result => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(handler(req, res));
      });
    });
  };
}
```

### File Upload Security

#### File Validation

**Secure File Upload:**

```typescript
// lib/file-upload.ts
import { createHash } from 'crypto';
import sharp from 'sharp';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function validateFile(file: File): Promise<ValidationResult> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large' };
  }

  // Check file type
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  // Generate secure filename
  const fileHash = createHash('sha256')
    .update(file.name + Date.now())
    .digest('hex');

  const extension = file.name.split('.').pop();
  const secureFilename = `${fileHash}.${extension}`;

  return { valid: true, filename: secureFilename };
}

export async function processImage(file: Buffer): Promise<Buffer> {
  return await sharp(file)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}
```

#### Malware Scanning

**File Security Scanning:**

```typescript
// lib/security-scan.ts
import { createClient } from '@supabase/supabase-js';

export async function scanFileForMalware(fileBuffer: Buffer): Promise<boolean> {
  // Integration with cloud security service (e.g., VirusTotal API)
  const scanResult = await fetch(
    'https://www.virustotal.com/vtapi/v2/file/scan',
    {
      method: 'POST',
      headers: {
        apikey: process.env.VIRUSTOTAL_API_KEY!,
      },
      body: fileBuffer,
    }
  );

  const result = await scanResult.json();
  return result.response_code === 1 && result.positives === 0;
}
```

### Data Encryption

#### Database Encryption

**Supabase RLS (Row Level Security):**

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Events are private to their creators
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own events" ON events
  FOR ALL USING (auth.uid() = user_id);

-- Contractors can be viewed by all authenticated users
CREATE POLICY "Contractors are viewable by all" ON contractors
  FOR SELECT USING (auth.role() = 'authenticated');
```

#### Sensitive Data Encryption

**Encryption at Rest:**

```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  cipher.setAAD(Buffer.from('eventpros', 'utf8'));

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decrypt(encryptedData: {
  encrypted: string;
  iv: string;
  tag: string;
}): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(encryptedData.iv, 'hex')
  );
  decipher.setAAD(Buffer.from('eventpros', 'utf8'));
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Security Monitoring

#### Audit Logging

**Security Event Logging:**

```typescript
// lib/audit-logger.ts
export enum SecurityEvent {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_RESET = 'password_reset',
  PROFILE_UPDATE = 'profile_update',
  FILE_UPLOAD = 'file_upload',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

export async function logSecurityEvent(
  event: SecurityEvent,
  userId: string | null,
  metadata: Record<string, any> = {}
) {
  await supabase.from('security_logs').insert({
    event_type: event,
    user_id: userId,
    ip_address: metadata.ip,
    user_agent: metadata.userAgent,
    metadata: metadata,
    timestamp: new Date().toISOString(),
  });
}

// Usage in API routes
export default async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    await logSecurityEvent(SecurityEvent.LOGIN_SUCCESS, result.user.id, {
      ip: req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });

    res.json(result);
  } catch (error) {
    await logSecurityEvent(SecurityEvent.LOGIN_FAILED, null, {
      email: req.body.email,
      ip: req.headers['x-forwarded-for'],
      error: error.message,
    });

    res.status(401).json({ error: 'Login failed' });
  }
}
```

#### Intrusion Detection

**Anomaly Detection:**

```typescript
// lib/intrusion-detection.ts
export class IntrusionDetector {
  private static readonly SUSPICIOUS_PATTERNS = [
    /union.*select/i,
    /<script.*>/i,
    /javascript:/i,
    /\.\.\//g,
  ];

  static detectSuspiciousActivity(input: string): boolean {
    return this.SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input));
  }

  static async checkRateLimitViolations(userId: string): Promise<boolean> {
    const recentRequests = await supabase
      .from('api_requests')
      .select('timestamp')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 60000).toISOString()); // Last minute

    return recentRequests.data.length > 100; // More than 100 requests per minute
  }

  static async checkGeographicAnomaly(
    userId: string,
    currentIP: string
  ): Promise<boolean> {
    const recentLogins = await supabase
      .from('security_logs')
      .select('metadata')
      .eq('user_id', userId)
      .eq('event_type', SecurityEvent.LOGIN_SUCCESS)
      .order('timestamp', { ascending: false })
      .limit(5);

    // Check if login is from significantly different location
    // Implementation would integrate with IP geolocation service
    return false; // Simplified for example
  }
}
```

### Compliance & Privacy

#### GDPR Compliance

**Data Protection Measures:**

```typescript
// lib/gdpr.ts
export class GDPRCompliance {
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const [user, profile, events, contractors] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('events').select('*').eq('user_id', userId),
      supabase.from('contractors').select('*').eq('user_id', userId),
    ]);

    return {
      personal_data: user.data,
      profile_data: profile.data,
      events: events.data,
      contractor_data: contractors.data,
      export_date: new Date().toISOString(),
    };
  }

  static async deleteUserData(userId: string): Promise<void> {
    // Soft delete - mark as deleted but retain for legal requirements
    await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        email: `deleted_${userId}@deleted.com`,
        first_name: 'Deleted',
        last_name: 'User',
      })
      .eq('id', userId);

    // Anonymize related data
    await supabase
      .from('events')
      .update({
        title: 'Deleted Event',
        location: 'Deleted',
        user_id: null,
      })
      .eq('user_id', userId);
  }

  static async getDataRetentionPolicy(): Promise<DataRetentionPolicy> {
    return {
      user_data: '7 years after account deletion',
      event_data: '3 years after event completion',
      contractor_data: '5 years after last activity',
      security_logs: '2 years',
      analytics_data: '1 year',
    };
  }
}
```

#### Privacy Controls

**User Privacy Settings:**

```typescript
// components/privacy/PrivacySettings.tsx
export function PrivacySettings() {
  const { user, updateProfile } = useAuth();
  const [settings, setSettings] = useState(user?.privacy_settings || {});

  const handleUpdateSettings = async (newSettings: PrivacySettings) => {
    await updateProfile({ privacy_settings: newSettings });
    setSettings(newSettings);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.profile_public}
            onChange={(e) =>
              handleUpdateSettings({
                ...settings,
                profile_public: e.target.checked,
              })
            }
          />
          <span>Make profile publicly visible</span>
        </label>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.analytics_tracking}
            onChange={(e) =>
              handleUpdateSettings({
                ...settings,
                analytics_tracking: e.target.checked,
              })
            }
          />
          <span>Allow analytics tracking</span>
        </label>
      </div>
    </div>
  );
}
```

## Testing

### Testing Strategy

The testing approach follows a pyramid structure with comprehensive coverage across unit, integration, and end-to-end testing levels.

#### Testing Pyramid

```
    /\
   /  \     E2E Tests (Playwright)
  /____\    - User journeys
 /      \   - Critical business flows
/________\  - Cross-browser testing

   /\
  /  \      Integration Tests (Jest + Supertest)
 /____\     - API endpoints
/      \    - Database operations
/________\  - Third-party integrations

    /\
   /  \     Unit Tests (Jest + RTL)
  /____\    - Components
 /      \   - Utilities
/________\  - Business logic
```

### Unit Testing

#### Frontend Component Testing

**React Testing Library Setup:**

```typescript
// __tests__/setup.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './mocks/server';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Setup MSW for API mocking
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  }),
}));
```

**Component Test Examples:**

```typescript
// __tests__/components/EventCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { EventCard } from "@/components/features/events/EventCard";
import { mockEvent } from "../mocks/eventMocks";

describe("EventCard", () => {
  const defaultProps = {
    event: mockEvent,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders event information correctly", () => {
    render(<EventCard {...defaultProps} />);

    expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    expect(screen.getByText(mockEvent.location)).toBeInTheDocument();
    expect(screen.getByText(mockEvent.event_type)).toBeInTheDocument();
  });

  it("displays correct status badge", () => {
    render(<EventCard {...defaultProps} />);

    const statusBadge = screen.getByTestId("event-status-badge");
    expect(statusBadge).toHaveTextContent(mockEvent.status);
    expect(statusBadge).toHaveClass(`status-${mockEvent.status}`);
  });

  it("calls onEdit when edit button is clicked", () => {
    render(<EventCard {...defaultProps} />);

    const editButton = screen.getByRole("button", { name: /edit event/i });
    fireEvent.click(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockEvent.id);
  });

  it("shows confirmation dialog before deletion", () => {
    render(<EventCard {...defaultProps} />);

    const deleteButton = screen.getByRole("button", { name: /delete event/i });
    fireEvent.click(deleteButton);

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm/i })
    ).toBeInTheDocument();
  });

  it("handles loading state", () => {
    render(<EventCard {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId("event-card-skeleton")).toBeInTheDocument();
  });
});
```

**Form Testing:**

```typescript
// __tests__/components/forms/EventForm.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventForm } from "@/components/forms/EventForm";
import { eventSchema } from "@/lib/validations/event";

describe("EventForm", () => {
  const mockSubmit = jest.fn();
  const defaultProps = {
    onSubmit: mockSubmit,
    initialData: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(<EventForm {...defaultProps} />);

    expect(screen.getByLabelText(/event title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/event type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/attendee count/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/budget/i)).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<EventForm {...defaultProps} />);

    const submitButton = screen.getByRole("button", { name: /create event/i });
    await user.click(submitButton);

    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/event type is required/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    const validData = {
      title: "Test Event",
      event_type: "wedding",
      event_date: "2024-12-25",
      location: "Auckland",
      attendee_count: 100,
      duration_hours: 8,
      budget: 5000,
    };

    render(<EventForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/event title/i), validData.title);
    await user.selectOptions(
      screen.getByLabelText(/event type/i),
      validData.event_type
    );
    await user.type(screen.getByLabelText(/event date/i), validData.event_date);
    await user.type(screen.getByLabelText(/location/i), validData.location);
    await user.type(
      screen.getByLabelText(/attendee count/i),
      validData.attendee_count.toString()
    );
    await user.type(
      screen.getByLabelText(/duration/i),
      validData.duration_hours.toString()
    );
    await user.type(
      screen.getByLabelText(/budget/i),
      validData.budget.toString()
    );

    const submitButton = screen.getByRole("button", { name: /create event/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(validData);
    });
  });

  it("pre-fills form with initial data", () => {
    const initialData = {
      title: "Existing Event",
      event_type: "corporate",
      location: "Wellington",
    };

    render(<EventForm {...defaultProps} initialData={initialData} />);

    expect(screen.getByDisplayValue(initialData.title)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(initialData.event_type)
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(initialData.location)).toBeInTheDocument();
  });
});
```

#### Backend API Testing

**API Route Testing:**

```typescript
// __tests__/api/events.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/events';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('/api/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/events', () => {
    it('returns events for authenticated user', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', user_id: 'user-1' },
        { id: '2', title: 'Event 2', user_id: 'user-1' },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
        }),
      });

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ events: mockEvents });
    });

    it('returns 401 for unauthenticated request', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('POST /api/events', () => {
    it('creates new event', async () => {
      const eventData = {
        title: 'New Event',
        event_type: 'wedding',
        event_date: '2024-12-25',
        location: 'Auckland',
        attendee_count: 100,
        duration_hours: 8,
        budget: 5000,
      };

      const mockCreatedEvent = { id: 'new-event-id', ...eventData };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [mockCreatedEvent],
            error: null,
          }),
        }),
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: eventData,
      });

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData())).toEqual(mockCreatedEvent);
    });

    it('validates required fields', async () => {
      const invalidData = {
        title: '', // Missing required field
        event_type: 'wedding',
      };

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: invalidData,
      });

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('error');
    });
  });
});
```

**Database Testing:**

```typescript
// __tests__/lib/database.test.ts
import { createEvent, getEventsByUser, updateEvent } from '@/lib/database';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('creates event successfully', async () => {
      const eventData = {
        title: 'Test Event',
        user_id: 'user-1',
        event_type: 'wedding',
        event_date: '2024-12-25',
        location: 'Auckland',
        attendee_count: 100,
        duration_hours: 8,
        budget: 5000,
      };

      const mockResponse = {
        data: [{ id: 'event-1', ...eventData }],
        error: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockResponse),
        }),
      });

      const result = await createEvent(eventData);

      expect(result).toEqual(mockResponse.data[0]);
      expect(supabase.from).toHaveBeenCalledWith('events');
    });

    it('handles database errors', async () => {
      const eventData = { title: 'Test Event', user_id: 'user-1' };
      const mockError = { message: 'Database error' };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      });

      await expect(createEvent(eventData)).rejects.toThrow('Database error');
    });
  });
});
```

### Integration Testing

#### API Integration Tests

**End-to-End API Testing:**

```typescript
// __tests__/integration/api.test.ts
import request from 'supertest';
import { app } from '@/pages/api/events';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('Events API Integration', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    // Create test user and get auth token
    const authResponse = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'TestPassword123',
      first_name: 'Test',
      last_name: 'User',
      role: 'event_manager',
    });

    authToken = authResponse.body.access_token;
    userId = authResponse.body.user.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('Event CRUD Operations', () => {
    let eventId: string;

    it('creates a new event', async () => {
      const eventData = {
        title: 'Integration Test Event',
        event_type: 'wedding',
        event_date: '2024-12-25T10:00:00Z',
        location: 'Auckland',
        attendee_count: 100,
        duration_hours: 8,
        budget: 5000,
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body).toMatchObject(eventData);
      eventId = response.body.id;
    });

    it('retrieves events for user', async () => {
      const response = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].id).toBe(eventId);
    });

    it('updates an existing event', async () => {
      const updateData = {
        title: 'Updated Event Title',
        budget: 6000,
      };

      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.budget).toBe(updateData.budget);
    });

    it('deletes an event', async () => {
      await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify event is deleted
      const response = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.events).toHaveLength(0);
    });
  });

  describe('Authentication and Authorization', () => {
    it('rejects requests without authentication', async () => {
      await request(app).get('/api/events').expect(401);
    });

    it('rejects requests with invalid token', async () => {
      await request(app)
        .get('/api/events')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
```

#### Database Integration Tests

**Database Schema Testing:**

```typescript
// __tests__/integration/database.test.ts
import { supabase } from '@/lib/supabase';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('Database Schema Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('User and Profile Relationships', () => {
    it('creates user with profile', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123',
        first_name: 'Test',
        last_name: 'User',
        role: 'event_manager',
      };

      // Create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
          },
        },
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();

      // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: '+64 21 123 4567',
          address: '123 Test Street, Auckland',
        })
        .select()
        .single();

      expect(profileError).toBeNull();
      expect(profileData.user_id).toBe(authData.user.id);
    });
  });

  describe('Event and Service Relationships', () => {
    let userId: string;
    let eventId: string;
    let serviceId: string;

    beforeEach(async () => {
      // Create test user
      const { data: authData } = await supabase.auth.signUp({
        email: 'eventtest@example.com',
        password: 'TestPassword123',
      });
      userId = authData.user.id;

      // Create test event
      const { data: eventData } = await supabase
        .from('events')
        .insert({
          user_id: userId,
          title: 'Test Event',
          event_type: 'wedding',
          event_date: '2024-12-25T10:00:00Z',
          location: 'Auckland',
          attendee_count: 100,
          duration_hours: 8,
          budget: 5000,
        })
        .select()
        .single();
      eventId = eventData.id;

      // Create test service
      const { data: serviceData } = await supabase
        .from('services')
        .insert({
          business_profile_id: 'test-business-profile',
          name: 'DJ Services',
          description: 'Professional DJ services',
          category: 'entertainment',
          price_range_min: 500,
          price_range_max: 1500,
        })
        .select()
        .single();
      serviceId = serviceData.id;
    });

    it('creates event-service relationship', async () => {
      const { data, error } = await supabase
        .from('event_services')
        .insert({
          event_id: eventId,
          service_id: serviceId,
          status: 'required',
          budget_allocated: 1000,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.event_id).toBe(eventId);
      expect(data.service_id).toBe(serviceId);
    });
  });
});
```

### End-to-End Testing

#### Playwright E2E Tests

**User Journey Testing:**

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can register and login', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123');
    await page.fill('[data-testid="first-name-input"]', 'Test');
    await page.fill('[data-testid="last-name-input"]', 'User');
    await page.selectOption('[data-testid="role-select"]', 'event_manager');

    // Submit form
    await page.click('[data-testid="register-button"]');

    // Should redirect to email verification page
    await expect(page).toHaveURL('/verify-email');
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('user can login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123');

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome to your dashboard')).toBeVisible();
  });

  test('user cannot access protected routes without authentication', async ({
    page,
  }) => {
    // Try to access protected route
    await page.goto('/events');

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Please log in to continue')).toBeVisible();
  });
});
```

**Event Management E2E:**

```typescript
// e2e/events.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Event Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('user can create a new event', async ({ page }) => {
    // Navigate to events page
    await page.goto('/events');

    // Click create event button
    await page.click('[data-testid="create-event-button"]');

    // Fill event form
    await page.fill('[data-testid="event-title-input"]', 'Test Wedding');
    await page.selectOption('[data-testid="event-type-select"]', 'wedding');
    await page.fill('[data-testid="event-date-input"]', '2024-12-25');
    await page.fill('[data-testid="event-location-input"]', 'Auckland');
    await page.fill('[data-testid="attendee-count-input"]', '100');
    await page.fill('[data-testid="duration-input"]', '8');
    await page.fill('[data-testid="budget-input"]', '5000');

    // Submit form
    await page.click('[data-testid="submit-event-button"]');

    // Should show success message and redirect to events list
    await expect(page.locator('text=Event created successfully')).toBeVisible();
    await expect(page.locator('text=Test Wedding')).toBeVisible();
  });

  test('user can edit an existing event', async ({ page }) => {
    // Navigate to events page
    await page.goto('/events');

    // Click edit button on first event
    await page.click('[data-testid="edit-event-button"]');

    // Update event title
    await page.fill('[data-testid="event-title-input"]', 'Updated Event Title');

    // Submit form
    await page.click('[data-testid="submit-event-button"]');

    // Should show success message
    await expect(page.locator('text=Event updated successfully')).toBeVisible();
    await expect(page.locator('text=Updated Event Title')).toBeVisible();
  });

  test('user can delete an event', async ({ page }) => {
    // Navigate to events page
    await page.goto('/events');

    // Click delete button on first event
    await page.click('[data-testid="delete-event-button"]');

    // Confirm deletion in modal
    await page.click('[data-testid="confirm-delete-button"]');

    // Should show success message
    await expect(page.locator('text=Event deleted successfully')).toBeVisible();
  });
});
```

**Contractor Search E2E:**

```typescript
// e2e/contractors.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Contractor Search and Discovery', () => {
  test('user can search for contractors', async ({ page }) => {
    // Navigate to contractors page
    await page.goto('/contractors');

    // Search for DJ services
    await page.fill('[data-testid="search-input"]', 'DJ');
    await page.click('[data-testid="search-button"]');

    // Should show search results
    await expect(
      page.locator('[data-testid="contractor-card"]')
    ).toHaveCount.greaterThan(0);

    // Filter by location
    await page.selectOption('[data-testid="location-filter"]', 'Auckland');

    // Should update results
    await expect(
      page.locator('[data-testid="contractor-card"]')
    ).toHaveCount.greaterThan(0);
  });

  test('user can view contractor profile', async ({ page }) => {
    // Navigate to contractors page
    await page.goto('/contractors');

    // Click on first contractor card
    await page.click('[data-testid="contractor-card"]:first-child');

    // Should show contractor profile page
    await expect(page).toHaveURL(/\/contractors\/[a-zA-Z0-9-]+/);
    await expect(
      page.locator('[data-testid="contractor-profile"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="portfolio-gallery"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="testimonials-section"]')
    ).toBeVisible();
  });

  test('user can send enquiry to contractor', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123');
    await page.click('[data-testid="login-button"]');

    // Navigate to contractor profile
    await page.goto('/contractors/test-contractor-id');

    // Click send enquiry button
    await page.click('[data-testid="send-enquiry-button"]');

    // Fill enquiry form
    await page.fill(
      '[data-testid="enquiry-message-textarea"]',
      'Hi, I am interested in your DJ services for my wedding on December 25th.'
    );

    // Submit enquiry
    await page.click('[data-testid="submit-enquiry-button"]');

    // Should show success message
    await expect(page.locator('text=Enquiry sent successfully')).toBeVisible();
  });
});
```

### Performance Testing

#### Load Testing

**API Load Testing:**

```typescript
// __tests__/performance/api-load.test.ts
import { check, sleep } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
  },
};

const BASE_URL = 'https://api.eventpros.co.nz/v1';

export default function () {
  // Test contractor search endpoint
  let response = http.get(`${BASE_URL}/contractors?search=DJ&limit=20`);

  check(response, {
    'contractor search status is 200': r => r.status === 200,
    'contractor search response time < 500ms': r => r.timings.duration < 500,
    'contractor search returns data': r =>
      JSON.parse(r.body).contractors.length > 0,
  });

  sleep(1);

  // Test event creation endpoint
  const eventData = {
    title: 'Load Test Event',
    event_type: 'wedding',
    event_date: '2024-12-25T10:00:00Z',
    location: 'Auckland',
    attendee_count: 100,
    duration_hours: 8,
    budget: 5000,
  };

  response = http.post(`${BASE_URL}/events`, JSON.stringify(eventData), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'event creation status is 201': r => r.status === 201,
    'event creation response time < 1000ms': r => r.timings.duration < 1000,
  });

  sleep(1);
}
```

#### Frontend Performance Testing

**Lighthouse Performance Tests:**

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('homepage meets performance standards', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Run Lighthouse audit
    const lighthouse = await page.evaluate(() => {
      return new Promise(resolve => {
        // This would integrate with Lighthouse CI
        // For now, we'll check basic performance metrics
        const navigation = performance.getEntriesByType('navigation')[0];
        resolve({
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded:
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
        });
      });
    });

    expect(lighthouse.loadTime).toBeLessThan(3000); // 3 seconds
    expect(lighthouse.domContentLoaded).toBeLessThan(1500); // 1.5 seconds
  });

  test('contractor search page loads quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/contractors');
    await page.waitForSelector('[data-testid="contractor-card"]');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // 2 seconds
  });
});
```

### Test Data Management

#### Mock Data and Fixtures

**Test Data Factories:**

```typescript
// __tests__/factories/eventFactory.ts
import { faker } from '@faker-js/faker';

export const createMockEvent = (overrides = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  title: faker.lorem.words(3),
  event_type: faker.helpers.arrayElement([
    'wedding',
    'corporate',
    'party',
    'conference',
  ]),
  event_date: faker.date.future().toISOString(),
  location: faker.location.city(),
  attendee_count: faker.number.int({ min: 10, max: 500 }),
  duration_hours: faker.number.float({ min: 1, max: 12, fractionDigits: 1 }),
  budget: faker.number.int({ min: 1000, max: 50000 }),
  status: faker.helpers.arrayElement([
    'draft',
    'planning',
    'confirmed',
    'completed',
  ]),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockContractor = (overrides = {}) => ({
  id: faker.string.uuid(),
  company_name: faker.company.name(),
  description: faker.lorem.paragraph(),
  service_categories: faker.helpers.arrayElements(
    ['DJ Services', 'Photography', 'Catering', 'Floral', 'Venue'],
    { min: 1, max: 3 }
  ),
  location: faker.location.city(),
  average_rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
  review_count: faker.number.int({ min: 0, max: 100 }),
  is_verified: faker.datatype.boolean(),
  subscription_tier: faker.helpers.arrayElement([
    'essential',
    'showcase',
    'spotlight',
  ]),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  role: faker.helpers.arrayElement(['event_manager', 'contractor', 'admin']),
  is_verified: faker.datatype.boolean(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});
```

**MSW API Mocking:**

```typescript
// __tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: { id: 'user-1', email: 'test@example.com' },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      })
    );
  }),

  // Events endpoints
  rest.get('/api/events', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        events: [
          {
            id: 'event-1',
            title: 'Test Event',
            event_type: 'wedding',
            location: 'Auckland',
            status: 'confirmed',
          },
        ],
        total: 1,
      })
    );
  }),

  rest.post('/api/events', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'new-event-id',
        ...req.body,
        created_at: new Date().toISOString(),
      })
    );
  }),

  // Contractors endpoints
  rest.get('/api/contractors', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        contractors: [
          {
            id: 'contractor-1',
            company_name: 'Test DJ Services',
            description: 'Professional DJ services',
            location: 'Auckland',
            average_rating: 4.5,
            is_verified: true,
          },
        ],
        total: 1,
      })
    );
  }),
];
```

### Test Configuration

#### Jest Configuration

**Jest Setup:**

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

#### Playwright Configuration

**Playwright Setup:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Deployment & DevOps

### Deployment Strategy

The deployment approach follows a modern, cloud-native architecture with automated CI/CD pipelines and comprehensive monitoring.

#### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                   │
├─────────────────────────────────────────────────────────────┤
│  Vercel (Frontend)     │  Supabase (Backend)              │
│  ├─ Next.js App        │  ├─ PostgreSQL Database          │
│  ├─ Static Assets      │  ├─ Authentication               │
│  ├─ Edge Functions     │  ├─ Real-time Subscriptions      │
│  └─ Global CDN         │  └─ File Storage                 │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Staging Environment                      │
├─────────────────────────────────────────────────────────────┤
│  Vercel Preview        │  Supabase (Staging)              │
│  ├─ Preview Deploys    │  ├─ Test Database                │
│  ├─ Branch Previews    │  ├─ Test Auth                    │
│  └─ PR Testing         │  └─ Test Storage                 │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Development Environment                    │
├─────────────────────────────────────────────────────────────┤
│  Local Development     │  Supabase (Dev)                  │
│  ├─ Next.js Dev        │  ├─ Local Database               │
│  ├─ Hot Reload         │  ├─ Local Auth                   │
│  └─ TypeScript         │  └─ Local Storage                │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

#### GitHub Actions Workflow

**Main Workflow:**

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18.x'
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  # Lint and Type Check
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run type-check

      - name: Run Prettier check
        run: npm run format:check

  # Unit and Integration Tests
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: eventpros_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/eventpros_test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/eventpros_test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # E2E Tests
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000

      - name: Upload E2E test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  # Build and Deploy
  build-and-deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest
    needs: [test, e2e-tests]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_VERCEL_URL: ${{ github.ref == 'refs/heads/main' && 'https://eventpros.co.nz' || 'https://staging.eventpros.co.nz' }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ env.VERCEL_ORG_ID }}
          vercel-project-id: ${{ env.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./

  # Security Scanning
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run npm audit
        run: npm audit --audit-level moderate

  # Performance Testing
  performance-test:
    name: Performance Test
    runs-on: ubuntu-latest
    needs: build-and-deploy
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Run K6 load tests
        run: |
          docker run --rm -i grafana/k6:latest run - <k6/load-test.js
```

#### Branch Strategy

**Git Flow:**

```yaml
# Branch Protection Rules
main:
  - Requires pull request reviews (2 reviewers)
  - Requires status checks to pass
  - Requires branches to be up to date
  - Restricts pushes to main
  - Auto-merge enabled for approved PRs

develop:
  - Requires pull request reviews (1 reviewer)
  - Requires status checks to pass
  - Allows force pushes for hotfixes

feature/*:
  - Created from develop
  - Merged back to develop
  - Auto-deleted after merge

hotfix/*:
  - Created from main
  - Merged to both main and develop
  - Auto-deleted after merge
```

### Environment Configuration

#### Environment Variables

**Production Environment:**

```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://eventpros.co.nz
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=your-sendgrid-key
ENCRYPTION_KEY=your-encryption-key
VIRUSTOTAL_API_KEY=your-virustotal-key
```

**Staging Environment:**

```bash
# .env.staging
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.eventpros.co.nz
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=your-sendgrid-key
ENCRYPTION_KEY=your-encryption-key
VIRUSTOTAL_API_KEY=your-virustotal-key
```

**Development Environment:**

```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=your-sendgrid-key
ENCRYPTION_KEY=your-encryption-key
VIRUSTOTAL_API_KEY=your-virustotal-key
```

### Infrastructure as Code

#### Vercel Configuration

**vercel.json:**

```json
{
  "version": 2,
  "name": "eventpros-nz",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://api.stripe.com https://www.google-analytics.com; frame-src 'self' https://js.stripe.com;"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "/api/sitemap"
    },
    {
      "source": "/robots.txt",
      "destination": "/api/robots"
    }
  ]
}
```

#### Supabase Configuration

**Database Migrations:**

```sql
-- migrations/001_initial_schema.sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('event_manager', 'contractor', 'admin');
CREATE TYPE event_status AS ENUM ('draft', 'planning', 'confirmed', 'completed', 'cancelled');
CREATE TYPE job_status AS ENUM ('active', 'filled', 'completed', 'cancelled');
CREATE TYPE subscription_tier AS ENUM ('essential', 'showcase', 'spotlight');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'event_manager',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business profiles table
CREATE TABLE public.business_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  location TEXT,
  service_categories TEXT[],
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  subscription_tier subscription_tier DEFAULT 'essential',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_multi_day BOOLEAN DEFAULT FALSE,
  location TEXT NOT NULL,
  attendee_count INTEGER NOT NULL,
  duration_hours DECIMAL(4,2) NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  status event_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_end_date CHECK (end_date IS NULL OR end_date > event_date),
  CONSTRAINT valid_multi_day CHECK (is_multi_day = (end_date IS NOT NULL))
);

-- Create indexes for performance
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_location ON public.events USING GIN(to_tsvector('english', location));

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Business profiles are viewable by everyone" ON public.business_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own business profile" ON public.business_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Events are viewable by owner" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);
```

### Monitoring & Observability

#### Application Monitoring

**Vercel Analytics:**

```typescript
// lib/analytics.ts
import { Analytics } from "@vercel/analytics/react";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}

// Custom event tracking
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (typeof window !== "undefined" && window.analytics) {
    window.analytics.track(eventName, properties);
  }
}

// Usage examples
trackEvent("event_created", {
  event_type: "wedding",
  budget: 5000,
  attendee_count: 100,
});

trackEvent("contractor_searched", {
  search_term: "DJ",
  location: "Auckland",
  results_count: 15,
});
```

**Error Tracking:**

```typescript
// lib/error-tracking.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter out development errors
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return event;
  },
});

// Error boundary component
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      {children}
    </Sentry.ErrorBoundary>
  );
}

function ErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

#### Performance Monitoring

**Web Vitals Tracking:**

```typescript
// lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to Vercel Analytics
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track('web_vital', {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });
  }

  // Send to Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(
        metric.name === 'CLS' ? metric.value * 1000 : metric.value
      ),
      non_interaction: true,
    });
  }
}

// Track all web vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**Database Monitoring:**

```sql
-- Database performance monitoring queries
-- Slow query analysis
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage analysis
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table size analysis
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup & Recovery

#### Database Backup Strategy

**Automated Backups:**

```yaml
# .github/workflows/backup.yml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Create database backup
        run: |
          # Create backup using Supabase CLI
          supabase db dump --file backup-$(date +%Y%m%d-%H%M%S).sql

      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2

      - name: Upload backup to S3
        run: |
          aws s3 cp backup-*.sql s3://eventpros-backups/database/

      - name: Cleanup old backups
        run: |
          # Keep only last 30 days of backups
          aws s3 ls s3://eventpros-backups/database/ --recursive | \
          awk '$1 < "'$(date -d '30 days ago' '+%Y-%m-%d')'" {print $4}' | \
          xargs -I {} aws s3 rm s3://eventpros-backups/{}
```

**Point-in-Time Recovery:**

```sql
-- Enable WAL archiving for point-in-time recovery
-- This is configured in Supabase dashboard
-- Recovery commands (run by Supabase support)

-- Restore to specific point in time
SELECT pg_start_backup('recovery_point');
-- ... restore from backup ...
SELECT pg_stop_backup();

-- Restore specific table
CREATE TABLE events_backup AS SELECT * FROM events;
-- ... restore from backup ...
```

### Security & Compliance

#### Security Scanning

**Dependency Scanning:**

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level moderate

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: javascript
```

**Infrastructure Security:**

```yaml
# .github/workflows/infrastructure-security.yml
name: Infrastructure Security

on:
  schedule:
    - cron: '0 6 * * *' # Daily at 6 AM UTC

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

### Disaster Recovery

#### Recovery Procedures

**Database Recovery:**

```bash
#!/bin/bash
# disaster-recovery.sh

# 1. Assess the situation
echo "Assessing disaster recovery situation..."

# 2. Restore from latest backup
echo "Restoring from latest backup..."
aws s3 cp s3://eventpros-backups/database/latest.sql ./restore.sql

# 3. Restore database
echo "Restoring database..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f restore.sql

# 4. Verify data integrity
echo "Verifying data integrity..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM events;"

# 5. Update DNS if needed
echo "Updating DNS records..."
# DNS update commands here

# 6. Notify team
echo "Sending notifications..."
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Database recovery completed successfully"}' \
  $SLACK_WEBHOOK_URL
```

**Application Recovery:**

```bash
#!/bin/bash
# app-recovery.sh

# 1. Deploy from last known good commit
echo "Deploying from last known good commit..."
git checkout $LAST_GOOD_COMMIT
vercel --prod --token $VERCEL_TOKEN

# 2. Verify application health
echo "Verifying application health..."
curl -f https://eventpros.co.nz/health || exit 1

# 3. Run smoke tests
echo "Running smoke tests..."
npm run test:smoke

# 4. Notify team
echo "Sending notifications..."
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Application recovery completed successfully"}' \
  $SLACK_WEBHOOK_URL
```

### Documentation & Runbooks

#### Deployment Runbook

**Pre-deployment Checklist:**

```markdown
# Pre-deployment Checklist

## Code Quality

- [ ] All tests passing
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Performance tests passed
- [ ] Documentation updated

## Environment Preparation

- [ ] Staging environment tested
- [ ] Database migrations ready
- [ ] Environment variables updated
- [ ] Third-party services configured

## Deployment

- [ ] Backup current production
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Monitor for issues

## Post-deployment

- [ ] Monitor application metrics
- [ ] Check error rates
- [ ] Verify user functionality
- [ ] Update documentation
- [ ] Notify stakeholders
```

**Incident Response Runbook:**

```markdown
# Incident Response Runbook

## Severity Levels

- **P0 (Critical)**: Complete service outage
- **P1 (High)**: Major functionality broken
- **P2 (Medium)**: Minor functionality affected
- **P3 (Low)**: Cosmetic issues

## Response Process

1. **Acknowledge** (5 minutes)
   - Confirm incident
   - Assign severity level
   - Notify team

2. **Investigate** (15 minutes)
   - Check monitoring dashboards
   - Review recent deployments
   - Identify root cause

3. **Mitigate** (30 minutes)
   - Implement fix or rollback
   - Verify resolution
   - Monitor for stability

4. **Communicate** (Ongoing)
   - Update stakeholders
   - Document incident
   - Post-mortem planning

## Escalation Matrix

- **P0**: Immediate escalation to CTO
- **P1**: Escalate to Engineering Manager
- **P2**: Assign to on-call engineer
- **P3**: Add to next sprint
```

---

## Conclusion

This comprehensive full-stack architecture document provides a complete blueprint for building the Event Pros NZ platform. The architecture leverages modern technologies and best practices to deliver a scalable, secure, and maintainable solution that meets all business requirements.

### Key Architectural Strengths

1. **Scalability**: Serverless architecture with auto-scaling capabilities
2. **Security**: Comprehensive security measures with RBAC and data protection
3. **Performance**: Optimized for speed with CDN and caching strategies
4. **Maintainability**: Clean code structure with comprehensive testing
5. **Reliability**: Robust error handling and monitoring systems
6. **Cost-Effectiveness**: Pay-as-you-scale pricing model

### Next Steps

1. **Environment Setup**: Configure development, staging, and production environments
2. **Database Migration**: Implement the database schema and RLS policies
3. **API Development**: Build the REST API endpoints and authentication
4. **Frontend Development**: Create the React components and user interfaces
5. **Testing Implementation**: Set up the testing infrastructure and write tests
6. **Deployment Pipeline**: Configure CI/CD and monitoring systems

This architecture provides a solid foundation for building a successful event management platform that can scale with business growth and adapt to changing requirements.

---

_Document completed - Full-stack architecture for Event Pros NZ is now complete._

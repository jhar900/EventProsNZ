# Epic 1: Foundation & Core Infrastructure

**Epic Goal:** Establish the foundational project infrastructure including Next.js application setup, Supabase integration, basic vendor directory with search and filtering capabilities, and essential user authentication to create a functional MVP foundation that demonstrates core platform value.

### Story 1.1: Project Setup and Environment Configuration

As a developer,
I want to initialize the Next.js 14 project with TypeScript, Tailwind CSS, and all required dependencies,
so that I have a properly configured development environment ready for Event Pros NZ development.

**Acceptance Criteria:**

1. Next.js 14 project initialized with TypeScript configuration
2. Tailwind CSS installed and configured for styling
3. Supabase client library installed and configured
4. Stripe SDK installed for payment processing
5. Mapbox GL JS installed for mapping functionality
6. All development dependencies (ESLint, Prettier, etc.) configured
7. Environment variables file created with placeholder values
8. Git repository initialized with proper .gitignore
9. README.md with setup instructions created
10. Project builds and runs successfully on localhost

### Story 1.2: Database Schema Design and Implementation

As a developer,
I want to design and implement the core database schema in Supabase,
so that the application has a solid data foundation for vendors, users, and basic platform functionality.

**Acceptance Criteria:**

1. Supabase project created and configured
2. User profiles table with vendor/organizer role distinction
3. Vendors table with basic profile information (name, description, location, services)
4. Service categories table with predefined NZ event service types
5. Reviews table for vendor ratings and feedback
6. Proper foreign key relationships established
7. Database indexes created for search performance
8. Row Level Security (RLS) policies implemented
9. Database schema documented
10. Test data seeded for development

### Story 1.3: Basic Vendor Directory with Search

As a user,
I want to browse and search through a directory of event vendors,
so that I can discover service providers in my area for my event needs.

**Acceptance Criteria:**

1. Vendor directory page displays list of vendors in card format
2. Basic search functionality by vendor name and description
3. Service category filter dropdown with all categories
4. Location-based filtering by NZ regions
5. Search results update dynamically as filters are applied
6. Each vendor card shows name, location, primary service, and rating
7. Pagination implemented for large result sets
8. Empty state message when no results found
9. Loading states during search operations
10. Responsive design works on mobile and desktop

### Story 1.4: User Authentication System

As a user,
I want to register and log in to the platform,
so that I can access personalized features and contact vendors.

**Acceptance Criteria:**

1. User registration form with email and password
2. User login form with authentication
3. Password reset functionality via email
4. User profile creation during registration
5. Role selection (vendor or event organizer) during signup
6. Protected routes that require authentication
7. User session management and persistence
8. Logout functionality
9. Form validation and error handling
10. Success/error messages for user feedback

### Story 1.5: Basic Vendor Profile Pages

As a user,
I want to view detailed vendor profiles,
so that I can learn more about their services and contact them.

**Acceptance Criteria:**

1. Individual vendor profile pages accessible via URL
2. Vendor name, description, and contact information displayed
3. Service categories and locations served
4. Basic photo gallery (1-2 images for free tier)
5. Contact form for logged-in users
6. Review display with ratings and comments
7. Back navigation to search results
8. Mobile-responsive layout
9. Loading states and error handling
10. SEO-friendly URLs and meta tags

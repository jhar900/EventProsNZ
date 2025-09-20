# Event Pros NZ UI/UX Specification

**Document Version:** 1.0  
**Date:** December 2024  
**Author:** UX Expert (Sally)  
**Project:** Event Pros NZ - New Zealand's Event Ecosystem

## Introduction

This document defines the user experience goals, information architecture, user flows, and visual design specifications for Event Pros NZ's user interface. It serves as the foundation for visual design and frontend development, ensuring a cohesive and user-centered experience.

### Overall UX Goals & Principles

#### Target User Personas

**Event Managers:**

- **Personal Event Planners:** Individuals planning weddings, parties, and personal celebrations who need efficient contractor discovery and planning assistance
- **Business Event Managers:** Professionals managing corporate events, conferences, and business functions who require comprehensive planning tools and reliable contractor networks

**Contractors:**

- **Solo Operators:** Independent service providers (DJs, photographers, caterers) seeking increased visibility and qualified leads
- **Established Businesses:** Companies with multiple staff looking to expand their client base and manage business opportunities efficiently

**Admins:**

- **Platform Administrators:** System managers who need control and oversight capabilities for platform quality and user management

#### Usability Goals

- **Efficiency:** Reduce contractor research time from 8 hours to 2 hours for event managers
- **Discovery:** Increase contractor profile views by 300% compared to previous marketing methods
- **Conversion:** Achieve 25%+ enquiry-to-booking conversion rate
- **Accessibility:** Maintain 4.5+ star average rating across all user testimonials
- **Performance:** Sub-1 second page load times with 99.5% platform uptime

#### Design Principles

1. **User-Centric Above All** - Every design decision must serve user needs and reduce friction
2. **Clean & Modern Aesthetic** - Embrace minimalism, clean lines, and contemporary design patterns that feel fresh and professional
3. **Intuitive Navigation** - Create logical, predictable interfaces that users can navigate without learning
4. **Simplicity Through Iteration** - Start simple, refine based on feedback and usage patterns
5. **Delight in the Details** - Thoughtful micro-interactions create memorable experiences
6. **Design for Real Scenarios** - Consider edge cases, errors, and loading states
7. **Collaborate, Don't Dictate** - Best solutions emerge from cross-functional work

### Change Log

| Date     | Version | Description                             | Author            |
| -------- | ------- | --------------------------------------- | ----------------- |
| Dec 2024 | 1.0     | Initial front-end specification created | UX Expert (Sally) |

## Information Architecture (IA)

### Main Site Map (Public/Unauthenticated)

```mermaid
graph TD
    A[Homepage] --> B[Authentication Modals]
    A --> C[Contractor Directory]
    A --> D[Job Board Public]
    A --> E[Marketing Pages]
    A --> F[Error Pages]

    B --> B1[Login Modal]
    B --> B2[Register Modal]
    B1 <--> B2
    B1 --> B3[Password Reset]
    B3 --> B1
    B1 --> K[User Dashboards]
    B2 --> B4[Role Selection]
    B4 --> B5[Email Verification]
    B5 --> H[Onboarding]

    C --> C1[Contractor Profile]
    C1 --> B1

    D --> D1[Job Details]
    D1 --> B1

    E --> E1[About]
    E --> E2[Pricing]
    E --> E3[Contact & Support]
    E --> E4[Legal Pages]
    E --> E5[FAQ]

    F --> F1[404 Not Found]
    F --> F2[500 Server Error]
    F --> F3[Maintenance Mode]
    F --> F4[Access Denied]

    H --> H1[Profile Setup]
    H --> H2[Welcome Tour]
    H1 --> H2
    H2 --> K

    K --> K1[Event Manager Dashboard]
    K --> K2[Contractor Dashboard]
    K --> K3[Admin Dashboard]

    E4 --> E6[Privacy Policy]
    E4 --> E7[Terms & Conditions]
```

### Event Manager Site Map

```mermaid
graph TD
    A[Event Manager Dashboard] --> B[My Events]
    A --> C[Contractor Discovery]
    A --> D[My Jobs]
    A --> E[Communication]
    A --> F[Profile & Settings]
    A --> G[Logout]

    B --> B1[Current Events]
    B --> B2[Past Events]
    B --> B3[Create Event]

    B1 --> B4[Event Details]
    B2 --> B4

    B4 --> B5[Contractor Flow]
    B4 --> B6[Budget & Quotes]
    B4 --> B7[Documents]

    B3 --> B8[Event Creation Wizard]
    B8 --> B9[Event Templates]
    B9 --> B10[Confirm Event]
    B9 --> C
    B10 --> B4

    C --> C1[Contractor Profile]
    C1 --> C2[Get In Touch]
    C2 --> E2[Relationship Management]
    C2 --> C1
    C2 --> C

    D --> D1[Create Job]
    D --> D2[Job Details]
    D --> D3[Job Board]

    D1 --> D4[Job Templates]
    D4 --> D5[Confirm Job]
    D5 --> D2

    D2 --> D6[View Application]
    D2 --> D7[Edit Job Modal]
    D3 --> D2

    E --> E2[Relationship Management]
    E2 --> E3[View Profile - New Tab]
    E2 --> E4[Give Testimonial Modal]

    F --> F1[Profile Management]
    F --> F2[Business Settings]
    F --> F3[Notification Preferences]
    F --> F4[Account Settings]

    G --> H[Event Pros NZ Homepage]
```

### Contractor Site Map

```mermaid
graph TD
    A[Contractor Dashboard] --> B[Profile Management]
    A --> C[Business Tools]
    A --> D[Relationship Management]
    A --> E[Analytics & Growth]
    A --> F[Account & Billing]
    A --> G[Logout]

    B --> B1[Personal Details]
    B --> B2[Business Details]
    B --> B3[Account & Billing]

    B2 --> B4[Business Information Tab]
    B2 --> B5[Portfolio Tab]

    B4 --> B6[Service Categories]
    B5 --> B7[Gallery]
    B5 --> B8[Previous Events]

    C --> C1[Job Applications]
    C --> C2[Job Board]
    C --> C3[Pricing Tools]

    D --> D1[Communication Log]
    D --> D2[Testimonials]

    D2 --> D3[Request Testimonial Modal]

    E --> E1[Analytics Dashboard]
    E1 --> E2[Profile Analytics Tab]
    E1 --> E3[Lead Tracking Tab]
    E1 --> E4[Performance Metrics Tab]
    E1 --> E5[Revenue Reports Tab]

    F --> F1[Subscription Management]
    F --> F2[Payment Methods]
    F --> F3[Billing History]

    G --> H[Event Pros NZ Homepage]

    %% Cross-connections
    C1 --> D1
    C2 --> C1
    D1 --> D2
    E2 --> E3
    E3 --> E4
    E4 --> E5

    %% Dashboard features
    A --> I[Basic Analytics Display]
    A --> J[Quick Actions]
    J --> J1[View Job Board]
    J --> J2[Analytics]
    J --> J3[Profile Management]

    %% Status indicators
    B --> K[Verification Status]
    B --> L[Subscription Tier]
```

### Admin Site Map

```mermaid
graph TD
    A[Admin Dashboard] --> B[User Management]
    A --> C[Analytics & Reporting]
    A --> D[System Administration]
    A --> E[Feature Request Management]
    A --> F[Testimonials]
    A --> G[Job Board]
    A --> H[Contractor Discovery]
    A --> I[Logout]

    B --> B1[User List]
    B --> B2[Verification Queue]

    B1 --> B3[User Profile]
    B1 --> B4[Account Management]
    B1 --> B5[Relationship Management]

    B5 --> B3

    C --> C1[Platform Analytics]
    C --> C2[User Metrics]
    C --> C3[Revenue Reports]
    C --> C4[Performance Monitoring]

    D --> D1[System Settings]
    D --> D2[Email Management]
    D --> D3[Security Settings]
    D --> D4[Backup & Recovery]

    G --> G1[Job Details]

    H --> H1[Contractor Profile]
    H1 --> B5

    I --> J[Event Pros NZ Homepage]

    %% Dashboard features
    A --> L[Quick Actions]

    %% Cross-connections
    B2 --> B1
    C1 --> C2
    C2 --> C3
    C3 --> C4
```

### Navigation Structure

**Primary Navigation:**

- **Home** - Landing page with hero, testimonials, and contractor map
- **Find Contractors** - Directory with search, filters, and map view
- **How It Works** - Process explanation for both user types
- **Pricing** - Subscription tiers and features
- **About** - Company information and team

**Secondary Navigation:**

- **Dashboard** (authenticated users) - Role-specific dashboard
- **Profile** (authenticated users) - User profile management
- **Support** - Help center and contact
- **Login/Register** (unauthenticated users)

**Breadcrumb Strategy:**

- Show current location within the platform hierarchy
- Include clickable parent levels for easy navigation
- Display user role context (Event Manager/Contractor/Admin)
- Highlight current section for complex multi-step processes

## User Flows

### Event Manager - Finding and Contacting Contractors

**User Goal:** Find suitable contractors for their event and initiate contact

**Entry Points:**

- Homepage "Find Contractors" button
- Event Manager Dashboard "Find Contractors" quick action
- Event Details page "Find Contractors" button
- Direct navigation to Contractor Discovery
- Interactive Map Pin Click

**Success Criteria:**

- Successfully find contractors matching event requirements
- Send inquiry to at least one contractor
- Receive confirmation of inquiry sent

**Flow Diagram:**

```mermaid
graph TD
    A[Start: Need Contractors] --> B[Access Contractor Discovery]
    B --> C[View Initial Contractor List]
    C --> D[Apply Search Filters]
    D --> E[Real-time List Updates]
    E --> F[Review Results]
    F --> G{Found Suitable Contractors?}
    G -->|No| H[Adjust Filters]
    H --> D
    G -->|Yes| I[View Contractor Profile]
    I --> J[Review Portfolio & Details]
    J --> K{Interested in Contractor?}
    K -->|No| L[Return to Results]
    L --> I
    K -->|Yes| M[Click Get In Touch]
    M --> N{Logged In?}
    N -->|No| O[Show Login Modal]
    O --> P[Login/Register]
    P --> Q[Return to Contractor Profile]
    Q --> M
    N -->|Yes| R[Fill Inquiry Form]
    R --> S[Submit Inquiry]
    S --> T[Confirmation Message]
    T --> U[Success: Inquiry Sent]
    U --> V[Return to Contractor Profile]
    U --> W[Manage Relationship]
    U --> X[Return to Contractor List]
    X --> F

    %% Map entry point
    Y[Interactive Map] --> Z[Click Pin]
    Z --> AA[View Mini Card]
    AA --> I
```

**Edge Cases & Error Handling:**

- No contractors found matching criteria
- Contractor profile fails to load
- Inquiry form validation errors
- Network connectivity issues
- Session timeout during inquiry process

**Notes:**

- **Initial List**: Shows up to 20 contractors with pagination, prioritized by subscription tier (Premium contractors first) and AI recommendations based on upcoming events and suggested service types
- **Real-time Updates**: List updates automatically as user types in search or adjusts filters
- **Search Filters**: Location, service type, budget range, and availability
- **Contractor Profiles**: Show key information without requiring login
- **Inquiry Form**: Pre-populate with event details if available
- **Post-Success**: Can return to contractor profile or manage relationship
- **Clear Feedback**: For all user actions
- **Loading States**: Skeleton loading for real-time updates
- **Filter Persistence**: Remember user's filter preferences
- **Inquiry Tracking**: Show inquiry status in relationship management
- **Map Integration**: Click pin → mini card → contractor profile

### Event Manager - Creating and Managing Events

**User Goal:** Create a new event with AI-powered recommendations and manage it throughout its lifecycle

**Entry Points:**

- Event Manager Dashboard "Create Event" button
- Event Manager Dashboard "Create Event" quick action
- My Events page "Create New Event" button
- Event Details page "Duplicate Event" option
- Quick Create option (name, type, date, location)

**Success Criteria:**

- Successfully create event with all required details
- Receive AI-powered service recommendations
- Event saved and accessible in My Events
- Can edit and manage event details

**Flow Diagram:**

```mermaid
graph TD
    A[Start: Create Event] --> B{Quick Create or Full Wizard?}
    B -->|Quick| C[Quick Create Form]
    B -->|Full| D[Event Creation Wizard]

    C --> E[Name, Type, Date, Location]
    E --> F[Save Quick Event]
    F --> G[Event Created]

    D --> H[Step 1: Event Basics]
    H --> I[Step 2: AI Service Recommendations]
    I --> J[Step 3: Budget Planning]
    J --> K[Step 4: Review & Confirm]
    K --> L{Confirm Event?}
    L -->|No| M[Edit Details]
    M --> H
    L -->|Yes| N[Event Created Successfully]

    G --> O[Event Details Page]
    N --> O

    O --> P[Edit Event Details]
    O --> Q[View Contractor Flow]
    O --> R[Manage Budget]
    O --> S[Event Timeline]
    O --> T[Contractor Checklist]

    U[Duplicate Event] --> V[Copy All Details Except Date]
    V --> W[Edit Date Required]
    W --> D
```

**Edge Cases & Error Handling:**

- Invalid date selection (past dates, conflicting times)
- Location not found or invalid
- AI recommendations fail to load
- Budget validation errors
- Network connectivity issues during save
- Event creation timeout
- Collaboration permissions - Handle access control for shared events

**Notes:**

- **Event Status**: Draft → Confirmed (confirmed events can engage contractors)
- **AI Budget**: Uses platform data and industry standards for realistic recommendations
- **Templates**: Users can create custom templates from successful events
- **Collaboration**: Premium feature for subscription users
- **Timeline**: Visual milestones and deadlines
- **Checklist**: Basic contractor confirmation tracking

### Event Manager - Posting and Managing Jobs

**User Goal:** Post job opportunities when suitable contractors aren't found and manage applications

**Entry Points:**

- Event Manager Dashboard "My Jobs" section
- My Events page "Post Job" button
- Event Details page "Post Job" button
- Contractor Discovery "No suitable contractors found" option

**Success Criteria:**

- Successfully post job with all required details
- Receive applications from qualified contractors
- Review and manage applications effectively
- Fill job position or close posting

**Flow Diagram:**

```mermaid
graph TD
    A[Start: Post Job] --> B[Access Job Creation]
    B --> C[Job Details Form]
    C --> D[Event Information]
    D --> E[Service Requirements]
    E --> F[Budget & Timeline]
    F --> G[Job Description]
    G --> H[Review Job Posting]
    H --> I{Post Job?}
    I -->|No| J[Edit Details]
    J --> C
    I -->|Yes| K[Job Posted Successfully]
    K --> L[Job Details Page]

    L --> M[View Applications]
    L --> N[Edit Job Details]
    L --> O[Close Job Posting]

    M --> P[Review Application]
    P --> Q[View Contractor Profile]
    P --> R[Accept Application]
    P --> S[Reject Application]

    R --> T[Job Filled]
    S --> U[Application Rejected]

    V[Job Board] --> W[Browse Jobs]
    W --> X[View Job Details]
    X --> Y[Apply for Job]
    Y --> Z[Application Submitted]
```

**Edge Cases & Error Handling:**

- Invalid job posting details
- No applications received
- Application submission errors
- Contractor profile not found
- Job posting expiration
- Duplicate job postings

**Notes:**

- **Job Templates**: Pre-built templates for common job types
- **Event Linking**: Optional linking to existing events for data import
- **Application Limits**: Based on contractor subscription tier
- **Job Status**: Active, Filled, Closed, Expired
- **Application Management**: Track status and communicate with applicants
- **Job Board**: Public view of all active job postings

### Contractor - Profile Setup and Verification

**User Goal:** Create a comprehensive business profile and get verified to increase visibility

**Entry Points:**

- Registration process
- Contractor Dashboard "Complete Profile" prompt
- Profile Management section

**Success Criteria:**

- Complete all required profile information
- Upload portfolio and business documents
- Submit for verification
- Receive verification approval

**Flow Diagram:**

```mermaid
graph TD
    A[Start: Profile Setup] --> B[Personal Information]
    B --> C[Business Information]
    C --> D[Service Categories]
    D --> E[Portfolio Upload]
    E --> F[Pricing Information]
    F --> G[Review Profile]
    G --> H{Profile Complete?}
    H -->|No| I[Edit Missing Information]
    I --> B
    H -->|Yes| J[Submit for Verification]
    J --> K[Verification Pending]
    K --> L{Admin Review}
    L -->|Approved| M[Profile Verified]
    L -->|Rejected| N[Review Feedback]
    N --> O[Make Changes]
    O --> J
    M --> P[Profile Live]
```

**Edge Cases & Error Handling:**

- Incomplete required fields
- File upload failures
- Verification rejection
- Profile information conflicts

**Notes:**

- **Verification Process**: Manual admin review for contractors
- **Profile Completion**: Track completion percentage
- **Document Requirements**: Business registration, insurance, etc.
- **Portfolio**: Multiple image uploads, video links

### Contractor - Finding and Applying for Jobs

**User Goal:** Find relevant job opportunities and submit applications

**Entry Points:**

- Contractor Dashboard "Job Board" button
- Job notifications
- Search for specific job types

**Success Criteria:**

- Find jobs matching service categories
- Submit compelling applications
- Track application status
- Secure job opportunities

**Flow Diagram:**

```mermaid
graph TD
    A[Start: Find Jobs] --> B[Access Job Board]
    B --> C[Apply Filters]
    C --> D[Browse Job Listings]
    D --> E[View Job Details]
    E --> F{Interested in Job?}
    F -->|No| G[Return to Listings]
    G --> D
    F -->|Yes| H[Check Application Limits]
    H --> I{Within Limits?}
    I -->|No| J[Upgrade Subscription]
    I -->|Yes| K[Prepare Application]
    K --> L[Write Cover Message]
    L --> M[Attach Portfolio]
    M --> N[Submit Application]
    N --> O[Application Confirmed]
    O --> P[Track Status]
    P --> Q{Application Status}
    Q -->|Accepted| R[Job Secured]
    Q -->|Rejected| S[Application Declined]
    Q -->|Pending| T[Wait for Response]
```

**Edge Cases & Error Handling:**

- Application limit exceeded
- Job posting expired
- Application submission errors
- Portfolio upload failures

**Notes:**

- **Application Limits**: Based on subscription tier (Essential: 2/month, Showcase: 5/month, Spotlight: unlimited)
- **Service Categories**: Can only apply to jobs matching their categories
- **Application Tracking**: Status updates and notifications
- **Portfolio Requirements**: Relevant work samples

### Cross-Platform - Onboarding and Welcome Tour

**User Goal:** Get familiar with the platform and understand key features

**Entry Points:**

- After successful registration
- First login after email verification
- Manual access from user menu

**Success Criteria:**

- Complete welcome tour
- Understand platform navigation
- Know how to access key features
- Feel confident using the platform

**Flow Diagram:**

```mermaid
graph TD
    A[Start: Onboarding] --> B[Welcome Message]
    B --> C[Platform Overview]
    C --> D[Key Features Tour]
    D --> E[Navigation Guide]
    E --> F[First Action Prompt]
    F --> G{Complete Action?}
    G -->|Yes| H[Success Celebration]
    G -->|No| I[Skip Tour]
    H --> J[Tour Complete]
    I --> J
    J --> K[Access Dashboard]

    L[Manual Tour Access] --> M[Select Tour Section]
    M --> N[Guided Walkthrough]
    N --> O[Interactive Tutorial]
    O --> P[Complete Section]
    P --> Q{More Sections?}
    Q -->|Yes| M
    Q -->|No| R[Tour Complete]
```

**Edge Cases & Error Handling:**

- Tour interruption
- Feature not available
- User skips tour
- Technical issues during tour

**Notes:**

- **Skippable**: Users can skip tour at any time
- **Progressive**: Show only relevant features for user role
- **Interactive**: Hands-on experience with key features
- **Replayable**: Can access tour again later

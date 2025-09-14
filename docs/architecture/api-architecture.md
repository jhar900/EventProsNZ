# API Architecture

### API Design Principles

#### 1. **RESTful Design**

- Consistent HTTP methods and status codes
- Resource-based URL structure
- Stateless communication
- JSON request/response format

#### 2. **Authentication & Authorization**

- JWT tokens for API authentication
- Role-based access control (RBAC)
- Rate limiting and request validation
- Secure headers and CORS configuration

#### 3. **Performance & Scalability**

- Response caching strategies
- Pagination for large datasets
- Request/response compression
- Database query optimization

#### 4. **Error Handling**

- Consistent error response format
- Appropriate HTTP status codes
- Detailed error messages for debugging
- Client-friendly error descriptions

### API Structure

#### Base Configuration

```typescript
// API Base Configuration
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
  version: "v1",
  timeout: 30000,
  retries: 3,
};

// Response Format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
  };
}
```

### Core API Endpoints

#### 1. Authentication Endpoints

```typescript
// Authentication Routes
POST / api / auth / register; // User registration
POST / api / auth / login; // User login
POST / api / auth / logout; // User logout
POST / api / auth / refresh; // Token refresh
POST / api / auth / forgot - password; // Password reset request
POST / api / auth / reset - password; // Password reset confirmation
GET / api / auth / me; // Get current user
PUT / api / auth / me; // Update user profile
```

#### 2. Vendor Management Endpoints

```typescript
// Vendor Discovery
GET    /api/vendors                // List vendors with filters
GET    /api/vendors/search         // Search vendors
GET    /api/vendors/:id            // Get vendor details
GET    /api/vendors/:id/portfolio  // Get vendor portfolio
GET    /api/vendors/:id/reviews    // Get vendor reviews

// Vendor Management (Authenticated)
POST   /api/vendors                // Create vendor profile
PUT    /api/vendors/:id            // Update vendor profile
DELETE /api/vendors/:id            // Delete vendor profile
POST   /api/vendors/:id/portfolio  // Upload portfolio images
PUT    /api/vendors/:id/portfolio/:imageId  // Update portfolio image
DELETE /api/vendors/:id/portfolio/:imageId  // Delete portfolio image
```

#### 3. Job Management Endpoints

```typescript
// Job Discovery
GET    /api/jobs                   // List jobs with filters
GET    /api/jobs/search            // Search jobs
GET    /api/jobs/:id               // Get job details
GET    /api/jobs/:id/applications  // Get job applications (organizer only)

// Job Management (Organizer)
POST   /api/jobs                   // Create job posting
PUT    /api/jobs/:id               // Update job posting
DELETE /api/jobs/:id               // Delete job posting
POST   /api/jobs/:id/publish       // Publish job
POST   /api/jobs/:id/close         // Close job

// Job Applications (Vendor)
POST   /api/jobs/:id/apply         // Apply to job
PUT    /api/applications/:id       // Update application
DELETE /api/applications/:id       // Withdraw application
GET    /api/applications           // Get vendor's applications
```

#### 4. Messaging Endpoints

```typescript
// Message Threads
GET    /api/messages/threads       // List message threads
POST   /api/messages/threads       // Create new thread
GET    /api/messages/threads/:id   // Get thread details
PUT    /api/messages/threads/:id   // Update thread (mark as read)

// Messages
GET    /api/messages/threads/:id/messages  // Get thread messages
POST   /api/messages/threads/:id/messages  // Send message
PUT    /api/messages/:id           // Update message
DELETE /api/messages/:id           // Delete message
POST   /api/messages/:id/read      // Mark message as read
```

#### 5. Review & Rating Endpoints

```typescript
// Reviews
GET    /api/reviews                // List reviews
GET    /api/reviews/vendor/:id     // Get vendor reviews
POST   /api/reviews                // Create review
PUT    /api/reviews/:id            // Update review
DELETE /api/reviews/:id            // Delete review

// Review Responses
POST   /api/reviews/:id/response   // Respond to review
PUT    /api/review-responses/:id   // Update response
DELETE /api/review-responses/:id   // Delete response
```

#### 6. Subscription & Payment Endpoints

```typescript
// Subscriptions
GET    /api/subscriptions          // Get user subscriptions
POST   /api/subscriptions          // Create subscription
PUT    /api/subscriptions/:id      // Update subscription
DELETE /api/subscriptions/:id      // Cancel subscription
POST   /api/subscriptions/:id/upgrade  // Upgrade subscription

// Payments
GET    /api/payments               // Get payment history
POST   /api/payments               // Process payment
GET    /api/payments/:id           // Get payment details
POST   /api/payments/:id/refund    // Process refund
```

### API Request/Response Examples

#### Vendor Search Request

```typescript
// GET /api/vendors/search
interface VendorSearchRequest {
  query?: string;
  categories?: string[];
  location?: {
    lat: number;
    lng: number;
    radius: number; // in km
  };
  priceRange?: "budget" | "moderate" | "premium" | "luxury";
  rating?: number; // minimum rating
  availability?: {
    startDate: string;
    endDate: string;
  };
  pagination?: {
    page: number;
    limit: number;
  };
  sortBy?: "relevance" | "rating" | "distance" | "price";
}

// Response
interface VendorSearchResponse {
  success: true;
  data: {
    vendors: Vendor[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}
```

#### Job Creation Request

```typescript
// POST /api/jobs
interface JobCreationRequest {
  title: string;
  description: string;
  eventType:
    | "wedding"
    | "corporate"
    | "birthday"
    | "anniversary"
    | "conference"
    | "seminar"
    | "party"
    | "celebration"
    | "other";
  eventDate: string; // ISO date
  eventEndDate?: string;
  eventTime?: string; // ISO time
  eventDurationHours?: number;
  guestCount: number;
  budgetMin: number;
  budgetMax: number;
  location: {
    address: string;
    city: string;
    region: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  categories: string[]; // Service category IDs
  specialRequirements?: string;
  contactPreferences: {
    email: boolean;
    phone: boolean;
    preferredTime?: string;
  };
  applicationDeadline?: string; // ISO datetime
  isUrgent?: boolean;
}
```

### API Middleware & Utilities

#### Authentication Middleware

```typescript
// Authentication middleware
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthUser | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error) throw error;
    return user;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

// Role-based access control
export function requireRole(roles: string[]) {
  return (req: NextRequest, user: AuthUser) => {
    if (!roles.includes(user.role)) {
      throw new Error("Insufficient permissions");
    }
  };
}
```

#### Rate Limiting

```typescript
// Rate limiting configuration
const rateLimits = {
  "/api/auth/login": { requests: 5, window: "15m" },
  "/api/vendors/search": { requests: 100, window: "1h" },
  "/api/messages": { requests: 200, window: "1h" },
  "/api/reviews": { requests: 10, window: "1h" },
  default: { requests: 1000, window: "1h" },
};
```

#### Error Handling

```typescript
// Standardized error responses
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

// Error response format
export function createErrorResponse(error: ApiError): ApiResponse<null> {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}
```

### Real-Time API Features

#### WebSocket Endpoints

```typescript
// Real-time messaging
ws://api.eventprosnz.com/messages/:threadId
// Real-time notifications
ws://api.eventprosnz.com/notifications/:userId
// Real-time job updates
ws://api.eventprosnz.com/jobs/:jobId
```

#### Supabase Real-time Subscriptions

```typescript
// Real-time message updates
const messageSubscription = supabase
  .channel("messages")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `thread_id=eq.${threadId}`,
    },
    (payload) => {
      // Handle new message
    }
  )
  .subscribe();
```

### API Documentation

#### OpenAPI Specification

- Comprehensive API documentation using OpenAPI 3.0
- Interactive API explorer (Swagger UI)
- Request/response examples
- Authentication requirements
- Error code documentation

#### API Versioning

- URL-based versioning: `/api/v1/`
- Backward compatibility maintenance
- Deprecation notices for old versions
- Migration guides for breaking changes

### Performance Considerations

#### Caching Strategy

```typescript
// Redis caching for frequently accessed data
const cacheConfig = {
  "vendors:search": { ttl: 300 }, // 5 minutes
  categories: { ttl: 3600 }, // 1 hour
  "user:profile": { ttl: 1800 }, // 30 minutes
  "jobs:public": { ttl: 600 }, // 10 minutes
};
```

#### Database Query Optimization

- Efficient database queries with proper indexing
- Connection pooling for database connections
- Query result caching
- Pagination for large datasets

#### Response Compression

- Gzip compression for API responses
- Image optimization and compression
- Minification of JSON responses
- CDN integration for static assets

This API architecture provides a comprehensive, scalable, and maintainable foundation for the Event Pros NZ platform, supporting all functional requirements while ensuring optimal performance and security.

---

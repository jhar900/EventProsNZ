# API Specification

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
        "201":
          description: User registered successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "400":
          $ref: "#/components/responses/BadRequest"

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
        "200":
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: "#/components/schemas/User"
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
        "200":
          description: User profile retrieved
          content:
            application/json:
              schema:
                allOf:
                  - $ref: "#/components/schemas/User"
                  - $ref: "#/components/schemas/Profile"
                  - $ref: "#/components/schemas/BusinessProfile"

    put:
      summary: Update user profile
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ProfileUpdate"
      responses:
        "200":
          description: Profile updated successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Profile"

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
        "200":
          description: Events retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  events:
                    type: array
                    items:
                      $ref: "#/components/schemas/Event"
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
              $ref: "#/components/schemas/EventCreate"
      responses:
        "201":
          description: Event created successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Event"

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
        "200":
          description: Event details retrieved
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Event"

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
              $ref: "#/components/schemas/EventUpdate"
      responses:
        "200":
          description: Event updated successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Event"

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
        "204":
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
        "200":
          description: Event services retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/EventService"

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
              $ref: "#/components/schemas/EventServiceCreate"
      responses:
        "201":
          description: Service added to event
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/EventService"

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
              $ref: "#/components/schemas/EventServiceUpdate"
      responses:
        "200":
          description: Event service updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/EventService"

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
        "204":
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
        "200":
          description: Contractors retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  contractors:
                    type: array
                    items:
                      $ref: "#/components/schemas/ContractorSummary"
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
        "200":
          description: Contractor profile retrieved
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ContractorProfile"

  # Contractor Service Management
  /contractors/me/services:
    get:
      summary: Get contractor's services
      tags: [Contractors]
      responses:
        "200":
          description: Services retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Service"

    post:
      summary: Create new service
      tags: [Contractors]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ServiceCreate"
      responses:
        "201":
          description: Service created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Service"

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
        "200":
          description: Service details retrieved
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Service"

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
              $ref: "#/components/schemas/ServiceUpdate"
      responses:
        "200":
          description: Service updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Service"

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
        "204":
          description: Service deleted

  # Portfolio Management
  /contractors/me/portfolio:
    get:
      summary: Get contractor's portfolio
      tags: [Contractors]
      responses:
        "200":
          description: Portfolio retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/PortfolioItem"

    post:
      summary: Add portfolio item
      tags: [Contractors]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PortfolioItemCreate"
      responses:
        "201":
          description: Portfolio item created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PortfolioItem"

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
        "200":
          description: Portfolio item retrieved
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PortfolioItem"

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
              $ref: "#/components/schemas/PortfolioItemUpdate"
      responses:
        "200":
          description: Portfolio item updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PortfolioItem"

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
        "204":
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
              $ref: "#/components/schemas/EnquiryCreate"
      responses:
        "201":
          description: Enquiry sent successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Enquiry"

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
        "200":
          description: Enquiry details retrieved
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Enquiry"

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
        "200":
          description: Messages retrieved successfully
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/EnquiryMessage"

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
              $ref: "#/components/schemas/EnquiryMessageCreate"
      responses:
        "201":
          description: Message sent successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/EnquiryMessage"

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
        "200":
          description: Jobs retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  jobs:
                    type: array
                    items:
                      $ref: "#/components/schemas/Job"
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
              $ref: "#/components/schemas/JobCreate"
      responses:
        "201":
          description: Job created successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Job"

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
        "200":
          description: Job details retrieved
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Job"

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
              $ref: "#/components/schemas/JobUpdate"
      responses:
        "200":
          description: Job updated successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Job"

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
        "204":
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
        "200":
          description: Applications retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/JobApplication"

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
              $ref: "#/components/schemas/JobApplicationCreate"
      responses:
        "201":
          description: Application submitted successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/JobApplication"

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
        "201":
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
        "201":
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
        "201":
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
        "200":
          description: Subscription retrieved
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Subscription"

    post:
      summary: Create subscription
      tags: [Subscriptions]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/SubscriptionCreate"
      responses:
        "201":
          description: Subscription created successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Subscription"

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
              $ref: "#/components/schemas/SubscriptionUpdate"
      responses:
        "200":
          description: Subscription updated successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Subscription"

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
        "200":
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
        "200":
          description: Testimonials retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  testimonials:
                    type: array
                    items:
                      $ref: "#/components/schemas/Testimonial"
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
              $ref: "#/components/schemas/TestimonialCreate"
      responses:
        "201":
          description: Testimonial created successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Testimonial"

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
        "200":
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
        "200":
          description: Users retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  users:
                    type: array
                    items:
                      $ref: "#/components/schemas/User"
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
        "200":
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
        "200":
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
        "200":
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
        "200":
          description: Notifications retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  notifications:
                    type: array
                    items:
                      $ref: "#/components/schemas/Notification"
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
        "200":
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
        "200":
          description: Search results retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  contractors:
                    type: array
                    items:
                      $ref: "#/components/schemas/ContractorSummary"
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
        "200":
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
        "200":
          description: Favorite contractors retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  contractors:
                    type: array
                    items:
                      $ref: "#/components/schemas/ContractorSummary"
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
        "201":
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
        "200":
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
        "200":
          description: Event templates retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  templates:
                    type: array
                    items:
                      $ref: "#/components/schemas/EventTemplate"
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
        "201":
          description: Event saved as template
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/EventTemplate"

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
        "200":
          description: Event template retrieved
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/EventTemplate"

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
        "200":
          description: Event template updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/EventTemplate"

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
        "204":
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
        "201":
          description: Event created from template
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Event"

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
        - $ref: "#/components/schemas/ContractorSummary"
        - type: object
          properties:
            services:
              type: array
              items:
                $ref: "#/components/schemas/Service"
            portfolio:
              type: array
              items:
                $ref: "#/components/schemas/PortfolioItem"
            testimonials:
              type: array
              items:
                $ref: "#/components/schemas/Testimonial"

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
            $ref: "#/components/schemas/Error"
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Forbidden:
      description: Forbidden
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    NotFound:
      description: Not found
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    InternalServerError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
```

### Real-time Subscriptions

The platform will use Supabase's real-time capabilities for live updates:

**Real-time Channels:**

- `enquiries:{enquiry_id}` - Live enquiry message updates
- `events:{event_id}` - Event status and service assignment updates
- `jobs:{job_id}` - Job application status updates
- `contractors:{contractor_id}` - Contractor profile and availability updates
- `notifications:{user_id}` - User-specific notifications

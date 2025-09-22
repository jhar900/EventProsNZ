# Testing

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
import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";
import { server } from "./mocks/server";

// Configure testing library
configure({ testIdAttribute: "data-testid" });

// Setup MSW for API mocking
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/",
    query: {},
  }),
}));

// Mock Supabase client
jest.mock("@supabase/supabase-js", () => ({
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
import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/events";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase");

describe("/api/events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/events", () => {
    it("returns events for authenticated user", async () => {
      const mockEvents = [
        { id: "1", title: "Event 1", user_id: "user-1" },
        { id: "2", title: "Event 2", user_id: "user-1" },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
        }),
      });

      const { req, res } = createMocks({
        method: "GET",
        headers: {
          authorization: "Bearer valid-token",
        },
      });

      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ events: mockEvents });
    });

    it("returns 401 for unauthenticated request", async () => {
      const { req, res } = createMocks({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/events", () => {
    it("creates new event", async () => {
      const eventData = {
        title: "New Event",
        event_type: "wedding",
        event_date: "2024-12-25",
        location: "Auckland",
        attendee_count: 100,
        duration_hours: 8,
        budget: 5000,
      };

      const mockCreatedEvent = { id: "new-event-id", ...eventData };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [mockCreatedEvent],
            error: null,
          }),
        }),
      });

      const { req, res } = createMocks({
        method: "POST",
        headers: {
          authorization: "Bearer valid-token",
          "content-type": "application/json",
        },
        body: eventData,
      });

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData())).toEqual(mockCreatedEvent);
    });

    it("validates required fields", async () => {
      const invalidData = {
        title: "", // Missing required field
        event_type: "wedding",
      };

      const { req, res } = createMocks({
        method: "POST",
        headers: {
          authorization: "Bearer valid-token",
          "content-type": "application/json",
        },
        body: invalidData,
      });

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty("error");
    });
  });
});
```

**Database Testing:**

```typescript
// __tests__/lib/database.test.ts
import { createEvent, getEventsByUser, updateEvent } from "@/lib/database";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase");

describe("Database Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createEvent", () => {
    it("creates event successfully", async () => {
      const eventData = {
        title: "Test Event",
        user_id: "user-1",
        event_type: "wedding",
        event_date: "2024-12-25",
        location: "Auckland",
        attendee_count: 100,
        duration_hours: 8,
        budget: 5000,
      };

      const mockResponse = {
        data: [{ id: "event-1", ...eventData }],
        error: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockResponse),
        }),
      });

      const result = await createEvent(eventData);

      expect(result).toEqual(mockResponse.data[0]);
      expect(supabase.from).toHaveBeenCalledWith("events");
    });

    it("handles database errors", async () => {
      const eventData = { title: "Test Event", user_id: "user-1" };
      const mockError = { message: "Database error" };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      });

      await expect(createEvent(eventData)).rejects.toThrow("Database error");
    });
  });
});
```

### Integration Testing

#### API Integration Tests

**End-to-End API Testing:**

```typescript
// __tests__/integration/api.test.ts
import request from "supertest";
import { app } from "@/pages/api/events";
import { setupTestDatabase, cleanupTestDatabase } from "../helpers/database";

describe("Events API Integration", () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    // Create test user and get auth token
    const authResponse = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "TestPassword123",
      first_name: "Test",
      last_name: "User",
      role: "event_manager",
    });

    authToken = authResponse.body.access_token;
    userId = authResponse.body.user.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe("Event CRUD Operations", () => {
    let eventId: string;

    it("creates a new event", async () => {
      const eventData = {
        title: "Integration Test Event",
        event_type: "wedding",
        event_date: "2024-12-25T10:00:00Z",
        location: "Auckland",
        attendee_count: 100,
        duration_hours: 8,
        budget: 5000,
      };

      const response = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${authToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body).toMatchObject(eventData);
      eventId = response.body.id;
    });

    it("retrieves events for user", async () => {
      const response = await request(app)
        .get("/api/events")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].id).toBe(eventId);
    });

    it("updates an existing event", async () => {
      const updateData = {
        title: "Updated Event Title",
        budget: 6000,
      };

      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.budget).toBe(updateData.budget);
    });

    it("deletes an event", async () => {
      await request(app)
        .delete(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(204);

      // Verify event is deleted
      const response = await request(app)
        .get("/api/events")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.events).toHaveLength(0);
    });
  });

  describe("Authentication and Authorization", () => {
    it("rejects requests without authentication", async () => {
      await request(app).get("/api/events").expect(401);
    });

    it("rejects requests with invalid token", async () => {
      await request(app)
        .get("/api/events")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });
});
```

#### Database Integration Tests

**Database Schema Testing:**

```typescript
// __tests__/integration/database.test.ts
import { supabase } from "@/lib/supabase";
import { setupTestDatabase, cleanupTestDatabase } from "../helpers/database";

describe("Database Schema Integration", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe("User and Profile Relationships", () => {
    it("creates user with profile", async () => {
      const userData = {
        email: "test@example.com",
        password: "TestPassword123",
        first_name: "Test",
        last_name: "User",
        role: "event_manager",
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
        .from("profiles")
        .insert({
          user_id: authData.user.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: "+64 21 123 4567",
          address: "123 Test Street, Auckland",
        })
        .select()
        .single();

      expect(profileError).toBeNull();
      expect(profileData.user_id).toBe(authData.user.id);
    });
  });

  describe("Event and Service Relationships", () => {
    let userId: string;
    let eventId: string;
    let serviceId: string;

    beforeEach(async () => {
      // Create test user
      const { data: authData } = await supabase.auth.signUp({
        email: "eventtest@example.com",
        password: "TestPassword123",
      });
      userId = authData.user.id;

      // Create test event
      const { data: eventData } = await supabase
        .from("events")
        .insert({
          user_id: userId,
          title: "Test Event",
          event_type: "wedding",
          event_date: "2024-12-25T10:00:00Z",
          location: "Auckland",
          attendee_count: 100,
          duration_hours: 8,
          budget: 5000,
        })
        .select()
        .single();
      eventId = eventData.id;

      // Create test service
      const { data: serviceData } = await supabase
        .from("services")
        .insert({
          business_profile_id: "test-business-profile",
          name: "DJ Services",
          description: "Professional DJ services",
          category: "entertainment",
          price_range_min: 500,
          price_range_max: 1500,
        })
        .select()
        .single();
      serviceId = serviceData.id;
    });

    it("creates event-service relationship", async () => {
      const { data, error } = await supabase
        .from("event_services")
        .insert({
          event_id: eventId,
          service_id: serviceId,
          status: "required",
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
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("user can register and login", async ({ page }) => {
    // Navigate to registration page
    await page.goto("/register");

    // Fill registration form
    await page.fill('[data-testid="email-input"]', "test@example.com");
    await page.fill('[data-testid="password-input"]', "TestPassword123");
    await page.fill('[data-testid="first-name-input"]', "Test");
    await page.fill('[data-testid="last-name-input"]', "User");
    await page.selectOption('[data-testid="role-select"]', "event_manager");

    // Submit form
    await page.click('[data-testid="register-button"]');

    // Should redirect to email verification page
    await expect(page).toHaveURL("/verify-email");
    await expect(page.locator("text=Check your email")).toBeVisible();
  });

  test("user can login with valid credentials", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Fill login form
    await page.fill('[data-testid="email-input"]', "test@example.com");
    await page.fill('[data-testid="password-input"]', "TestPassword123");

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("text=Welcome to your dashboard")).toBeVisible();
  });

  test("user cannot access protected routes without authentication", async ({
    page,
  }) => {
    // Try to access protected route
    await page.goto("/events");

    // Should redirect to login page
    await expect(page).toHaveURL("/login");
    await expect(page.locator("text=Please log in to continue")).toBeVisible();
  });
});
```

**Event Management E2E:**

```typescript
// e2e/events.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Event Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', "test@example.com");
    await page.fill('[data-testid="password-input"]', "TestPassword123");
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("user can create a new event", async ({ page }) => {
    // Navigate to events page
    await page.goto("/events");

    // Click create event button
    await page.click('[data-testid="create-event-button"]');

    // Fill event form
    await page.fill('[data-testid="event-title-input"]', "Test Wedding");
    await page.selectOption('[data-testid="event-type-select"]', "wedding");
    await page.fill('[data-testid="event-date-input"]', "2024-12-25");
    await page.fill('[data-testid="event-location-input"]', "Auckland");
    await page.fill('[data-testid="attendee-count-input"]', "100");
    await page.fill('[data-testid="duration-input"]', "8");
    await page.fill('[data-testid="budget-input"]', "5000");

    // Submit form
    await page.click('[data-testid="submit-event-button"]');

    // Should show success message and redirect to events list
    await expect(page.locator("text=Event created successfully")).toBeVisible();
    await expect(page.locator("text=Test Wedding")).toBeVisible();
  });

  test("user can edit an existing event", async ({ page }) => {
    // Navigate to events page
    await page.goto("/events");

    // Click edit button on first event
    await page.click('[data-testid="edit-event-button"]');

    // Update event title
    await page.fill('[data-testid="event-title-input"]', "Updated Event Title");

    // Submit form
    await page.click('[data-testid="submit-event-button"]');

    // Should show success message
    await expect(page.locator("text=Event updated successfully")).toBeVisible();
    await expect(page.locator("text=Updated Event Title")).toBeVisible();
  });

  test("user can delete an event", async ({ page }) => {
    // Navigate to events page
    await page.goto("/events");

    // Click delete button on first event
    await page.click('[data-testid="delete-event-button"]');

    // Confirm deletion in modal
    await page.click('[data-testid="confirm-delete-button"]');

    // Should show success message
    await expect(page.locator("text=Event deleted successfully")).toBeVisible();
  });
});
```

**Contractor Search E2E:**

```typescript
// e2e/contractors.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Contractor Search and Discovery", () => {
  test("user can search for contractors", async ({ page }) => {
    // Navigate to contractors page
    await page.goto("/contractors");

    // Search for DJ services
    await page.fill('[data-testid="search-input"]', "DJ");
    await page.click('[data-testid="search-button"]');

    // Should show search results
    await expect(
      page.locator('[data-testid="contractor-card"]')
    ).toHaveCount.greaterThan(0);

    // Filter by location
    await page.selectOption('[data-testid="location-filter"]', "Auckland");

    // Should update results
    await expect(
      page.locator('[data-testid="contractor-card"]')
    ).toHaveCount.greaterThan(0);
  });

  test("user can view contractor profile", async ({ page }) => {
    // Navigate to contractors page
    await page.goto("/contractors");

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

  test("user can send enquiry to contractor", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', "test@example.com");
    await page.fill('[data-testid="password-input"]', "TestPassword123");
    await page.click('[data-testid="login-button"]');

    // Navigate to contractor profile
    await page.goto("/contractors/test-contractor-id");

    // Click send enquiry button
    await page.click('[data-testid="send-enquiry-button"]');

    // Fill enquiry form
    await page.fill(
      '[data-testid="enquiry-message-textarea"]',
      "Hi, I am interested in your DJ services for my wedding on December 25th."
    );

    // Submit enquiry
    await page.click('[data-testid="submit-enquiry-button"]');

    // Should show success message
    await expect(page.locator("text=Enquiry sent successfully")).toBeVisible();
  });
});
```

### Performance Testing

#### Load Testing

**API Load Testing:**

```typescript
// __tests__/performance/api-load.test.ts
import { check, sleep } from "k6";
import http from "k6/http";

export let options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 200 }, // Ramp up to 200 users
    { duration: "5m", target: 200 }, // Stay at 200 users
    { duration: "2m", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
    http_req_failed: ["rate<0.1"], // Error rate must be below 10%
  },
};

const BASE_URL = "https://api.eventpros.co.nz/v1";

export default function () {
  // Test contractor search endpoint
  let response = http.get(`${BASE_URL}/contractors?search=DJ&limit=20`);

  check(response, {
    "contractor search status is 200": (r) => r.status === 200,
    "contractor search response time < 500ms": (r) => r.timings.duration < 500,
    "contractor search returns data": (r) =>
      JSON.parse(r.body).contractors.length > 0,
  });

  sleep(1);

  // Test event creation endpoint
  const eventData = {
    title: "Load Test Event",
    event_type: "wedding",
    event_date: "2024-12-25T10:00:00Z",
    location: "Auckland",
    attendee_count: 100,
    duration_hours: 8,
    budget: 5000,
  };

  response = http.post(`${BASE_URL}/events`, JSON.stringify(eventData), {
    headers: { "Content-Type": "application/json" },
  });

  check(response, {
    "event creation status is 201": (r) => r.status === 201,
    "event creation response time < 1000ms": (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

#### Frontend Performance Testing

**Lighthouse Performance Tests:**

```typescript
// e2e/performance.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Performance Tests", () => {
  test("homepage meets performance standards", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Run Lighthouse audit
    const lighthouse = await page.evaluate(() => {
      return new Promise((resolve) => {
        // This would integrate with Lighthouse CI
        // For now, we'll check basic performance metrics
        const navigation = performance.getEntriesByType("navigation")[0];
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

  test("contractor search page loads quickly", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/contractors");
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
import { faker } from "@faker-js/faker";

export const createMockEvent = (overrides = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  title: faker.lorem.words(3),
  event_type: faker.helpers.arrayElement([
    "wedding",
    "corporate",
    "party",
    "conference",
  ]),
  event_date: faker.date.future().toISOString(),
  location: faker.location.city(),
  attendee_count: faker.number.int({ min: 10, max: 500 }),
  duration_hours: faker.number.float({ min: 1, max: 12, fractionDigits: 1 }),
  budget: faker.number.int({ min: 1000, max: 50000 }),
  status: faker.helpers.arrayElement([
    "draft",
    "planning",
    "confirmed",
    "completed",
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
    ["DJ Services", "Photography", "Catering", "Floral", "Venue"],
    { min: 1, max: 3 }
  ),
  location: faker.location.city(),
  average_rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
  review_count: faker.number.int({ min: 0, max: 100 }),
  is_verified: faker.datatype.boolean(),
  subscription_tier: faker.helpers.arrayElement([
    "essential",
    "showcase",
    "spotlight",
  ]),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  role: faker.helpers.arrayElement(["event_manager", "contractor", "admin"]),
  is_verified: faker.datatype.boolean(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});
```

**MSW API Mocking:**

```typescript
// __tests__/mocks/handlers.ts
import { rest } from "msw";

export const handlers = [
  // Auth endpoints
  rest.post("/api/auth/login", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: { id: "user-1", email: "test@example.com" },
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      })
    );
  }),

  // Events endpoints
  rest.get("/api/events", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        events: [
          {
            id: "event-1",
            title: "Test Event",
            event_type: "wedding",
            location: "Auckland",
            status: "confirmed",
          },
        ],
        total: 1,
      })
    );
  }),

  rest.post("/api/events", (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: "new-event-id",
        ...req.body,
        created_at: new Date().toISOString(),
      })
    );
  }),

  // Contractors endpoints
  rest.get("/api/contractors", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        contractors: [
          {
            id: "contractor-1",
            company_name: "Test DJ Services",
            description: "Professional DJ services",
            location: "Auckland",
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
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
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
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}",
  ],
};

module.exports = createJestConfig(customJestConfig);
```

#### Playwright Configuration

**Playwright Setup:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

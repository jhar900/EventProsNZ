# Components

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
  sm: "640px", // Mobile landscape
  md: "768px", // Tablet
  lg: "1024px", // Desktop
  xl: "1280px", // Large desktop
  "2xl": "1536px", // Extra large
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
const ContractorProfile = lazy(() => import("./ContractorProfile"));
const EventTimeline = lazy(() => import("./EventTimeline"));
const PortfolioGallery = lazy(() => import("./PortfolioGallery"));
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

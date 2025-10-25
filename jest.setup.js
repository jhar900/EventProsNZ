import '@testing-library/jest-dom';

// Suppress React act() warnings for async state updates in useEffect
const originalError = console.error;
beforeAll(() => {
  // eslint-disable-next-line no-console
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes(
        'Warning: An update to TestComponent inside a test was not wrapped in act'
      ) ||
        (args[0].includes('Warning: An update to') &&
          args[0].includes('was not wrapped in act')) ||
        args[0].includes('Maximum update depth exceeded'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  // eslint-disable-next-line no-console
  console.error = originalError;
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-mapbox-token';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_test';
process.env.STRIPE_SECRET_KEY = 'sk_test_test';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_webhook_secret';
process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID = 'GA-TEST-ID';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock Web APIs for Node.js environment
global.Request = class Request {
  constructor(input, init) {
    // Use Object.defineProperty to set url as non-writable
    Object.defineProperty(this, 'url', {
      value: input,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }

  async json() {
    return JSON.parse(this.body || '{}');
  }

  async text() {
    return this.body || '';
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }

  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  }
};

global.Headers = class Headers {
  constructor(init) {
    this._headers = new Map();
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value));
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.set(key, value));
      }
    }
  }

  set(name, value) {
    this._headers.set(name.toLowerCase(), value);
  }

  get(name) {
    return this._headers.get(name.toLowerCase());
  }

  has(name) {
    return this._headers.has(name.toLowerCase());
  }

  delete(name) {
    return this._headers.delete(name.toLowerCase());
  }

  entries() {
    return this._headers.entries();
  }

  keys() {
    return this._headers.keys();
  }

  values() {
    return this._headers.values();
  }

  forEach(callback) {
    this._headers.forEach(callback);
  }
};

// Mock fetch
global.fetch = jest.fn();

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn(() => ({
    document: {
      write: jest.fn(),
      close: jest.fn(),
    },
    close: jest.fn(),
  })),
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(() => true), // Default to true for tests
});

// Mock hasPointerCapture for Radix UI compatibility
Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  writable: true,
  value: jest.fn(() => false),
});

Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  writable: true,
  value: jest.fn(),
});

// Mock scrollIntoView for Radix UI compatibility
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  value: jest.fn(),
});

// Mock getBoundingClientRect for Radix UI compatibility
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  writable: true,
  value: jest.fn(() => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  })),
});

// Mock NextRequest with proper cookies support
global.NextRequest = class NextRequest {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
    this._cookies = new Map(); // Use _cookies instead of cookies
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }

  // Add cookie methods
  get cookies() {
    return {
      get: name => this._cookies?.get(name) || null,
      set: (name, value, options) => {
        if (!this._cookies) this._cookies = new Map();
        this._cookies.set(name, { name, value, ...options });
      },
      delete: (name, options) => {
        if (!this._cookies) this._cookies = new Map();
        this._cookies.set(name, { name, value: '', ...options });
      },
      has: name => this._cookies?.has(name) || false,
      getAll: () => Array.from(this._cookies?.values() || []),
    };
  }

  set cookies(value) {
    this._cookies = new Map();
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([name, cookie]) => {
        this._cookies.set(
          name,
          typeof cookie === 'string' ? { name, value: cookie } : cookie
        );
      });
    }
  }
};

// Mock NextResponse
global.NextResponse = {
  json: (data, init) => ({
    json: () => Promise.resolve(data),
    status: init?.status || 200,
  }),
  next: init => ({
    cookies: {
      set: jest.fn(),
      delete: jest.fn(),
    },
  }),
  redirect: (url, init) => ({
    status: init?.status || 302,
    headers: new Headers({ Location: url }),
  }),
};

// Mock next/server module globally
jest.mock('next/server', () => ({
  NextRequest: global.NextRequest,
  NextResponse: global.NextResponse,
}));

// Import simple Supabase mock
const {
  createSimpleSupabaseMock,
} = require('./__tests__/mocks/supabase-simple-mock');

// Create a simple, working Supabase mock
const createMockSupabaseClient = () => {
  return createSimpleSupabaseMock();
};

// Set up global mock
global.mockSupabaseClient = createMockSupabaseClient();

// Mock the server client import
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => global.mockSupabaseClient),
  supabaseAdmin: global.mockSupabaseClient,
}));

// Ensure the mock is applied before any imports
beforeAll(() => {
  // Force the mock to be applied
  jest.doMock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => global.mockSupabaseClient),
    supabaseAdmin: global.mockSupabaseClient,
  }));
});

// Mock the client import
jest.mock('@/lib/supabase/client', () => ({
  supabase: global.mockSupabaseClient,
  createClient: jest.fn(() => global.mockSupabaseClient),
}));

// Add mock data structures for consistent testing
global.mockPaymentMethod = {
  id: 'pm_test_123',
  user_id: 'user_test_123',
  type: 'card',
  card: {
    brand: 'visa',
    last4: '4242',
    exp_month: 12,
    exp_year: 2025,
  },
  is_default: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock event data structure
global.mockEventData = {
  title: '',
  eventType: '',
  eventDate: '',
  location: '',
  attendeeCount: 0,
  durationHours: 0,
  budget: 0,
  description: '',
  isPrivate: false,
  allowGuests: true,
  maxGuests: 0,
  requirements: '',
  specialInstructions: '',
};

global.mockPaymentIntent = {
  id: 'pi_test_123',
  amount: 5000,
  currency: 'nzd',
  status: 'succeeded',
  client_secret: 'pi_test_123_secret_test',
  created: 1640995200,
};

global.mockContractor = {
  id: 'contractor_test_123',
  company_name: 'Test Company',
  service_type: 'catering',
  location: {
    lat: -36.8485,
    lng: 174.7633,
  },
  is_verified: true,
  rating: 4.5,
  price_range: '$$',
};

// Mock rate limiting
jest.mock('@/lib/rate-limiting', () => ({
  createRateLimit: jest.fn(() =>
    jest.fn(() => ({
      allowed: true,
      remaining: 10,
      resetTime: Date.now() + 60000,
    }))
  ),
  contactFormRateLimit: jest.fn(() => ({
    allowed: true,
    remaining: 10,
    resetTime: Date.now() + 60000,
  })),
  newsletterRateLimit: jest.fn(() => ({
    allowed: true,
    remaining: 10,
    resetTime: Date.now() + 60000,
  })),
}));

// Mock Mapbox context to prevent infinite loops in tests
jest.mock('@/lib/maps/mapbox-context', () => ({
  useMapbox: () => ({
    mapInstance: null, // Disable map instance to prevent infinite loops
  }),
}));

// Mock map services to prevent infinite loops
jest.mock('@/lib/maps/clustering/pin-service', () => ({
  pinService: {
    initializePin: jest.fn(),
    handlePinClick: jest.fn(),
    handlePinHover: jest.fn(),
    handlePinHoverEnd: jest.fn(),
  },
}));

jest.mock('@/lib/maps/clustering/animation-service', () => ({
  animationService: {
    animatePinBounce: jest.fn(),
    animatePinScale: jest.fn(),
  },
}));

// Mock the problematic ContractorPin component to prevent infinite loops
jest.mock('@/components/features/map/ContractorPin', () => {
  const React = require('react');
  return {
    default: props =>
      React.createElement(
        'div',
        {
          'data-testid': 'contractor-pin-mock',
          ...props,
        },
        `Mocked Contractor Pin for ${props.contractor?.company_name || 'Unknown'}`
      ),
  };
});

// Mock the event creation store
jest.mock('@/stores/event-creation', () => ({
  useEventCreationStore: jest.fn(() => ({
    currentStep: 1,
    eventData: global.mockEventData,
    serviceRequirements: [],
    budgetPlan: { totalBudget: 0, breakdown: {}, recommendations: [] },
    contractorMatches: [],
    templates: [],
    drafts: [],
    isDraft: true,
    isLoading: false,
    validationErrors: [],
    nextStep: jest.fn(),
    previousStep: jest.fn(),
    goToStep: jest.fn(),
    updateEventData: jest.fn(),
    addServiceRequirement: jest.fn(),
    removeServiceRequirement: jest.fn(),
    updateServiceRequirement: jest.fn(),
    updateBudgetPlan: jest.fn(),
    loadTemplates: jest.fn(),
    loadDrafts: jest.fn(),
    saveDraft: jest.fn(),
    submitEvent: jest.fn(),
    reset: jest.fn(),
  })),
  useEventData: jest.fn(() => global.mockEventData),
  useServiceRequirements: jest.fn(() => []),
  useBudgetPlan: jest.fn(() => ({
    totalBudget: 0,
    breakdown: {},
    recommendations: [],
  })),
  useValidationErrors: jest.fn(() => []),
  useIsLoading: jest.fn(() => false),
}));

// Mock subscription management hooks
jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: jest.fn(() => ({
    subscription: {
      id: 'sub_test_123',
      status: 'active',
      plan: 'showcase',
      price: 2900,
      currency: 'nzd',
      current_period_start: '2024-01-01T00:00:00Z',
      current_period_end: '2024-02-01T00:00:00Z',
    },
    isLoading: false,
    error: null,
    updateSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
    resumeSubscription: jest.fn(),
  })),
}));

// Mock EventTemplates component
jest.mock('@/components/features/events/EventTemplates', () => {
  const React = require('react');
  return function EventTemplates({ onSelect, onClose }) {
    return React.createElement(
      'div',
      {
        'data-testid': 'event-templates-modal',
      },
      [
        React.createElement('h2', { key: 'title' }, 'Choose an Event Template'),
        React.createElement(
          'button',
          {
            key: 'close',
            onClick: onClose,
            'data-testid': 'close-templates',
          },
          'Close'
        ),
      ]
    );
  };
});

// Mock date-fns functions
jest.mock('date-fns', () => ({
  addDays: jest.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }),
  format: jest.fn((date, format) => {
    return date.toISOString().split('T')[0]; // Simple mock
  }),
  isAfter: jest.fn((date1, date2) => date1 > date2),
  isBefore: jest.fn((date1, date2) => date1 < date2),
  isToday: jest.fn(date => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }),
  startOfDay: jest.fn(date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }),
  endOfDay: jest.fn(date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }),
}));

// Mock date-fns/addDays for default import
jest.mock('date-fns/addDays', () => ({
  __esModule: true,
  default: jest.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }),
}));

// Mock date-fns/isAfter for default import
jest.mock('date-fns/isAfter', () => ({
  __esModule: true,
  default: jest.fn((date1, date2) => date1 > date2),
}));

// Mock date-fns/isBefore for default import
jest.mock('date-fns/isBefore', () => ({
  __esModule: true,
  default: jest.fn((date1, date2) => date1 < date2),
}));

// Mock date-fns/format for default import
jest.mock('date-fns/format', () => ({
  __esModule: true,
  default: jest.fn((date, format) => {
    return date.toISOString().split('T')[0]; // Simple mock
  }),
}));

import '@testing-library/jest-dom';

// Suppress React act() warnings for async state updates in useEffect
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes(
        'Warning: An update to TestComponent inside a test was not wrapped in act'
      ) ||
        (args[0].includes('Warning: An update to') &&
          args[0].includes('was not wrapped in act')))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
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

// Mock NextRequest
global.NextRequest = class NextRequest {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
};

// Mock NextResponse
global.NextResponse = {
  json: (data, init) => ({
    json: () => Promise.resolve(data),
    status: init?.status || 200,
  }),
};

// Mock next/server module globally
jest.mock('next/server', () => ({
  NextRequest: global.NextRequest,
  NextResponse: global.NextResponse,
}));

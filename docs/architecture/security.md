# Security

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
  EVENT_MANAGER = "event_manager",
  CONTRACTOR = "contractor",
  ADMIN = "admin",
}

enum Permission {
  // Event permissions
  CREATE_EVENT = "create:event",
  READ_EVENT = "read:event",
  UPDATE_EVENT = "update:event",
  DELETE_EVENT = "delete:event",

  // Contractor permissions
  CREATE_CONTRACTOR_PROFILE = "create:contractor_profile",
  READ_CONTRACTOR_PROFILE = "read:contractor_profile",
  UPDATE_CONTRACTOR_PROFILE = "update:contractor_profile",

  // Job permissions
  CREATE_JOB = "create:job",
  READ_JOB = "read:job",
  UPDATE_JOB = "update:job",
  DELETE_JOB = "delete:job",
  APPLY_JOB = "apply:job",

  // Admin permissions
  MANAGE_USERS = "manage:users",
  VIEW_ANALYTICS = "view:analytics",
  MANAGE_SUBSCRIPTIONS = "manage:subscriptions",
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
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      req.user = user;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: "Authentication failed" });
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
        return res.status(403).json({ error: "Insufficient permissions" });
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
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum(["event_manager", "contractor"]),
});

// lib/validations/event.ts
export const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  event_type: z.string().min(1, "Event type is required"),
  event_date: z.date().min(new Date(), "Event date must be in the future"),
  location: z.string().min(1, "Location is required"),
  attendee_count: z.number().min(1, "Must have at least 1 attendee"),
  duration_hours: z.number().min(0.5, "Duration must be at least 30 minutes"),
  budget: z.number().min(0, "Budget must be positive"),
});
```

**Input Sanitization:**

```typescript
// lib/utils/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

// API route validation
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid input data", error.errors);
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
  let query = supabase.from("contractors").select(`
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
    query = query.ilike("company_name", `%${filters.search}%`);
  }

  if (filters.categories?.length) {
    query = query.overlaps("service_categories", filters.categories);
  }

  if (filters.min_rating) {
    query = query.gte("average_rating", filters.min_rating);
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
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
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
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
});

// API route protection
export async function withRateLimit(req: NextApiRequest, res: NextApiResponse) {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const { success, limit, reset, remaining } = await ratelimit.limit(
    ip as string
  );

  res.setHeader("X-RateLimit-Limit", limit.toString());
  res.setHeader("X-RateLimit-Remaining", remaining.toString());
  res.setHeader("X-RateLimit-Reset", new Date(reset).toISOString());

  if (!success) {
    return res.status(429).json({
      error: "Too many requests",
      retryAfter: Math.round((reset - Date.now()) / 1000),
    });
  }
}
```

#### CORS Configuration

**CORS Settings:**

```typescript
// lib/cors.ts
import Cors from "cors";

const cors = Cors({
  origin: [
    "https://eventpros.co.nz",
    "https://www.eventpros.co.nz",
    "https://staging.eventpros.co.nz",
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000"]
      : []),
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
});

export function withCors(handler: NextApiHandler) {
  return (req: NextApiRequest, res: NextApiResponse) => {
    return new Promise((resolve, reject) => {
      cors(req, res, (result) => {
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
import { createHash } from "crypto";
import sharp from "sharp";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function validateFile(file: File): Promise<ValidationResult> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File too large" };
  }

  // Check file type
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type" };
  }

  // Generate secure filename
  const fileHash = createHash("sha256")
    .update(file.name + Date.now())
    .digest("hex");

  const extension = file.name.split(".").pop();
  const secureFilename = `${fileHash}.${extension}`;

  return { valid: true, filename: secureFilename };
}

export async function processImage(file: Buffer): Promise<Buffer> {
  return await sharp(file)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}
```

#### Malware Scanning

**File Security Scanning:**

```typescript
// lib/security-scan.ts
import { createClient } from "@supabase/supabase-js";

export async function scanFileForMalware(fileBuffer: Buffer): Promise<boolean> {
  // Integration with cloud security service (e.g., VirusTotal API)
  const scanResult = await fetch(
    "https://www.virustotal.com/vtapi/v2/file/scan",
    {
      method: "POST",
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
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = "aes-256-gcm";

export function encrypt(text: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from("eventpros", "utf8"));

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decrypt(encryptedData: {
  encrypted: string;
  iv: string;
  tag: string;
}): string {
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from("eventpros", "utf8"));
  decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"));

  let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

### Security Monitoring

#### Audit Logging

**Security Event Logging:**

```typescript
// lib/audit-logger.ts
export enum SecurityEvent {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILED = "login_failed",
  LOGOUT = "logout",
  PASSWORD_RESET = "password_reset",
  PROFILE_UPDATE = "profile_update",
  FILE_UPLOAD = "file_upload",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
}

export async function logSecurityEvent(
  event: SecurityEvent,
  userId: string | null,
  metadata: Record<string, any> = {}
) {
  await supabase.from("security_logs").insert({
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
      ip: req.headers["x-forwarded-for"],
      userAgent: req.headers["user-agent"],
    });

    res.json(result);
  } catch (error) {
    await logSecurityEvent(SecurityEvent.LOGIN_FAILED, null, {
      email: req.body.email,
      ip: req.headers["x-forwarded-for"],
      error: error.message,
    });

    res.status(401).json({ error: "Login failed" });
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
    return this.SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(input));
  }

  static async checkRateLimitViolations(userId: string): Promise<boolean> {
    const recentRequests = await supabase
      .from("api_requests")
      .select("timestamp")
      .eq("user_id", userId)
      .gte("timestamp", new Date(Date.now() - 60000).toISOString()); // Last minute

    return recentRequests.data.length > 100; // More than 100 requests per minute
  }

  static async checkGeographicAnomaly(
    userId: string,
    currentIP: string
  ): Promise<boolean> {
    const recentLogins = await supabase
      .from("security_logs")
      .select("metadata")
      .eq("user_id", userId)
      .eq("event_type", SecurityEvent.LOGIN_SUCCESS)
      .order("timestamp", { ascending: false })
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
      supabase.from("users").select("*").eq("id", userId).single(),
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("events").select("*").eq("user_id", userId),
      supabase.from("contractors").select("*").eq("user_id", userId),
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
      .from("users")
      .update({
        deleted_at: new Date().toISOString(),
        email: `deleted_${userId}@deleted.com`,
        first_name: "Deleted",
        last_name: "User",
      })
      .eq("id", userId);

    // Anonymize related data
    await supabase
      .from("events")
      .update({
        title: "Deleted Event",
        location: "Deleted",
        user_id: null,
      })
      .eq("user_id", userId);
  }

  static async getDataRetentionPolicy(): Promise<DataRetentionPolicy> {
    return {
      user_data: "7 years after account deletion",
      event_data: "3 years after event completion",
      contractor_data: "5 years after last activity",
      security_logs: "2 years",
      analytics_data: "1 year",
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

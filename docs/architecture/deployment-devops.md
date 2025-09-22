# Deployment & DevOps

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
  NODE_VERSION: "18.x"
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
          cache: "npm"

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
          cache: "npm"

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
          cache: "npm"

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
          cache: "npm"

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
          vercel-args: "--prod"
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
          scan-type: "fs"
          scan-ref: "."
          format: "sarif"
          output: "trivy-results.sarif"

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: "trivy-results.sarif"

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
          cache: "npm"

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
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric: any) {
  // Send to Vercel Analytics
  if (typeof window !== "undefined" && window.analytics) {
    window.analytics.track("web_vital", {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });
  }

  // Send to Google Analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value
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
    - cron: "0 2 * * *" # Daily at 2 AM UTC
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
    - cron: "0 0 * * 1" # Weekly on Monday
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
    - cron: "0 6 * * *" # Daily at 6 AM UTC

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"
          scan-ref: "."
          format: "sarif"
          output: "trivy-results.sarif"

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: "trivy-results.sarif"
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

# Technical Assumptions

### Repository Structure: Monorepo

Single repository containing both frontend and backend code for Event Pros NZ, enabling easier development, testing, and deployment coordination.

### Service Architecture

**Next.js Full-Stack Application with Supabase Backend**

- Frontend: Next.js 14 with TypeScript and Tailwind CSS
- Backend: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- External Services: Stripe for payments, Mapbox GL JS for mapping
- Deployment: Vercel for zero-config deployment and excellent performance

### Testing Requirements

**Unit + Integration Testing**

- Unit tests for individual components and functions
- Integration tests for API endpoints and database operations
- Manual testing for user workflows and payment processing
- Testing framework: Jest and React Testing Library for frontend, Supabase testing utilities for backend

### Additional Technical Assumptions and Requests

- **Database:** PostgreSQL via Supabase with proper indexing for search performance
- **Authentication:** Supabase Auth with role-based access (vendor/organizer)
- **Real-time Features:** Supabase real-time subscriptions for messaging and notifications
- **Maps Integration:** Mapbox GL JS for location-based search and vendor mapping
- **Payment Processing:** Stripe integration with webhook handling for subscription management
- **File Storage:** Supabase Storage for vendor photos and document uploads
- **Environment Management:** Environment variables for API keys and configuration
- **Error Handling:** Comprehensive error boundaries and user feedback systems
- **Performance:** Image optimization, lazy loading, and caching strategies
- **Security:** Data encryption, input validation, and secure API endpoints
- **Monitoring:** Basic logging and error tracking (consider Sentry for production)
- **CI/CD:** Automated testing and deployment through Vercel integration

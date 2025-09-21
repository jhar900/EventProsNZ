# Vercel Deployment Setup Guide

## Prerequisites

1. **Vercel Account**: Create account at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Ensure your code is pushed to GitHub
3. **Environment Variables**: Configure all required environment variables

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Vercel CLI (if not already installed globally)

```bash
npm install -g vercel
```

### 3. Login to Vercel

```bash
vercel login
```

### 4. Link Project to Vercel

```bash
vercel link
```

This will:

- Ask for your Vercel team/account
- Ask for project name (suggest: `eventpros-nz`)
- Ask for directory (current directory)
- Create `.vercel` folder with project configuration

### 5. Configure Environment Variables

Set these in Vercel Dashboard or via CLI:

#### Required Environment Variables:

```bash
# Application
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Event Pros NZ

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# External Services
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
SENDGRID_API_KEY=your-sendgrid-key

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

#### Vercel Auto-Provided Variables:

- `VERCEL_URL` - Automatically set by Vercel
- `VERCEL_ENV` - production/preview/development
- `VERCEL_REGION` - Deployment region

### 6. Deploy

#### Deploy Preview (for testing):

```bash
npm run deploy:preview
# or
vercel
```

#### Deploy Production:

```bash
npm run deploy
# or
vercel --prod
```

## Common Issues & Solutions

### Issue 1: Build Failures

**Error**: Build command failed
**Solution**:

- Check `next.config.js` for any syntax errors
- Ensure all dependencies are properly installed
- Check for TypeScript errors: `npm run lint`

### Issue 2: Environment Variables Not Loading

**Error**: `process.env.VARIABLE_NAME` is undefined
**Solution**:

- Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Check Vercel dashboard environment variables are set correctly
- Redeploy after adding new environment variables

### Issue 3: Supabase Connection Issues

**Error**: Supabase client initialization failed
**Solution**:

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is not paused
- Ensure RLS policies allow public access where needed

### Issue 4: Domain/URL Issues

**Error**: CORS or redirect issues
**Solution**:

- Update `NEXT_PUBLIC_APP_URL` to match your Vercel domain
- Check Supabase allowed origins include your Vercel domain
- Update any hardcoded URLs in the codebase

## Deployment Checklist

- [ ] Vercel CLI installed and logged in
- [ ] Project linked to Vercel
- [ ] All environment variables configured
- [ ] Build passes locally (`npm run build`)
- [ ] Preview deployment successful
- [ ] Production deployment successful
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active
- [ ] All external services working with production URLs

## Monitoring & Debugging

### Vercel Dashboard

- View deployment logs
- Monitor performance
- Check function logs
- View analytics

### CLI Commands

```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --follow

# Check deployment status
vercel ls
```

## Next Steps

1. **Custom Domain**: Configure custom domain in Vercel dashboard
2. **Analytics**: Enable Vercel Analytics for performance monitoring
3. **CI/CD**: Set up GitHub integration for automatic deployments
4. **Monitoring**: Configure error tracking and performance monitoring

# Stripe Production Setup - Quick Checklist

## Pre-Deployment

- [ ] Production domain is deployed and accessible
- [ ] Production Stripe account is set up
- [ ] Production API keys are available

## Step 1: Create Webhook Endpoint

- [ ] Logged into Stripe Dashboard (Live mode)
- [ ] Navigated to Developers → Webhooks
- [ ] Created new endpoint with production URL
- [ ] Selected all required events (12 events)
- [ ] Saved endpoint

## Step 2: Get Webhook Secret

- [ ] Clicked on the webhook endpoint
- [ ] Revealed signing secret
- [ ] Copied secret (starts with `whsec_`)

## Step 3: Configure Environment Variables

- [ ] Added `STRIPE_SECRET_KEY` (production: `sk_live_...`)
- [ ] Added `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (production: `pk_live_...`)
- [ ] Added `STRIPE_WEBHOOK_SECRET` (production: `whsec_...`)
- [ ] Set variables for Production environment
- [ ] Redeployed application

## Step 4: Test Webhook

- [ ] Sent test webhook from Stripe Dashboard
- [ ] Verified webhook received (200 status)
- [ ] Checked application logs for processing
- [ ] Verified database updates (if applicable)

## Step 5: Monitoring Setup

- [ ] Enabled Stripe webhook failure notifications
- [ ] Set up application error monitoring
- [ ] Configured alerts for webhook failures

## Post-Deployment Verification

- [ ] Tested actual payment flow end-to-end
- [ ] Verified subscription creation works
- [ ] Verified payment processing works
- [ ] Checked webhook logs for any errors
- [ ] Monitored for 24-48 hours

## Security Verification

- [ ] Webhook endpoint uses HTTPS
- [ ] Webhook secret is NOT in code/version control
- [ ] Rate limiting is active (production mode)
- [ ] Signature verification is working
- [ ] Error handling is in place

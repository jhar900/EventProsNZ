# Stripe Production Webhook Setup Guide

This guide walks you through setting up Stripe webhooks for production.

## Prerequisites

- Stripe account with production API keys
- Production domain deployed and accessible
- Access to your production environment variables

## Step 1: Get Your Production Domain

Your webhook endpoint will be:

```
https://yourdomain.com/api/stripe/webhook
```

Replace `yourdomain.com` with your actual production domain.

**Note**: The endpoint must be:

- HTTPS (not HTTP)
- Publicly accessible (no localhost)
- Returns 200 status code within 30 seconds

## Step 2: Create Webhook Endpoint in Stripe Dashboard

1. **Log in to Stripe Dashboard**
   - Go to https://dashboard.stripe.com
   - Make sure you're in **Live mode** (toggle in top right)

2. **Navigate to Webhooks**
   - Click **Developers** in the left sidebar
   - Click **Webhooks**

3. **Add Endpoint**
   - Click **Add endpoint** or **Create an event destination**
   - Enter your production URL: `https://yourdomain.com/api/stripe/webhook`
   - Give it a descriptive name: `EventProsNZ Production Webhook`

4. **Select Events**
   Select these events (the ones we implemented):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `customer.created`
   - `customer.updated`
   - `payment_method.attached`
   - `payment_method.detached`

5. **Create the Endpoint**
   - Click **Create destination** or **Add endpoint**

## Step 3: Get Your Webhook Signing Secret

1. **After creating the endpoint**, click on it in the webhooks list
2. **Find "Signing secret"** section
3. **Click "Reveal"** to see your secret
4. **Copy the secret** - it starts with `whsec_...`

**Important**:

- Each webhook endpoint has its own unique signing secret
- Keep this secret secure - never commit it to version control
- You'll need this for your production environment variables

## Step 4: Configure Production Environment Variables

Add the following to your production environment (Vercel, Heroku, etc.):

```bash
# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_...          # Your production secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Your production publishable key
STRIPE_WEBHOOK_SECRET=whsec_...        # The webhook secret from Step 3
```

### For Vercel:

1. Go to your project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: `sk_live_...`
   - **Environment**: Production (and Preview if needed)
4. Repeat for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_WEBHOOK_SECRET`
5. **Redeploy** your application for changes to take effect

### For Other Platforms:

- **Heroku**: `heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...`
- **Railway**: Add in project settings → Variables
- **AWS/Docker**: Add to your `.env` file or environment configuration

## Step 5: Verify Webhook Endpoint is Accessible

Test that your endpoint is reachable:

```bash
curl https://yourdomain.com/api/stripe/webhook
```

You should get a response (even if it's an error about missing signature - that's expected).

## Step 6: Test the Webhook Endpoint

### Option A: Use Stripe Dashboard (Recommended)

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click **Send test webhook**
3. Select an event type (e.g., `customer.subscription.created`)
4. Click **Send test webhook**
5. Check the **Logs** tab to see if it was received successfully

### Option B: Use Stripe CLI (if you have it)

```bash
# Forward to production (requires ngrok or similar)
stripe listen --forward-to https://yourdomain.com/api/stripe/webhook

# Trigger a test event
stripe trigger customer.subscription.created
```

## Step 7: Monitor Webhook Events

### In Stripe Dashboard:

1. Go to **Webhooks** → Your endpoint
2. Click **Logs** tab
3. You'll see:
   - ✅ Green checkmarks for successful deliveries
   - ❌ Red X for failed deliveries
   - Response codes and response times

### In Your Application:

Check your application logs for webhook processing:

- Successful events should log: `Subscription [eventType]: Updated subscription...`
- Failed events will show error messages

## Step 8: Set Up Monitoring & Alerts

### Recommended Monitoring:

1. **Stripe Dashboard Alerts**
   - Go to **Settings** → **Webhooks**
   - Enable email notifications for webhook failures

2. **Application Monitoring**
   - Set up error tracking (Sentry, etc.)
   - Monitor for webhook processing errors
   - Alert on repeated failures

3. **Database Monitoring**
   - Verify subscriptions are updating correctly
   - Check subscription_analytics table for events

## Step 9: Security Checklist

Before going live, verify:

- [ ] Webhook endpoint uses HTTPS
- [ ] `STRIPE_WEBHOOK_SECRET` is set in production environment
- [ ] Webhook secret is NOT in version control
- [ ] Rate limiting is enabled (we bypassed it in dev, but it's active in production)
- [ ] Signature verification is working (test with invalid signature)
- [ ] Error handling is in place
- [ ] Logging is configured for webhook events

## Step 10: Handle Webhook Failures

Stripe will retry failed webhooks:

- **Immediate retry**: After 5 minutes
- **Exponential backoff**: Up to 3 days
- **Maximum attempts**: 19 retries

Your webhook handler should be:

- **Idempotent**: Processing the same event twice should be safe
- **Fast**: Respond within 30 seconds
- **Reliable**: Handle errors gracefully

## Troubleshooting

### Webhook Not Receiving Events

1. **Check endpoint URL**: Is it correct and accessible?
2. **Check HTTPS**: Must be HTTPS, not HTTP
3. **Check firewall**: Ensure Stripe IPs aren't blocked
4. **Check logs**: Look in Stripe Dashboard → Webhooks → Logs

### "Invalid Signature" Errors

1. **Verify secret**: Is `STRIPE_WEBHOOK_SECRET` correct?
2. **Check environment**: Is it set in the right environment?
3. **Redeploy**: Did you redeploy after adding the secret?

### Events Not Updating Database

1. **Check application logs**: Look for error messages
2. **Verify database connection**: Is Supabase accessible?
3. **Check RLS policies**: Do webhook operations have proper permissions?
4. **Test locally**: Use test script to verify handler logic

### Subscription Not Found Errors

This is normal if:

- Testing with events for subscriptions that don't exist in your database
- The subscription was created outside your application

The webhook will log a warning but won't fail.

## Production Checklist

Before going live:

- [ ] Production webhook endpoint created in Stripe
- [ ] Production webhook secret added to environment variables
- [ ] All required events selected
- [ ] Test webhook sent and verified
- [ ] Application logs show successful processing
- [ ] Database records updating correctly
- [ ] Monitoring and alerts configured
- [ ] Error handling tested
- [ ] Documentation updated

## Next Steps

After production setup:

1. **Monitor closely** for the first few days
2. **Review webhook logs** regularly
3. **Set up alerts** for failures
4. **Test payment flows** end-to-end
5. **Document any issues** and resolutions

## Support

If you encounter issues:

1. Check Stripe Dashboard → Webhooks → Logs
2. Check your application logs
3. Review this guide
4. Consult Stripe documentation: https://stripe.com/docs/webhooks

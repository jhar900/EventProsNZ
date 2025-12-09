# Testing Stripe Webhooks

This guide explains how to test the Stripe webhook handler we just implemented.

## Prerequisites

1. **Environment Variables**: Make sure you have a `.env` file with:

   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Dev Server Running**: Start your development server:
   ```bash
   npm run dev
   ```

## Testing Methods

### Method 1: Using the Test Script (Recommended for Local Testing)

We've created a test script that simulates Stripe webhook events:

```bash
# Test a specific event
node scripts/test-webhook.js customer.subscription.created

# Test all events
node scripts/test-webhook.js all
```

**Available test events:**

- `customer.subscription.created`
- `customer.subscription.updated`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `payment_intent.succeeded`

### Method 2: Using Stripe Dashboard (Recommended for Production Testing)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint (or create one pointing to your local URL)
3. Click "Send test webhook"
4. Select an event type (e.g., `customer.subscription.created`)
5. Click "Send test webhook"

**Note**: For local testing, you'll need to use a tool like [ngrok](https://ngrok.com/) to expose your local server to the internet, or use the Stripe CLI.

### Method 3: Using Stripe CLI (Best for Local Development)

If you have Stripe CLI installed:

```bash
# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger a test event
stripe trigger customer.subscription.created
```

The CLI will show you the webhook secret to use in your `.env` file.

### Method 4: Manual Testing with cURL

You can manually send webhook events using cURL. However, you'll need to generate a valid Stripe signature. The test script handles this for you.

## What to Check

When testing, verify:

1. **Webhook Receives Event**: Check server logs for "Received webhook event: [event_type]"
2. **Database Updates**:
   - Subscription status updates correctly
   - Payment records are created/updated
   - Analytics events are logged
3. **Error Handling**: Invalid signatures should return 400
4. **Response**: Webhook should return `{ received: true }` on success

## Common Issues

### Issue: "Missing Stripe signature"

- **Solution**: Make sure you're sending the `stripe-signature` header

### Issue: "Invalid signature"

- **Solution**: Verify your `STRIPE_WEBHOOK_SECRET` matches the one from Stripe Dashboard

### Issue: "Webhook configuration error"

- **Solution**: Make sure `STRIPE_WEBHOOK_SECRET` is set in your `.env` file

### Issue: Subscription not found in database

- **Solution**: This is expected if testing with mock data. The webhook will log a warning but won't fail.

## Next Steps

After testing:

1. Verify all event types work correctly
2. Check database records are updated
3. Test error scenarios (invalid signatures, missing data)
4. Move to production webhook setup when ready

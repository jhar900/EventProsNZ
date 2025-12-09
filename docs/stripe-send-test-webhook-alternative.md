# Alternative Ways to Test Your Stripe Webhook

## Method 1: Stripe Dashboard - Event Deliveries Tab

1. Click the **"Event deliveries"** tab (next to "Overview")
2. Look for a **"Send test webhook"** or **"Test"** button
3. Select an event type and send

## Method 2: Use Stripe CLI

If you have Stripe CLI installed:

```bash
# Trigger a test event
stripe trigger customer.subscription.created

# Or trigger invoice payment
stripe trigger invoice.payment_succeeded
```

## Method 3: Create a Test Subscription

1. Go to Stripe Dashboard → **Customers**
2. Create a test customer
3. Create a test subscription for that customer
4. This will automatically trigger webhook events

## Method 4: Use Stripe API Directly

You can also use the Stripe API to create test events, but the Dashboard method is easiest.

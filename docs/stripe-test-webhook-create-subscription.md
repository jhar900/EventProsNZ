# Testing Webhook by Creating a Test Subscription

## Step-by-Step Guide

### 1. Create a Test Customer

1. Go to Stripe Dashboard → **Customers**
2. Click **"+ Add customer"**
3. Enter:
   - **Email**: `test@example.com`
   - **Name**: `Test Customer`
4. Click **"Add customer"**

### 2. Create a Test Subscription

1. Click on the customer you just created
2. Click **"+ Add subscription"** button
3. Select a product/price (or create a test price)
4. Click **"Add subscription"**
5. This will automatically trigger:
   - `customer.subscription.created` webhook
   - `invoice.payment_succeeded` webhook (if payment succeeds)

### 3. Check Webhook Delivery

1. Go back to **Webhooks** → Your endpoint
2. Click **"Event deliveries"** tab
3. You should now see webhook events listed
4. Click on an event to see:
   - ✅ Green checkmark = Success (200 status)
   - ❌ Red X = Failed
   - Response details

## What Events Will Be Triggered

When you create a subscription, you'll see:

- `customer.subscription.created`
- `invoice.created`
- `invoice.payment_succeeded` (if payment method works)
- `customer.subscription.updated`

## Verify in Vercel

1. Go to Vercel Dashboard → Your project
2. **Deployments** → Latest deployment
3. **Functions** tab
4. Look for `/api/stripe/webhook` logs
5. Should see processing messages

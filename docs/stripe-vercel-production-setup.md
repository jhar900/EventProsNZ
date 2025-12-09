# Stripe Production Setup for Vercel

Step-by-step guide for setting up Stripe webhooks in production on Vercel.

## Overview

Your webhook endpoint will be:

```
https://your-domain.vercel.app/api/stripe/webhook
```

## Step-by-Step Instructions

### Step 1: Get Your Production Domain

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Domains**
4. Note your production domain (e.g., `eventpros-nz.vercel.app` or your custom domain)

**Your webhook URL will be:**

```
https://[your-domain]/api/stripe/webhook
```

### Step 2: Create Webhook Endpoint in Stripe

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com
   - **Important**: Toggle to **Live mode** (top right corner)

2. **Navigate to Webhooks**
   - Click **Developers** in left sidebar
   - Click **Webhooks**

3. **Add New Endpoint**
   - Click **Add endpoint** button
   - Or click **Create an event destination**

4. **Configure Endpoint**
   - **Endpoint URL**: `https://your-domain.vercel.app/api/stripe/webhook`
     - Replace `your-domain.vercel.app` with your actual Vercel domain
   - **Description**: `EventProsNZ Production Webhook`

5. **Select Events** (Click "Continue" after selecting)

   Select these 12 events:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
   - ✅ `customer.created`
   - ✅ `customer.updated`
   - ✅ `payment_method.attached`
   - ✅ `payment_method.detached`

6. **Create Endpoint**
   - Click **Create destination** or **Add endpoint**

### Step 3: Get Your Webhook Signing Secret

1. **After creating the endpoint**, you'll see it in the webhooks list
2. **Click on the endpoint** you just created
3. **Find "Signing secret"** section
4. **Click "Reveal"** button
5. **Copy the secret** - it will look like: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. **Save this securely** - you'll need it in the next step

⚠️ **Important**: Keep this secret secure. Never commit it to Git or share it publicly.

### Step 4: Add Environment Variables to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Settings**
   - Click **Settings** tab
   - Click **Environment Variables** in left sidebar

3. **Add Stripe Production Keys**

   Add these three variables:

   **Variable 1:**
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: `sk_live_...` (your production secret key from Stripe)
   - **Environment**: Select **Production** (and **Preview** if you want)
   - Click **Save**

   **Variable 2:**
   - **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Value**: `pk_live_...` (your production publishable key from Stripe)
   - **Environment**: Select **Production** (and **Preview** if you want)
   - Click **Save**

   **Variable 3:**
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_...` (the webhook secret from Step 3)
   - **Environment**: Select **Production** only (not Preview - each environment needs its own)
   - Click **Save**

#### Option B: Via Vercel CLI

```bash
# Set production Stripe keys
vercel env add STRIPE_SECRET_KEY production
# Paste: sk_live_...

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Paste: pk_live_...

vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_...
```

### Step 5: Redeploy Your Application

After adding environment variables, you must redeploy:

**Via Dashboard:**

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

**Via CLI:**

```bash
vercel --prod
```

### Step 6: Verify Webhook Endpoint is Accessible

Test that your endpoint is reachable:

```bash
curl https://your-domain.vercel.app/api/stripe/webhook
```

You should get a response (even if it's an error about missing signature - that's expected and means the endpoint is working).

### Step 7: Test the Webhook

1. **In Stripe Dashboard**
   - Go to **Webhooks** → Your endpoint
   - Click **Send test webhook** button
   - Select event: `customer.subscription.created`
   - Click **Send test webhook**

2. **Check Results**
   - In Stripe: Look at the **Logs** tab - should show ✅ success
   - In Vercel: Check **Functions** → **Logs** for webhook processing
   - Should see: `Subscription customer.subscription.created: Updated subscription...`

### Step 8: Monitor Webhook Events

#### In Stripe Dashboard:

- **Webhooks** → Your endpoint → **Logs** tab
- Shows all webhook deliveries with status codes

#### In Vercel:

- **Deployments** → Click deployment → **Functions** tab
- Shows serverless function logs including webhook processing

#### Set Up Alerts:

1. **Stripe**: Settings → Webhooks → Enable email notifications
2. **Vercel**: Integrate with monitoring service (Sentry, etc.)

## Verification Checklist

After setup, verify:

- [ ] Webhook endpoint created in Stripe (Live mode)
- [ ] All 12 events selected
- [ ] Webhook secret copied
- [ ] Environment variables added to Vercel (Production)
- [ ] Application redeployed
- [ ] Test webhook sent successfully
- [ ] Webhook logs show successful processing
- [ ] HTTPS is working (required for webhooks)

## Troubleshooting

### "Invalid signature" in logs

- **Cause**: Wrong webhook secret or not set
- **Fix**: Verify `STRIPE_WEBHOOK_SECRET` in Vercel matches Stripe Dashboard

### Webhook not receiving events

- **Cause**: Wrong URL or endpoint not accessible
- **Fix**: Verify URL in Stripe matches your Vercel domain exactly

### Environment variable not working

- **Cause**: Not redeployed after adding variable
- **Fix**: Redeploy the application

### Events not updating database

- **Cause**: Database connection issue or RLS policies
- **Fix**: Check Supabase connection and RLS policies for webhook operations

## Security Notes

✅ **Do:**

- Use production keys in production environment only
- Keep webhook secret secure
- Enable HTTPS (Vercel does this automatically)
- Monitor webhook logs regularly

❌ **Don't:**

- Commit secrets to Git
- Use test keys in production
- Share webhook secrets
- Disable signature verification

## Next Steps

After production setup:

1. **Monitor for 24-48 hours** to ensure stability
2. **Test real payment flows** end-to-end
3. **Set up alerts** for webhook failures
4. **Document any custom configurations**

## Support Resources

- **Stripe Webhook Docs**: https://stripe.com/docs/webhooks
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Stripe Dashboard**: https://dashboard.stripe.com/webhooks

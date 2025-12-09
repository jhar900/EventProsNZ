# How to Get Your Stripe Webhook Secret

## Quick Steps

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/webhooks
   - Make sure you're in **Live mode** (toggle in top right)

2. **Find Your Webhook Endpoint**
   - You should see the endpoint you just created
   - It should show your Vercel URL: `https://your-domain.vercel.app/api/stripe/webhook`

3. **Click on the Endpoint**
   - Click on the endpoint name/URL to open its details

4. **Reveal the Signing Secret**
   - Scroll down to find the **"Signing secret"** section
   - Click the **"Reveal"** button
   - Copy the secret - it starts with `whsec_...`

5. **Save It Securely**
   - You'll need this in the next step
   - Keep it secret - never commit to Git!

## What It Looks Like

The secret will look like:

```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Next Step

Once you have the secret, we'll add it to your Vercel environment variables.

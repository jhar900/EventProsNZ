# Testing Your Production Stripe Webhook

## Quick Test Steps

### Option 1: Use Stripe Dashboard (Easiest)

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/webhooks
   - Make sure you're in **Live mode**

2. **Find Your Webhook Endpoint**
   - Click on the endpoint you created

3. **Send Test Webhook**
   - Click **"Send test webhook"** button
   - Select event type: `customer.subscription.created`
   - Click **"Send test webhook"**

4. **Check Results**
   - Look at the **"Logs"** tab
   - You should see:
     - ✅ Green checkmark = Success
     - Status code: `200`
     - Response time: Usually < 1 second

### Option 2: Check Your Application Logs

1. **In Vercel Dashboard**
   - Go to your project
   - Click **Deployments** tab
   - Click on your latest deployment
   - Click **Functions** tab
   - Look for `/api/stripe/webhook` function logs

2. **What to Look For**
   - Should see: `Subscription customer.subscription.created: Updated subscription...`
   - Or: `Invoice payment succeeded: Activated subscription...`
   - No error messages

## Verification Checklist

After sending a test webhook, verify:

- [ ] Stripe Dashboard shows ✅ success (200 status)
- [ ] Vercel logs show webhook was processed
- [ ] No error messages in logs
- [ ] Response time is reasonable (< 5 seconds)

## Common Issues

### Webhook Returns 400 "Invalid signature"

- **Cause**: Webhook secret mismatch
- **Fix**: Verify `STRIPE_WEBHOOK_SECRET` in Vercel matches Stripe Dashboard exactly

### Webhook Returns 500 Error

- **Cause**: Application error processing webhook
- **Fix**: Check Vercel function logs for specific error message

### Webhook Times Out

- **Cause**: Function taking too long (> 30 seconds)
- **Fix**: Check for slow database queries or external API calls

### No Logs Appearing

- **Cause**: Webhook not reaching your endpoint
- **Fix**: Verify URL in Stripe matches your Vercel domain exactly

## Next Steps After Testing

Once test webhook succeeds:

1. **Test Real Payment Flow**
   - Create a test subscription
   - Verify webhook processes it correctly
   - Check database updates

2. **Monitor for 24-48 Hours**
   - Watch for any failures
   - Set up alerts if needed

3. **Document Any Issues**
   - Note any edge cases
   - Update documentation as needed

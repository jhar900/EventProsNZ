# Stripe API Keys Setup for Vercel Environments

## Recommended Approach: Same Variable Names, Different Values Per Environment

### Best Practice

Use the **same environment variable names** but set **different values** for each environment:

- **Production environment**: Use Live keys (`sk_live_...`, `pk_live_...`)
- **Preview/Development environments**: Use Test keys (`sk_test_...`, `pk_test_...`)

## Step-by-Step Setup

### In Vercel Dashboard

1. **Go to Settings → Environment Variables**

2. **Add STRIPE_SECRET_KEY**
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value for Production**: `sk_live_...` (your live secret key)
   - **Value for Preview**: `sk_test_...` (your test secret key)
   - **Environments**:
     - ✅ Production
     - ✅ Preview
     - ✅ Development (optional)

3. **Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
   - **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Value for Production**: `pk_live_...` (your live publishable key)
   - **Value for Preview**: `pk_test_...` (your test publishable key)
   - **Environments**:
     - ✅ Production
     - ✅ Preview
     - ✅ Development (optional)

4. **Add STRIPE_WEBHOOK_SECRET**
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value for Production**: `whsec_...` (from your **Live mode** webhook)
   - **Value for Preview**: `whsec_...` (from your **Test mode** webhook)
   - **Environments**:
     - ✅ Production (Live webhook secret)
     - ✅ Preview (Test webhook secret)
   - **Note**: You'll need separate webhook endpoints for Test and Live mode

## Why This Approach?

✅ **Same code** works in all environments
✅ **Automatic** - Vercel uses the right keys based on deployment type
✅ **Safe** - Test keys can't accidentally charge real money
✅ **Simple** - No code changes needed

## Environment Mapping

| Vercel Environment | Stripe Mode | API Keys                      | Webhook Secret           |
| ------------------ | ----------- | ----------------------------- | ------------------------ |
| **Production**     | Live        | `sk_live_...` / `pk_live_...` | Live webhook `whsec_...` |
| **Preview**        | Test        | `sk_test_...` / `pk_test_...` | Test webhook `whsec_...` |
| **Development**    | Test        | `sk_test_...` / `pk_test_...` | Test webhook `whsec_...` |

## Important Notes

1. **Separate Webhook Endpoints**: You need to create webhook endpoints in both Test and Live mode in Stripe
   - Test mode webhook: Points to your preview/staging URL
   - Live mode webhook: Points to your production URL

2. **Webhook Secrets Are Different**: Each webhook endpoint has its own secret
   - Test webhook → Test secret → Use in Preview/Development
   - Live webhook → Live secret → Use in Production

3. **Never Mix**:
   - ❌ Don't use live keys in preview environments
   - ❌ Don't use test keys in production
   - ✅ Always match the mode

## Setup Checklist

- [ ] Test mode webhook created in Stripe (for Preview/Development)
- [ ] Live mode webhook created in Stripe (for Production)
- [ ] Test API keys added to Preview environment
- [ ] Live API keys added to Production environment
- [ ] Test webhook secret added to Preview environment
- [ ] Live webhook secret added to Production environment
- [ ] Verified each environment uses correct keys

## Alternative: Separate Variable Names (Not Recommended)

If you really want separate variable names (not recommended):

```bash
# Production
STRIPE_SECRET_KEY_LIVE=sk_live_...
STRIPE_SECRET_KEY_TEST=sk_test_...

# Then in code, you'd need to check environment:
const key = process.env.NODE_ENV === 'production'
  ? process.env.STRIPE_SECRET_KEY_LIVE
  : process.env.STRIPE_SECRET_KEY_TEST;
```

This requires code changes and is more error-prone. The first approach is better.

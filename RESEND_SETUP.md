# Resend Email Setup - Quick Guide

## Step 1: Get Your Resend API Key

1. Go to [resend.com](https://resend.com) and sign up (it's free!)
2. Once logged in, go to **API Keys** in the dashboard
3. Click **Create API Key**
4. Give it a name (e.g., "EventProsNZ Development")
5. Copy the API key (starts with `re_`)

## Step 2: Set Up Your Environment Variables

Create or edit `.env.local` in your project root:

```env
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Note:**

- For testing, you can use `onboarding@resend.dev` (Resend's test domain)
- For production, you'll need to verify your own domain in Resend dashboard

## Step 3: Test It

1. Restart your dev server:

   ```bash
   npm run dev
   ```

2. Submit a feature request on your site

3. Check:
   - Terminal should show: "Feature request notification email sent successfully"
   - Email should arrive at `jasonhartnz@gmail.com`

## Troubleshooting

### "No email provider configured"

- Make sure `.env.local` exists and has `RESEND_API_KEY`
- Restart your dev server after adding env vars

### "Unauthorized" error

- Check your API key is correct (starts with `re_`)
- Make sure there are no extra spaces in the env file

### Emails not arriving

- Check spam folder
- Verify the "to" email address is correct
- Check Resend dashboard for delivery status
- Look at terminal logs for error messages

## Free Tier Limits

- **3,000 emails per month**
- **100 emails per day**
- Perfect for development and early stage!

## Next Steps (Production)

When you're ready for production:

1. Verify your domain in Resend dashboard
2. Update `RESEND_FROM_EMAIL` to use your verified domain
3. That's it! Same API key works for production



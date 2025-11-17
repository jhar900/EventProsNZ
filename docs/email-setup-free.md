# Free Email Setup Guide

This guide explains how to set up email sending for EventProsNZ using free email services.

## Quick Start - Choose Your Provider

### Option 1: Resend (Recommended) ⭐

**Free Tier:** 3,000 emails/month, 100 emails/day

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Verify your domain (or use their test domain)
4. Install package:
   ```bash
   npm install resend
   ```
5. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

**Pros:**

- Modern, developer-friendly API
- Great deliverability
- Simple setup
- Good free tier

**Cons:**

- Requires domain verification for production

---

### Option 2: Brevo (formerly Sendinblue)

**Free Tier:** 300 emails/day

1. Sign up at [brevo.com](https://www.brevo.com)
2. Get your API key from Settings > API Keys
3. Install package:
   ```bash
   npm install @getbrevo/brevo
   ```
4. Add to `.env.local`:
   ```
   BREVO_API_KEY=your_brevo_api_key
   BREVO_FROM_EMAIL=noreply@yourdomain.com
   ```

**Pros:**

- Good free tier (300/day = ~9,000/month)
- Reliable service
- Good for transactional emails

**Cons:**

- More complex API
- Requires domain verification

---

### Option 3: SMTP (Gmail/Outlook)

**Free Tier:** Unlimited (with rate limits)

#### Gmail Setup:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Install package:
   ```bash
   npm install nodemailer
   ```
4. Add to `.env.local`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   ```

#### Outlook Setup:

1. Enable 2-factor authentication
2. Generate an App Password from Microsoft Account
3. Add to `.env.local`:
   ```
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@outlook.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM_EMAIL=your-email@outlook.com
   ```

**Pros:**

- Completely free
- No signup required (if you have Gmail/Outlook)
- Works immediately

**Cons:**

- Gmail: 500 emails/day limit
- Outlook: 300 emails/day limit
- Lower deliverability than dedicated services
- Requires app password setup
- Not ideal for production

---

### Option 4: Amazon SES

**Free Tier:** 62,000 emails/month (if on EC2), then $0.10 per 1,000

1. Sign up for AWS account
2. Verify your domain/email in SES
3. Get SMTP credentials
4. Use SMTP configuration (see Option 3)

**Pros:**

- Very cheap after free tier
- Excellent deliverability
- Scalable

**Cons:**

- Requires AWS account
- More complex setup
- Need to verify domain/email first

---

## How It Works

The `SimpleEmailService` automatically tries providers in this order:

1. Resend (if `RESEND_API_KEY` is set)
2. Brevo (if `BREVO_API_KEY` is set)
3. SMTP (if `SMTP_HOST` is set)
4. Falls back to console logging in development

You only need to configure **one** provider.

## Testing

After setting up, test by submitting a feature request. Check:

1. Terminal logs for "Feature request notification email sent successfully"
2. Your inbox at `jasonhartnz@gmail.com`

## Troubleshooting

### "No email provider configured"

- Make sure you've set the environment variables in `.env.local`
- Restart your dev server after adding env vars

### "Unauthorized" or authentication errors

- Check your API key is correct
- For SMTP: Make sure you're using an App Password, not your regular password
- Verify your domain/email is verified with the provider

### Emails not arriving

- Check spam folder
- Verify sender email is correct
- Check provider's dashboard for delivery status
- Look for error messages in terminal logs

## Recommendation

For EventProsNZ, I recommend **Resend** because:

- Best free tier (3,000/month is plenty for early stage)
- Easiest to set up
- Great developer experience
- Good deliverability

Once you monetize and need more volume, you can easily switch to SendGrid or another paid service.


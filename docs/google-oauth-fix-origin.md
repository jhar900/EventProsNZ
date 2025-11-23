# Quick Fix: "The given origin is not allowed" Error

## The Problem

You're seeing this error:

```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

This means Google doesn't recognize your current origin as authorized.

## Quick Fix Steps

### Step 1: Check Your Current Origin

Open your browser's Developer Console (F12) and check the URL. It should be:

- `http://localhost:3000` ✅
- NOT `http://127.0.0.1:3000` ❌
- NOT `https://localhost:3000` ❌

### Step 2: Add Origin to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID (the one starting with `158394098662-...`)
4. Scroll down to **"Authorized JavaScript origins"**
5. Click **"+ ADD URI"**
6. Add exactly: `http://localhost:3000`
   - ✅ Use `http://` (not `https://`)
   - ✅ Use `localhost` (not `127.0.0.1`)
   - ✅ No trailing slash
   - ✅ Include the port `:3000`
7. Click **"SAVE"**

### Step 3: Wait and Clear Cache

- Wait 1-2 minutes for Google's changes to propagate
- Clear your browser cache or use an incognito/private window
- Restart your dev server if it's running

### Step 4: Test Again

Try the Google sign-in button again. The error should be resolved.

## Common Mistakes

❌ **Wrong:**

- `http://127.0.0.1:3000`
- `https://localhost:3000`
- `http://localhost:3000/`
- `localhost:3000` (missing protocol)

✅ **Correct:**

- `http://localhost:3000`

## If It Still Doesn't Work

1. **Double-check the Client ID:**
   - Your Client ID: `158394098662-ukve3ksgke1uc8dv6e0omel8jou3rgrj.apps.googleusercontent.com`
   - Make sure this matches in your `.env.local` file
   - No quotes, no spaces

2. **Check OAuth Consent Screen:**
   - Go to **APIs & Services** > **OAuth consent screen**
   - Make sure it's configured
   - If in "Testing" mode, add your email as a test user

3. **Check Browser Console:**
   - Look for the exact origin being used
   - It should match exactly what you added in Google Cloud Console



# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for Event Pros NZ.

## Prerequisites

- A Google Cloud Platform (GCP) account
- Access to your Supabase project dashboard

## Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select or create a project

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google Identity Services API" if available

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - User Type: External (unless you have a Google Workspace)
     - App name: Event Pros NZ
     - User support email: your-email@example.com
     - Developer contact: your-email@example.com
     - Add scopes: `email`, `profile`, `openid`
     - Add test users (if in testing mode)

4. **Configure OAuth Client**
   - Application type: **Web application**
   - Name: Event Pros NZ Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
     - Note: For Google Identity Services (ID token flow), redirect URIs may not be required, but include them for compatibility

5. **Copy Client ID**
   - After creating, copy the **Client ID** (not the Client Secret)
   - It will look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

## Step 2: Configure Environment Variables

1. **Add to your `.env.local` file:**

   ```bash
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

2. **For production (Vercel/other platforms):**
   - Add the same environment variable in your deployment platform's settings
   - Make sure to use your production domain's authorized origins

## Step 3: Configure Supabase (Optional but Recommended)

If you want to use Supabase's built-in OAuth (alternative approach):

1. **Go to Supabase Dashboard**
   - Navigate to Authentication > Providers
   - Find "Google" and enable it

2. **Add OAuth Credentials**
   - Client ID: Your Google OAuth Client ID
   - Client Secret: Your Google OAuth Client Secret (from Google Cloud Console)
   - Authorized redirect URLs: Supabase will provide these

3. **Note:** The current implementation uses Google Identity Services directly, so Supabase OAuth configuration is optional. However, configuring it provides a backup authentication method.

## Step 4: Test the Integration

1. **Start your development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to the login/register page**
   - Click "Continue with Google"
   - You should see the Google sign-in popup
   - After signing in, you should be redirected back and logged in

3. **Check for errors:**
   - Open browser console (F12)
   - Look for any authentication errors
   - Check network tab for API call failures

## Troubleshooting

### CORS Errors / FedCM Errors / "ERR_FAILED"

**Common Error Messages:**

- `The fetch of the id assertion endpoint resulted in a network error: ERR_FAILED`
- `Server did not send the correct CORS headers`
- `[GSI_LOGGER]: FedCM get() rejects with IdentityCredentialError`

**Solutions:**

1. **Verify Google Cloud Console Configuration:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
   - Click on your OAuth 2.0 Client ID
   - **Authorized JavaScript origins** MUST include:
     - `http://localhost:3000` (for development) - **NO trailing slash**
     - `https://your-production-domain.com` (for production) - **NO trailing slash**
   - **Important:** Use `http://localhost:3000` NOT `http://127.0.0.1:3000`
   - **Important:** Don't include paths or trailing slashes

2. **Check OAuth Consent Screen:**
   - Go to APIs & Services > OAuth consent screen
   - Ensure it's published (not in "Testing" mode) OR add your email as a test user
   - Verify all required fields are filled (App name, Support email, Developer contact)

3. **Verify Client ID:**
   - Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` matches exactly (no spaces, no quotes)
   - The format should be: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - Copy directly from Google Cloud Console (don't type it manually)
   - Restart your dev server after changing environment variables

4. **Clear Browser Cache:**
   - Clear cookies and cache for your domain
   - Try in an incognito/private window
   - The error might be cached

5. **Check Browser Console:**
   - Open DevTools (F12) > Console tab
   - Look for specific error messages
   - Check Network tab for failed requests to `accounts.google.com`

6. **The code now disables FedCM:**
   - The implementation sets `use_fedcm_for_prompt: false` to avoid FedCM issues
   - This should resolve most CORS-related problems

### "Google Identity Services not loaded"

- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
- Verify the Google Identity Services script is loading (check Network tab)
- Ensure your domain is in the authorized JavaScript origins
- Check browser console for script loading errors

### "Invalid client ID"

- Verify the Client ID is correct (no extra spaces, no quotes)
- Ensure the Client ID matches the one in Google Cloud Console
- Check that the domain matches your authorized origins
- Restart your dev server after changing environment variables

### "Redirect URI mismatch"

- Verify your current URL matches the authorized redirect URIs
- For localhost, ensure you're using `http://localhost:3000` (not `http://127.0.0.1:3000`)
- Don't include paths in authorized origins (just the domain)

### "OAuth consent screen not configured"

- Complete the OAuth consent screen setup in Google Cloud Console
- Add test users if your app is in testing mode
- Ensure the consent screen is published or you're added as a test user

### API returns 401/403

- Check that Supabase is configured correctly
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase logs for authentication errors
- Verify the ID token is being sent correctly (check Network tab)

## Security Best Practices

1. **Never commit Client IDs or Secrets to version control**
   - Use environment variables
   - Add `.env.local` to `.gitignore`

2. **Use different OAuth clients for development and production**
   - Create separate OAuth credentials for each environment
   - This allows different redirect URIs and better security isolation

3. **Restrict authorized origins**
   - Only add domains you actually use
   - Remove test/development domains from production credentials

4. **Regularly rotate credentials**
   - Update OAuth credentials periodically
   - Revoke old credentials when no longer needed

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

## Implementation Details

The current implementation uses:

- **Google Identity Services (GIS)** for client-side authentication
- **ID Token flow** (not authorization code flow)
- **Supabase `signInWithIdToken`** for backend verification
- **Custom API route** (`/api/auth/google`) for user profile creation

This approach provides:

- ✅ No redirect required (popup-based)
- ✅ Works with existing Supabase backend
- ✅ Secure token verification
- ✅ Automatic user profile creation

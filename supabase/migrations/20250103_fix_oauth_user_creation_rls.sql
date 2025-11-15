-- Fix RLS policy for OAuth user creation
-- This allows users to be created during OAuth signup

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create a policy that allows inserts when the user exists in auth.users
-- This is needed for OAuth signup where the user is created in auth.users first
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (
    -- Allow if the authenticated user is inserting their own record
    auth.uid() = id OR
    -- Allow if the user exists in auth.users (for OAuth flow)
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = users.id
    )
  );

-- Create a database function to create user profile that bypasses RLS
-- This is a fallback if RLS policies still cause issues
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_role TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, is_verified, last_login)
  VALUES (user_id, user_email, user_role::user_role, true, NOW())
  ON CONFLICT (id) DO NOTHING;
END;
$$;


-- ============================================
-- Fix: Infinite recursion in admin RLS policies
-- The admin policies query profiles table from within profiles policy
-- Fix: Use a SECURITY DEFINER function to bypass RLS when checking admin
-- ============================================

-- 1. Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop the broken policies
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all requests" ON public.activation_requests;
DROP POLICY IF EXISTS "Admins update all requests" ON public.activation_requests;

-- 3. Recreate with the helper function
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins read all requests"
  ON public.activation_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins update all requests"
  ON public.activation_requests FOR UPDATE
  USING (public.is_admin());

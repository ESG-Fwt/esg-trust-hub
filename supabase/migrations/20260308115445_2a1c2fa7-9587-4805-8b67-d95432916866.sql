-- Allow managers to view ALL profiles (not just same org) for user management
DROP POLICY IF EXISTS "Managers can view org profiles" ON public.profiles;
CREATE POLICY "Managers can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role));

-- Allow managers to update any profile's organization_id
DROP POLICY IF EXISTS "Managers can update user profiles" ON public.profiles;
CREATE POLICY "Managers can update user profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role));

-- Allow managers to view all organizations
DROP POLICY IF EXISTS "Managers can view all organizations" ON public.organizations;
CREATE POLICY "Managers can view all organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role));

-- Allow managers to create organizations
DROP POLICY IF EXISTS "Managers can create organizations" ON public.organizations;
CREATE POLICY "Managers can create organizations"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- Allow managers to view all user roles
DROP POLICY IF EXISTS "Managers can view all user roles" ON public.user_roles;
CREATE POLICY "Managers can view all user roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role));
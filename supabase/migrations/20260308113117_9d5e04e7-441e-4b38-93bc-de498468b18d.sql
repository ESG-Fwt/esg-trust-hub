
-- Fix 1: Change all policies to PERMISSIVE (default) by dropping and recreating them

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view org profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Suppliers can view own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Managers can view org submissions" ON public.submissions;
DROP POLICY IF EXISTS "Suppliers can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Managers can update submission status" ON public.submissions;
DROP POLICY IF EXISTS "Users can view own submission audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Managers can view org audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Recreate as PERMISSIVE (explicit)

-- Organizations
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT TO authenticated
  USING (id = public.get_user_org_id(auth.uid()));

-- Profiles: view own
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Profiles: managers view org profiles
CREATE POLICY "Managers can view org profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager')
    AND organization_id = public.get_user_org_id(auth.uid())
  );

-- Profiles: insert own (organization_id must be NULL on insert — assigned by admin/invite)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND organization_id IS NULL);

-- Profiles: update own (cannot change organization_id)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND organization_id = public.get_user_org_id(auth.uid()));

-- User roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Submissions: supplier sees own
CREATE POLICY "Suppliers can view own submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Submissions: managers see org
CREATE POLICY "Managers can view org submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager')
    AND organization_id = public.get_user_org_id(auth.uid())
  );

-- Submissions: suppliers create
CREATE POLICY "Suppliers can create submissions"
  ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = public.get_user_org_id(auth.uid())
  );

-- Submissions: managers update status
CREATE POLICY "Managers can update submission status"
  ON public.submissions FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager')
    AND organization_id = public.get_user_org_id(auth.uid())
  );

-- Audit logs: submission owner
CREATE POLICY "Users can view own submission audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

-- Audit logs: org managers
CREATE POLICY "Managers can view org audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = submission_id
        AND s.organization_id = public.get_user_org_id(auth.uid())
        AND public.has_role(auth.uid(), 'manager')
    )
  );

-- Audit logs: authenticated users can insert
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

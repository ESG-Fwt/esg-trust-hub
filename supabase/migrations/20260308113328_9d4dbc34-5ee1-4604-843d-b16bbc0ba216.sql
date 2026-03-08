
-- Make organization_id nullable on submissions
ALTER TABLE public.submissions ALTER COLUMN organization_id DROP NOT NULL;

-- Drop and recreate affected policies to work without org requirement

DROP POLICY IF EXISTS "Suppliers can create submissions" ON public.submissions;
CREATE POLICY "Suppliers can create submissions"
  ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Managers can view org submissions" ON public.submissions;
CREATE POLICY "Managers can view all submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Managers can update submission status" ON public.submissions;
CREATE POLICY "Managers can update submission status"
  ON public.submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));

-- Fix audit logs insert to not require org check
DROP POLICY IF EXISTS "Users can insert audit logs for their submissions" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs for their submissions"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (
    performed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = submission_id
      AND (s.user_id = auth.uid() OR public.has_role(auth.uid(), 'manager'))
    )
  );

-- Managers can view all audit logs
DROP POLICY IF EXISTS "Managers can view org audit logs" ON public.audit_logs;
CREATE POLICY "Managers can view all audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));

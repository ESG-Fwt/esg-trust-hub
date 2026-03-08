
-- Fix audit logs insert policy to be scoped
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

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

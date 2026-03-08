
-- Submission deadlines: managers set due dates per organization
CREATE TABLE public.submission_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  period_label text NOT NULL,
  due_date date NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.submission_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can manage deadlines"
  ON public.submission_deadlines
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Suppliers can view own org deadlines"
  ON public.submission_deadlines
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

-- Compliance alerts table
CREATE TABLE public.compliance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  deadline_id uuid REFERENCES public.submission_deadlines(id) ON DELETE CASCADE,
  alert_type text NOT NULL DEFAULT 'missed_deadline',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can manage alerts"
  ON public.compliance_alerts
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

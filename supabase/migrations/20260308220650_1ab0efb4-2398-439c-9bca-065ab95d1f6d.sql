
-- 1. VSME Social & Governance questionnaire responses
CREATE TABLE public.vsme_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  -- Social (S)
  total_employees integer NOT NULL DEFAULT 0,
  female_employees integer NOT NULL DEFAULT 0,
  male_employees integer NOT NULL DEFAULT 0,
  gender_pay_gap_percent numeric DEFAULT NULL,
  employee_turnover_percent numeric DEFAULT NULL,
  health_safety_incidents integer NOT NULL DEFAULT 0,
  -- Governance (G)
  has_code_of_conduct boolean NOT NULL DEFAULT false,
  has_anti_corruption_policy boolean NOT NULL DEFAULT false,
  has_whistleblower_channel boolean NOT NULL DEFAULT false,
  has_sustainability_officer boolean NOT NULL DEFAULT false,
  board_esg_oversight boolean NOT NULL DEFAULT false,
  governance_notes text DEFAULT '',
  -- Meta
  reporting_year integer NOT NULL DEFAULT 2025,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vsme_questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view own questionnaires" ON public.vsme_questionnaires
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Suppliers can insert own questionnaires" ON public.vsme_questionnaires
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Suppliers can update own questionnaires" ON public.vsme_questionnaires
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Managers can view all questionnaires" ON public.vsme_questionnaires
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'));

-- 2. ESG Share tokens for SME Data Passport
CREATE TABLE public.esg_share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  label text NOT NULL DEFAULT 'Shared Profile',
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.esg_share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can manage own share tokens" ON public.esg_share_tokens
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can view all share tokens" ON public.esg_share_tokens
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'));

-- 3. Webhook endpoints for ERP integrations
CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  created_by uuid NOT NULL,
  label text NOT NULL DEFAULT 'ERP Webhook',
  url text NOT NULL,
  secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events text[] NOT NULL DEFAULT ARRAY['submission.approved'],
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  last_status_code integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can manage webhooks" ON public.webhook_endpoints
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'manager')) WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- 4. Webhook delivery logs
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status_code integer,
  response_body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view webhook logs" ON public.webhook_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can insert webhook logs" ON public.webhook_logs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'manager'));

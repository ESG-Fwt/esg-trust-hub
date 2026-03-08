
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('supplier', 'manager');

-- 2. Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. Create profiles table (minimal: name + company)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create user_roles table (separate from profiles!)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Create submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  electricity NUMERIC(12,2) NOT NULL DEFAULT 0,
  gas NUMERIC(12,2) NOT NULL DEFAULT 0,
  fuel NUMERIC(12,2) NOT NULL DEFAULT 0,
  waste NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_emissions NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  file_url TEXT,
  audit_hash TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 6. Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  hash TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 7. Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false);

-- 8. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 9. Function to get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = _user_id
$$;

-- 10. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  -- Default role: supplier
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'supplier');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Generate audit hash function
CREATE OR REPLACE FUNCTION public.generate_audit_hash()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'SHA-256: ' || encode(gen_random_bytes(32), 'hex')
$$;

-- ============= RLS POLICIES =============

-- Organizations: members can see their own org
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  USING (id = public.get_user_org_id(auth.uid()));

-- Profiles: users see own profile; managers see profiles in same org
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view org profiles"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'manager')
    AND organization_id = public.get_user_org_id(auth.uid())
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User roles: users can read their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Submissions: suppliers see own; managers see org submissions
CREATE POLICY "Suppliers can view own submissions"
  ON public.submissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view org submissions"
  ON public.submissions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'manager')
    AND organization_id = public.get_user_org_id(auth.uid())
  );

CREATE POLICY "Suppliers can create submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = public.get_user_org_id(auth.uid())
  );

CREATE POLICY "Managers can update submission status"
  ON public.submissions FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'manager')
    AND organization_id = public.get_user_org_id(auth.uid())
  );

-- Audit logs: readable by submission owner and org managers
CREATE POLICY "Users can view own submission audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view org audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = submission_id
        AND s.organization_id = public.get_user_org_id(auth.uid())
        AND public.has_role(auth.uid(), 'manager')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Storage policies for submissions bucket
CREATE POLICY "Users can upload to submissions bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'submissions' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Managers can view org uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'submissions' AND public.has_role(auth.uid(), 'manager'));

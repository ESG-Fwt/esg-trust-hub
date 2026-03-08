
-- Create emission_factors table
CREATE TABLE public.emission_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  unit text NOT NULL,
  co2_multiplier numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read factors (public reference data)
CREATE POLICY "Authenticated users can view emission factors"
  ON public.emission_factors FOR SELECT TO authenticated
  USING (true);

-- Only managers can manage factors
CREATE POLICY "Managers can manage emission factors"
  ON public.emission_factors FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- Seed default Italian emission factors
INSERT INTO public.emission_factors (source, label, unit, co2_multiplier) VALUES
  ('electricity', 'Electricity (Italy grid)', 'kWh', 0.5),
  ('gas', 'Natural Gas', 'm³', 2.0),
  ('fuel', 'Fuel / Diesel', 'L', 2.5),
  ('waste', 'Waste', 'kg', 0.3),
  ('water', 'Water', 'm³', 0.1);

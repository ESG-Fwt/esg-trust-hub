
-- Add source reference and year columns
ALTER TABLE public.emission_factors ADD COLUMN source_reference text NOT NULL DEFAULT '';
ALTER TABLE public.emission_factors ADD COLUMN reference_year integer NOT NULL DEFAULT 2023;

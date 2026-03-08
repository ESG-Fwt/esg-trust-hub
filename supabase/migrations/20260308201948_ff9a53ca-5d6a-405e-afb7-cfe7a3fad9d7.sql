
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS water numeric NOT NULL DEFAULT 0;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS period_start date NULL;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS period_end date NULL;

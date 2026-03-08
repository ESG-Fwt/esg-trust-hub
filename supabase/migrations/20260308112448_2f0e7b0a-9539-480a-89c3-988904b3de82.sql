
-- Fix search_path on generate_audit_hash function using pgcrypto
CREATE OR REPLACE FUNCTION public.generate_audit_hash()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'SHA-256: ' || encode(extensions.gen_random_bytes(32), 'hex');
END;
$$;

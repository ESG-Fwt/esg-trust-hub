
-- Remove the dangerous self-update policy
DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;

-- Update the trigger to read role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- Read role from signup metadata, default to supplier
  _role := COALESCE(
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'manager' THEN 'manager'::public.app_role ELSE NULL END,
    'supplier'::public.app_role
  );
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

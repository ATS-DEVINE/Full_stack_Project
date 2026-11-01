
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'buyer');
  
  INSERT INTO public.profiles (id, full_name, business_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'business_name');
  
  -- Always assign buyer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer');
  
  -- If seller, also assign seller role
  IF _role = 'seller' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'seller');
    
    INSERT INTO public.sellers (user_id, business_name, status)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Store'), 'pending');
  END IF;
  
  RETURN NEW;
END;
$function$;

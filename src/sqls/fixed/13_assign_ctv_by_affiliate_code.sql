-- Assign a CTV (child) to a parent user by parent's affiliate_code
-- Sets profiles.referrer_id = parent_profile.id

DROP FUNCTION IF EXISTS public.assign_ctv_by_affiliate_code(uuid, varchar);

CREATE OR REPLACE FUNCTION public.assign_ctv_by_affiliate_code(
  child_profile_id uuid,
  target_affiliate_code varchar
)
RETURNS TABLE (
  updated_child_id uuid,
  new_referrer_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role varchar(20);
  parent_profile_id uuid;
BEGIN
  -- Ensure caller is authenticated and get role
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Resolve parent by affiliate_code
  SELECT id INTO parent_profile_id
  FROM public.profiles
  WHERE affiliate_code = target_affiliate_code
  LIMIT 1;

  IF parent_profile_id IS NULL THEN
    RAISE EXCEPTION 'Invalid affiliate_code';
  END IF;

  -- Prevent self-assign
  IF parent_profile_id = child_profile_id THEN
    RAISE EXCEPTION 'Cannot assign user to themselves';
  END IF;

  -- Update child's referrer_id
  UPDATE public.profiles
  SET referrer_id = parent_profile_id
  WHERE id = child_profile_id;

  RETURN QUERY
  SELECT child_profile_id, parent_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_ctv_by_affiliate_code(uuid, varchar) TO authenticated;



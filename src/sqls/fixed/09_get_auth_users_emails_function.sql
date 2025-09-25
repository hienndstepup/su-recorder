-- Drop đúng function theo chữ ký tham số
DROP FUNCTION IF EXISTS public.get_auth_users_emails(uuid);
DROP FUNCTION IF EXISTS public.get_auth_users_emails();

-- Tạo lại function chỉ lấy email CTV cấp dưới (referrer_id = current user)
CREATE OR REPLACE FUNCTION public.get_auth_users_emails(current_user_id uuid DEFAULT NULL)
RETURNS TABLE(id uuid, email character varying)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile_id uuid;
BEGIN
  -- Ưu tiên tham số truyền vào; nếu không có thì lấy auth.uid()
  IF current_user_id IS NOT NULL THEN
    user_profile_id := current_user_id;
  ELSE
    user_profile_id := auth.uid();
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email
  FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  WHERE au.email IS NOT NULL
    AND p.role = 'ctv'
    AND p.referrer_id = user_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_users_emails(uuid) TO authenticated;
-- Drop đúng function theo chữ ký tham số
DROP FUNCTION IF EXISTS public.get_auth_users_emails(uuid);
DROP FUNCTION IF EXISTS public.get_auth_users_emails();

-- Tạo lại function: admin lấy tất cả email, CTV lấy email cấp dưới
CREATE OR REPLACE FUNCTION public.get_auth_users_emails(current_user_id uuid DEFAULT NULL)
RETURNS TABLE(id uuid, email character varying)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile_id uuid;
  current_user_role VARCHAR(20);
BEGIN
  -- Ưu tiên tham số truyền vào; nếu không có thì lấy auth.uid()
  IF current_user_id IS NOT NULL THEN
    user_profile_id := current_user_id;
  ELSE
    user_profile_id := auth.uid();
  END IF;

  -- Lấy role của user hiện tại
  SELECT p.role INTO current_user_role
  FROM public.profiles p
  WHERE p.id = user_profile_id;

  RETURN QUERY
  SELECT 
    au.id,
    au.email
  FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  WHERE au.email IS NOT NULL
    AND (
      -- Admin: lấy tất cả email của tất cả users
      current_user_role = 'admin'
      OR
      -- CTV: chỉ lấy email của cấp dưới
      (current_user_role = 'ctv' AND p.role = 'ctv' AND p.referrer_id = user_profile_id)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_users_emails(uuid) TO authenticated;
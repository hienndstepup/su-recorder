-- Export user data for September 2024
-- This query exports user information with recordings data for September only
-- Payment calculation: 1 second = 100 VND

SELECT 
    p.id,
    u.email,
    p.full_name,
    p.phone,
    p.id_number,
    p.bank_account_number,
    p.bank_name,
    p.bank_account_name,
    COALESCE(sept_stats.total_recordings, 0) as total_recordings,
    COALESCE(sept_stats.total_duration, 0) as total_duration,
    COALESCE(sept_stats.total_duration * 100, 0) as total_amount,
    p.referrer_id,
    up.email as email_parent
FROM 
    public.profiles p
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) as total_recordings,
            SUM(COALESCE(audio_duration, 0))::integer as total_duration
        FROM 
            public.recordings
        WHERE 
            created_at >= make_date(EXTRACT(year FROM now())::int, 9, 1)::timestamp
            AND created_at < (make_date(EXTRACT(year FROM now())::int, 9, 1)::timestamp + interval '1 month')
        GROUP BY 
            user_id
    ) sept_stats ON sept_stats.user_id = p.id
LEFT JOIN auth.users u ON u.id = p.id
LEFT JOIN auth.users up ON up.id = p.referrer_id
WHERE 
    p.role = 'ctv'  -- Only export CTV users
    AND p.status = 'active'  -- Only active users
ORDER BY 
    p.full_name ASC;

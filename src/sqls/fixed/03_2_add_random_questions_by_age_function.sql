-- Function to get random questions based on age
CREATE OR REPLACE FUNCTION select_random_questions_by_age(row_count integer, user_age integer)
RETURNS TABLE (
    id uuid,
    text text,
    type varchar(50),
    audio_url text,
    hint text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF user_age <= 7 THEN
        -- For age <= 7, only return VI_TRA_LOI questions
        RETURN QUERY
        SELECT q.id, q.text, q.type, q.audio_url, q.hint
        FROM questions q
        WHERE q.is_active = true
        AND q.type = 'VI_TRA_LOI'
        ORDER BY RANDOM()
        LIMIT row_count;
    ELSE
        -- For age > 7, return all types of questions
        RETURN QUERY
        SELECT q.id, q.text, q.type, q.audio_url, q.hint
        FROM questions q
        WHERE q.is_active = true
        ORDER BY RANDOM()
        LIMIT row_count;
    END IF;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION select_random_questions_by_age(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION select_random_questions_by_age(integer, integer) TO anon;

COMMENT ON FUNCTION select_random_questions_by_age(integer, integer) IS 'Get random questions based on age - only VI_TRA_LOI for age <= 7';

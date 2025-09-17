-- Function to get random questions
CREATE OR REPLACE FUNCTION select_random_questions(row_count integer)
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
    RETURN QUERY
    SELECT q.id, q.text, q.type, q.audio_url, q.hint
    FROM questions q
    WHERE q.is_active = true
    ORDER BY RANDOM()
    LIMIT row_count;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION select_random_questions(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION select_random_questions(integer) TO anon;

COMMENT ON FUNCTION select_random_questions(integer) IS 'Get random questions with limit';
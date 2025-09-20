-- Drop existing function first
DROP FUNCTION IF EXISTS search_questions(text,text,integer,integer);

-- Create a function to search questions with pagination and filters
CREATE OR REPLACE FUNCTION search_questions(
  search_keyword TEXT DEFAULT NULL,
  question_type TEXT DEFAULT NULL,
  page_number INTEGER DEFAULT 1,
  items_per_page INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  text TEXT,
  type VARCHAR(50),
  hint TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  offset_value INTEGER;
BEGIN
  offset_value := (page_number - 1) * items_per_page;
  
  RETURN QUERY
  WITH filtered_questions AS (
    SELECT q.*
    FROM questions q
    WHERE 
      -- Apply type filter if provided
      (question_type IS NULL OR q.type = question_type)
      -- Apply search filter if provided
      AND (
        search_keyword IS NULL 
        OR q.text ILIKE '%' || search_keyword || '%'
        OR q.hint ILIKE '%' || search_keyword || '%'
      )
  )
  SELECT 
    fq.id,
    fq.text,
    fq.type,
    fq.hint,
    fq.audio_url,
    fq.created_at,
    fq.updated_at,
    COUNT(*) OVER() AS total_count
  FROM filtered_questions fq
  ORDER BY created_at DESC
  LIMIT items_per_page
  OFFSET offset_value;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_questions TO authenticated;
GRANT EXECUTE ON FUNCTION search_questions TO anon;

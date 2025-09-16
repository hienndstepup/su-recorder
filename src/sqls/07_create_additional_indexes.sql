-- Tạo thêm các indexes để tối ưu hiệu suất truy vấn
-- Các indexes này bổ sung cho những indexes đã tạo trong các file trước

-- ==============================================
-- REGIONS TABLE ADDITIONAL INDEXES
-- ==============================================

-- Index cho full-text search trên name và description
CREATE INDEX IF NOT EXISTS idx_regions_name_gin ON regions USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_regions_description_gin ON regions USING gin(to_tsvector('english', description));

-- ==============================================
-- PROVINCES TABLE ADDITIONAL INDEXES
-- ==============================================

-- Index cho full-text search trên name
CREATE INDEX IF NOT EXISTS idx_provinces_name_gin ON provinces USING gin(to_tsvector('english', name));

-- Index cho tìm kiếm theo code
CREATE INDEX IF NOT EXISTS idx_provinces_code_lower ON provinces(LOWER(code));

-- Composite index cho query theo region và active
CREATE INDEX IF NOT EXISTS idx_provinces_region_active ON provinces(region_id, is_active);

-- ==============================================
-- QUESTIONS TABLE ADDITIONAL INDEXES
-- ==============================================

-- Index cho full-text search trên text
CREATE INDEX IF NOT EXISTS idx_questions_text_gin ON questions USING gin(to_tsvector('english', text));

-- Index cho tìm kiếm theo hint
CREATE INDEX IF NOT EXISTS idx_questions_hint ON questions(hint) WHERE hint IS NOT NULL;

-- Index cho audio files
CREATE INDEX IF NOT EXISTS idx_questions_audio ON questions(audio) WHERE audio IS NOT NULL;

-- ==============================================
-- PROFILES TABLE ADDITIONAL INDEXES
-- ==============================================

-- Index cho full-text search trên full_name
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_gin ON profiles USING gin(to_tsvector('english', full_name));

-- Index cho tìm kiếm theo phone
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Index cho tìm kiếm theo email (từ auth.users)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(id) WHERE id IS NOT NULL;

-- Composite index cho dashboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_role_status_province ON profiles(role, status, province_id);

-- ==============================================
-- RECORDINGS TABLE ADDITIONAL INDEXES
-- ==============================================

-- Index cho full-text search trên audio_script
CREATE INDEX IF NOT EXISTS idx_recordings_script_gin ON recordings USING gin(to_tsvector('english', audio_script));

-- Index cho tìm kiếm theo audio_duration
CREATE INDEX IF NOT EXISTS idx_recordings_duration ON recordings(audio_duration) WHERE audio_duration IS NOT NULL;

-- Index cho processed_at
CREATE INDEX IF NOT EXISTS idx_recordings_processed_at ON recordings(processed_at) WHERE processed_at IS NOT NULL;

-- Composite index cho analytics queries
CREATE INDEX IF NOT EXISTS idx_recordings_user_created ON recordings(user_id, created_at DESC);

-- Composite index cho region/province queries
CREATE INDEX IF NOT EXISTS idx_recordings_region_province_created ON recordings(region_id, province_id, created_at DESC);


-- ==============================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ==============================================

-- Index cho các query thống kê thường dùng
CREATE INDEX IF NOT EXISTS idx_recordings_stats ON recordings(user_id, recorded_at);

-- Index cho các query dashboard
CREATE INDEX IF NOT EXISTS idx_profiles_dashboard ON profiles(role, status, last_active, total_completed_recordings);

-- ==============================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ==============================================

-- Index cho active questions only
CREATE INDEX IF NOT EXISTS idx_questions_active_only ON questions(id, type, created_at) 
WHERE is_active = true;

-- Index cho active profiles only
CREATE INDEX IF NOT EXISTS idx_profiles_active_only ON profiles(id, role, province_id, last_active) 
WHERE status = 'active';

-- Index cho recordings with audio_duration
CREATE INDEX IF NOT EXISTS idx_recordings_with_duration ON recordings(user_id, question_id, recorded_at) 
WHERE audio_duration IS NOT NULL;

-- ==============================================
-- INDEXES FOR FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Đảm bảo foreign key constraints có indexes
-- (PostgreSQL tự động tạo indexes cho primary keys, nhưng cần kiểm tra foreign keys)

-- Index cho recordings.question_id (đã có trong file 05)
-- Index cho recordings.user_id (đã có trong file 05)
-- Index cho recordings.region_id (đã có trong file 05)
-- Index cho recordings.province_id (đã có trong file 05)
-- Index cho profiles.province_id (đã có trong file 04)
-- Index cho provinces.region_id (đã có trong file 01)
-- Index cho profiles.id (primary key, tự động có)

-- ==============================================
-- COMMENTS FOR INDEXES
-- ==============================================

COMMENT ON INDEX idx_regions_name_gin IS 'Full-text search index cho tên khu vực';
COMMENT ON INDEX idx_provinces_name_gin IS 'Full-text search index cho tên tỉnh thành';
COMMENT ON INDEX idx_questions_text_gin IS 'Full-text search index cho câu hỏi';
COMMENT ON INDEX idx_profiles_full_name_gin IS 'Full-text search index cho tên user';
COMMENT ON INDEX idx_recordings_script_gin IS 'Full-text search index cho audio script';
COMMENT ON INDEX idx_recordings_user_created IS 'Index cho query recordings theo user';
COMMENT ON INDEX idx_recordings_region_province_created IS 'Index cho query recordings theo khu vực và tỉnh thành';
COMMENT ON INDEX idx_profiles_dashboard IS 'Index cho dashboard profile queries';

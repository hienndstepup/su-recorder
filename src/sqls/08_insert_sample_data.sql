-- Chèn dữ liệu mẫu để test hệ thống
-- Lưu ý: Chỉ chạy file này sau khi đã tạo tất cả bảng và policies

-- ==============================================
-- SAMPLE REGIONS DATA (đã có trong file 02)
-- ==============================================

-- Regions đã được tạo trong file 02_create_regions_table.sql
-- Không cần chèn lại

-- ==============================================
-- SAMPLE PROVINCES DATA (đã có trong file 01)
-- ==============================================

-- Provinces đã được tạo trong file 01_create_provinces_table.sql
-- Không cần chèn lại

-- ==============================================
-- SAMPLE QUESTIONS DATA
-- ==============================================

-- Chèn các câu hỏi mẫu
INSERT INTO questions (text, type, audio, hint, is_active) VALUES
-- Câu hỏi về công nghệ
('Cậu có biết tại sao máy tính lại có thể tính toán nhanh như vậy không?', 'open_ended', NULL, 'Hãy nghĩ về bộ vi xử lý và tốc độ xử lý', true),
('Bạn có thích sử dụng điện thoại thông minh không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Hãy kể về một ứng dụng di động mà bạn thích nhất', 'open_ended', NULL, 'Có thể là game, mạng xã hội, hoặc ứng dụng tiện ích', true),

-- Câu hỏi về cuộc sống hàng ngày
('Bạn thường làm gì vào cuối tuần?', 'open_ended', NULL, 'Kể về các hoạt động giải trí hoặc nghỉ ngơi', true),
('Món ăn yêu thích của bạn là gì?', 'open_ended', NULL, 'Có thể là món Việt Nam hoặc món nước ngoài', true),
('Bạn có thích đọc sách không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),

-- Câu hỏi về học tập
('Môn học nào bạn thích nhất ở trường?', 'open_ended', NULL, 'Có thể là Toán, Văn, Lý, Hóa, Sinh, v.v.', true),
('Bạn có thích học tiếng Anh không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Hãy kể về một kỷ niệm đẹp trong học tập', 'open_ended', NULL, 'Có thể là điểm cao, thầy cô, bạn bè', true),

-- Câu hỏi về gia đình
('Bạn có bao nhiêu anh chị em?', 'open_ended', NULL, 'Kể về số lượng và mối quan hệ', true),
('Bạn có thích ở với gia đình không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Hãy kể về một kỷ niệm đẹp với gia đình', 'open_ended', NULL, 'Có thể là đi du lịch, sinh nhật, lễ tết', true),

-- Câu hỏi về sở thích
('Bạn thích nghe loại nhạc nào?', 'open_ended', NULL, 'Có thể là pop, rock, rap, ballad, v.v.', true),
('Bạn có thích xem phim không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Hãy kể về một bộ phim mà bạn thích nhất', 'open_ended', NULL, 'Có thể là phim Việt Nam hoặc nước ngoài', true),

-- Câu hỏi về tương lai
('Bạn muốn làm nghề gì khi lớn lên?', 'open_ended', NULL, 'Kể về ước mơ nghề nghiệp', true),
('Bạn có muốn đi du lịch nước ngoài không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Hãy kể về một đất nước bạn muốn đến thăm', 'open_ended', NULL, 'Có thể là Nhật Bản, Hàn Quốc, Mỹ, v.v.', true),

-- Câu hỏi về môi trường
('Bạn có quan tâm đến vấn đề môi trường không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Hãy kể về một cách bảo vệ môi trường', 'open_ended', NULL, 'Có thể là tiết kiệm điện, nước, trồng cây', true),

-- Câu hỏi về thể thao
('Bạn có thích chơi thể thao không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Môn thể thao nào bạn thích nhất?', 'open_ended', NULL, 'Có thể là bóng đá, bóng rổ, cầu lông, v.v.', true),

-- Câu hỏi về thời tiết
('Bạn thích mùa nào trong năm?', 'open_ended', NULL, 'Có thể là xuân, hạ, thu, đông', true),
('Bạn có thích mưa không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),

-- Câu hỏi về động vật
('Bạn có thích nuôi thú cưng không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Con vật nào bạn thích nhất?', 'open_ended', NULL, 'Có thể là chó, mèo, chim, cá, v.v.', true),

-- Câu hỏi về du lịch
('Bạn đã từng đi du lịch ở đâu?', 'open_ended', NULL, 'Kể về các địa điểm đã đến', true),
('Bạn có thích đi du lịch không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),

-- Câu hỏi về âm nhạc
('Bạn có biết chơi nhạc cụ nào không?', 'open_ended', NULL, 'Có thể là piano, guitar, sáo, v.v.', true),
('Ca sĩ nào bạn thích nhất?', 'open_ended', NULL, 'Có thể là ca sĩ Việt Nam hoặc nước ngoài', true),

-- Câu hỏi về nghệ thuật
('Bạn có thích vẽ không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Hãy kể về một tác phẩm nghệ thuật bạn thích', 'open_ended', NULL, 'Có thể là tranh, tượng, kiến trúc', true),

-- Câu hỏi về ẩm thực
('Bạn có thích nấu ăn không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Món ăn Việt Nam nào bạn thích nhất?', 'open_ended', NULL, 'Có thể là phở, bún, chả cá, v.v.', true),

-- Câu hỏi về lịch sử
('Bạn có thích học lịch sử không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Hãy kể về một nhân vật lịch sử bạn ngưỡng mộ', 'open_ended', NULL, 'Có thể là Hồ Chí Minh, Trần Hưng Đạo, v.v.', true),

-- Câu hỏi về khoa học
('Bạn có thích khám phá khoa học không?', 'yes_no', NULL, 'Trả lời có hoặc không', true),
('Hãy kể về một phát minh khoa học bạn thích', 'open_ended', NULL, 'Có thể là điện thoại, máy tính, v.v.', true);

-- ==============================================
-- SAMPLE PROFILES DATA (CHỈ DÀNH CHO TEST)
-- ==============================================

-- Lưu ý: Trong thực tế, profiles sẽ được tạo tự động khi user đăng ký
-- Đây chỉ là dữ liệu mẫu để test, không nên chạy trong production

-- Tạo một admin user mẫu (cần có user_id thực tế từ auth.users)
-- INSERT INTO profiles (id, full_name, role, status, province_id, affiliate_code, referrer_id) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin', 'active', (SELECT id FROM provinces WHERE code = 'HN'), 'ADMIN001', NULL);

-- Tạo một số CTV mẫu với affiliate system
-- INSERT INTO profiles (id, full_name, role, status, province_id, affiliate_code, referrer_id) VALUES
-- ('00000000-0000-0000-0000-000000000002', 'CTV Nguyễn Văn A', 'ctv', 'active', (SELECT id FROM provinces WHERE code = 'HN'), 'CTV001', '00000000-0000-0000-0000-000000000001'),
-- ('00000000-0000-0000-0000-000000000003', 'CTV Trần Thị B', 'ctv', 'active', (SELECT id FROM provinces WHERE code = 'HCM'), 'CTV002', '00000000-0000-0000-0000-000000000001'),
-- ('00000000-0000-0000-0000-000000000004', 'CTV Lê Văn C', 'ctv', 'active', (SELECT id FROM provinces WHERE code = 'DN'), 'CTV003', '00000000-0000-0000-0000-000000000002'),
-- ('00000000-0000-0000-0000-000000000005', 'CTV Phạm Thị D', 'ctv', 'active', (SELECT id FROM provinces WHERE code = 'HP'), 'CTV004', '00000000-0000-0000-0000-000000000002');

-- ==============================================
-- SAMPLE RECORDINGS DATA (CHỈ DÀNH CHO TEST)
-- ==============================================

-- Lưu ý: Recordings sẽ được tạo khi user hoàn thành ghi âm
-- Đây chỉ là dữ liệu mẫu để test

-- INSERT INTO recordings (user_id, question_id, region_id, province_id, audio_script, audio_duration) VALUES
-- ('00000000-0000-0000-0000-000000000002', 
--  (SELECT id FROM questions LIMIT 1), 
--  (SELECT id FROM regions WHERE code = 'NORTH'), 
--  (SELECT id FROM provinces WHERE code = 'HN'), 
--  'Đây là câu trả lời mẫu từ CTV Nguyễn Văn A', 
--  120),
-- ('00000000-0000-0000-0000-000000000003', 
--  (SELECT id FROM questions LIMIT 1 OFFSET 1), 
--  (SELECT id FROM regions WHERE code = 'SOUTH'), 
--  (SELECT id FROM provinces WHERE code = 'HCM'), 
--  'Đây là câu trả lời mẫu từ CTV Trần Thị B', 
--  95);

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Kiểm tra số lượng dữ liệu đã được chèn
SELECT 'Regions count:' as info, COUNT(*)::TEXT as count FROM regions WHERE is_active = true
UNION ALL
SELECT 'Provinces count:' as info, COUNT(*)::TEXT as count FROM provinces WHERE is_active = true
UNION ALL
SELECT 'Questions count:' as info, COUNT(*)::TEXT as count FROM questions WHERE is_active = true
UNION ALL
SELECT 'Total questions:' as info, COUNT(*)::TEXT as count FROM questions;

-- Hiển thị một số dữ liệu mẫu từ regions
SELECT 'Regions:' as table_name, code::TEXT, name::TEXT FROM regions WHERE is_active = true LIMIT 3;

-- Hiển thị một số dữ liệu mẫu từ provinces  
SELECT 'Provinces:' as table_name, code::TEXT, name::TEXT FROM provinces WHERE is_active = true LIMIT 3;

-- Hiển thị một số dữ liệu mẫu từ questions
SELECT 'Questions:' as table_name, COALESCE(type::TEXT, 'No type'), COALESCE(LEFT(text, 50), 'No text') FROM questions WHERE is_active = true LIMIT 3;

-- Test affiliate system queries
-- SELECT 'Affiliate Test:' as info, 'Admin có thể xem tất cả profiles' as description
-- UNION ALL
-- SELECT 'Affiliate Test:' as info, 'CTV chỉ xem được CTV trực tiếp' as description
-- UNION ALL
-- SELECT 'Affiliate Test:' as info, 'Tất cả user đều có affiliate_code' as description;

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE questions IS 'Bảng chứa 30 câu hỏi mẫu đa dạng về các chủ đề khác nhau';
COMMENT ON TABLE regions IS 'Bảng chứa 3 khu vực chính của Việt Nam';
COMMENT ON TABLE provinces IS 'Bảng chứa 34 tỉnh thành mới sau sáp nhập';

-- ==============================================
-- AFFILIATE SYSTEM TEST QUERIES
-- ==============================================

-- Query để test affiliate system (chỉ chạy khi có dữ liệu thực tế)
-- Lấy danh sách CTV trực tiếp của một user
-- SELECT * FROM get_direct_referrals('user_id_here');

-- Kiểm tra quyền xem profile
-- SELECT can_view_profile('target_user_id_here');

-- Lấy thông tin affiliate của user
-- SELECT 
--   p.full_name,
--   p.affiliate_code,
--   p.role,
--   r.full_name as referrer_name,
--   r.affiliate_code as referrer_code
-- FROM profiles p
-- LEFT JOIN profiles r ON p.referrer_id = r.id
-- WHERE p.id = 'user_id_here';

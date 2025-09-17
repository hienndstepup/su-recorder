-- Sample data for questions (dev only)
INSERT INTO questions (text, type, is_active) VALUES
('Hãy giới thiệu về bản thân', 'introduction', true),
('Bạn sống ở đâu?', 'location', true),
('Bạn làm nghề gì?', 'occupation', true),
('Bạn có sở thích gì?', 'hobby', true),
('Hãy kể về gia đình bạn', 'family', true),
('Bạn thích ăn món gì?', 'food', true),
('Thời tiết hôm nay thế nào?', 'weather', true),
('Bạn thích đi du lịch không?', 'travel', true),
('Bạn có thú cưng không?', 'pets', true),
('Hãy nói về công việc của bạn', 'work', true);

SELECT 'Sample data inserted successfully' as status,
       (SELECT COUNT(*) FROM questions WHERE is_active = true) as total_questions;

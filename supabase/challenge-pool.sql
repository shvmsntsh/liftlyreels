-- Challenge pool table — auto-generates daily challenges
CREATE TABLE IF NOT EXISTS challenge_pool (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  challenge_text TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed 35+ challenges across categories
INSERT INTO challenge_pool (category, challenge_text, difficulty) VALUES
-- Mindset
('Mindset', 'Write down 3 things you are grateful for today and share why each matters.', 'easy'),
('Mindset', 'Spend 10 minutes in silence — no phone, no music. Just be present.', 'medium'),
('Mindset', 'Replace one negative self-talk pattern with a positive affirmation today.', 'easy'),
('Mindset', 'Journal about a fear you have and write one action step to face it.', 'medium'),
('Mindset', 'Compliment 3 strangers today and notice how it changes your mood.', 'medium'),

-- Gym
('Gym', 'Do 50 push-ups throughout the day — break them up however you want.', 'medium'),
('Gym', 'Take a 30-minute walk outside. No headphones — just observe the world.', 'easy'),
('Gym', 'Hold a plank for as long as you can. Beat yesterday''s time.', 'medium'),
('Gym', 'Try a new exercise you''ve never done before and share how it felt.', 'easy'),
('Gym', 'Do a full body stretch routine for 15 minutes. Focus on tight spots.', 'easy'),

-- Diet
('Diet', 'Drink 8 full glasses of water today and track each one.', 'easy'),
('Diet', 'Cook a meal from scratch using only whole foods — no processed ingredients.', 'medium'),
('Diet', 'Skip added sugar for the entire day. Read every label.', 'medium'),
('Diet', 'Eat a fruit or vegetable you''ve never tried before.', 'easy'),
('Diet', 'Meal prep your lunches for the next 3 days.', 'hard'),

-- Books
('Books', 'Read 20 pages of a book and write down the single most useful idea.', 'easy'),
('Books', 'Pick one quote from a book and explain to someone why it matters.', 'easy'),
('Books', 'Start a new non-fiction book today. Share the title and why you chose it.', 'medium'),
('Books', 'Summarize a chapter you recently read in 3 bullet points from memory.', 'medium'),
('Books', 'Teach someone one concept you learned from your current book.', 'medium'),

-- Wellness
('Wellness', 'Meditate for 10 minutes. Use a timer and just focus on your breathing.', 'easy'),
('Wellness', 'Get to bed 30 minutes earlier tonight. Prepare with no screens.', 'medium'),
('Wellness', 'Take a cold shower for 60 seconds at the end of your regular shower.', 'hard'),
('Wellness', 'Write a letter of appreciation to someone in your life. Send it.', 'medium'),
('Wellness', 'Unplug from all social media for 4 hours today.', 'medium'),

-- Finance
('Finance', 'Track every single expense you make today. Every single one.', 'easy'),
('Finance', 'Cancel one subscription you don''t actually use anymore.', 'easy'),
('Finance', 'Save an extra $5 today — transfer it to savings right now.', 'easy'),
('Finance', 'Read one article about investing and note 3 new things you learned.', 'medium'),
('Finance', 'Create or review your monthly budget. Identify one area to cut back.', 'medium'),

-- Relationships
('Relationships', 'Call someone you haven''t spoken to in over a month. Have a real conversation.', 'medium'),
('Relationships', 'Write a genuine thank-you message to someone who helped you recently.', 'easy'),
('Relationships', 'Put your phone away during your next meal with someone. Be fully present.', 'medium'),
('Relationships', 'Ask someone about their goals and actually listen. Then offer support.', 'easy'),
('Relationships', 'Forgive someone in your mind today — even if you don''t tell them.', 'hard');

-- Enable RLS
ALTER TABLE challenge_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read challenge pool" ON challenge_pool FOR SELECT USING (true);

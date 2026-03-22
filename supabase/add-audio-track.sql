-- Add audio_track column to posts table
-- Stores the ID of the selected audio track (e.g., "mindset-1", "gym-2")
-- NULL means use the default track for the post's category

ALTER TABLE posts ADD COLUMN IF NOT EXISTS audio_track TEXT DEFAULT NULL;

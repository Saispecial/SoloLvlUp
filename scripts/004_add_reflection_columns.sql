-- Add missing columns to reflections table
ALTER TABLE public.reflections 
ADD COLUMN IF NOT EXISTS challenges text,
ADD COLUMN IF NOT EXISTS motivation_level integer DEFAULT 5 CHECK (motivation_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS gratitude text;

-- Update the existing check constraint name from 'motivation' to match the code
-- Note: The table already has a 'motivation' column but the code expects 'motivation_level'
-- We're adding motivation_level as a new column since altering existing column names requires more care

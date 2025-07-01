-- Add description column to scenarios table
-- Run this in Supabase Studio SQL Editor

ALTER TABLE scenarios ADD COLUMN description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN scenarios.description IS 'Optional description for the scenario';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scenarios' AND column_name = 'description'; 
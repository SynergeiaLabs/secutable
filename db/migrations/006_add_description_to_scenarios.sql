-- Add description column to scenarios table
ALTER TABLE scenarios ADD COLUMN description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN scenarios.description IS 'Optional description for the scenario'; 
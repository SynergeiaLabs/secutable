-- Add user_id column to scenarios table
ALTER TABLE scenarios ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to include user_id filtering
DROP POLICY IF EXISTS "Users can view their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can insert their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete their own scenarios" ON scenarios;

-- Create new RLS policies that include user_id
CREATE POLICY "Users can view their own scenarios" ON scenarios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenarios" ON scenarios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios" ON scenarios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios" ON scenarios
    FOR DELETE USING (auth.uid() = user_id);

-- Add user_id column to injects table as well for consistency
ALTER TABLE injects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update injects RLS policies
DROP POLICY IF EXISTS "Users can view their own injects" ON injects;
DROP POLICY IF EXISTS "Users can insert their own injects" ON injects;
DROP POLICY IF EXISTS "Users can update their own injects" ON injects;
DROP POLICY IF EXISTS "Users can delete their own injects" ON injects;

CREATE POLICY "Users can view their own injects" ON injects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own injects" ON injects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own injects" ON injects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own injects" ON injects
    FOR DELETE USING (auth.uid() = user_id); 
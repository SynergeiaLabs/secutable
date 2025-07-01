-- Complete Database Setup for SecuTable Platform
-- Run this in Supabase Studio SQL Editor

-- Migration 001: Create scenarios tables
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    background TEXT NOT NULL,
    key_themes TEXT NOT NULL,
    assumptions TEXT,
    irp_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS injects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    time_offset VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration 002: Create IRP storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('irp_documents', 'irp_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Migration 003: Add inject tracking
ALTER TABLE injects ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE injects ADD COLUMN IF NOT EXISTS delivered_by VARCHAR(255);

-- Migration 004: Add user_id to scenarios
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE injects ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add RLS policies for scenarios
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own scenarios" ON scenarios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own scenarios" ON scenarios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own scenarios" ON scenarios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own scenarios" ON scenarios
    FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for injects
ALTER TABLE injects ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view injects for their scenarios" ON injects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scenarios 
            WHERE scenarios.id = injects.scenario_id 
            AND scenarios.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can insert injects for their scenarios" ON injects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM scenarios 
            WHERE scenarios.id = injects.scenario_id 
            AND scenarios.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can update injects for their scenarios" ON injects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM scenarios 
            WHERE scenarios.id = injects.scenario_id 
            AND scenarios.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can delete injects for their scenarios" ON injects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM scenarios 
            WHERE scenarios.id = injects.scenario_id 
            AND scenarios.user_id = auth.uid()
        )
    );

-- Migration 005: Add inject comments
CREATE TABLE IF NOT EXISTS inject_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inject_id UUID REFERENCES injects(id) ON DELETE CASCADE,
    user_id UUID,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE inject_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view comments for their injects" ON inject_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM injects 
            JOIN scenarios ON scenarios.id = injects.scenario_id
            WHERE injects.id = inject_comments.inject_id 
            AND scenarios.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can insert comments for their injects" ON inject_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM injects 
            JOIN scenarios ON scenarios.id = injects.scenario_id
            WHERE injects.id = inject_comments.inject_id 
            AND scenarios.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can update their own comments" ON inject_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own comments" ON inject_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Migration 006: Add description to scenarios
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN scenarios.description IS 'Optional description for the scenario';

-- Verify the setup
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('scenarios', 'injects', 'inject_comments')
ORDER BY table_name, ordinal_position; 
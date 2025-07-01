-- Complete Database Setup for SecuTable
-- Run this script in Supabase Studio SQL Editor

-- ========================================
-- 1. Create Scenarios Table
-- ========================================

CREATE TABLE IF NOT EXISTS scenarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    background TEXT NOT NULL,
    key_themes TEXT NOT NULL,
    assumptions TEXT,
    irp_url TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. Create Injects Table
-- ========================================

CREATE TABLE IF NOT EXISTS injects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    time_offset VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(100) NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE,
    handled_at TIMESTAMP WITH TIME ZONE,
    response_time INTEGER, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. Create IRP Storage Bucket
-- ========================================

-- Create storage bucket for IRP documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'irp_documents',
    'irp_documents',
    true,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
CREATE POLICY "Users can upload IRP documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'irp_documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view IRP documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'irp_documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update IRP documents" ON storage.objects
    FOR UPDATE USING (bucket_id = 'irp_documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete IRP documents" ON storage.objects
    FOR DELETE USING (bucket_id = 'irp_documents' AND auth.uid() IS NOT NULL);

-- ========================================
-- 4. Enable Row Level Security
-- ========================================

-- Enable RLS on scenarios table
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Enable RLS on injects table
ALTER TABLE injects ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. Create RLS Policies for Scenarios
-- ========================================

-- Users can view their own scenarios
CREATE POLICY "Users can view their own scenarios" ON scenarios
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own scenarios
CREATE POLICY "Users can insert their own scenarios" ON scenarios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own scenarios
CREATE POLICY "Users can update their own scenarios" ON scenarios
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own scenarios
CREATE POLICY "Users can delete their own scenarios" ON scenarios
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 6. Create RLS Policies for Injects
-- ========================================

-- Users can view their own injects
CREATE POLICY "Users can view their own injects" ON injects
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own injects
CREATE POLICY "Users can insert their own injects" ON injects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own injects
CREATE POLICY "Users can update their own injects" ON injects
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own injects
CREATE POLICY "Users can delete their own injects" ON injects
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 7. Create Indexes for Performance
-- ========================================

-- Index for scenarios by user_id
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);

-- Index for scenarios by created_at
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);

-- Index for injects by scenario_id
CREATE INDEX IF NOT EXISTS idx_injects_scenario_id ON injects(scenario_id);

-- Index for injects by user_id
CREATE INDEX IF NOT EXISTS idx_injects_user_id ON injects(user_id);

-- Index for injects by time_offset
CREATE INDEX IF NOT EXISTS idx_injects_time_offset ON injects(time_offset);

-- ========================================
-- 8. Create Functions for Timestamps
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_scenarios_updated_at 
    BEFORE UPDATE ON scenarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 9. Verification Queries
-- ========================================

-- Check if tables were created
SELECT 'scenarios' as table_name, COUNT(*) as row_count FROM scenarios
UNION ALL
SELECT 'injects' as table_name, COUNT(*) as row_count FROM injects;

-- Check if policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('scenarios', 'injects')
ORDER BY tablename, policyname;

-- Check if storage bucket was created
SELECT * FROM storage.buckets WHERE id = 'irp_documents';

-- ========================================
-- Setup Complete!
-- ========================================

-- You can now:
-- 1. Enable Email Auth in Authentication > Settings
-- 2. Configure redirect URLs in Authentication > URL Configuration
-- 3. Test the application at http://localhost:3000 
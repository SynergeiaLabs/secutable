-- Create inject_comments table
CREATE TABLE IF NOT EXISTS inject_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inject_id UUID REFERENCES injects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on inject_comments table
ALTER TABLE inject_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inject_comments
-- Users can view comments for injects they own
CREATE POLICY "Users can view comments for their injects" ON inject_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM injects 
            WHERE injects.id = inject_comments.inject_id 
            AND injects.user_id = auth.uid()
        )
    );

-- Users can insert comments for injects they own
CREATE POLICY "Users can insert comments for their injects" ON inject_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM injects 
            WHERE injects.id = inject_comments.inject_id 
            AND injects.user_id = auth.uid()
        ) AND user_id = auth.uid()
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON inject_comments
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON inject_comments
    FOR DELETE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inject_comments_inject_id ON inject_comments(inject_id);
CREATE INDEX IF NOT EXISTS idx_inject_comments_user_id ON inject_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_inject_comments_created_at ON inject_comments(created_at DESC); 
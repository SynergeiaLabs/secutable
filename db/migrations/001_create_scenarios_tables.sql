-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    background TEXT NOT NULL,
    key_themes TEXT NOT NULL,
    assumptions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create injects table with foreign key to scenarios
CREATE TABLE IF NOT EXISTS injects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    time_offset VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at);
CREATE INDEX IF NOT EXISTS idx_injects_scenario_id ON injects(scenario_id);
CREATE INDEX IF NOT EXISTS idx_injects_time_offset ON injects(time_offset);

-- Enable Row Level Security (RLS) for production
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE injects ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- Example: Allow authenticated users to read all scenarios
CREATE POLICY "Allow authenticated users to read scenarios" ON scenarios
    FOR SELECT USING (auth.role() = 'authenticated');

-- Example: Allow authenticated users to insert scenarios
CREATE POLICY "Allow authenticated users to insert scenarios" ON scenarios
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Example: Allow users to read injects for scenarios they can access
CREATE POLICY "Allow users to read injects" ON injects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Example: Allow users to insert injects
CREATE POLICY "Allow users to insert injects" ON injects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_scenarios_updated_at 
    BEFORE UPDATE ON scenarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_injects_updated_at 
    BEFORE UPDATE ON injects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
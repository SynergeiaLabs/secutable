-- Add inject tracking fields to injects table
ALTER TABLE injects 
ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN handled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN response_time INTEGER; -- in seconds

-- Add indexes for better query performance
CREATE INDEX idx_injects_activated_at ON injects(activated_at);
CREATE INDEX idx_injects_handled_at ON injects(handled_at);
CREATE INDEX idx_injects_scenario_activated ON injects(scenario_id, activated_at);

-- Add comments for documentation
COMMENT ON COLUMN injects.activated_at IS 'Timestamp when inject was triggered (manually or automatically)';
COMMENT ON COLUMN injects.handled_at IS 'Timestamp when inject was marked as handled';
COMMENT ON COLUMN injects.response_time IS 'Response time in seconds (handled_at - activated_at)'; 
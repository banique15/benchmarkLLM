-- Add speed_level and cost_level columns to model_rankings table
ALTER TABLE model_rankings ADD COLUMN IF NOT EXISTS speed_level INTEGER;
ALTER TABLE model_rankings ADD COLUMN IF NOT EXISTS cost_level INTEGER;

-- Add comments explaining the columns
COMMENT ON COLUMN model_rankings.speed_level IS 'Speed level of the model (1-5)';
COMMENT ON COLUMN model_rankings.cost_level IS 'Cost level of the model (1-5)';
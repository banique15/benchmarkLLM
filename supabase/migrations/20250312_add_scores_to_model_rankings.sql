-- Add domain expertise and accuracy score columns to model_rankings table
ALTER TABLE model_rankings ADD COLUMN IF NOT EXISTS domain_expertise_score FLOAT;
ALTER TABLE model_rankings ADD COLUMN IF NOT EXISTS accuracy_score FLOAT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS model_rankings_domain_expertise_score_idx ON model_rankings(domain_expertise_score);
CREATE INDEX IF NOT EXISTS model_rankings_accuracy_score_idx ON model_rankings(accuracy_score);

-- Add comments explaining the columns
COMMENT ON COLUMN model_rankings.domain_expertise_score IS 'Score for domain-specific knowledge (0-1)';
COMMENT ON COLUMN model_rankings.accuracy_score IS 'Score for accuracy of the response (0-1)';
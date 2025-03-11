-- Add prompt column to test_case_results table
ALTER TABLE test_case_results ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Add an index on the prompt column for better query performance
CREATE INDEX IF NOT EXISTS test_case_results_prompt_idx ON test_case_results(prompt);

-- Comment explaining the migration
COMMENT ON COLUMN test_case_results.prompt IS 'The prompt used for this test case, stored for reference and analysis';
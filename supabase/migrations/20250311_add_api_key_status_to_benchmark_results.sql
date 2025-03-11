-- Add API key status columns to benchmark_results table
ALTER TABLE benchmark_results ADD COLUMN IF NOT EXISTS api_key_valid BOOLEAN;
ALTER TABLE benchmark_results ADD COLUMN IF NOT EXISTS api_key_credits NUMERIC;
ALTER TABLE benchmark_results ADD COLUMN IF NOT EXISTS api_key_limit NUMERIC;
ALTER TABLE benchmark_results ADD COLUMN IF NOT EXISTS api_key_error TEXT;

-- Add an index on the api_key_valid column for better query performance
CREATE INDEX IF NOT EXISTS benchmark_results_api_key_valid_idx ON benchmark_results(api_key_valid);

-- Add comments explaining the columns
COMMENT ON COLUMN benchmark_results.api_key_valid IS 'Whether the API key used for this benchmark was valid';
COMMENT ON COLUMN benchmark_results.api_key_credits IS 'The number of credits available on the API key at the time of the benchmark';
COMMENT ON COLUMN benchmark_results.api_key_limit IS 'The credit limit of the API key at the time of the benchmark';
COMMENT ON COLUMN benchmark_results.api_key_error IS 'Any error message related to the API key validation';
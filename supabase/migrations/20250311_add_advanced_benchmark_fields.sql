-- Add advanced benchmark fields to benchmark_configs table
ALTER TABLE benchmark_configs ADD COLUMN IF NOT EXISTS benchmark_type TEXT DEFAULT 'basic';
ALTER TABLE benchmark_configs ADD COLUMN IF NOT EXISTS advanced_options JSONB;
ALTER TABLE benchmark_configs ADD COLUMN IF NOT EXISTS topic TEXT;

-- Add domain expertise score to test case results
ALTER TABLE test_case_results ADD COLUMN IF NOT EXISTS domain_expertise_score FLOAT;
ALTER TABLE test_case_results ADD COLUMN IF NOT EXISTS accuracy_score FLOAT;

-- Create model rankings table
CREATE TABLE IF NOT EXISTS model_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_result_id UUID REFERENCES benchmark_results(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  overall_rank INTEGER,
  performance_rank INTEGER,
  cost_efficiency_rank INTEGER,
  domain_expertise_rank INTEGER,
  score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS benchmark_configs_benchmark_type_idx ON benchmark_configs(benchmark_type);
CREATE INDEX IF NOT EXISTS benchmark_configs_topic_idx ON benchmark_configs(topic);
CREATE INDEX IF NOT EXISTS test_case_results_domain_expertise_score_idx ON test_case_results(domain_expertise_score);
CREATE INDEX IF NOT EXISTS test_case_results_accuracy_score_idx ON test_case_results(accuracy_score);
CREATE INDEX IF NOT EXISTS model_rankings_benchmark_result_id_idx ON model_rankings(benchmark_result_id);
CREATE INDEX IF NOT EXISTS model_rankings_model_id_idx ON model_rankings(model_id);

-- Add comments explaining the columns
COMMENT ON COLUMN benchmark_configs.benchmark_type IS 'Type of benchmark: basic or advanced';
COMMENT ON COLUMN benchmark_configs.advanced_options IS 'Additional options for advanced benchmarks';
COMMENT ON COLUMN benchmark_configs.topic IS 'Topic or domain for advanced benchmarks';
COMMENT ON COLUMN test_case_results.domain_expertise_score IS 'Score for domain-specific knowledge (0-1)';
COMMENT ON COLUMN test_case_results.accuracy_score IS 'Score for accuracy of the response (0-1)';
COMMENT ON TABLE model_rankings IS 'Rankings of models for each benchmark result';
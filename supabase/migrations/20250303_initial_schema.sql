-- Create benchmark_configs table
CREATE TABLE IF NOT EXISTS benchmark_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  test_cases JSONB NOT NULL,
  model_configs JSONB NOT NULL,
  metric_configs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  public_id TEXT UNIQUE
);

-- Create benchmark_results table
CREATE TABLE IF NOT EXISTS benchmark_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES benchmark_configs(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  status_details JSONB,
  model_results JSONB,
  summary JSONB,
  error TEXT,
  public_id TEXT UNIQUE
);

-- Create test_case_results table
CREATE TABLE IF NOT EXISTS test_case_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_result_id UUID REFERENCES benchmark_results(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  test_case_id TEXT NOT NULL,
  output TEXT,
  latency FLOAT,
  token_count INTEGER,
  cost FLOAT,
  metrics JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS benchmark_configs_created_at_idx ON benchmark_configs(created_at);
CREATE INDEX IF NOT EXISTS benchmark_configs_public_id_idx ON benchmark_configs(public_id);
CREATE INDEX IF NOT EXISTS benchmark_results_executed_at_idx ON benchmark_results(executed_at);
CREATE INDEX IF NOT EXISTS benchmark_results_config_id_idx ON benchmark_results(config_id);
CREATE INDEX IF NOT EXISTS benchmark_results_public_id_idx ON benchmark_results(public_id);
CREATE INDEX IF NOT EXISTS test_case_results_benchmark_result_id_idx ON test_case_results(benchmark_result_id);
CREATE INDEX IF NOT EXISTS test_case_results_model_id_idx ON test_case_results(model_id);
CREATE INDEX IF NOT EXISTS test_case_results_test_case_id_idx ON test_case_results(test_case_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for benchmark_configs
CREATE TRIGGER update_benchmark_configs_updated_at
BEFORE UPDATE ON benchmark_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
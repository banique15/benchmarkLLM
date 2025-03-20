-- Create tables for Ollama benchmarking

-- Table for storing Ollama benchmark configurations
CREATE TABLE IF NOT EXISTS ollama_benchmark_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  models JSONB NOT NULL, -- Array of selected Ollama models
  test_cases JSONB NOT NULL, -- Array of test cases with difficulty levels
  parameters JSONB, -- Additional benchmark parameters
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing Ollama benchmark results
CREATE TABLE IF NOT EXISTS ollama_benchmark_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  benchmark_config_id UUID REFERENCES ollama_benchmark_configs(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  status_details JSONB, -- Additional status information
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT -- Error message if benchmark failed
);

-- Table for storing individual test case results
CREATE TABLE IF NOT EXISTS ollama_test_case_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  benchmark_result_id UUID REFERENCES ollama_benchmark_results(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL, -- Ollama model ID
  test_case_id TEXT NOT NULL, -- Test case ID
  difficulty TEXT NOT NULL, -- 'basic', 'intermediate', 'advanced', 'expert'
  category TEXT NOT NULL, -- Test case category
  prompt TEXT NOT NULL, -- The prompt sent to the model
  output TEXT, -- The model's response
  latency INTEGER, -- Response time in milliseconds
  token_count INTEGER, -- Number of tokens in the response
  accuracy_score FLOAT, -- Evaluation score (0-1)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing model rankings
CREATE TABLE IF NOT EXISTS ollama_model_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  benchmark_result_id UUID REFERENCES ollama_benchmark_results(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL, -- Ollama model ID
  overall_rank INTEGER NOT NULL, -- Overall ranking
  basic_rank INTEGER, -- Ranking for basic difficulty
  intermediate_rank INTEGER, -- Ranking for intermediate difficulty
  advanced_rank INTEGER, -- Ranking for advanced difficulty
  expert_rank INTEGER, -- Ranking for expert difficulty
  accuracy_score FLOAT, -- Average accuracy score
  latency_score FLOAT, -- Average latency score
  overall_score FLOAT, -- Combined score
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ollama_benchmark_results_config_id ON ollama_benchmark_results(benchmark_config_id);
CREATE INDEX IF NOT EXISTS idx_ollama_test_case_results_result_id ON ollama_test_case_results(benchmark_result_id);
CREATE INDEX IF NOT EXISTS idx_ollama_model_rankings_result_id ON ollama_model_rankings(benchmark_result_id);
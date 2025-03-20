-- Add category scores to ollama_test_case_results table
ALTER TABLE ollama_test_case_results
ADD COLUMN category_scores JSONB;

-- Add category-specific ranks to ollama_model_rankings table
ALTER TABLE ollama_model_rankings
ADD COLUMN accuracy_rank INTEGER,
ADD COLUMN correctness_rank INTEGER,
ADD COLUMN efficiency_rank INTEGER,
ADD COLUMN accuracy_category_score FLOAT,
ADD COLUMN correctness_category_score FLOAT,
ADD COLUMN efficiency_category_score FLOAT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ollama_test_case_results_model_id ON ollama_test_case_results(model_id);
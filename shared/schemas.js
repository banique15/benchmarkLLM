import { z } from 'zod';

// Test case schema
export const TestCaseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  category: z.string(),
  prompt: z.string().min(1, 'Prompt is required'),
  expectedOutput: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Model parameters schema
export const ModelParametersSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).optional(),
});

// Model configuration schema
export const ModelConfigSchema = z.object({
  modelId: z.string().min(1, 'Model ID is required'),
  provider: z.string().optional(),
  enabled: z.boolean().default(true),
  parameters: ModelParametersSchema.optional(),
});

// Metric configuration schema
export const MetricConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean().default(true),
  weight: z.number().optional(),
});

// Advanced benchmark options schema
export const AdvancedBenchmarkOptionsSchema = z.object({
  maxModels: z.number().int().positive().optional(),
  testCaseCount: z.number().int().positive().optional(),
  prioritizeCost: z.boolean().optional(),
  domainSpecific: z.boolean().optional(),
  includeReasoning: z.boolean().optional(),
});

// Benchmark configuration schema
export const BenchmarkConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  benchmark_type: z.enum(['basic', 'advanced']).default('basic'),
  topic: z.string().optional(),
  advanced_options: z.union([AdvancedBenchmarkOptionsSchema, z.record(z.any())]).optional(),
  test_cases: z.union([
    z.array(TestCaseSchema).min(1, 'At least one test case is required'),
    z.string(), // For JSON string representation
  ]),
  model_configs: z.array(ModelConfigSchema).min(1, 'At least one model configuration is required'),
  metric_configs: z.array(MetricConfigSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  public_id: z.string().optional(),
});

// Test case result schema
export const TestCaseResultSchema = z.object({
  id: z.string().optional(),
  benchmark_result_id: z.string(),
  model_id: z.string(),
  test_case_id: z.string(),
  output: z.string(),
  latency: z.number(),
  token_count: z.number().int(),
  cost: z.number(),
  prompt: z.string().optional(),
  domain_expertise_score: z.number().min(0).max(1).optional(),
  accuracy_score: z.number().min(0).max(1).optional(),
  metrics: z.record(z.any()).optional(),
});

// Benchmark result schema
export const BenchmarkResultSchema = z.object({
  id: z.string().optional(),
  config_id: z.string(),
  executed_at: z.string(),
  status: z.enum(['running', 'completed', 'failed']),
  status_details: z.record(z.any()).optional(),
  model_results: z.record(z.any()).optional(),
  summary: z.record(z.any()).optional(),
  error: z.string().optional(),
  public_id: z.string().optional(),
  test_case_results: z.array(TestCaseResultSchema).optional(),
  // API key status fields
  api_key_valid: z.boolean().optional(),
  api_key_credits: z.number().optional(),
  api_key_limit: z.number().optional(),
  api_key_error: z.string().optional(),
});

// OpenRouter API key schema
export const ApiKeySchema = z.string().min(1, 'API key is required');

// Chat message schema
export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'function']),
  content: z.string(),
  name: z.string().optional(),
});

// Chat completion request schema
export const ChatCompletionRequestSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  messages: z.array(ChatMessageSchema).min(1, 'At least one message is required'),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).optional(),
});

// Completion request schema
export const CompletionRequestSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).optional(),
});

// Benchmark run request schema
export const BenchmarkRunRequestSchema = z.object({
  config: BenchmarkConfigSchema,
  apiKey: ApiKeySchema,
});

// Model ranking schema
export const ModelRankingSchema = z.object({
  id: z.string().optional(),
  benchmark_result_id: z.string(),
  model_id: z.string(),
  overall_rank: z.number().int().positive(),
  performance_rank: z.number().int().positive(),
  cost_efficiency_rank: z.number().int().positive(),
  domain_expertise_rank: z.number().int().positive(),
  score: z.number().min(0).max(1),
  speed_level: z.number().int().min(1).max(5).optional(),
  cost_level: z.number().int().min(1).max(5).optional(),
  created_at: z.string().optional(),
});

// Advanced benchmark analysis schema
export const AdvancedAnalysisSchema = z.object({
  rankings: z.array(ModelRankingSchema),
  summary: z.record(z.any()).optional(),
  costBreakdown: z.array(z.object({
    model_id: z.string(),
    totalCost: z.number(),
    costPerTestCase: z.number(),
    costEfficiencyRank: z.number().int().positive(),
    overallRank: z.number().int().positive(),
  })).optional(),
  domainInsights: z.array(z.object({
    model_id: z.string(),
    domainExpertiseRank: z.number().int().positive(),
    overallRank: z.number().int().positive(),
    strengths: z.array(z.object({
      category: z.string(),
      score: z.number().min(0).max(1),
    })),
    weaknesses: z.array(z.object({
      category: z.string(),
      score: z.number().min(0).max(1),
    })),
  })).optional(),
});

export default {
  TestCaseSchema,
  ModelParametersSchema,
  ModelConfigSchema,
  MetricConfigSchema,
  BenchmarkConfigSchema,
  TestCaseResultSchema,
  BenchmarkResultSchema,
  ApiKeySchema,
  ChatMessageSchema,
  ChatCompletionRequestSchema,
  CompletionRequestSchema,
  BenchmarkRunRequestSchema,
  AdvancedBenchmarkOptionsSchema,
  ModelRankingSchema,
  AdvancedAnalysisSchema,
};
// API endpoints
export const API_ENDPOINTS = {
  OPENROUTER: {
    MODELS: '/api/openrouter/models',
    COMPLETIONS: '/api/openrouter/completions',
    CHAT_COMPLETIONS: '/api/openrouter/chat/completions',
    TEST: '/api/openrouter/test',
  },
  BENCHMARKS: {
    RUN: '/api/benchmarks/run',
    STATUS: (id) => `/api/benchmarks/${id}/status`,
    RESULTS: (id) => `/api/benchmarks/${id}/results`,
    LIST: '/api/benchmarks',
  },
  CONFIGS: {
    LIST: '/api/configs',
    GET: (id) => `/api/configs/${id}`,
    CREATE: '/api/configs',
    UPDATE: (id) => `/api/configs/${id}`,
    DELETE: (id) => `/api/configs/${id}`,
    GET_BY_PUBLIC_ID: (publicId) => `/api/configs/public/${publicId}`,
  },
  RESULTS: {
    LIST: '/api/results',
    GET: (id) => `/api/results/${id}`,
    DELETE: (id) => `/api/results/${id}`,
    GET_BY_PUBLIC_ID: (publicId) => `/api/results/public/${publicId}`,
    EXPORT: (id, format = 'json') => `/api/results/${id}/export?format=${format}`,
  },
};

// Task categories
export const TASK_CATEGORIES = [
  { id: 'text-completion', name: 'Text Completion' },
  { id: 'summarization', name: 'Summarization' },
  { id: 'question-answering', name: 'Question Answering' },
  { id: 'code-generation', name: 'Code Generation' },
  { id: 'creative-writing', name: 'Creative Writing' },
  { id: 'reasoning', name: 'Reasoning' },
  { id: 'classification', name: 'Classification' },
];

// Default model parameters
export const DEFAULT_MODEL_PARAMETERS = {
  temperature: 0.7,
  max_tokens: 1000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

// Popular models
export const POPULAR_MODELS = [
  {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'OpenAI\'s most advanced model',
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and efficient model with good performance',
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Anthropic\'s most capable model',
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and efficiency',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fast and efficient model',
  },
  {
    id: 'meta-llama/llama-3-70b',
    name: 'Llama 3 (70B)',
    provider: 'Meta',
    description: 'Meta\'s largest open model',
  },
];

// Metrics
export const METRICS = [
  {
    id: 'latency',
    name: 'Latency',
    description: 'Response time in milliseconds',
    unit: 'ms',
    lowerIsBetter: true,
  },
  {
    id: 'tokens',
    name: 'Token Usage',
    description: 'Number of tokens used',
    unit: 'tokens',
    lowerIsBetter: true,
  },
  {
    id: 'cost',
    name: 'Cost',
    description: 'Estimated cost in USD',
    unit: 'USD',
    lowerIsBetter: true,
  },
];

// Local storage keys
export const STORAGE_KEYS = {
  API_KEY: 'openrouter_api_key',
  RECENT_CONFIGS: 'recent_benchmark_configs',
  RECENT_RESULTS: 'recent_benchmark_results',
  SETTINGS: 'benchmark_settings',
};

// Default test cases
export const DEFAULT_TEST_CASES = [
  {
    id: 'text-completion-1',
    name: 'Simple Text Completion',
    category: 'text-completion',
    prompt: 'Complete the following sentence: The quick brown fox',
    expectedOutput: '',
  },
  {
    id: 'summarization-1',
    name: 'Article Summarization',
    category: 'summarization',
    prompt: 'Summarize the following article in 3 sentences: [Article text would go here]',
    expectedOutput: '',
  },
  {
    id: 'question-answering-1',
    name: 'Factual Question',
    category: 'question-answering',
    prompt: 'What is the capital of France?',
    expectedOutput: 'Paris',
  },
  {
    id: 'code-generation-1',
    name: 'Simple Function',
    category: 'code-generation',
    prompt: 'Write a JavaScript function that returns the factorial of a number.',
    expectedOutput: '',
  },
];

export default {
  API_ENDPOINTS,
  TASK_CATEGORIES,
  DEFAULT_MODEL_PARAMETERS,
  POPULAR_MODELS,
  METRICS,
  STORAGE_KEYS,
  DEFAULT_TEST_CASES,
};
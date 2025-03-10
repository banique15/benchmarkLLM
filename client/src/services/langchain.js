import axios from 'axios';

// Import the API_URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create an axios instance for LangChain API
const langchainClient = axios.create({
  baseURL: `${API_URL}/api/langchain`, // Use the full URL with API_URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add API key to requests
const getApiKey = () => {
  const apiKey = localStorage.getItem('openrouter_api_key');
  console.log('API key from localStorage:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key');
  return apiKey;
};

// Models
export const getAvailableModels = async () => {
  try {
    const apiKey = getApiKey();
    const response = await langchainClient.get('/models', {
      headers: {
        'X-API-Key': apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available models:', error);
    throw error;
  }
};

// Completions
export const generateCompletion = async (model, prompt, options = {}) => {
  try {
    const apiKey = getApiKey();
    const response = await langchainClient.post('/completions', {
      model,
      prompt,
      ...options,
    }, {
      headers: {
        'X-API-Key': apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error generating completion:', error);
    throw error;
  }
};

// Chat completions
export const generateChatCompletion = async (model, messages, options = {}) => {
  try {
    const apiKey = getApiKey();
    const response = await langchainClient.post('/chat/completions', {
      model,
      messages,
      ...options,
    }, {
      headers: {
        'X-API-Key': apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw error;
  }
};

// Run benchmark
export const runBenchmark = async (benchmarkConfig) => {
  try {
    const apiKey = getApiKey();
    console.log('Running benchmark with LangChain and API key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key');
    
    // Log the request headers
    const headers = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    };
    console.log('Request headers:', Object.keys(headers));
    
    const response = await langchainClient.post('/benchmark', benchmarkConfig, {
      headers,
    });
    
    console.log('Benchmark response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data ? 'Data received' : 'No data',
    });
    
    return response.data;
  } catch (error) {
    console.error('Error running benchmark:', error);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    throw error;
  }
};

// Get benchmark status
export const getBenchmarkStatus = async (benchmarkId) => {
  try {
    const apiKey = getApiKey();
    console.log('Getting benchmark status with LangChain and API key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key');
    
    // Log the request headers
    const headers = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    };
    console.log('Request headers:', Object.keys(headers));
    
    const response = await langchainClient.get(`/benchmark/${benchmarkId}/status`, {
      headers,
    });
    
    console.log('Benchmark status response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data ? 'Data received' : 'No data',
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error getting benchmark status for id ${benchmarkId}:`, error);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    throw error;
  }
};

// Helper function to estimate token count (very rough estimate)
export const estimateTokenCount = (text) => {
  // A very simple estimation: ~4 chars per token on average
  return Math.ceil(text.length / 4);
};

// Helper function to estimate cost based on model and token count
export const estimateCost = (model, inputTokens, outputTokens = 0) => {
  // These rates would need to be updated based on current OpenRouter pricing
  const rates = {
    'openai/gpt-4': { input: 0.00003, output: 0.00006 },
    'openai/gpt-3.5-turbo': { input: 0.000001, output: 0.000002 },
    'anthropic/claude-3-opus': { input: 0.00003, output: 0.00006 },
    'anthropic/claude-3-sonnet': { input: 0.000015, output: 0.00003 },
    'anthropic/claude-3-haiku': { input: 0.000005, output: 0.000015 },
    'meta-llama/llama-3-70b': { input: 0.000002, output: 0.000002 },
    // Add more models as needed
  };

  // Default to GPT-3.5 rates if model not found
  const modelRates = rates[model] || rates['openai/gpt-3.5-turbo'];
  
  return (inputTokens * modelRates.input) + (outputTokens * modelRates.output);
};

export default {
  getAvailableModels,
  generateCompletion,
  generateChatCompletion,
  runBenchmark,
  getBenchmarkStatus,
  estimateTokenCount,
  estimateCost,
};
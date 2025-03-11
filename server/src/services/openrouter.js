import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create an axios instance for OpenRouter API
const openRouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173', // Required by OpenRouter
    'X-Title': 'LLM Benchmark', // Optional, but good practice
  },
});

// Add API key to requests
openRouterClient.interceptors.request.use((config) => {
  console.log('OpenRouter request config:', {
    url: config.url,
    method: config.method,
    headers: Object.keys(config.headers || {}),
  });
  
  // Check if the Authorization header is already set (from the apiKey parameter)
  if (config.headers['Authorization']) {
    console.log('Authorization header already set, using it');
    return config;
  }
  
  // The API key should be passed from the client to avoid storing it on the server
  if (config.headers['X-API-Key']) {
    console.log('X-API-Key found in headers, converting to Authorization header');
    // Convert X-API-Key header to Authorization header for OpenRouter API
    config.headers['Authorization'] = `Bearer ${config.headers['X-API-Key']}`;
    // Remove the X-API-Key header as it's not needed by OpenRouter
    delete config.headers['X-API-Key'];
    console.log('Headers after conversion:', Object.keys(config.headers || {}));
    return config;
  }
  
  // Fallback to server API key if available (for testing only)
  if (process.env.OPENROUTER_API_KEY) {
    console.log('Using server API key from environment variables');
    config.headers['Authorization'] = `Bearer ${process.env.OPENROUTER_API_KEY}`;
  } else {
    console.log('No API key found, request will likely fail');
  }
  
  return config;
});

// Get available models
export const getAvailableModels = async (apiKey) => {
  try {
    console.log('Getting available models with API key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key provided');
    
    // Create a direct request to the OpenRouter API
    const headers = {
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
      'X-Title': 'LLM Benchmark',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      console.log('Authorization header set for models request');
    } else {
      console.log('No API key provided for models request, using public models only');
    }
    
    console.log('Request headers:', Object.keys(headers));
    
    // Make a direct request to OpenRouter API
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers,
    });
    
    console.log('Models response received:', {
      status: response.status,
      statusText: response.statusText,
      modelCount: response.data?.data?.length || 0,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching available models:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers ? Object.keys(error.response.headers) : 'No headers',
    });
    throw error;
  }
};

// Generate completion
export const generateCompletion = async (model, prompt, options = {}, apiKey) => {
  try {
    console.log('Generating completion with API key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key provided');
    
    // Create a direct request to the OpenRouter API
    const headers = {
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
      'X-Title': 'LLM Benchmark',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      console.log('Authorization header set for completion request');
    } else {
      console.log('No API key provided for completion request, will likely fail');
    }
    
    console.log('Request payload:', {
      model,
      prompt: prompt.substring(0, 50) + '...',
      ...options,
    });
    
    console.log('Request headers:', Object.keys(headers));
    
    // Make a direct request to OpenRouter API
    const response = await axios.post('https://openrouter.ai/api/v1/completions', {
      model,
      prompt,
      ...options,
    }, {
      headers,
    });
    
    console.log('Completion response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data ? 'Data received' : 'No data',
    });
    
    return response.data;
  } catch (error) {
    console.error('Error generating completion:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers ? Object.keys(error.response.headers) : 'No headers',
    });
    throw error;
  }
};

// Generate chat completion
export const generateChatCompletion = async (model, messages, options = {}, apiKey) => {
  try {
    console.log('Generating chat completion with API key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key provided');
    
    // Create a direct request to the OpenRouter API
    const headers = {
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
      'X-Title': 'LLM Benchmark',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      console.log('Authorization header set:', `Bearer ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
    } else {
      console.log('No API key provided, request will likely fail');
    }
    
    console.log('Request payload:', {
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 20) + '...' })),
      ...options,
    });
    
    console.log('Request headers:', Object.keys(headers));
    
    // Make a direct request to OpenRouter API instead of using the client
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages,
      ...options,
    }, {
      headers,
    });
    
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data ? 'Data received' : 'No data',
    });
    
    return response.data;
  } catch (error) {
    console.error('Error generating chat completion:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers ? Object.keys(error.response.headers) : 'No headers',
    });
    throw error;
  }
};

// Run a benchmark test for a single model and prompt
export const runModelTest = async (model, prompt, options = {}, apiKey) => {
  const startTime = Date.now();
  
  try {
    console.log(`Running model test for ${model} with API key: ${apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key provided'}`);
    
    if (!apiKey) {
      console.error('No API key provided for model test, this will likely fail');
      throw new Error('API key is required for model testing');
    }
    
    const messages = [{ role: 'user', content: prompt }];
    console.log(`Test prompt: "${prompt.substring(0, 50)}..."`);
    
    const response = await generateChatCompletion(
      model,
      messages,
      options,
      apiKey
    );
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    console.log(`Model test for ${model} completed successfully in ${latency}ms`);
    
    return {
      model,
      output: response.choices[0].message.content,
      latency,
      tokenCount: {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
        total: response.usage.total_tokens,
      },
      raw: response,
    };
  } catch (error) {
    console.error(`Error running model test for ${model}:`, error.response?.data || error.message);
    
    return {
      model,
      error: error.response?.data?.error || error.message,
      latency: Date.now() - startTime,
    };
  }
};

// Validate API key and check credits
export const validateApiKey = async (apiKey) => {
  try {
    console.log('Validating API key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key provided');
    
    if (!apiKey) {
      return {
        valid: false,
        error: 'API key is required'
      };
    }
    
    // Create headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
      'X-Title': 'LLM Benchmark',
      'Authorization': `Bearer ${apiKey}`
    };
    
    // Make a request to the OpenRouter API to check the key
    const response = await axios.get('https://openrouter.ai/api/v1/auth/key', {
      headers
    });
    
    console.log('API key validation response:', {
      status: response.status,
      statusText: response.statusText
    });
    
    // Log the full response for debugging
    console.log('API key validation response data:', JSON.stringify(response.data, null, 2));
    
    // Extract credit information from the response
    // OpenRouter API returns data in different formats depending on the endpoint
    let credits = null;
    let limit = null;
    
    // Try to extract credit information from different possible formats
    if (response.data.credits !== undefined) {
      credits = response.data.credits;
    } else if (response.data.data?.usage !== undefined) {
      // The /auth/key endpoint returns usage instead of credits
      credits = 1000 - (response.data.data.usage * 1000); // Convert usage to available credits
    }
    
    if (response.data.limit !== undefined) {
      limit = response.data.limit;
    } else if (response.data.data?.limit !== undefined) {
      limit = response.data.data.limit;
    }
    
    // Check if we have enough credits for a typical request
    // If we can't determine credits, we need to make a test call to check
    const hasCredits = credits === null ? true : credits >= 500;
    
    console.log('Credit check results:', {
      credits,
      limit,
      hasCredits,
      creditInfoProvided: credits !== null,
      usage: response.data.data?.usage
    });
    
    return {
      valid: true,
      credits,
      limit,
      hasCredits,
      data: response.data
    };
  } catch (error) {
    console.error('Error validating API key:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // Determine the specific error
    let errorMessage = 'API key validation failed';
    
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        errorMessage = 'Invalid API key';
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }
    }
    
    return {
      valid: false,
      error: errorMessage,
      details: error.response?.data || error.message
    };
  }
};

/**
 * Get available models from OpenRouter (alias for getAvailableModels)
 * @param {string} apiKey - OpenRouter API key
 * @returns {Promise<Array>} - List of available models
 */
export const getOpenRouterModels = async (apiKey = process.env.OPENROUTER_API_KEY) => {
  return getAvailableModels(apiKey);
};

export default {
  getAvailableModels,
  getOpenRouterModels,
  generateCompletion,
  generateChatCompletion,
  runModelTest,
  validateApiKey
};
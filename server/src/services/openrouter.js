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
export const validateApiKey = async (apiKey, req = null) => {
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
    
    // Extract credit information from the response using a more robust approach
    let credits = null;
    let limit = null;
    let defaultCreditLimit = 1000; // Default credit limit if not provided by API
    
    // Enhanced logging for response structure analysis
    console.log('Response structure check:', {
      hasCreditsField: response.data.credits !== undefined,
      hasDataField: response.data.data !== undefined,
      hasUsageField: response.data.data?.usage !== undefined,
      hasLimitField: response.data.limit !== undefined || response.data.data?.limit !== undefined,
      responseKeys: Object.keys(response.data),
      dataKeys: response.data.data ? Object.keys(response.data.data) : 'No data field'
    });
    
    // Try to extract credit information from different possible formats
    // First priority: direct credits field
    if (response.data.credits !== undefined) {
      console.log('Using direct credits field:', response.data.credits);
      credits = response.data.credits;
    }
    // Second priority: extract from usage with dynamic limit
    else if (response.data.data?.usage !== undefined) {
      // Check if there's a manually set credit limit in the request
      const manualCreditLimit = req?.creditLimit;
      
      // Always prioritize the manual credit limit if provided
      // Only fall back to API response or default if not provided
      const creditLimit = manualCreditLimit ?
                         parseInt(manualCreditLimit, 10) :
                         response.data.data?.limit ||
                         response.data.limit ||
                         defaultCreditLimit;
                         
      console.log('Using credit limit:', manualCreditLimit ?
                 `${manualCreditLimit} (manually set)` :
                 `${creditLimit} (from API or default)`);
      
      // Calculate available credits based on usage value and limit
      const usageValue = response.data.data.usage;
      
      // The correct calculation is simply: creditLimit - usageValue
      // This treats usage as an absolute value, not a percentage
      credits = creditLimit - usageValue;
      
      console.log('Calculated credits from usage:', {
        usageValue,
        creditLimit,
        calculatedCredits: credits,
        calculation: `${creditLimit} - ${usageValue} = ${credits}`
      });
    }
    // Third priority: try to find credits in nested objects
    else if (response.data.data) {
      // Look for any field that might contain credit information
      const possibleCreditFields = ['credits', 'credit', 'balance', 'available'];
      for (const field of possibleCreditFields) {
        if (response.data.data[field] !== undefined) {
          console.log(`Found credits in data.${field}:`, response.data.data[field]);
          credits = response.data.data[field];
          break;
        }
      }
    }
    
    // Extract limit information
    if (response.data.limit !== undefined) {
      limit = response.data.limit;
    } else if (response.data.data?.limit !== undefined) {
      limit = response.data.data.limit;
    } else {
      // If no limit is provided, use the default
      limit = defaultCreditLimit;
      console.log(`No limit found in response, using default: ${defaultCreditLimit}`);
    }
    
    // Minimum recommended credits for benchmarks
    const minimumRecommendedCredits = 500;
    
    // Check if we have enough credits for a typical request
    // If we can't determine credits, we need to make a test call to check
    const hasCredits = credits === null ? true : credits >= minimumRecommendedCredits;
    
    console.log('Credit check results:', {
      credits,
      limit,
      hasCredits,
      creditInfoProvided: credits !== null,
      minimumRecommendedCredits,
      usage: response.data.data?.usage
    });
    
    return {
      valid: true,
      credits,
      limit,
      hasCredits,
      minimumRecommendedCredits,
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

/**
 * Check token capacity for a specific model
 * @param {string} modelId - The model ID to check
 * @param {string} apiKey - OpenRouter API key
 * @param {Object} req - Request object containing creditLimit
 * @returns {Promise<Object>} - Token capacity information
 */
export const checkModelTokenCapacity = async (modelId, apiKey = process.env.OPENROUTER_API_KEY, req = null) => {
  try {
    console.log(`Checking token capacity for model ${modelId}`);
    
    if (!apiKey) {
      console.error('No API key provided for token capacity check');
      return {
        success: false,
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
    
    console.log('Headers for token capacity check:', Object.keys(headers));
    
    // First, validate the API key to get general credit information
    console.log('Validating API key before token capacity check');
    // Create a mock request object with the apiKey
    const mockReq = {
      apiKey: apiKey,
      creditLimit: null // We don't have access to the request headers here
    };
    const keyValidation = await validateApiKey(apiKey, mockReq);
    console.log('API key validation result:', {
      valid: keyValidation.valid,
      credits: keyValidation.credits,
      error: keyValidation.error || 'None'
    });
    
    if (!keyValidation.valid) {
      return {
        success: false,
        error: keyValidation.error || 'Invalid API key'
      };
    }
    
    // Make a test request to the model to check token capacity
    // We'll use a more realistic prompt that matches the actual benchmark usage
    const testPrompt = "Generate 3 test cases for a benchmark on the topic of artificial intelligence. Each test case should include a prompt, expected output, and category.";
    
    try {
      console.log(`Making test request to model ${modelId}`);
      
      // Make a request to the chat completions endpoint
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: modelId,
        messages: [{ role: 'user', content: testPrompt }],
        temperature: 0.7,
        max_tokens: 2048 // Match the token limit used in the benchmark
      }, {
        headers
      });
      
      console.log('Test request successful:', {
        status: response.status,
        usage: response.data.usage
      });
      
      // If we get here, the request was successful
      return {
        success: true,
        modelId,
        availableTokenCapacity: true,
        credits: keyValidation.credits,
        usage: response.data.usage
      };
    } catch (modelError) {
      console.error('Error in test request:', modelError.message);
      console.error('Error response:', modelError.response?.data);
      
      // Check if this is a token capacity error
      if (modelError.response?.data?.error?.message?.includes('token capacity required')) {
        // Extract the required and available token capacity from the error message
        const errorMsg = modelError.response.data.error.message;
        console.log('Token capacity error message:', errorMsg);
        
        const requiredMatch = errorMsg.match(/(\d+) token capacity required/);
        const availableMatch = errorMsg.match(/(\d+) available/);
        
        const requiredCapacity = requiredMatch ? parseInt(requiredMatch[1]) : null;
        const availableCapacity = availableMatch ? parseInt(availableMatch[1]) : null;
        
        console.log('Extracted capacity information:', {
          requiredCapacity,
          availableCapacity
        });
        
        return {
          success: false,
          modelId,
          availableTokenCapacity: false,
          requiredCapacity,
          availableCapacity,
          credits: keyValidation.credits,
          error: errorMsg
        };
      }
      
      // For other errors, return the error message
      return {
        success: false,
        modelId,
        error: modelError.response?.data?.error?.message || modelError.message
      };
    }
  } catch (error) {
    console.error(`Error checking token capacity for model ${modelId}:`, error.message);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      modelId,
      error: error.message
    };
  }
};

export default {
  getAvailableModels,
  getOpenRouterModels,
  generateCompletion,
  generateChatCompletion,
  runModelTest,
  validateApiKey,
  checkModelTokenCapacity
};
import axios from 'axios';
import dotenv from 'dotenv';
import promptTemplates from './prompt-templates.js';

// Load environment variables
dotenv.config();

/**
 * Custom OpenRouter model class that directly uses axios
 * This gives us full control over the API requests
 */
class OpenRouterModel {
  constructor(fields) {
    this.modelName = fields.modelName;
    this.apiKey = fields.openAIApiKey;
    this.temperature = fields.temperature || 0.7;
    this.maxTokens = fields.maxTokens; // No default limit
    this._lastCallTokenUsage = null;
    this._lastResponse = null;
    
    // Create an axios instance for OpenRouter
    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
        'X-Title': 'LLM Benchmark',
      },
    });
  }
  
  /**
   * Call the model with a list of messages
   * @param {Array} messages - Array of message objects with role and content
   * @returns {Promise<Object>} - Model response
   */
  async call(messages) {
    try {
      console.log(`Calling OpenRouter model ${this.modelName} with ${messages.length} messages`);
      
      // Prepare request parameters
      const requestParams = {
        model: this.modelName,
        messages,
        temperature: this.temperature,
      };
      
      // Only include max_tokens if it's defined
      if (this.maxTokens !== undefined) {
        requestParams.max_tokens = this.maxTokens;
      }
      
      // Make the API request
      const response = await this.client.post('/chat/completions', requestParams);
      
      // Log the response for debugging
      console.log('OpenRouter response received:', {
        status: response.status,
        statusText: response.statusText,
        hasChoices: Array.isArray(response.data?.choices) && response.data.choices.length > 0,
        hasUsage: !!response.data?.usage
      });
      
      // Check for error in the response data
      if (response.data?.error) {
        console.error('Error in OpenRouter response:', JSON.stringify(response.data.error, null, 2));
        
        // Check specifically for credit-related errors
        // Log detailed error information for debugging
        console.error('Detailed OpenRouter error:', JSON.stringify(response.data.error, null, 2));
        
        if (response.data.error.code === 402 ||
            (response.data.error.message &&
             (response.data.error.message.includes('credits') ||
              response.data.error.message.includes('capacity') ||
              response.data.error.message.includes('quota')))) {
          // This might be a rate limit or tier restriction rather than insufficient credits
          throw new Error(`OpenRouter API request failed: ${response.data.error.message}. Please check your OpenRouter account settings or try a model with lower token requirements.`);
        }
        
        throw new Error(`OpenRouter API error: ${response.data.error.message || JSON.stringify(response.data.error)}`);
      }
      
      // Store the response for later use
      this._lastResponse = response.data;
      
      // Extract token usage
      this._lastCallTokenUsage = {
        promptTokens: response.data.usage?.prompt_tokens || 0,
        completionTokens: response.data.usage?.completion_tokens || 0,
        totalTokens: response.data.usage?.total_tokens || 0,
      };
      
      // Check if the response has the expected format
      if (!response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
        console.error('Unexpected response format from OpenRouter:', JSON.stringify(response.data, null, 2));
        throw new Error('Unexpected response format from OpenRouter: No choices returned');
      }
      
      // Check if the first choice has a message with content
      if (!response.data.choices[0].message || typeof response.data.choices[0].message.content !== 'string') {
        console.error('Unexpected message format in OpenRouter response:', JSON.stringify(response.data.choices[0], null, 2));
        throw new Error('Unexpected message format in OpenRouter response');
      }
      
      // Return the response in the expected format
      return {
        content: response.data.choices[0].message.content,
      };
    } catch (error) {
      // Log detailed error information
      console.error('Error calling OpenRouter:', error.response?.data || error.message);
      
      if (error.response) {
        console.error('OpenRouter API error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: Object.keys(error.response.headers || {})
        });
      }
      
      // Check for specific error conditions
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(`OpenRouter API authentication error: ${error.response.data?.error || 'Invalid API key or insufficient permissions'}`);
      } else if (error.response?.status === 429) {
        throw new Error(`OpenRouter API rate limit exceeded: ${error.response.data?.error?.message || error.response.data?.error || 'Too many requests'}`);
      } else if (error.response?.data?.error?.message?.includes('insufficient_quota') ||
                error.response?.data?.error?.message?.includes('token capacity required')) {
        // Log detailed error information for debugging
        console.error('Detailed OpenRouter quota error:', JSON.stringify(error.response.data, null, 2));
        
        // This might be a rate limit, tier restriction, or model-specific limitation
        throw new Error(`OpenRouter API request failed: ${error.response.data.error.message}. This may be due to tier restrictions rather than insufficient credits. Try using a different model or contact OpenRouter support.`);
      } else if (error.response?.data?.error?.message?.includes('data policy')) {
        // Handle data policy error specifically
        throw new Error(`OpenRouter API data policy error: ${error.response.data.error.message}. Please visit https://openrouter.ai/settings/privacy to update your data policy settings.`);
      } else if (error.response?.data?.error) {
        // Handle both string and object error formats
        const errorMessage = typeof error.response.data.error === 'object'
          ? error.response.data.error.message || JSON.stringify(error.response.data.error)
          : error.response.data.error;
        throw new Error(`OpenRouter API error: ${errorMessage}`);
      } else {
        throw new Error(`OpenRouter API error: ${error.message}`);
      }
    }
  }
  
  /**
   * Invoke the model with a single input
   * @param {Object} input - Input object with text
   * @returns {Promise<string>} - Model response text
   */
  async invoke(input) {
    try {
      // Convert input to messages format
      const messages = [
        { role: 'user', content: input.input },
      ];
      
      // Call the model
      const response = await this.call(messages);
      
      // Return the response content
      return response.content;
    } catch (error) {
      console.error('Error invoking OpenRouter:', error);
      throw error;
    }
  }
}

/**
 * Get available models from OpenRouter
 * @param {string} apiKey - OpenRouter API key
 * @returns {Promise<Array>} - List of available models
 */
export const getAvailableModels = async (apiKey) => {
  try {
    console.log('Getting available models with API key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key provided');
    
    // Create headers for the request
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
    throw error;
  }
};

/**
 * Get a model instance for the specified model
 * @param {string} modelId - Model ID (e.g., 'openai/gpt-4')
 * @param {Object} parameters - Model parameters
 * @param {string} apiKey - API key
 * @returns {OpenRouterModel} - Model instance
 */
export const getModelInstance = (modelId, parameters = {}, apiKey) => {
  if (!apiKey) {
    throw new Error('API key is required for model instantiation');
  }

  // Set up common parameters
  const modelParams = {
    temperature: parameters.temperature || 0.7,
    maxTokens: parameters.max_tokens, // No default limit
    modelName: modelId,
    openAIApiKey: apiKey,
  };

  // Create and return the model instance
  return new OpenRouterModel(modelParams);
};

/**
 * Run a model test using LangChain
 * @param {string} model - Model ID
 * @param {string} prompt - Test prompt
 * @param {Object} options - Model parameters
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} - Test result
 */
export const runModelTest = async (model, prompt, options = {}, apiKey) => {
  const startTime = Date.now();
  
  try {
    console.log(`Running model test for ${model} with LangChain`);
    
    if (!apiKey) {
      console.error('No API key provided for model test, this will likely fail');
      throw new Error('API key is required for model testing');
    }
    
    // Create a model instance
    const llm = getModelInstance(model, options, apiKey);
    
    // Determine the category from options or default to text-completion
    const category = options.category || 'text-completion';
    
    // Format the prompt using the appropriate template
    const formattedPrompt = await promptTemplates.formatPromptWithTemplate(
      category,
      prompt,
      options.templateVariables || {}
    );
    
    console.log(`Test category: ${category}`);
    console.log(`Test prompt: "${prompt.substring(0, 50)}..."`);
    console.log(`Formatted prompt: "${formattedPrompt.substring(0, 50)}..."`);
    
    // Call the model directly instead of using pipe
    const response = await llm.invoke({ input: formattedPrompt });
    
    // Calculate latency
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    console.log(`Model test for ${model} completed successfully in ${latency}ms`);
    
    // Get token usage from the LLM's last call
    const tokenUsage = llm._lastCallTokenUsage || {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };
    
    return {
      model,
      output: response,
      latency,
      tokenCount: {
        input: tokenUsage.promptTokens || 0,
        output: tokenUsage.completionTokens || 0,
        total: tokenUsage.totalTokens || 0,
      },
      raw: llm._lastResponse || {},
    };
  } catch (error) {
    console.error(`Error running model test for ${model}:`, error.message);
    
    return {
      model,
      error: error.message,
      latency: Date.now() - startTime,
    };
  }
};

/**
 * Generate a completion using LangChain
 * @param {string} model - Model ID
 * @param {string} prompt - Prompt text
 * @param {Object} options - Model parameters
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} - Completion result
 */
export const generateCompletion = async (model, prompt, options = {}, apiKey) => {
  try {
    console.log('Generating completion with LangChain');
    
    // Create a model instance
    const llm = getModelInstance(model, options, apiKey);
    
    // Call the model directly
    const response = await llm.invoke({ input: prompt });
    
    // Format the response to match the OpenRouter API format
    return {
      id: `langchain-${Date.now()}`,
      object: "completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          text: response,
          index: 0,
          logprobs: null,
          finish_reason: "stop"
        }
      ],
      usage: llm._lastCallTokenUsage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  } catch (error) {
    console.error('Error generating completion:', error.message);
    throw error;
  }
};

/**
 * Generate a chat completion using LangChain
 * @param {string} model - Model ID
 * @param {Array} messages - Chat messages
 * @param {Object} options - Model parameters
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} - Chat completion result
 */
export const generateChatCompletion = async (model, messages, options = {}, apiKey) => {
  try {
    console.log('Generating chat completion with LangChain');
    
    // Create a model instance
    const llm = getModelInstance(model, options, apiKey);
    
    // Format messages for OpenRouter
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Call the model
    const response = await llm.call(formattedMessages);
    
    // Format the response to match the OpenRouter API format
    return {
      id: `langchain-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          message: {
            role: "assistant",
            content: response.content
          },
          index: 0,
          finish_reason: "stop"
        }
      ],
      usage: llm._lastCallTokenUsage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  } catch (error) {
    console.error('Error generating chat completion:', error.message);
    throw error;
  }
};

// Import the validateApiKey and checkModelTokenCapacity functions from openrouter.js
import { validateApiKey, checkModelTokenCapacity } from './openrouter.js';

// Get the credit limit from environment variable or use a reasonable default
const DEFAULT_CREDIT_LIMIT = process.env.OPENROUTER_CREDIT_LIMIT || '1000';

/**
 * Check available token capacity for OpenRouter
 * @param {string} apiKey - OpenRouter API key
 * @param {string} modelId - Model ID to check capacity for
 * @returns {Promise<number>} - Available token capacity
 */
export const checkTokenCapacity = async (apiKey, modelId) => {
  try {
    // Create a mock request object with the credit limit from environment
    const mockReq = {
      apiKey: apiKey,
      creditLimit: DEFAULT_CREDIT_LIMIT
    };
    
    // First try to get capacity information from validateApiKey
    const keyValidation = await validateApiKey(apiKey, mockReq);
    
    if (!keyValidation.valid) {
      console.error('API key validation failed:', keyValidation.error);
      return 300; // Conservative estimate
    }
    
    // If we have credits information from validateApiKey, use it
    if (keyValidation.credits !== null && keyValidation.credits !== undefined) {
      console.log(`Available OpenRouter credits from validateApiKey: ${keyValidation.credits}`);
      return keyValidation.credits;
    }
    
    // If we don't have credits information, try checkModelTokenCapacity
    if (modelId) {
      const capacityCheck = await checkModelTokenCapacity(modelId, apiKey, mockReq);
      
      if (capacityCheck.availableCapacity) {
        console.log(`Available token capacity for model ${modelId}: ${capacityCheck.availableCapacity}`);
        return capacityCheck.availableCapacity;
      }
    }
    
    // If we still don't have capacity information, extract it from error messages
    // This is done in the generateWithLangchain function when handling errors
    
    // Return a conservative estimate if we can't determine the capacity
    return parseInt(DEFAULT_CREDIT_LIMIT, 10) * 0.3; // 30% of the credit limit as a conservative estimate
  } catch (error) {
    console.error('Error checking token capacity:', error.message);
    // Return a conservative estimate if we can't check
    return parseInt(DEFAULT_CREDIT_LIMIT, 10) * 0.3; // 30% of the credit limit as a conservative estimate
  }
};

/**
 * Generate text using LangChain with a simple prompt
 * @param {string} prompt - The prompt text
 * @param {Object} options - Model parameters including model, temperature, max_tokens
 * @param {string} apiKey - API key (optional, will use environment variable if not provided)
 * @returns {Promise<string>} - The generated text
 */
export const generateWithLangchain = async (prompt, options = {}, apiKey = process.env.OPENROUTER_API_KEY) => {
  try {
    console.log('Generating text with LangChain');
    
    // Get the model from options
    const model = options.model || "openai/gpt-4-turbo";
    
    // Check available token capacity for this specific model
    const availableCapacity = await checkTokenCapacity(apiKey, model);
    
    // Adjust options based on available capacity
    const adjustedOptions = { ...options };
    
    // If requested max_tokens exceeds available capacity, adjust it
    if (adjustedOptions.max_tokens && adjustedOptions.max_tokens > availableCapacity) {
      console.log(`Adjusting max_tokens from ${adjustedOptions.max_tokens} to ${availableCapacity - 50} due to capacity limits`);
      // Leave some buffer for the prompt tokens
      adjustedOptions.max_tokens = Math.max(100, availableCapacity - 50);
    }
    
    // If capacity is very low, use a more efficient model
    let modelToUse = model;
    
    if (availableCapacity < 500) {
      // For Claude models, switch to GPT-3.5 Turbo
      if (model.includes('claude-3')) {
        console.log(`Low token capacity (${availableCapacity}) for Claude model, switching to GPT-3.5 Turbo`);
        modelToUse = "openai/gpt-3.5-turbo";
      }
      // For GPT-4 models, switch to GPT-3.5 Turbo
      else if (model.includes('gpt-4')) {
        console.log(`Low token capacity (${availableCapacity}) for GPT-4 model, switching to GPT-3.5 Turbo`);
        modelToUse = "openai/gpt-3.5-turbo";
      }
      // For other models, keep the original but reduce max_tokens further
      else {
        console.log(`Low token capacity (${availableCapacity}), reducing max_tokens further`);
        adjustedOptions.max_tokens = Math.max(50, availableCapacity - 100);
      }
    }
    
    console.log(`Using model ${modelToUse} with max_tokens ${adjustedOptions.max_tokens || 'default'}`);
    
    // Create a model instance with adjusted parameters
    const llm = getModelInstance(modelToUse, adjustedOptions, apiKey);
    
    // Call the model directly
    const response = await llm.invoke({ input: prompt });
    
    return response;
  } catch (error) {
    console.error('Error generating text with LangChain:', error.message);
    
    // If the error is related to token capacity, try again with reduced requirements
    if (error.message.includes('token capacity required') || error.message.includes('credits are required')) {
      console.log('Token capacity error detected, retrying with minimal requirements');
      
      // Extract available capacity from error message if possible
      const capacityMatch = error.message.match(/(\d+) token capacity required, (\d+) available/);
      const availableCapacity = capacityMatch ? parseInt(capacityMatch[2]) : 200;
      
      console.log(`Extracted available capacity from error: ${availableCapacity}`);
      
      // Create minimal options
      const minimalOptions = {
        ...options,
        model: "openai/gpt-3.5-turbo", // Use most efficient model
        max_tokens: Math.max(50, availableCapacity - 50) // Leave buffer for prompt
      };
      
      console.log(`Retrying with model ${minimalOptions.model} and max_tokens ${minimalOptions.max_tokens}`);
      
      // Create a model instance with minimal requirements
      const llm = getModelInstance(minimalOptions.model, minimalOptions, apiKey);
      
      try {
        // Call the model directly
        return await llm.invoke({ input: prompt });
      } catch (retryError) {
        console.error('Error in retry attempt:', retryError.message);
        
        // If we still have an error, try one last time with an even smaller request
        if (retryError.message.includes('token capacity required') || retryError.message.includes('credits are required')) {
          // Extract available capacity again
          const retryCapacityMatch = retryError.message.match(/(\d+) token capacity required, (\d+) available/);
          const retryAvailableCapacity = retryCapacityMatch ? parseInt(retryCapacityMatch[2]) : 100;
          
          // Create absolute minimal options
          const lastResortOptions = {
            model: "openai/gpt-3.5-turbo",
            temperature: 0.7,
            max_tokens: Math.max(20, retryAvailableCapacity - 80) // Leave even more buffer
          };
          
          console.log(`Final retry with max_tokens ${lastResortOptions.max_tokens}`);
          
          // Create a model instance with absolute minimal requirements
          const lastResortLlm = getModelInstance(lastResortOptions.model, lastResortOptions, apiKey);
          
          // Simplify the prompt if possible
          const simplifiedPrompt = prompt.length > 500 ? prompt.substring(0, 500) + "..." : prompt;
          
          // Call the model with simplified prompt
          return await lastResortLlm.invoke({ input: simplifiedPrompt });
        }
        
        throw retryError;
      }
    }
    
    throw error;
  }
};

export default {
  getAvailableModels,
  generateCompletion,
  generateChatCompletion,
  runModelTest,
  getModelInstance,
  generateWithLangchain
};
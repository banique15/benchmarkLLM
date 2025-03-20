import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Ollama API URL from environment or use default
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

// Create axios instance for Ollama API
const ollamaClient = axios.create({
  baseURL: OLLAMA_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout for long-running requests
});

/**
 * Get list of available Ollama models
 * @returns {Promise<Array>} Array of available models
 */
export const getOllamaModels = async () => {
  try {
    console.log('Fetching available Ollama models from:', OLLAMA_API_URL);
    const response = await ollamaClient.get('/api/tags');
    
    if (!response.data || !response.data.models) {
      console.warn('Unexpected response format from Ollama API:', response.data);
      return [];
    }
    
    // Format the response to match our application's model format
    const formattedModels = response.data.models.map(model => ({
      id: model.name,
      name: model.name,
      description: `${model.name} (${formatSize(model.size)})`,
      size: model.size,
      modified: model.modified,
      parameters: {
        temperature: 0.7,
        top_p: 1,
        max_tokens: 2048
      }
    }));
    
    console.log(`Found ${formattedModels.length} Ollama models`);
    return formattedModels;
  } catch (error) {
    console.error('Error fetching Ollama models:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error(`Failed to fetch Ollama models: ${error.message}`);
  }
};

/**
 * Run a prompt against an Ollama model
 * @param {string} modelId - The model ID
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} The model's response and metrics
 */
export const runOllamaPrompt = async (modelId, prompt, options = {}) => {
  try {
    console.log(`Running prompt against Ollama model: ${modelId}`);
    console.log(`Prompt length: ${prompt.length} characters`);
    
    const startTime = Date.now();
    
    const requestBody = {
      model: modelId,
      prompt: prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 1,
        num_predict: options.max_tokens || 2048,
      }
    };
    
    const response = await ollamaClient.post('/api/generate', requestBody);
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    if (!response.data) {
      throw new Error('Empty response from Ollama API');
    }
    
    // Extract the response and metrics
    const result = {
      output: response.data.response || '',
      latency: latency,
      token_count: response.data.eval_count || 0,
      prompt_token_count: response.data.prompt_eval_count || 0,
      total_token_count: (response.data.eval_count || 0) + (response.data.prompt_eval_count || 0),
      raw_response: response.data
    };
    
    console.log(`Received response from ${modelId} in ${latency}ms`);
    console.log(`Token count: ${result.token_count} (response) + ${result.prompt_token_count} (prompt) = ${result.total_token_count} (total)`);
    
    return result;
  } catch (error) {
    console.error(`Error running prompt against Ollama model ${modelId}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error(`Failed to run prompt against Ollama model ${modelId}: ${error.message}`);
  }
};

/**
 * Check if Ollama server is running
 * @returns {Promise<boolean>} True if Ollama server is running
 */
export const checkOllamaServer = async () => {
  try {
    await ollamaClient.get('/api/tags');
    return true;
  } catch (error) {
    console.error('Ollama server check failed:', error.message);
    return false;
  }
};

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Evaluate the quality of a model's response
 * This is a simple implementation that could be expanded
 * @param {string} output - The model's response
 * @param {string} expectedOutput - The expected output (if available)
 * @param {string} difficulty - The difficulty level
 * @returns {number} Score between 0 and 1
 */
export const evaluateResponse = (output, expectedOutput, difficulty) => {
  // This is a placeholder for a more sophisticated evaluation
  // In a real implementation, you would use more advanced techniques
  
  // Check if the output is empty
  if (!output || output.trim() === '') {
    return 0;
  }
  
  // Basic checks for React code
  const hasReactImport = output.includes('import React') || output.includes('from "react"') || output.includes("from 'react'");
  const hasComponentDefinition = output.includes('function') && output.includes('return') && 
                               (output.includes('(') && output.includes(')') && output.includes('{') && output.includes('}'));
  const hasJSX = output.includes('<') && output.includes('>') && output.includes('</');
  
  // Additional checks based on difficulty
  let score = 0;
  
  // Base score for having React code
  if (hasReactImport) score += 0.1;
  if (hasComponentDefinition) score += 0.2;
  if (hasJSX) score += 0.2;
  
  // Difficulty-specific checks
  switch (difficulty) {
    case 'basic':
      // For basic, just having a component that compiles is good
      if (hasReactImport && hasComponentDefinition && hasJSX) {
        score += 0.3;
      }
      break;
      
    case 'intermediate':
      // Check for hooks
      if (output.includes('useState')) score += 0.1;
      if (output.includes('useEffect')) score += 0.1;
      if (output.includes('onChange') || output.includes('onClick')) score += 0.1;
      break;
      
    case 'advanced':
      // Check for advanced hooks and patterns
      if (output.includes('useContext')) score += 0.05;
      if (output.includes('useReducer')) score += 0.05;
      if (output.includes('useMemo')) score += 0.05;
      if (output.includes('useCallback')) score += 0.05;
      if (output.includes('createContext')) score += 0.05;
      if (output.includes('Provider')) score += 0.05;
      break;
      
    case 'expert':
      // Check for expert patterns
      if (output.includes('custom hook') || output.includes('function use')) score += 0.05;
      if (output.includes('React.memo') || output.includes('memo(')) score += 0.05;
      if (output.includes('forwardRef')) score += 0.05;
      if (output.includes('useImperativeHandle')) score += 0.05;
      if (output.includes('createPortal')) score += 0.05;
      break;
  }
  
  // Cap the score at 1
  return Math.min(1, score);
};

export default {
  getOllamaModels,
  runOllamaPrompt,
  checkOllamaServer,
  evaluateResponse
};
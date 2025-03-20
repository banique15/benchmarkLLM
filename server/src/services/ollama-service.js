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
  timeout: 300000, // 5 minute timeout for long-running requests
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
 * @returns {Object} Scores for overall and each category
 */
export const evaluateResponse = (output, expectedOutput, difficulty) => {
  // This is a placeholder for a more sophisticated evaluation
  // In a real implementation, you would use more advanced techniques
  
  // Check if the output is empty
  if (!output || output.trim() === '') {
    return {
      overallScore: 0,
      categoryScores: {
        accuracy: 0,
        correctness: 0,
        efficiency: 0
      }
    };
  }
  
  // Basic checks for React code
  const hasReactImport = output.includes('import React') || output.includes('from "react"') || output.includes("from 'react'");
  const hasComponentDefinition = output.includes('function') && output.includes('return') &&
                               (output.includes('(') && output.includes(')') && output.includes('{') && output.includes('}'));
  const hasJSX = output.includes('<') && output.includes('>') && output.includes('</');
  
  // Initialize category scores
  let accuracyScore = 0;
  let correctnessScore = 0;
  let efficiencyScore = 0;
  
  // Evaluate Code Accuracy - How well the code fulfills the requirements
  // Base score for having React code
  if (hasReactImport) accuracyScore += 0.1;
  if (hasComponentDefinition) accuracyScore += 0.2;
  if (hasJSX) accuracyScore += 0.2;
  
  // Difficulty-specific checks for accuracy
  switch (difficulty) {
    case 'basic':
      // For basic, just having a component that compiles is good
      if (hasReactImport && hasComponentDefinition && hasJSX) {
        accuracyScore += 0.3;
      }
      break;
      
    case 'intermediate':
      // Check for hooks
      if (output.includes('useState')) accuracyScore += 0.1;
      if (output.includes('useEffect')) accuracyScore += 0.1;
      if (output.includes('onChange') || output.includes('onClick')) accuracyScore += 0.1;
      break;
      
    case 'advanced':
      // Check for advanced hooks and patterns
      if (output.includes('useContext')) accuracyScore += 0.05;
      if (output.includes('useReducer')) accuracyScore += 0.05;
      if (output.includes('useMemo')) accuracyScore += 0.05;
      if (output.includes('useCallback')) accuracyScore += 0.05;
      if (output.includes('createContext')) accuracyScore += 0.05;
      if (output.includes('Provider')) accuracyScore += 0.05;
      break;
      
    case 'expert':
      // Check for expert patterns
      if (output.includes('custom hook') || output.includes('function use')) accuracyScore += 0.05;
      if (output.includes('React.memo') || output.includes('memo(')) accuracyScore += 0.05;
      if (output.includes('forwardRef')) accuracyScore += 0.05;
      if (output.includes('useImperativeHandle')) accuracyScore += 0.05;
      if (output.includes('createPortal')) accuracyScore += 0.05;
      break;
  }
  
  // Evaluate Code Correctness - Is the code free of bugs and errors
  // Check for syntax errors
  const hasSyntaxErrors = output.includes('undefined variable') ||
                         output.includes('is not defined') ||
                         output.includes('unexpected token');
  
  // Check for proper component structure
  const hasProperComponentStructure = output.includes('export default') ||
                                     output.includes('export function') ||
                                     output.includes('export const');
  
  // Check for proper JSX syntax
  const hasProperJSX = !output.includes('</div') && !output.includes('<div>') &&
                      !output.includes('<<') && !output.includes('>>');
  
  // Check for proper hook usage
  const hasProperHookUsage = !output.includes('if (') ||
                            !(output.includes('if (') && output.includes('useState('));
  
  // Calculate correctness score
  if (!hasSyntaxErrors) correctnessScore += 0.3;
  if (hasProperComponentStructure) correctnessScore += 0.3;
  if (hasProperJSX) correctnessScore += 0.2;
  if (hasProperHookUsage) correctnessScore += 0.2;
  
  // Evaluate Code Efficiency - How optimized is the code
  // Check for unnecessary re-renders
  const hasUnnecessaryRenders = output.includes('useState') &&
                               !output.includes('useCallback') &&
                               output.includes('map(') &&
                               output.includes('onClick');
  
  // Check for proper dependency arrays
  const hasProperDependencyArrays = output.includes('useEffect') &&
                                   output.includes('useEffect(') &&
                                   output.includes('[]');
  
  // Check for memoization
  const hasMemoization = output.includes('useMemo') ||
                        output.includes('useCallback') ||
                        output.includes('memo(');
  
  // Check for proper state management
  const hasProperStateManagement = output.includes('useState') &&
                                  !output.includes('this.state') &&
                                  output.includes('set');
  
  // Calculate efficiency score
  if (!hasUnnecessaryRenders) efficiencyScore += 0.25;
  if (hasProperDependencyArrays) efficiencyScore += 0.25;
  if (hasMemoization) efficiencyScore += 0.25;
  if (hasProperStateManagement) efficiencyScore += 0.25;
  
  // Cap scores at 1
  accuracyScore = Math.min(1, accuracyScore);
  correctnessScore = Math.min(1, correctnessScore);
  efficiencyScore = Math.min(1, efficiencyScore);
  
  // Calculate overall score (weighted average)
  const overallScore = (accuracyScore * 0.4) + (correctnessScore * 0.4) + (efficiencyScore * 0.2);
  
  return {
    overallScore,
    categoryScores: {
      accuracy: accuracyScore,
      correctness: correctnessScore,
      efficiency: efficiencyScore
    }
  };
};

export default {
  getOllamaModels,
  runOllamaPrompt,
  checkOllamaServer,
  evaluateResponse
};
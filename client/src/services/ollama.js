import axios from 'axios';

// Import the API_URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create an axios instance for Ollama API
const ollamaClient = axios.create({
  baseURL: `${API_URL}/api/ollama`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Check if Ollama server is running
 * @returns {Promise<Object>} Server status
 */
export const checkOllamaStatus = async () => {
  try {
    const response = await ollamaClient.get('/status');
    return response.data;
  } catch (error) {
    console.error('Error checking Ollama status:', error);
    throw error;
  }
};

/**
 * Get available Ollama models
 * @returns {Promise<Array>} Available models
 */
export const getOllamaModels = async () => {
  try {
    const response = await ollamaClient.get('/models');
    return response.data.models;
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    throw error;
  }
};

/**
 * Run a prompt against an Ollama model
 * @param {string} model - Model ID
 * @param {string} prompt - Prompt text
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Model response
 */
export const runOllamaPrompt = async (model, prompt, options = {}) => {
  try {
    const response = await ollamaClient.post('/generate', {
      model,
      prompt,
      options,
    });
    return response.data;
  } catch (error) {
    console.error('Error running Ollama prompt:', error);
    throw error;
  }
};

/**
 * Get available React test cases
 * @param {Array} difficulties - Difficulty levels to include
 * @param {number} count - Number of test cases per difficulty
 * @returns {Promise<Array>} Test cases
 */
export const getReactTestCases = async (difficulties = ['basic', 'intermediate', 'advanced', 'expert'], count = 5) => {
  try {
    const response = await ollamaClient.get('/test-cases', {
      params: {
        difficulties: difficulties.join(','),
        count,
      },
    });
    return response.data.testCases;
  } catch (error) {
    console.error('Error fetching React test cases:', error);
    throw error;
  }
};

/**
 * Create a new Ollama benchmark
 * @param {Object} config - Benchmark configuration
 * @returns {Promise<Object>} Created benchmark
 */
export const createOllamaBenchmark = async (config) => {
  try {
    const response = await ollamaClient.post('/benchmarks', config);
    return response.data;
  } catch (error) {
    console.error('Error creating Ollama benchmark:', error);
    throw error;
  }
};

/**
 * Get all Ollama benchmarks
 * @returns {Promise<Array>} Benchmarks
 */
export const getOllamaBenchmarks = async () => {
  try {
    const response = await ollamaClient.get('/benchmarks');
    return response.data.benchmarks;
  } catch (error) {
    console.error('Error fetching Ollama benchmarks:', error);
    throw error;
  }
};

/**
 * Get a specific Ollama benchmark
 * @param {string} id - Benchmark ID
 * @returns {Promise<Object>} Benchmark
 */
export const getOllamaBenchmark = async (id) => {
  try {
    const response = await ollamaClient.get(`/benchmarks/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Ollama benchmark ${id}:`, error);
    throw error;
  }
};

/**
 * Get the status of an Ollama benchmark
 * @param {string} id - Benchmark ID
 * @returns {Promise<Object>} Benchmark status
 */
export const getOllamaBenchmarkStatus = async (id) => {
  try {
    const response = await ollamaClient.get(`/benchmarks/${id}/status`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Ollama benchmark status ${id}:`, error);
    throw error;
  }
};

/**
 * Get the results of an Ollama benchmark
 * @param {string} id - Benchmark ID
 * @returns {Promise<Object>} Benchmark results
 */
export const getOllamaBenchmarkResults = async (id) => {
  try {
    const response = await ollamaClient.get(`/benchmarks/${id}/results`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Ollama benchmark results ${id}:`, error);
    throw error;
  }
};

export default {
  checkOllamaStatus,
  getOllamaModels,
  runOllamaPrompt,
  getReactTestCases,
  createOllamaBenchmark,
  getOllamaBenchmarks,
  getOllamaBenchmark,
  getOllamaBenchmarkStatus,
  getOllamaBenchmarkResults,
};
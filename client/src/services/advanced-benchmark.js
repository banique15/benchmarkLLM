import supabase from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Use the same API URL approach as in api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Generate a new advanced benchmark based on the provided topic and options
 * @param {string} topic - The topic or domain for the benchmark
 * @param {Object} options - Configuration options for the benchmark
 * @returns {Promise<Object>} - The generated benchmark configuration
 */
export const generateBenchmark = async (topic, options) => {
  try {
    // Validate inputs
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      throw new Error('Topic is required and must be a non-empty string');
    }
    
    if (!options || typeof options !== 'object') {
      options = {}; // Default to empty options if not provided
    }
    
    const response = await fetch(`${API_URL}/api/advanced-benchmark/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        options,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate benchmark';
      let errorDetails = '';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData.details || '';
        
        // If it's a credits error (402 status code)
        if (response.status === 402) {
          return {
            error: true,
            message: errorMessage,
            details: errorDetails
          };
        }
      } catch (jsonError) {
        // If response is not JSON, use status text
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating advanced benchmark:', error);
    // Return a structured error object instead of throwing
    return {
      error: true,
      message: error.message || 'An unexpected error occurred',
      details: error.toString()
    };
  }
};

/**
 * Get advanced analysis for a benchmark result
 * @param {string} resultId - The benchmark result ID
 * @param {string} analysisType - The type of analysis to perform (general, cost, domain)
 * @returns {Promise<Object>} - The analysis results
 */
export const getAdvancedAnalysis = async (resultId, analysisType = 'general') => {
  try {
    // Validate inputs
    if (!resultId) {
      throw new Error('Result ID is required');
    }
    
    // Validate analysis type
    const validTypes = ['general', 'cost', 'domain'];
    if (!validTypes.includes(analysisType)) {
      console.warn(`Invalid analysis type: ${analysisType}, defaulting to 'general'`);
      analysisType = 'general';
    }
    
    const response = await fetch(`${API_URL}/api/advanced-benchmark/analyze/${resultId}?type=${analysisType}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to get analysis';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (jsonError) {
        // If response is not JSON, use status text
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting advanced analysis:', error);
    // Return a structured error object instead of throwing
    return {
      error: true,
      message: error.message || 'An unexpected error occurred',
      details: error.toString(),
      // Return empty data structure that matches expected format
      rankings: [],
      summary: {
        error: 'Analysis failed',
        message: error.message,
        topic: 'Unknown',
        totalModels: 0
      }
    };
  }
};

/**
 * Create a new advanced benchmark configuration
 * @param {Object} config - The benchmark configuration
 * @returns {Promise<Object>} - The created benchmark configuration
 */
export const createAdvancedBenchmark = async (config) => {
  try {
    // Validate input
    if (!config || typeof config !== 'object') {
      throw new Error('Benchmark configuration is required');
    }
    
    // Add benchmark type and ensure required fields
    const benchmarkConfig = {
      ...config,
      benchmark_type: 'advanced',
      id: config.id || uuidv4(),
      name: config.name || `Advanced Benchmark ${new Date().toLocaleDateString()}`,
      created_at: config.created_at || new Date().toISOString(),
    };
    
    // Ensure test_cases is properly formatted
    if (benchmarkConfig.test_cases && typeof benchmarkConfig.test_cases === 'object' && !Array.isArray(benchmarkConfig.test_cases)) {
      benchmarkConfig.test_cases = JSON.stringify(benchmarkConfig.test_cases);
    }

    // Insert into benchmark_configs table
    const { data, error } = await supabase
      .from('benchmark_configs')
      .insert(benchmarkConfig)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create benchmark: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from database');
    }

    return data;
  } catch (error) {
    console.error('Error creating advanced benchmark:', error);
    // Return a structured error object instead of throwing
    return {
      error: true,
      message: error.message || 'An unexpected error occurred',
      details: error.toString()
    };
  }
};

/**
 * Get all advanced benchmarks
 * @returns {Promise<Array>} - List of advanced benchmarks
 */
export const getAdvancedBenchmarks = async () => {
  try {
    const { data, error } = await supabase
      .from('benchmark_configs')
      .select('*')
      .eq('benchmark_type', 'advanced')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch benchmarks: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching advanced benchmarks:', error);
    // Return a structured error object instead of throwing
    return {
      error: true,
      message: error.message || 'An unexpected error occurred',
      details: error.toString(),
      data: [] // Return empty array to prevent null reference errors
    };
  }
};

/**
 * Get an advanced benchmark by ID
 * @param {string} id - The benchmark ID
 * @returns {Promise<Object>} - The benchmark configuration
 */
export const getAdvancedBenchmarkById = async (id) => {
  try {
    // Validate input
    if (!id) {
      throw new Error('Benchmark ID is required');
    }
    
    const { data, error } = await supabase
      .from('benchmark_configs')
      .select('*')
      .eq('id', id)
      .eq('benchmark_type', 'advanced')
      .single();

    if (error) {
      // Handle "not found" error differently
      if (error.code === 'PGRST116') {
        return {
          error: true,
          message: `Benchmark with ID ${id} not found`,
          notFound: true
        };
      }
      
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch benchmark: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching advanced benchmark:', error);
    // Return a structured error object instead of throwing
    return {
      error: true,
      message: error.message || 'An unexpected error occurred',
      details: error.toString()
    };
  }
};

/**
 * Update an advanced benchmark
 * @param {string} id - The benchmark ID
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} - The updated benchmark configuration
 */
export const updateAdvancedBenchmark = async (id, updates) => {
  try {
    // Validate inputs
    if (!id) {
      throw new Error('Benchmark ID is required');
    }
    
    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates object is required');
    }
    
    // Ensure test_cases is properly formatted if present
    if (updates.test_cases && typeof updates.test_cases === 'object' && !Array.isArray(updates.test_cases)) {
      updates.test_cases = JSON.stringify(updates.test_cases);
    }
    
    // Add updated_at timestamp if not provided
    if (!updates.updated_at) {
      updates.updated_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('benchmark_configs')
      .update(updates)
      .eq('id', id)
      .eq('benchmark_type', 'advanced')
      .select()
      .single();

    if (error) {
      // Handle "not found" error differently
      if (error.code === 'PGRST116') {
        return {
          error: true,
          message: `Benchmark with ID ${id} not found`,
          notFound: true
        };
      }
      
      console.error('Supabase error:', error);
      throw new Error(`Failed to update benchmark: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from database');
    }

    return data;
  } catch (error) {
    console.error('Error updating advanced benchmark:', error);
    // Return a structured error object instead of throwing
    return {
      error: true,
      message: error.message || 'An unexpected error occurred',
      details: error.toString()
    };
  }
};

/**
 * Delete an advanced benchmark
 * @param {string} id - The benchmark ID
 * @returns {Promise<void>}
 */
export const deleteAdvancedBenchmark = async (id) => {
  try {
    // Validate input
    if (!id) {
      throw new Error('Benchmark ID is required');
    }
    
    // First check if the benchmark exists
    const { data: existingData, error: checkError } = await supabase
      .from('benchmark_configs')
      .select('id')
      .eq('id', id)
      .eq('benchmark_type', 'advanced')
      .single();
    
    if (checkError) {
      // Handle "not found" error differently
      if (checkError.code === 'PGRST116') {
        return {
          error: true,
          message: `Benchmark with ID ${id} not found`,
          notFound: true
        };
      }
      
      console.error('Supabase error checking benchmark:', checkError);
      throw new Error(`Failed to check benchmark: ${checkError.message}`);
    }
    
    // Delete the benchmark
    const { error } = await supabase
      .from('benchmark_configs')
      .delete()
      .eq('id', id)
      .eq('benchmark_type', 'advanced');

    if (error) {
      console.error('Supabase error deleting benchmark:', error);
      throw new Error(`Failed to delete benchmark: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting advanced benchmark:', error);
    // Return a structured error object instead of throwing
    return {
      error: true,
      message: error.message || 'An unexpected error occurred',
      details: error.toString()
    };
  }
};

/**
 * Get model rankings for a benchmark result
 * @param {string} resultId - The benchmark result ID
 * @returns {Promise<Array>} - The model rankings
 */
export const getModelRankings = async (resultId) => {
  try {
    // Validate input
    if (!resultId) {
      throw new Error('Result ID is required');
    }
    
    const { data, error } = await supabase
      .from('model_rankings')
      .select('*')
      .eq('benchmark_result_id', resultId)
      .order('overall_rank', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch model rankings: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching model rankings:', error);
    // Return a structured error object instead of throwing
    return {
      error: true,
      message: error.message || 'An unexpected error occurred',
      details: error.toString(),
      data: [] // Return empty array to prevent null reference errors
    };
  }
};
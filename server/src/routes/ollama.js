import express from 'express';
import { getOllamaModels, checkOllamaServer, runOllamaPrompt } from '../services/ollama-service.js';
import { 
  createOllamaBenchmark, 
  runOllamaBenchmark, 
  getBenchmarkStatus, 
  getBenchmarkResults 
} from '../services/ollama-benchmark-service.js';
import { generateReactTestCases } from '../services/react-test-generator.js';
import supabase from '../supabase.js';

const router = express.Router();

/**
 * Check if Ollama server is running
 * GET /api/ollama/status
 */
router.get('/status', async (req, res) => {
  try {
    const isRunning = await checkOllamaServer();
    
    return res.status(200).json({
      status: isRunning ? 'running' : 'not_running',
      message: isRunning ? 'Ollama server is running' : 'Ollama server is not running'
    });
  } catch (error) {
    console.error('Error checking Ollama server status:', error);
    return res.status(500).json({
      status: 'error',
      message: `Failed to check Ollama server status: ${error.message}`
    });
  }
});

/**
 * Get available Ollama models
 * GET /api/ollama/models
 */
router.get('/models', async (req, res) => {
  try {
    const models = await getOllamaModels();
    
    return res.status(200).json({
      models
    });
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return res.status(500).json({
      message: `Failed to fetch Ollama models: ${error.message}`
    });
  }
});

/**
 * Run a prompt against an Ollama model
 * POST /api/ollama/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { model, prompt, options } = req.body;
    
    if (!model) {
      return res.status(400).json({ message: 'Model is required' });
    }
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    const result = await runOllamaPrompt(model, prompt, options);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error running Ollama prompt:', error);
    return res.status(500).json({
      message: `Failed to run Ollama prompt: ${error.message}`
    });
  }
});

/**
 * Get available React test cases
 * GET /api/ollama/test-cases
 */
router.get('/test-cases', async (req, res) => {
  try {
    const { difficulties, count } = req.query;
    
    // Parse difficulties from query string
    const parsedDifficulties = difficulties ? difficulties.split(',') : ['basic', 'intermediate', 'advanced', 'expert'];
    
    // Parse count from query string
    const parsedCount = count ? parseInt(count, 10) : 5;
    
    const testCases = generateReactTestCases(parsedDifficulties, parsedCount);
    
    return res.status(200).json({
      testCases
    });
  } catch (error) {
    console.error('Error generating React test cases:', error);
    return res.status(500).json({
      message: `Failed to generate React test cases: ${error.message}`
    });
  }
});

/**
 * Create a new Ollama benchmark
 * POST /api/ollama/benchmarks
 */
router.post('/benchmarks', async (req, res) => {
  try {
    const { name, description, models, difficulties, testCasesPerDifficulty, parameters } = req.body;
    
    if (!models || !Array.isArray(models) || models.length === 0) {
      return res.status(400).json({ message: 'At least one model is required' });
    }
    
    if (!difficulties || !Array.isArray(difficulties) || difficulties.length === 0) {
      return res.status(400).json({ message: 'At least one difficulty level is required' });
    }
    
    const benchmarkConfig = {
      name,
      description,
      models,
      difficulties,
      testCasesPerDifficulty,
      parameters
    };
    
    const benchmarkResult = await createOllamaBenchmark(benchmarkConfig);
    
    // Start the benchmark asynchronously
    runOllamaBenchmark(benchmarkResult.id).catch(error => {
      console.error(`Error running benchmark ${benchmarkResult.id}:`, error);
    });
    
    return res.status(201).json(benchmarkResult);
  } catch (error) {
    console.error('Error creating Ollama benchmark:', error);
    return res.status(500).json({
      message: `Failed to create Ollama benchmark: ${error.message}`
    });
  }
});

/**
 * Get all Ollama benchmarks
 * GET /api/ollama/benchmarks
 */
router.get('/benchmarks', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ollama_benchmark_results')
      .select('*, benchmark_config:benchmark_config_id(*)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching Ollama benchmarks:', error);
      return res.status(500).json({
        message: `Failed to fetch Ollama benchmarks: ${error.message}`
      });
    }
    
    return res.status(200).json({
      benchmarks: data
    });
  } catch (error) {
    console.error('Error fetching Ollama benchmarks:', error);
    return res.status(500).json({
      message: `Failed to fetch Ollama benchmarks: ${error.message}`
    });
  }
});

/**
 * Get a specific Ollama benchmark
 * GET /api/ollama/benchmarks/:id
 */
router.get('/benchmarks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('ollama_benchmark_results')
      .select('*, benchmark_config:benchmark_config_id(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching Ollama benchmark:', error);
      return res.status(500).json({
        message: `Failed to fetch Ollama benchmark: ${error.message}`
      });
    }
    
    if (!data) {
      return res.status(404).json({
        message: 'Ollama benchmark not found'
      });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Ollama benchmark:', error);
    return res.status(500).json({
      message: `Failed to fetch Ollama benchmark: ${error.message}`
    });
  }
});

/**
 * Get the status of an Ollama benchmark
 * GET /api/ollama/benchmarks/:id/status
 */
router.get('/benchmarks/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const status = await getBenchmarkStatus(id);
    
    return res.status(200).json(status);
  } catch (error) {
    console.error('Error fetching Ollama benchmark status:', error);
    return res.status(500).json({
      message: `Failed to fetch Ollama benchmark status: ${error.message}`
    });
  }
});

/**
 * Get the results of an Ollama benchmark
 * GET /api/ollama/benchmarks/:id/results
 */
router.get('/benchmarks/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    
    const results = await getBenchmarkResults(id);
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching Ollama benchmark results:', error);
    return res.status(500).json({
      message: `Failed to fetch Ollama benchmark results: ${error.message}`
    });
  }
});

export default router;
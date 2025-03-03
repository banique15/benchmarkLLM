import express from 'express';
import benchmarkService from '../services/benchmark.js';
import supabase from '../supabase.js';

const router = express.Router();

// Middleware to extract API key from request
const extractApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key is required. Please provide it in the X-API-Key header.',
    });
  }
  req.apiKey = apiKey;
  next();
};

// Run a benchmark
router.post('/run', extractApiKey, async (req, res, next) => {
  try {
    const benchmarkConfig = req.body;
    
    if (!benchmarkConfig) {
      return res.status(400).json({ error: 'Benchmark configuration is required' });
    }
    
    if (!benchmarkConfig.test_cases || !Array.isArray(benchmarkConfig.test_cases) || benchmarkConfig.test_cases.length === 0) {
      return res.status(400).json({ error: 'Test cases are required' });
    }
    
    if (!benchmarkConfig.model_configs || !Array.isArray(benchmarkConfig.model_configs) || benchmarkConfig.model_configs.length === 0) {
      return res.status(400).json({ error: 'Model configurations are required' });
    }
    
    const result = await benchmarkService.runBenchmark(benchmarkConfig, req.apiKey);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get benchmark status
router.get('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Benchmark ID is required' });
    }
    
    const status = await benchmarkService.getBenchmarkStatus(id);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Get benchmark results
router.get('/:id/results', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Benchmark ID is required' });
    }
    
    const { data, error } = await supabase
      .from('benchmark_results')
      .select(`
        *,
        test_case_results(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get all benchmarks
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('benchmark_results')
      .select('*')
      .order('executed_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
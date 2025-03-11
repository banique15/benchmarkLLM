import express from 'express';
import supabase from '../supabase.js';
import { v4 as uuidv4 } from 'uuid';
import {
  generateTestCases,
  selectModels,
  analyzeResults
} from '../services/advanced-benchmark-service.js';

const router = express.Router();

/**
 * Generate a new advanced benchmark based on the provided topic and options
 * POST /api/advanced-benchmark/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { topic, options } = req.body;
    
    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }
    
    // Generate test cases based on the topic
    let testCases;
    try {
      testCases = await generateTestCases(topic, options?.testCaseCount || 20);
    } catch (testCaseError) {
      // Check if it's a credits error
      if (testCaseError.message && testCaseError.message.includes('credits')) {
        return res.status(402).json({
          message: 'Insufficient OpenRouter API credits',
          error: testCaseError.message,
          details: 'Please add more credits to your OpenRouter account to continue.'
        });
      }
      throw testCaseError; // Re-throw if it's not a credits error
    }
    
    // Select appropriate models based on the topic and options
    let modelConfigs;
    try {
      modelConfigs = await selectModels(topic, options?.maxModels || 50, options?.prioritizeCost || false);
    } catch (modelError) {
      // Check if it's a credits error
      if (modelError.message && modelError.message.includes('credits')) {
        return res.status(402).json({
          message: 'Insufficient OpenRouter API credits',
          error: modelError.message,
          details: 'Please add more credits to your OpenRouter account to continue.'
        });
      }
      throw modelError; // Re-throw if it's not a credits error
    }
    
    // Create benchmark configuration
    const benchmarkId = uuidv4();
    const benchmarkConfig = {
      id: benchmarkId,
      name: `Advanced Benchmark: ${topic}`,
      description: `Automatically generated benchmark for topic: ${topic}`,
      benchmark_type: 'advanced',
      topic,
      advanced_options: options,
      test_cases: testCases,
      model_configs: modelConfigs,
      created_at: new Date().toISOString()
    };
    
    // Save to database
    const { data, error } = await supabase
      .from('benchmark_configs')
      .insert(benchmarkConfig)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving benchmark config:', error);
      return res.status(500).json({ message: 'Failed to save benchmark configuration', error });
    }
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error generating advanced benchmark:', error);
    return res.status(500).json({ message: 'Failed to generate benchmark', error: error.message });
  }
});

/**
 * Get advanced analysis for a benchmark result
 * GET /api/advanced-benchmark/analyze/:resultId
 */
router.get('/analyze/:resultId', async (req, res) => {
  try {
    const { resultId } = req.params;
    const { type = 'general' } = req.query;
    
    if (!resultId) {
      return res.status(400).json({ message: 'Result ID is required' });
    }
    
    // Get benchmark result
    const { data: benchmarkResult, error: resultError } = await supabase
      .from('benchmark_results')
      .select('*, test_case_results(*), benchmark_configs(*)')
      .eq('id', resultId)
      .single();
    
    if (resultError) {
      console.error('Error fetching benchmark result:', resultError);
      return res.status(500).json({ message: 'Failed to fetch benchmark result', error: resultError });
    }
    
    if (!benchmarkResult) {
      return res.status(404).json({ message: 'Benchmark result not found' });
    }
    
    // Check if this is an advanced benchmark
    if (benchmarkResult.benchmark_configs?.benchmark_type !== 'advanced') {
      return res.status(400).json({ message: 'This is not an advanced benchmark' });
    }
    
    // Get model rankings
    const { data: rankings, error: rankingsError } = await supabase
      .from('model_rankings')
      .select('*')
      .eq('benchmark_result_id', resultId)
      .order('overall_rank', { ascending: true });
    
    if (rankingsError) {
      console.error('Error fetching model rankings:', rankingsError);
      return res.status(500).json({ message: 'Failed to fetch model rankings', error: rankingsError });
    }
    
    // Analyze results based on the requested type
    const analysis = await analyzeResults(benchmarkResult, rankings, type);
    
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing benchmark result:', error);
    return res.status(500).json({ message: 'Failed to analyze benchmark result', error: error.message });
  }
});

/**
 * Get all advanced benchmarks
 * GET /api/advanced-benchmark
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('benchmark_configs')
      .select('*')
      .eq('benchmark_type', 'advanced')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching advanced benchmarks:', error);
      return res.status(500).json({ message: 'Failed to fetch advanced benchmarks', error });
    }
    
    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching advanced benchmarks:', error);
    return res.status(500).json({ message: 'Failed to fetch advanced benchmarks', error: error.message });
  }
});

/**
 * Get an advanced benchmark by ID
 * GET /api/advanced-benchmark/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('benchmark_configs')
      .select('*')
      .eq('id', id)
      .eq('benchmark_type', 'advanced')
      .single();
    
    if (error) {
      console.error('Error fetching advanced benchmark:', error);
      return res.status(500).json({ message: 'Failed to fetch advanced benchmark', error });
    }
    
    if (!data) {
      return res.status(404).json({ message: 'Advanced benchmark not found' });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching advanced benchmark:', error);
    return res.status(500).json({ message: 'Failed to fetch advanced benchmark', error: error.message });
  }
});

/**
 * Update an advanced benchmark
 * PUT /api/advanced-benchmark/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Ensure benchmark_type remains 'advanced'
    updates.benchmark_type = 'advanced';
    
    const { data, error } = await supabase
      .from('benchmark_configs')
      .update(updates)
      .eq('id', id)
      .eq('benchmark_type', 'advanced')
      .select()
      .single();
    
    if (error) {
      console.error('Error updating advanced benchmark:', error);
      return res.status(500).json({ message: 'Failed to update advanced benchmark', error });
    }
    
    if (!data) {
      return res.status(404).json({ message: 'Advanced benchmark not found' });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating advanced benchmark:', error);
    return res.status(500).json({ message: 'Failed to update advanced benchmark', error: error.message });
  }
});

/**
 * Delete an advanced benchmark
 * DELETE /api/advanced-benchmark/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('benchmark_configs')
      .delete()
      .eq('id', id)
      .eq('benchmark_type', 'advanced');
    
    if (error) {
      console.error('Error deleting advanced benchmark:', error);
      return res.status(500).json({ message: 'Failed to delete advanced benchmark', error });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting advanced benchmark:', error);
    return res.status(500).json({ message: 'Failed to delete advanced benchmark', error: error.message });
  }
});

export default router;
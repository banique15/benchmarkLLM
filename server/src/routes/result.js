import express from 'express';
import supabase from '../supabase.js';

const router = express.Router();

// Get all benchmark results
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

// Get a specific benchmark result
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Result ID is required' });
    }
    
    // We don't need to check for benchmark- prefix anymore since all results are stored in the database
    
    // For regular IDs, fetch from the database
    const { data, error } = await supabase
      .from('benchmark_results')
      .select(`
        *,
        test_case_results(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Result not found' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Delete a benchmark result
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Result ID is required' });
    }
    
    // First delete related test case results
    const { error: testCaseError } = await supabase
      .from('test_case_results')
      .delete()
      .eq('benchmark_result_id', id);
    
    if (testCaseError) {
      throw testCaseError;
    }
    
    // Then delete the benchmark result
    const { error } = await supabase
      .from('benchmark_results')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Get a benchmark result by public ID
router.get('/public/:publicId', async (req, res, next) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' });
    }
    
    const { data, error } = await supabase
      .from('benchmark_results')
      .select(`
        *,
        test_case_results(*)
      `)
      .eq('public_id', publicId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Result not found' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Export a benchmark result
router.get('/:id/export', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Result ID is required' });
    }
    
    // Get the benchmark result with test case results
    const { data, error } = await supabase
      .from('benchmark_results')
      .select(`
        *,
        test_case_results(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Result not found' });
      }
      throw error;
    }
    
    // Format the data based on the requested format
    if (format === 'csv') {
      // Convert to CSV
      const csv = convertResultToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="benchmark-result-${id}.csv"`);
      return res.send(csv);
    } else {
      // Default to JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="benchmark-result-${id}.json"`);
      return res.json(data);
    }
  } catch (error) {
    next(error);
  }
});

// Helper function to convert a benchmark result to CSV
function convertResultToCSV(result) {
  if (!result || !result.test_case_results || result.test_case_results.length === 0) {
    return 'No data';
  }
  
  // Group test case results by model
  const resultsByModel = {};
  result.test_case_results.forEach(tcr => {
    if (!resultsByModel[tcr.model_id]) {
      resultsByModel[tcr.model_id] = [];
    }
    resultsByModel[tcr.model_id].push(tcr);
  });
  
  // Create CSV header
  let csv = 'Test Case ID,';
  Object.keys(resultsByModel).forEach(modelId => {
    csv += `${modelId} Latency (ms),${modelId} Tokens,${modelId} Cost,`;
  });
  csv = csv.slice(0, -1) + '\n';
  
  // Create a map of test case results by test case ID and model ID
  const resultMap = {};
  result.test_case_results.forEach(tcr => {
    if (!resultMap[tcr.test_case_id]) {
      resultMap[tcr.test_case_id] = {};
    }
    resultMap[tcr.test_case_id][tcr.model_id] = tcr;
  });
  
  // Add data rows
  const testCaseIds = [...new Set(result.test_case_results.map(tcr => tcr.test_case_id))];
  testCaseIds.forEach(testCaseId => {
    csv += `${testCaseId},`;
    Object.keys(resultsByModel).forEach(modelId => {
      const tcr = resultMap[testCaseId][modelId];
      if (tcr) {
        csv += `${tcr.latency},${tcr.token_count},${tcr.cost},`;
      } else {
        csv += ',,';
      }
    });
    csv = csv.slice(0, -1) + '\n';
  });
  
  return csv;
}

export default router;
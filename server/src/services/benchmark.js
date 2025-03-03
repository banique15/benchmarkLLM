import supabase from '../supabase.js';
import openRouterService from './openrouter.js';

// Create a new benchmark result
export const createBenchmarkResult = async (benchmarkConfig) => {
  try {
    // Create a new benchmark result record
    const { data: result, error } = await supabase
      .from('benchmark_results')
      .insert({
        config_id: benchmarkConfig.id,
        status: 'running',
        executed_at: new Date().toISOString(),
        summary: {},
        model_results: {},
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error creating benchmark result:', error);
    throw error;
  }
};

// Run a benchmark
export const runBenchmark = async (benchmarkConfig, apiKey) => {
  try {
    // Create a new benchmark result
    const benchmarkResult = await createBenchmarkResult(benchmarkConfig);

    // Start the benchmark process asynchronously
    processBenchmark(benchmarkConfig, benchmarkResult.id, apiKey);

    return benchmarkResult;
  } catch (error) {
    console.error('Error running benchmark:', error);
    throw error;
  }
};

// Process a benchmark asynchronously
const processBenchmark = async (benchmarkConfig, resultId, apiKey) => {
  try {
    const { test_cases, model_configs } = benchmarkConfig;
    const modelResults = {};
    
    // Run tests for each model
    for (const modelConfig of model_configs) {
      if (!modelConfig.enabled) continue;
      
      const modelId = modelConfig.modelId;
      modelResults[modelId] = { testResults: {} };
      
      // Update benchmark status
      await updateBenchmarkStatus(resultId, 'running', {
        currentModel: modelId,
        progress: 0,
        totalTests: test_cases.length,
      });
      
      // Run each test case for this model
      for (let i = 0; i < test_cases.length; i++) {
        const testCase = test_cases[i];
        
        // Update progress
        await updateBenchmarkStatus(resultId, 'running', {
          currentModel: modelId,
          currentTest: testCase.name,
          progress: i,
          totalTests: test_cases.length,
        });
        
        // Run the test
        const testResult = await openRouterService.runModelTest(
          modelId,
          testCase.prompt,
          modelConfig.parameters,
          apiKey
        );
        
        // Save the test result
        modelResults[modelId].testResults[testCase.id] = testResult;
        
        // Save individual test case result to database
        await saveTestCaseResult(resultId, modelId, testCase.id, testResult);
      }
    }
    
    // Calculate summary metrics
    const summary = calculateSummaryMetrics(modelResults, test_cases);
    
    // Update the benchmark result with the final data
    await updateBenchmarkResult(resultId, {
      status: 'completed',
      model_results: modelResults,
      summary,
    });
  } catch (error) {
    console.error('Error processing benchmark:', error);
    
    // Update the benchmark result with the error
    await updateBenchmarkResult(resultId, {
      status: 'failed',
      error: error.message,
    });
  }
};

// Save a test case result
const saveTestCaseResult = async (benchmarkResultId, modelId, testCaseId, testResult) => {
  try {
    const { error } = await supabase
      .from('test_case_results')
      .insert({
        benchmark_result_id: benchmarkResultId,
        model_id: modelId,
        test_case_id: testCaseId,
        output: testResult.output || '',
        latency: testResult.latency || 0,
        token_count: testResult.tokenCount?.total || 0,
        cost: calculateCost(modelId, testResult.tokenCount),
        metrics: {
          error: testResult.error,
          tokenCounts: testResult.tokenCount,
        },
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving test case result:', error);
    throw error;
  }
};

// Update benchmark status
const updateBenchmarkStatus = async (benchmarkResultId, status, statusDetails = {}) => {
  try {
    const { error } = await supabase
      .from('benchmark_results')
      .update({
        status,
        status_details: statusDetails,
      })
      .eq('id', benchmarkResultId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating benchmark status:', error);
    throw error;
  }
};

// Update benchmark result
const updateBenchmarkResult = async (benchmarkResultId, updates) => {
  try {
    const { error } = await supabase
      .from('benchmark_results')
      .update(updates)
      .eq('id', benchmarkResultId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating benchmark result:', error);
    throw error;
  }
};

// Calculate summary metrics
const calculateSummaryMetrics = (modelResults, testCases) => {
  const summary = {
    models: {},
    overall: {},
  };
  
  // Calculate per-model metrics
  Object.keys(modelResults).forEach(modelId => {
    const modelResult = modelResults[modelId];
    const testResults = Object.values(modelResult.testResults);
    
    // Calculate average latency
    const totalLatency = testResults.reduce((sum, result) => sum + (result.latency || 0), 0);
    const avgLatency = testResults.length > 0 ? totalLatency / testResults.length : 0;
    
    // Calculate total tokens
    const totalTokens = testResults.reduce((sum, result) => {
      return sum + (result.tokenCount?.total || 0);
    }, 0);
    
    // Calculate total cost
    const totalCost = testResults.reduce((sum, result) => {
      return sum + calculateCost(modelId, result.tokenCount);
    }, 0);
    
    // Calculate success rate
    const successfulTests = testResults.filter(result => !result.error).length;
    const successRate = testResults.length > 0 ? successfulTests / testResults.length : 0;
    
    summary.models[modelId] = {
      avgLatency,
      totalTokens,
      totalCost,
      successRate,
      testCount: testResults.length,
    };
  });
  
  return summary;
};

// Calculate cost based on model and token count
const calculateCost = (modelId, tokenCount) => {
  if (!tokenCount) return 0;
  
  // These rates would need to be updated based on current OpenRouter pricing
  const rates = {
    'openai/gpt-4': { input: 0.00003, output: 0.00006 },
    'openai/gpt-3.5-turbo': { input: 0.000001, output: 0.000002 },
    'anthropic/claude-3-opus': { input: 0.00003, output: 0.00006 },
    'anthropic/claude-3-sonnet': { input: 0.000015, output: 0.00003 },
    'anthropic/claude-3-haiku': { input: 0.000005, output: 0.000015 },
    'meta-llama/llama-3-70b': { input: 0.000002, output: 0.000002 },
    // Add more models as needed
  };

  // Default to GPT-3.5 rates if model not found
  const modelRates = rates[modelId] || rates['openai/gpt-3.5-turbo'];
  
  return (tokenCount.input * modelRates.input) + (tokenCount.output * modelRates.output);
};

// Get benchmark status
export const getBenchmarkStatus = async (benchmarkResultId) => {
  try {
    const { data, error } = await supabase
      .from('benchmark_results')
      .select('*')
      .eq('id', benchmarkResultId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting benchmark status:', error);
    throw error;
  }
};

export default {
  runBenchmark,
  getBenchmarkStatus,
};
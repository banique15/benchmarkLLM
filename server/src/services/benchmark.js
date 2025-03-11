import supabase from '../supabase.js';
import langchainService from './langchain-service.js';
import openRouterService from './openrouter.js';

// Create a new benchmark result
export const createBenchmarkResult = async (benchmarkConfig, apiKeyStatus = null) => {
  try {
    // Prepare the benchmark result data
    const benchmarkData = {
      config_id: benchmarkConfig.id,
      status: apiKeyStatus && !apiKeyStatus.valid ? 'failed' : 'running',
      executed_at: new Date().toISOString(),
      summary: {},
      model_results: {},
    };
    
    // Add API key status information if available
    if (apiKeyStatus) {
      benchmarkData.api_key_valid = apiKeyStatus.valid;
      benchmarkData.api_key_credits = apiKeyStatus.credits;
      benchmarkData.api_key_limit = apiKeyStatus.limit;
      
      if (!apiKeyStatus.valid && apiKeyStatus.error) {
        benchmarkData.api_key_error = apiKeyStatus.error;
        benchmarkData.error = apiKeyStatus.error;
      }
    }
    
    // Create a new benchmark result record
    const { data: result, error } = await supabase
      .from('benchmark_results')
      .insert(benchmarkData)
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
    // Validate the API key and check credits
    console.log('Validating API key before running benchmark');
    const keyValidation = await openRouterService.validateApiKey(apiKey);
    console.log('API key validation result:', {
      valid: keyValidation.valid,
      hasCredits: keyValidation.hasCredits,
      credits: keyValidation.credits,
      error: keyValidation.error || 'None'
    });
    
    // Create a new benchmark result
    const benchmarkResult = await createBenchmarkResult(benchmarkConfig, keyValidation);
    
    // If the API key is invalid, mark the benchmark as failed
    if (!keyValidation.valid) {
      console.log('API key validation failed:', keyValidation.error);
      await updateBenchmarkResult(benchmarkResult.id, {
        status: 'failed',
        error: `API key validation failed: ${keyValidation.error}`,
        api_key_valid: keyValidation.valid,
        api_key_credits: keyValidation.credits || 0,
        api_key_limit: keyValidation.limit || 0,
        api_key_error: keyValidation.error
      });
      
      return {
        ...benchmarkResult,
        status: 'failed',
        error: `API key validation failed: ${keyValidation.error}`
      };
    }
    
    // Check if the API key has sufficient credits
    // Only fail if we have definitive information that credits are 0
    if (keyValidation.credits !== null && keyValidation.credits !== undefined && keyValidation.credits <= 0) {
      console.log('API key has insufficient credits:', keyValidation.credits);
      await updateBenchmarkResult(benchmarkResult.id, {
        status: 'failed',
        error: 'Insufficient API credits to run benchmark',
        api_key_valid: keyValidation.valid,
        api_key_credits: keyValidation.credits || 0,
        api_key_limit: keyValidation.limit || 0,
        api_key_error: 'Insufficient API credits to run benchmark'
      });
      
      return {
        ...benchmarkResult,
        status: 'failed',
        error: 'Insufficient API credits to run benchmark'
      };
    }
    
    console.log('API key validation successful, proceeding with benchmark');

    // Start the benchmark process
    // We'll use a Promise to handle both synchronous and asynchronous completion
    const benchmarkPromise = processBenchmark(benchmarkConfig, benchmarkResult.id, apiKey, keyValidation);
    
    // Set up a timeout to check the status of the benchmark
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(async () => {
        // Check if the benchmark is still running
        const status = await getBenchmarkStatus(benchmarkResult.id);
        if (status.status === 'failed' && status.api_key_error) {
          console.log('Benchmark failed due to API key error:', status.api_key_error);
        }
        resolve();
      }, 1000); // Check after 1 second
    });
    
    // Fire and forget - we don't want to block the response
    Promise.all([benchmarkPromise, timeoutPromise])
      .catch(error => {
        console.error('Error in benchmark process:', error);
      });

    return {
      ...benchmarkResult,
      api_key_valid: keyValidation.valid,
      api_key_credits: keyValidation.credits || 0,
      api_key_limit: keyValidation.limit || 0
    };
  } catch (error) {
    console.error('Error running benchmark:', error);
    throw error;
  }
};

// Process a benchmark asynchronously
const processBenchmark = async (benchmarkConfig, resultId, apiKey, apiKeyStatus = null) => {
  try {
    const { test_cases, model_configs } = benchmarkConfig;
    const modelResults = {};
    
    // Store API key status in the results if provided
    if (apiKeyStatus) {
      const updateData = {
        api_key_valid: apiKeyStatus.valid,
        api_key_credits: apiKeyStatus.credits || 0,
        api_key_limit: apiKeyStatus.limit || 0
      };
      
      if (!apiKeyStatus.valid && apiKeyStatus.error) {
        updateData.api_key_error = apiKeyStatus.error;
      }
      
      await updateBenchmarkResult(resultId, updateData);
    }
    
    // Flag to track if we've encountered an API key error
    let apiKeyErrorEncountered = false;
    
    // Run tests for each model
    for (const modelConfig of model_configs) {
      // If we've already encountered an API key error, don't run any more tests
      if (apiKeyErrorEncountered) {
        console.log('Skipping model due to previous API key error:', modelConfig.modelId);
        continue;
      }
      
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
        // If we've already encountered an API key error, don't run any more tests
        if (apiKeyErrorEncountered) {
          console.log('Skipping test case due to previous API key error:', testCase?.name);
          continue;
        }
        
        const testCase = test_cases[i];
        
        // Update progress
        await updateBenchmarkStatus(resultId, 'running', {
          currentModel: modelId,
          currentTest: testCase.name,
          progress: i,
          totalTests: test_cases.length,
        });
        
        try {
          // Run the test using LangChain
          const testResult = await langchainService.runModelTest(
            modelId,
            testCase.prompt,
            modelConfig.parameters,
            apiKey
          );
          
          // Check if the test result indicates an API key issue
          if (testResult.error) {
            console.log(`Test error detected: ${testResult.error}`);
            
            const isApiKeyError =
              testResult.error.includes('API key') ||
              testResult.error.includes('authentication') ||
              testResult.error.includes('insufficient_quota') ||
              testResult.error.includes('insufficient credits') ||
              testResult.error.includes('OpenRouter API insufficient credits') ||
              testResult.error.includes('credit') ||
              testResult.error.includes('capacity') ||
              testResult.error.includes('quota') ||
              testResult.error.includes('rate limit');
              
            if (isApiKeyError) {
              // Check if this is specifically a credit-related error
              const isCreditError =
                testResult.error.includes('OpenRouter API insufficient credits') ||
                testResult.error.includes('More credits are required') ||
                testResult.error.includes('capacity required') ||
                testResult.error.includes('402');
              
              if (isCreditError) {
                console.log('Credit-related error detected, stopping benchmark immediately');
                
                // Mark that we've encountered an API key error
                apiKeyErrorEncountered = true;
                
                // Update the benchmark result with the error
                await updateBenchmarkResult(resultId, {
                  status: 'failed',
                  error: `Insufficient credits: ${testResult.error}`,
                  api_key_error: testResult.error,
                  api_key_valid: false
                });
                
                console.log('Credit error confirmed, stopping benchmark');
                
                // Don't throw, just return from the function to stop the benchmark
                return;
              } else {
                console.log('API key related error detected, re-validating key');
                // Re-validate the API key to check if credits have been depleted
                const updatedKeyStatus = await openRouterService.validateApiKey(apiKey);
                
                console.log('Re-validation result:', {
                  valid: updatedKeyStatus.valid,
                  hasCredits: updatedKeyStatus.hasCredits,
                  credits: updatedKeyStatus.credits
                });
                
                if (!updatedKeyStatus.valid ||
                    (updatedKeyStatus.credits !== null &&
                     updatedKeyStatus.credits !== undefined &&
                     updatedKeyStatus.credits <= 0)) {
                  // Mark that we've encountered an API key error
                  apiKeyErrorEncountered = true;
                  
                  // Update the benchmark result with the error
                  await updateBenchmarkResult(resultId, {
                    status: 'failed',
                    error: `API key error: ${testResult.error}`,
                    api_key_error: testResult.error,
                    api_key_valid: false
                  });
                  
                  console.log('API key error confirmed, stopping benchmark');
                  
                  // Don't throw, just return from the function to stop the benchmark
                  return;
                }
              }
            }
          }
          
          // Save the test result
          modelResults[modelId].testResults[testCase.id] = testResult;
          
          // Save individual test case result to database
          await saveTestCaseResult(resultId, modelId, testCase.id, testResult, testCase.prompt);
        } catch (testError) {
          console.error(`Error running test case ${testCase.id} for model ${modelId}:`, testError);
          
          // Save the error result
          const errorResult = {
            error: testError.message,
            latency: 0,
            output: `Error: ${testError.message}`
          };
          
          modelResults[modelId].testResults[testCase.id] = errorResult;
          await saveTestCaseResult(resultId, modelId, testCase.id, errorResult, testCase.prompt);
          
          // If this is an API key error, stop the entire benchmark
          const isApiKeyError =
            testError.message.includes('API key') ||
            testError.message.includes('authentication') ||
            testError.message.includes('insufficient_quota') ||
            testError.message.includes('insufficient credits') ||
            testError.message.includes('OpenRouter API insufficient credits') ||
            testError.message.includes('credit') ||
            testError.message.includes('capacity') ||
            testError.message.includes('quota') ||
            testError.message.includes('rate limit');
            
          if (isApiKeyError) {
            // Check if this is specifically a credit-related error
            const isCreditError =
              testError.message.includes('OpenRouter API insufficient credits') ||
              testError.message.includes('More credits are required') ||
              testError.message.includes('capacity required') ||
              testError.message.includes('402');
            
            console.log(isCreditError
              ? 'Credit-related error detected in catch block, stopping benchmark immediately'
              : 'API key error detected in catch block, stopping benchmark');
            
            // Mark that we've encountered an API key error
            apiKeyErrorEncountered = true;
            
            // Update the benchmark result to indicate an API key error
            await updateBenchmarkResult(resultId, {
              status: 'failed',
              error: isCreditError
                ? `Insufficient credits: ${testError.message}`
                : `API key error: ${testError.message}`,
              api_key_error: testError.message,
              api_key_valid: false
            });
            
            // Return from the function to stop the benchmark
            return;
          }
        }
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
    
    // Determine if this is an API key error
    const isApiKeyError = error.message.includes('API key') ||
                          error.message.includes('authentication') ||
                          error.message.includes('insufficient_quota') ||
                          error.message.includes('insufficient credits') ||
                          error.message.includes('OpenRouter API insufficient credits') ||
                          error.message.includes('credit') ||
                          error.message.includes('capacity') ||
                          error.message.includes('quota') ||
                          error.message.includes('rate limit');
    
    // Check if this is specifically a credit-related error
    const isCreditError =
      error.message.includes('OpenRouter API insufficient credits') ||
      error.message.includes('More credits are required') ||
      error.message.includes('capacity required') ||
      error.message.includes('402');
    
    if (isApiKeyError) {
      console.log(isCreditError
        ? 'Credit-related error detected in main catch block, marking benchmark as failed'
        : 'API key error detected in main catch block, marking benchmark as failed');
    }
    
    // Update the benchmark result with the error
    const updateData = {
      status: 'failed',
      error: isCreditError
        ? `Insufficient credits: ${error.message}`
        : error.message
    };
    
    if (isApiKeyError) {
      updateData.api_key_error = error.message;
      updateData.api_key_valid = false;
    }
    
    await updateBenchmarkResult(resultId, updateData);
    
    // If this is an API key error, we want to make sure the benchmark is marked as failed
    // and not continue with any other models or test cases
    if (isApiKeyError) {
      console.log('API key error handled, benchmark marked as failed');
    }
  }
};

// Save a test case result
const saveTestCaseResult = async (benchmarkResultId, modelId, testCaseId, testResult, prompt) => {
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
        prompt: prompt, // Save the prompt in the test case result
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

    // If the benchmark has an API key error, ensure it's marked as failed
    if (data.api_key_error) {
      console.log(`Benchmark ${benchmarkResultId} has API key error: ${data.api_key_error}`);
      
      // If the status is still running but there's an API key error, update it to failed
      if (data.status === 'running') {
        console.log(`Updating benchmark ${benchmarkResultId} status from running to failed due to API key error`);
        
        // Update the status to failed
        await updateBenchmarkResult(benchmarkResultId, {
          status: 'failed',
          error: data.api_key_error || 'API key error detected'
        });
        
        // Fetch the updated data
        const { data: updatedData, error: updatedError } = await supabase
          .from('benchmark_results')
          .select('*')
          .eq('id', benchmarkResultId)
          .single();
          
        if (updatedError) {
          throw updatedError;
        }
        
        return updatedData;
      }
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
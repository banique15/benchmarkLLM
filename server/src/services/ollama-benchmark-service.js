import { v4 as uuidv4 } from 'uuid';
import supabase from '../supabase.js';
import { runOllamaPrompt, evaluateResponse } from './ollama-service.js';
import { generateReactTestCases } from './react-test-generator.js';

/**
 * Create a new Ollama benchmark
 * @param {Object} config - Benchmark configuration
 * @returns {Promise<Object>} Created benchmark result
 */
export const createOllamaBenchmark = async (config) => {
  try {
    console.log('Creating new Ollama benchmark with config:', {
      name: config.name,
      modelCount: config.models.length,
      difficulties: config.difficulties
    });
    
    // Generate a unique ID for the benchmark
    const benchmarkId = uuidv4();
    
    // Generate test cases based on the selected difficulties
    const testCases = generateReactTestCases(config.difficulties, config.testCasesPerDifficulty || 3);
    
    console.log(`Generated ${testCases.length} test cases for benchmark`);
    
    // Create benchmark configuration
    const benchmarkConfig = {
      id: benchmarkId,
      name: config.name || `Ollama React Benchmark ${new Date().toISOString()}`,
      description: config.description || 'Benchmark for React coding tasks',
      models: config.models,
      test_cases: testCases,
      parameters: config.parameters || { temperature: 0.7, top_p: 1, max_tokens: 2048 },
      created_at: new Date().toISOString()
    };
    
    // Save benchmark configuration to database
    const { data: configData, error: configError } = await supabase
      .from('ollama_benchmark_configs')
      .insert(benchmarkConfig)
      .select()
      .single();
    
    if (configError) {
      console.error('Error saving benchmark configuration:', configError);
      throw new Error(`Failed to save benchmark configuration: ${configError.message}`);
    }
    
    console.log('Benchmark configuration saved with ID:', configData.id);
    
    // Create benchmark result
    const benchmarkResult = {
      id: uuidv4(),
      benchmark_config_id: configData.id,
      status: 'created',
      status_details: {
        progress: 0,
        totalTests: testCases.length * config.models.length,
        currentModel: '',
        currentTest: ''
      },
      created_at: new Date().toISOString()
    };
    
    // Save benchmark result to database
    const { data: resultData, error: resultError } = await supabase
      .from('ollama_benchmark_results')
      .insert(benchmarkResult)
      .select()
      .single();
    
    if (resultError) {
      console.error('Error saving benchmark result:', resultError);
      throw new Error(`Failed to save benchmark result: ${resultError.message}`);
    }
    
    console.log('Benchmark result created with ID:', resultData.id);
    
    return resultData;
  } catch (error) {
    console.error('Error creating Ollama benchmark:', error);
    throw error;
  }
};

/**
 * Run an Ollama benchmark
 * @param {string} benchmarkResultId - Benchmark result ID
 * @returns {Promise<void>}
 */
export const runOllamaBenchmark = async (benchmarkResultId) => {
  try {
    console.log(`Starting Ollama benchmark with ID: ${benchmarkResultId}`);
    
    // Update benchmark status to running
    await updateBenchmarkStatus(benchmarkResultId, 'running', {
      progress: 0,
      totalTests: 0,
      currentModel: '',
      currentTest: ''
    });
    
    // Get benchmark configuration and result
    const { data: benchmarkResult, error: resultError } = await supabase
      .from('ollama_benchmark_results')
      .select('*, benchmark_config:benchmark_config_id(*)')
      .eq('id', benchmarkResultId)
      .single();
    
    if (resultError) {
      console.error('Error fetching benchmark result:', resultError);
      throw new Error(`Failed to fetch benchmark result: ${resultError.message}`);
    }
    
    const benchmarkConfig = benchmarkResult.benchmark_config;
    
    if (!benchmarkConfig) {
      throw new Error('Benchmark configuration not found');
    }
    
    console.log('Benchmark configuration loaded:', {
      name: benchmarkConfig.name,
      modelCount: benchmarkConfig.models.length,
      testCaseCount: benchmarkConfig.test_cases.length
    });
    
    // Calculate total number of tests
    const totalTests = benchmarkConfig.models.length * benchmarkConfig.test_cases.length;
    
    // Update benchmark status with total tests
    await updateBenchmarkStatus(benchmarkResultId, 'running', {
      progress: 0,
      totalTests,
      currentModel: '',
      currentTest: ''
    });
    
    // Run tests for each model
    let progress = 0;
    
    for (const model of benchmarkConfig.models) {
      console.log(`Running tests for model: ${model.id}`);
      
      // Update benchmark status with current model
      await updateBenchmarkStatus(benchmarkResultId, 'running', {
        progress,
        totalTests,
        currentModel: model.id,
        currentTest: ''
      });
      
      for (const testCase of benchmarkConfig.test_cases) {
        console.log(`Running test case: ${testCase.name} (${testCase.difficulty})`);
        
        // Update benchmark status with current test
        await updateBenchmarkStatus(benchmarkResultId, 'running', {
          progress,
          totalTests,
          currentModel: model.id,
          currentTest: testCase.name
        });
        
        try {
          // Run the test case against the model
          const result = await runOllamaPrompt(model.id, testCase.prompt, benchmarkConfig.parameters);
          
          // Evaluate the response
          const evaluation = evaluateResponse(result.output, testCase.expectedOutput, testCase.difficulty);
          
          // Save test case result
          const testCaseResult = {
            id: uuidv4(),
            benchmark_result_id: benchmarkResultId,
            model_id: model.id,
            test_case_id: testCase.id,
            difficulty: testCase.difficulty,
            category: testCase.category,
            prompt: testCase.prompt,
            output: result.output,
            latency: result.latency,
            token_count: result.token_count,
            accuracy_score: evaluation.overallScore,
            category_scores: evaluation.categoryScores,
            created_at: new Date().toISOString()
          };
          
          const { error: testCaseError } = await supabase
            .from('ollama_test_case_results')
            .insert(testCaseResult);
          
          if (testCaseError) {
            console.error('Error saving test case result:', testCaseError);
            // Continue with other test cases even if one fails
          }
          
          // Increment progress
          progress++;
          
          // Update benchmark status with progress
          await updateBenchmarkStatus(benchmarkResultId, 'running', {
            progress,
            totalTests,
            currentModel: model.id,
            currentTest: testCase.name
          });
          
        } catch (error) {
          console.error(`Error running test case ${testCase.name} for model ${model.id}:`, error);
          
          // Save failed test case result
          const testCaseResult = {
            id: uuidv4(),
            benchmark_result_id: benchmarkResultId,
            model_id: model.id,
            test_case_id: testCase.id,
            difficulty: testCase.difficulty,
            category: testCase.category,
            prompt: testCase.prompt,
            output: `Error: ${error.message}`,
            latency: 0,
            token_count: 0,
            accuracy_score: 0,
            created_at: new Date().toISOString()
          };
          
          await supabase
            .from('ollama_test_case_results')
            .insert(testCaseResult);
          
          // Increment progress
          progress++;
          
          // Continue with other test cases even if one fails
        }
      }
    }
    
    // Generate model rankings
    await generateModelRankings(benchmarkResultId);
    
    // Update benchmark status to completed
    await updateBenchmarkStatus(benchmarkResultId, 'completed', {
      progress: totalTests,
      totalTests,
      currentModel: '',
      currentTest: ''
    });
    
    console.log(`Benchmark ${benchmarkResultId} completed successfully`);
    
  } catch (error) {
    console.error('Error running Ollama benchmark:', error);
    
    // Update benchmark status to failed
    await updateBenchmarkStatus(benchmarkResultId, 'failed', {
      error: error.message
    });
    
    throw error;
  }
};

/**
 * Update benchmark status
 * @param {string} benchmarkResultId - Benchmark result ID
 * @param {string} status - New status
 * @param {Object} statusDetails - Status details
 * @returns {Promise<void>}
 */
const updateBenchmarkStatus = async (benchmarkResultId, status, statusDetails) => {
  try {
    const updates = {
      status,
      status_details: statusDetails
    };
    
    // If status is completed or failed, add completed_at timestamp
    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }
    
    // If status is failed, add error message
    if (status === 'failed' && statusDetails.error) {
      updates.error = statusDetails.error;
    }
    
    const { error } = await supabase
      .from('ollama_benchmark_results')
      .update(updates)
      .eq('id', benchmarkResultId);
    
    if (error) {
      console.error('Error updating benchmark status:', error);
      throw new Error(`Failed to update benchmark status: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Error updating benchmark status:', error);
    throw error;
  }
};

/**
 * Generate model rankings for a benchmark
 * @param {string} benchmarkResultId - Benchmark result ID
 * @returns {Promise<void>}
 */
const generateModelRankings = async (benchmarkResultId) => {
  try {
    console.log(`Generating model rankings for benchmark: ${benchmarkResultId}`);
    
    // Get all test case results for the benchmark
    const { data: testCaseResults, error: resultsError } = await supabase
      .from('ollama_test_case_results')
      .select('*')
      .eq('benchmark_result_id', benchmarkResultId);
    
    if (resultsError) {
      console.error('Error fetching test case results:', resultsError);
      throw new Error(`Failed to fetch test case results: ${resultsError.message}`);
    }
    
    if (!testCaseResults || testCaseResults.length === 0) {
      console.warn('No test case results found for benchmark:', benchmarkResultId);
      return;
    }
    
    // Get unique model IDs
    const modelIds = [...new Set(testCaseResults.map(result => result.model_id))];
    
    console.log(`Found ${modelIds.length} models to rank`);
    
    // Calculate metrics for each model
    const modelMetrics = modelIds.map(modelId => {
      const modelResults = testCaseResults.filter(result => result.model_id === modelId);
      
      // Calculate overall metrics
      const avgAccuracy = modelResults.reduce((sum, result) => sum + (result.accuracy_score || 0), 0) / modelResults.length;
      const avgLatency = modelResults.reduce((sum, result) => sum + (result.latency || 0), 0) / modelResults.length;
      const totalTokens = modelResults.reduce((sum, result) => sum + (result.token_count || 0), 0);
      
      // Calculate category-specific metrics
      const avgAccuracyCategoryScore = modelResults.reduce((sum, result) => {
        const categoryScores = result.category_scores || {};
        return sum + (categoryScores.accuracy || 0);
      }, 0) / modelResults.length;
      
      const avgCorrectnessCategoryScore = modelResults.reduce((sum, result) => {
        const categoryScores = result.category_scores || {};
        return sum + (categoryScores.correctness || 0);
      }, 0) / modelResults.length;
      
      const avgEfficiencyCategoryScore = modelResults.reduce((sum, result) => {
        const categoryScores = result.category_scores || {};
        return sum + (categoryScores.efficiency || 0);
      }, 0) / modelResults.length;
      
      // Calculate metrics by difficulty
      const difficultyMetrics = {};
      const difficulties = [...new Set(modelResults.map(result => result.difficulty))];
      
      difficulties.forEach(difficulty => {
        const difficultyResults = modelResults.filter(result => result.difficulty === difficulty);
        difficultyMetrics[difficulty] = {
          avgAccuracy: difficultyResults.reduce((sum, result) => sum + (result.accuracy_score || 0), 0) / difficultyResults.length,
          avgLatency: difficultyResults.reduce((sum, result) => sum + (result.latency || 0), 0) / difficultyResults.length,
          count: difficultyResults.length
        };
      });
      
      // Calculate latency score (lower is better, normalized to 0-1)
      // Using a logarithmic scale to handle wide range of latencies
      const latencyScore = Math.max(0, 1 - (Math.log(avgLatency + 1) / Math.log(30000))); // 30s as max expected latency
      
      // Calculate overall score (weighted average of accuracy and latency)
      const overallScore = (avgAccuracy * 0.7) + (latencyScore * 0.3);
      
      return {
        modelId,
        avgAccuracy,
        avgLatency,
        latencyScore,
        totalTokens,
        overallScore,
        difficultyMetrics,
        categoryScores: {
          accuracy: avgAccuracyCategoryScore,
          correctness: avgCorrectnessCategoryScore,
          efficiency: avgEfficiencyCategoryScore
        }
      };
    });
    
    // Sort models by overall score (descending)
    modelMetrics.sort((a, b) => b.overallScore - a.overallScore);
    
    // Assign overall ranks
    modelMetrics.forEach((metric, index) => {
      metric.overallRank = index + 1;
    });
    
    // Sort and rank by category
    // Accuracy category
    const modelsByAccuracy = [...modelMetrics].sort((a, b) =>
      b.categoryScores.accuracy - a.categoryScores.accuracy
    );
    modelsByAccuracy.forEach((metric, index) => {
      metric.accuracyRank = index + 1;
    });
    
    // Correctness category
    const modelsByCorrectness = [...modelMetrics].sort((a, b) =>
      b.categoryScores.correctness - a.categoryScores.correctness
    );
    modelsByCorrectness.forEach((metric, index) => {
      metric.correctnessRank = index + 1;
    });
    
    // Efficiency category
    const modelsByEfficiency = [...modelMetrics].sort((a, b) =>
      b.categoryScores.efficiency - a.categoryScores.efficiency
    );
    modelsByEfficiency.forEach((metric, index) => {
      metric.efficiencyRank = index + 1;
    });
    
    // Sort and rank by difficulty
    const difficulties = ['basic', 'intermediate', 'advanced', 'expert'];
    
    difficulties.forEach(difficulty => {
      // Filter models that have results for this difficulty
      const modelsWithDifficulty = modelMetrics.filter(metric => 
        metric.difficultyMetrics[difficulty] && metric.difficultyMetrics[difficulty].count > 0
      );
      
      // Sort by accuracy for this difficulty
      modelsWithDifficulty.sort((a, b) => 
        b.difficultyMetrics[difficulty].avgAccuracy - a.difficultyMetrics[difficulty].avgAccuracy
      );
      
      // Assign ranks for this difficulty
      modelsWithDifficulty.forEach((metric, index) => {
        metric.difficultyMetrics[difficulty].rank = index + 1;
      });
    });
    
    // Save rankings to database
    const rankings = modelMetrics.map(metric => ({
      id: uuidv4(),
      benchmark_result_id: benchmarkResultId,
      model_id: metric.modelId,
      overall_rank: metric.overallRank,
      basic_rank: metric.difficultyMetrics.basic?.rank || null,
      intermediate_rank: metric.difficultyMetrics.intermediate?.rank || null,
      advanced_rank: metric.difficultyMetrics.advanced?.rank || null,
      expert_rank: metric.difficultyMetrics.expert?.rank || null,
      accuracy_rank: metric.accuracyRank,
      correctness_rank: metric.correctnessRank,
      efficiency_rank: metric.efficiencyRank,
      accuracy_score: metric.avgAccuracy,
      accuracy_category_score: metric.categoryScores.accuracy,
      correctness_category_score: metric.categoryScores.correctness,
      efficiency_category_score: metric.categoryScores.efficiency,
      latency_score: metric.latencyScore,
      overall_score: metric.overallScore,
      created_at: new Date().toISOString()
    }));
    
    // Insert rankings in batches to avoid exceeding request size limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < rankings.length; i += BATCH_SIZE) {
      const batch = rankings.slice(i, i + BATCH_SIZE);
      
      const { error: rankingsError } = await supabase
        .from('ollama_model_rankings')
        .insert(batch);
      
      if (rankingsError) {
        console.error('Error saving model rankings:', rankingsError);
        throw new Error(`Failed to save model rankings: ${rankingsError.message}`);
      }
    }
    
    console.log(`Successfully generated and saved rankings for ${rankings.length} models`);
    
  } catch (error) {
    console.error('Error generating model rankings:', error);
    throw error;
  }
};

/**
 * Get benchmark status
 * @param {string} benchmarkResultId - Benchmark result ID
 * @returns {Promise<Object>} Benchmark status
 */
export const getBenchmarkStatus = async (benchmarkResultId) => {
  try {
    const { data, error } = await supabase
      .from('ollama_benchmark_results')
      .select('*')
      .eq('id', benchmarkResultId)
      .single();
    
    if (error) {
      console.error('Error fetching benchmark status:', error);
      throw new Error(`Failed to fetch benchmark status: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting benchmark status:', error);
    throw error;
  }
};

/**
 * Get benchmark results
 * @param {string} benchmarkResultId - Benchmark result ID
 * @returns {Promise<Object>} Benchmark results
 */
export const getBenchmarkResults = async (benchmarkResultId) => {
  try {
    // Get benchmark result
    const { data: benchmarkResult, error: resultError } = await supabase
      .from('ollama_benchmark_results')
      .select('*, benchmark_config:benchmark_config_id(*)')
      .eq('id', benchmarkResultId)
      .single();
    
    if (resultError) {
      console.error('Error fetching benchmark result:', resultError);
      throw new Error(`Failed to fetch benchmark result: ${resultError.message}`);
    }
    
    // Get test case results
    const { data: testCaseResults, error: testCaseError } = await supabase
      .from('ollama_test_case_results')
      .select('*')
      .eq('benchmark_result_id', benchmarkResultId);
    
    if (testCaseError) {
      console.error('Error fetching test case results:', testCaseError);
      throw new Error(`Failed to fetch test case results: ${testCaseError.message}`);
    }
    
    // Get model rankings
    const { data: modelRankings, error: rankingsError } = await supabase
      .from('ollama_model_rankings')
      .select('*')
      .eq('benchmark_result_id', benchmarkResultId)
      .order('overall_rank', { ascending: true });
    
    if (rankingsError) {
      console.error('Error fetching model rankings:', rankingsError);
      throw new Error(`Failed to fetch model rankings: ${rankingsError.message}`);
    }
    
    return {
      benchmarkResult,
      testCaseResults,
      modelRankings
    };
  } catch (error) {
    console.error('Error getting benchmark results:', error);
    throw error;
  }
};

export default {
  createOllamaBenchmark,
  runOllamaBenchmark,
  getBenchmarkStatus,
  getBenchmarkResults
};
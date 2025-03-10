import axios from 'axios';

// Import the API_URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create an axios instance for Evaluation API
const evaluationClient = axios.create({
  baseURL: `${API_URL}/api/evaluation`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add API key to requests
const getApiKey = () => {
  const apiKey = localStorage.getItem('openrouter_api_key');
  return apiKey;
};

/**
 * Evaluate a model's response
 * @param {string} prompt - The original prompt
 * @param {string} expectedOutput - The expected output (optional)
 * @param {string} actualOutput - The model's actual output
 * @param {string} evaluatorModel - The model to use for evaluation (optional)
 * @returns {Promise<Object>} - Evaluation results
 */
export const evaluateResponse = async (prompt, expectedOutput, actualOutput, evaluatorModel = 'openai/gpt-4') => {
  try {
    const apiKey = getApiKey();
    const response = await evaluationClient.post('/evaluate', {
      prompt,
      expectedOutput,
      actualOutput,
      evaluatorModel,
    }, {
      headers: {
        'X-API-Key': apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error evaluating response:', error);
    throw error;
  }
};

/**
 * Evaluate a model's response for a specific task
 * @param {string} taskType - The type of task (e.g., 'summarization', 'question-answering')
 * @param {string} prompt - The original prompt
 * @param {string} expectedOutput - The expected output (optional)
 * @param {string} actualOutput - The model's actual output
 * @param {string} evaluatorModel - The model to use for evaluation (optional)
 * @returns {Promise<Object>} - Task-specific evaluation results
 */
export const evaluateTaskSpecific = async (taskType, prompt, expectedOutput, actualOutput, evaluatorModel = 'openai/gpt-4') => {
  try {
    const apiKey = getApiKey();
    const response = await evaluationClient.post('/evaluate-task', {
      taskType,
      prompt,
      expectedOutput,
      actualOutput,
      evaluatorModel,
    }, {
      headers: {
        'X-API-Key': apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error evaluating task-specific response:', error);
    throw error;
  }
};

/**
 * Batch evaluate multiple responses
 * @param {Array} evaluations - Array of evaluation objects
 * @param {string} evaluatorModel - The model to use for evaluation (optional)
 * @returns {Promise<Array>} - Array of evaluation results
 */
export const evaluateBatch = async (evaluations, evaluatorModel = 'openai/gpt-4') => {
  try {
    const apiKey = getApiKey();
    const response = await evaluationClient.post('/evaluate-batch', {
      evaluations,
      evaluatorModel,
    }, {
      headers: {
        'X-API-Key': apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error batch evaluating responses:', error);
    throw error;
  }
};

/**
 * Evaluate benchmark results
 * @param {Object} benchmarkResult - The benchmark result object
 * @param {string} evaluatorModel - The model to use for evaluation (optional)
 * @returns {Promise<Object>} - Enhanced benchmark result with evaluations
 */
export const evaluateBenchmarkResults = async (benchmarkResult, evaluatorModel = 'openai/gpt-4') => {
  try {
    // Extract test case results from the benchmark result
    const { test_case_results } = benchmarkResult;
    
    if (!test_case_results || test_case_results.length === 0) {
      throw new Error('No test case results found in benchmark result');
    }
    
    // Prepare evaluations array
    const evaluations = test_case_results.map(tcr => ({
      id: `${tcr.model_id}-${tcr.test_case_id}`,
      prompt: tcr.prompt,
      actualOutput: tcr.output,
      taskType: tcr.test_case_id.split('-')[0], // Extract task type from test case ID
    }));
    
    // Batch evaluate all test case results
    const evaluationResults = await evaluateBatch(evaluations, evaluatorModel);
    
    // Enhance benchmark result with evaluations
    const enhancedResult = {
      ...benchmarkResult,
      evaluations: {},
    };
    
    // Organize evaluations by model and test case
    evaluationResults.forEach(evalResult => {
      const [modelId, testCaseId] = evalResult.id.split('-');
      
      if (!enhancedResult.evaluations[modelId]) {
        enhancedResult.evaluations[modelId] = {};
      }
      
      enhancedResult.evaluations[modelId][testCaseId] = evalResult.result;
    });
    
    // Calculate average scores per model
    Object.keys(enhancedResult.evaluations).forEach(modelId => {
      const modelEvals = enhancedResult.evaluations[modelId];
      const scores = Object.values(modelEvals).map(evalResult => evalResult.overall?.score || 0);
      
      if (scores.length > 0) {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        if (!enhancedResult.summary) {
          enhancedResult.summary = { models: {} };
        }
        
        if (!enhancedResult.summary.models[modelId]) {
          enhancedResult.summary.models[modelId] = {};
        }
        
        enhancedResult.summary.models[modelId].avgEvalScore = avgScore;
      }
    });
    
    return enhancedResult;
  } catch (error) {
    console.error('Error evaluating benchmark results:', error);
    throw error;
  }
};

export default {
  evaluateResponse,
  evaluateTaskSpecific,
  evaluateBatch,
  evaluateBenchmarkResults,
};
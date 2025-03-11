import supabase from '../supabase.js';
import { getOpenRouterModels } from './openrouter.js';
import { generateWithLangchain } from './langchain-service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate test cases based on a topic
 * @param {string} topic - The topic or domain for the benchmark
 * @param {number} count - Number of test cases to generate
 * @returns {Promise<Array>} - Array of generated test cases
 */
export const generateTestCases = async (topic, count = 20) => {
  try {
    // Use LangChain to generate test cases
    const prompt = `
      You are an expert in creating benchmark test cases for evaluating AI language models.
      
      Create ${count} diverse test cases for evaluating language models on the topic: "${topic}".
      
      For each test case, include:
      1. A clear, specific prompt that tests knowledge or capabilities related to ${topic}
      2. The expected output or key points that should be included in a good response
      3. A category for the test case (e.g., factual-knowledge, problem-solving, creative-writing, etc.)
      
      Format your response as a JSON array of objects with the following structure:
      [
        {
          "id": "unique-id",
          "name": "Brief descriptive name",
          "category": "category-name",
          "prompt": "The actual prompt text",
          "expectedOutput": "Expected output or key points"
        }
      ]
      
      Ensure the test cases:
      - Cover different aspects and difficulty levels related to ${topic}
      - Include both factual and reasoning questions
      - Test both general knowledge and specialized expertise
      - Avoid ambiguous questions with multiple valid answers
      - Are challenging but fair
      
      Return only the JSON array with no additional text.
    `;

    const response = await generateWithLangchain(prompt, {
      model: "openai/gpt-3.5-turbo",  // Using GPT-3.5 which requires less token capacity
      temperature: 0.7,
      max_tokens: 2000  // Reduced max tokens
    });

    // Parse the response as JSON
    let testCases;
    try {
      // First try to parse the entire response as JSON
      try {
        testCases = JSON.parse(response);
      } catch (directParseError) {
        // If that fails, try to extract a JSON array from the response
        const jsonMatch = response.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          testCases = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON array is found, look for any JSON object
          const objectMatch = response.match(/\{\s*".*"\s*:.*\}/s);
          if (objectMatch) {
            const parsedObject = JSON.parse(objectMatch[0]);
            // Check if the object has a property that contains an array
            const arrayProperty = Object.values(parsedObject).find(value => Array.isArray(value));
            if (arrayProperty) {
              testCases = arrayProperty;
            } else {
              throw new Error('No valid JSON array found in response object');
            }
          } else {
            throw new Error('No valid JSON found in response');
          }
        }
      }
      
      // Validate that testCases is an array
      if (!Array.isArray(testCases)) {
        throw new Error('Parsed result is not an array');
      }
      
      // Validate that each test case has the required properties
      testCases = testCases.filter(testCase => {
        return testCase && typeof testCase === 'object' &&
               typeof testCase.prompt === 'string' &&
               testCase.prompt.trim() !== '';
      });
      
      if (testCases.length === 0) {
        throw new Error('No valid test cases found in response');
      }
    } catch (parseError) {
      console.error('Error parsing test cases JSON:', parseError);
      console.log('Raw response:', response);
      
      // Fallback: Create basic test cases from the response
      console.log('Creating fallback test cases');
      const lines = response.split('\n').filter(line => line.trim() !== '');
      testCases = [];
      
      // Try to extract questions from the response
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.endsWith('?') || line.match(/^\d+\.\s+/)) {
          testCases.push({
            id: uuidv4(),
            name: `Test case ${testCases.length + 1}`,
            category: 'general',
            prompt: line,
            expectedOutput: ''
          });
          
          if (testCases.length >= count) break;
        }
      }
      
      if (testCases.length === 0) {
        throw new Error('Failed to parse generated test cases and could not create fallback test cases');
      }
    }

    // Ensure each test case has a unique ID
    testCases = testCases.map(testCase => ({
      ...testCase,
      id: testCase.id || uuidv4()
    }));

    return testCases;
  } catch (error) {
    console.error('Error generating test cases:', error);
    throw error;
  }
};

/**
 * Select appropriate models based on the topic and options
 * @param {string} topic - The topic or domain for the benchmark
 * @param {number} maxModels - Maximum number of models to select
 * @param {boolean} prioritizeCost - Whether to prioritize cost-effective models
 * @returns {Promise<Array>} - Array of selected model configurations
 */
export const selectModels = async (topic, maxModels = 50, prioritizeCost = false) => {
  try {
    // Get available models from OpenRouter
    const modelsResponse = await getOpenRouterModels();
    
    // Extract the models array from the response
    // The OpenRouter API returns models in the 'data' property
    let availableModels = modelsResponse.data || [];
    
    if (!Array.isArray(availableModels)) {
      console.error('Invalid models response format, trying to extract data property:', modelsResponse);
      
      // Try to extract from data.data (nested structure)
      if (modelsResponse.data && Array.isArray(modelsResponse.data.data)) {
        console.log('Found models in data.data property');
        availableModels = modelsResponse.data.data;
      } else {
        // If still not an array, create a fallback array with some common models
        console.warn('Creating fallback models array');
        availableModels = [
          { id: 'openai/gpt-3.5-turbo', description: 'GPT-3.5 Turbo' },
          { id: 'anthropic/claude-3-haiku', description: 'Claude 3 Haiku' },
          { id: 'google/gemini-pro', description: 'Gemini Pro' },
          { id: 'meta-llama/llama-3-8b-instruct', description: 'Llama 3 8B' },
          { id: 'mistralai/mistral-7b-instruct', description: 'Mistral 7B' }
        ];
      }
    }
    
    if (availableModels.length === 0) {
      console.warn('No models found, using fallback models');
      availableModels = [
        { id: 'openai/gpt-3.5-turbo', description: 'GPT-3.5 Turbo' },
        { id: 'anthropic/claude-3-haiku', description: 'Claude 3 Haiku' },
        { id: 'google/gemini-pro', description: 'Gemini Pro' },
        { id: 'meta-llama/llama-3-8b-instruct', description: 'Llama 3 8B' },
        { id: 'mistralai/mistral-7b-instruct', description: 'Mistral 7B' }
      ];
    }
    
    console.log(`Retrieved ${availableModels.length} available models`);
    
    // Limit the number of models to include in the prompt to avoid token limit issues
    // We'll take a representative sample of models instead of all of them
    const MAX_MODELS_IN_PROMPT = 30;
    let modelsForPrompt = availableModels;
    
    if (availableModels.length > MAX_MODELS_IN_PROMPT) {
      console.log(`Limiting models in prompt to ${MAX_MODELS_IN_PROMPT} (from ${availableModels.length})`);
      
      // Create a diverse sample by taking models from different providers
      const modelsByProvider = {};
      
      // Group models by provider
      availableModels.forEach(model => {
        const provider = model.id.split('/')[0]; // Extract provider from id (e.g., "openai" from "openai/gpt-4")
        if (!modelsByProvider[provider]) {
          modelsByProvider[provider] = [];
        }
        modelsByProvider[provider].push(model);
      });
      
      // Take a few models from each provider
      modelsForPrompt = [];
      const providers = Object.keys(modelsByProvider);
      const modelsPerProvider = Math.max(1, Math.floor(MAX_MODELS_IN_PROMPT / providers.length));
      
      providers.forEach(provider => {
        const providerModels = modelsByProvider[provider];
        // Take a sample of models from this provider
        const sampleSize = Math.min(modelsPerProvider, providerModels.length);
        const sample = providerModels.slice(0, sampleSize);
        modelsForPrompt.push(...sample);
      });
      
      // If we still have room, add more popular models
      if (modelsForPrompt.length < MAX_MODELS_IN_PROMPT) {
        const popularModels = [
          'openai/gpt-4-turbo',
          'openai/gpt-3.5-turbo',
          'anthropic/claude-3-opus',
          'anthropic/claude-3-sonnet',
          'anthropic/claude-3-haiku',
          'google/gemini-pro',
          'meta-llama/llama-3-70b-instruct',
          'meta-llama/llama-3-8b-instruct',
          'mistralai/mistral-7b-instruct'
        ];
        
        // Add any popular models that aren't already in our sample
        for (const modelId of popularModels) {
          if (modelsForPrompt.length >= MAX_MODELS_IN_PROMPT) break;
          
          const model = availableModels.find(m => m.id === modelId);
          if (model && !modelsForPrompt.some(m => m.id === modelId)) {
            modelsForPrompt.push(model);
          }
        }
      }
      
      // Limit to MAX_MODELS_IN_PROMPT
      modelsForPrompt = modelsForPrompt.slice(0, MAX_MODELS_IN_PROMPT);
      console.log(`Selected ${modelsForPrompt.length} representative models for the prompt`);
    }
    
    // Use LangChain to select appropriate models
    const modelsList = modelsForPrompt.map(model => `${model.id} (${model.description || 'No description'})`).join('\n');
    
    const prompt = `
      You are an expert in AI model selection for benchmarking.
      
      Select the most appropriate models for benchmarking on the topic: "${topic}".
      
      Here are the available models:
      ${modelsList}
      
      ${prioritizeCost ? 'Prioritize cost-effective models that provide good value for money.' : ''}
      
      For each selected model, provide:
      1. The model ID exactly as shown above
      2. A brief explanation of why this model is suitable for this topic
      3. Recommended parameters (temperature, top_p, etc.)
      
      Format your response as a JSON array of objects with the following structure:
      [
        {
          "modelId": "exact-model-id",
          "reason": "Brief explanation of selection",
          "parameters": {
            "temperature": 0.7,
            "top_p": 1,
            "max_tokens": 1000
          }
        }
      ]
      
      Select up to ${maxModels} models, focusing on diversity and coverage of different capabilities.
      Include both specialized models that might excel at this topic and general-purpose models for comparison.
      
      Return only the JSON array with no additional text.
    `;

    const response = await generateWithLangchain(prompt, {
      model: "openai/gpt-3.5-turbo",  // Using GPT-3.5 which requires less token capacity
      temperature: 0.7,
      max_tokens: 2000  // Reduced max tokens
    });

    // Parse the response as JSON
    let selectedModels;
    try {
      // First try to parse the entire response as JSON
      try {
        selectedModels = JSON.parse(response);
      } catch (directParseError) {
        // If that fails, try to extract a JSON array from the response
        const jsonMatch = response.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          selectedModels = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON array is found, look for any JSON object
          const objectMatch = response.match(/\{\s*".*"\s*:.*\}/s);
          if (objectMatch) {
            const parsedObject = JSON.parse(objectMatch[0]);
            // Check if the object has a property that contains an array
            const arrayProperty = Object.values(parsedObject).find(value => Array.isArray(value));
            if (arrayProperty) {
              selectedModels = arrayProperty;
            } else {
              throw new Error('No valid JSON array found in response object');
            }
          } else {
            throw new Error('No valid JSON found in response');
          }
        }
      }
      
      // Validate that selectedModels is an array
      if (!Array.isArray(selectedModels)) {
        throw new Error('Parsed result is not an array');
      }
      
      // Validate that each model has the required properties
      selectedModels = selectedModels.filter(model => {
        return model && typeof model === 'object' &&
               typeof model.modelId === 'string' &&
               model.modelId.trim() !== '';
      });
      
      if (selectedModels.length === 0) {
        throw new Error('No valid models found in response');
      }
    } catch (parseError) {
      console.error('Error parsing selected models JSON:', parseError);
      console.log('Raw response:', response);
      
      // Fallback: Use a subset of available models
      console.log('Using fallback model selection');
      selectedModels = availableModels
        .slice(0, Math.min(maxModels, availableModels.length))
        .map(model => ({
          modelId: model.id,
          reason: 'Automatically selected as fallback',
          parameters: {
            temperature: 0.7,
            top_p: 1,
            max_tokens: 1000
          },
          enabled: true // Add enabled property for BenchmarkRunner.jsx
        }));
      
      if (selectedModels.length === 0) {
        throw new Error('Failed to parse selected models and could not create fallback selection');
      }
    }

    // Filter out any models that don't exist in availableModels
    const validModelIds = availableModels.map(model => model.id);
    
    // Log the number of valid model IDs for debugging
    console.log(`Found ${validModelIds.length} valid model IDs`);
    
    // Filter selected models to only include valid ones
    const originalCount = selectedModels.length;
    selectedModels = selectedModels.filter(model => validModelIds.includes(model.modelId));
    
    // Log how many models were filtered out
    console.log(`Filtered out ${originalCount - selectedModels.length} invalid models`);

    // Limit to maxModels
    selectedModels = selectedModels.slice(0, maxModels);

    // Add enabled property to each model (needed by BenchmarkRunner.jsx)
    selectedModels = selectedModels.map(model => ({
      ...model,
      enabled: true // All selected models are enabled by default
    }));

    console.log(`Returning ${selectedModels.length} models with enabled property`);
    return selectedModels;
  } catch (error) {
    console.error('Error selecting models:', error);
    throw error;
  }
};

/**
 * Analyze benchmark results
 * @param {Object} benchmarkResult - The benchmark result object
 * @param {Array} rankings - The model rankings
 * @param {string} analysisType - The type of analysis to perform (general, cost, domain)
 * @returns {Promise<Object>} - The analysis results
 */
export const analyzeResults = async (benchmarkResult, rankings, analysisType = 'general') => {
  try {
    // Validate benchmark result
    if (!benchmarkResult) {
      throw new Error('Benchmark result is required');
    }
    
    if (!benchmarkResult.test_case_results || !Array.isArray(benchmarkResult.test_case_results) || benchmarkResult.test_case_results.length === 0) {
      throw new Error('Benchmark result does not contain any test case results');
    }
    
    // If rankings don't exist yet, generate them
    if (!rankings || rankings.length === 0) {
      rankings = await generateRankings(benchmarkResult);
    }
    
    // Validate rankings
    if (!rankings || rankings.length === 0) {
      throw new Error('Failed to generate rankings');
    }

    // Prepare the analysis based on the requested type
    switch (analysisType) {
      case 'cost':
        return await analyzeCostEfficiency(benchmarkResult, rankings);
      case 'domain':
        return await analyzeDomainExpertise(benchmarkResult, rankings);
      case 'general':
      default:
        return {
          rankings,
          summary: generateSummary(benchmarkResult, rankings)
        };
    }
  } catch (error) {
    console.error('Error analyzing results:', error);
    
    // Return a basic response with error information
    return {
      error: error.message,
      rankings: rankings || [],
      summary: {
        error: 'Analysis failed',
        message: error.message,
        topic: benchmarkResult?.benchmark_configs?.topic || 'Unknown',
        totalModels: rankings?.length || 0
      }
    };
  }
};

/**
 * Generate rankings for models in a benchmark result
 * @param {Object} benchmarkResult - The benchmark result object
 * @returns {Promise<Array>} - The generated rankings
 */
const generateRankings = async (benchmarkResult) => {
  try {
    // Validate benchmark result
    if (!benchmarkResult || !benchmarkResult.id) {
      throw new Error('Invalid benchmark result: missing ID');
    }
    
    if (!benchmarkResult.test_case_results || !Array.isArray(benchmarkResult.test_case_results) || benchmarkResult.test_case_results.length === 0) {
      throw new Error('Benchmark result does not contain any test case results');
    }
    
    // Check if we already have rankings
    const { data: existingRankings, error: rankingsError } = await supabase
      .from('model_rankings')
      .select('*')
      .eq('benchmark_result_id', benchmarkResult.id);
    
    if (rankingsError) {
      console.error('Error checking existing rankings:', rankingsError);
      throw new Error(`Failed to check existing rankings: ${rankingsError.message}`);
    }
    
    if (existingRankings && existingRankings.length > 0) {
      console.log(`Found ${existingRankings.length} existing rankings for benchmark ${benchmarkResult.id}`);
      return existingRankings;
    }
    
    console.log(`Generating new rankings for benchmark ${benchmarkResult.id}`);
    
    // Extract model IDs from test case results
    const modelIds = [...new Set(benchmarkResult.test_case_results.map(tcr => tcr.model_id))];
    
    if (modelIds.length === 0) {
      throw new Error('No models found in test case results');
    }
    
    // Calculate scores for each model
    const modelScores = modelIds.map(modelId => {
      const modelResults = benchmarkResult.test_case_results.filter(tcr => tcr.model_id === modelId);
      
      // Calculate average scores
      const avgLatency = modelResults.reduce((sum, tcr) => sum + tcr.latency, 0) / modelResults.length;
      const totalTokens = modelResults.reduce((sum, tcr) => sum + tcr.token_count, 0);
      const totalCost = modelResults.reduce((sum, tcr) => sum + tcr.cost, 0);
      
      // Calculate domain expertise score if available
      const domainExpertiseScore = modelResults.reduce((sum, tcr) => sum + (tcr.domain_expertise_score || 0), 0) / modelResults.length;
      
      // Calculate accuracy score if available
      const accuracyScore = modelResults.reduce((sum, tcr) => sum + (tcr.accuracy_score || 0), 0) / modelResults.length;
      
      // Calculate overall score (weighted average)
      const overallScore = (
        (accuracyScore * 0.4) + 
        (domainExpertiseScore * 0.3) + 
        (Math.max(0, 1 - (avgLatency / 10000)) * 0.1) + 
        (Math.max(0, 1 - (totalCost / 0.1)) * 0.2)
      );
      
      return {
        model_id: modelId,
        avg_latency: avgLatency,
        total_tokens: totalTokens,
        total_cost: totalCost,
        domain_expertise_score: domainExpertiseScore,
        accuracy_score: accuracyScore,
        overall_score: overallScore,
        cost_efficiency: accuracyScore / (totalCost > 0 ? totalCost : 0.001),
        speed_level: Math.min(5, Math.max(1, Math.floor(6 - (avgLatency / 2000)))),
        cost_level: Math.min(5, Math.max(1, Math.floor(6 - (totalCost * 100))))
      };
    });
    
    // Sort by overall score for overall ranking
    const overallRanking = [...modelScores].sort((a, b) => b.overall_score - a.overall_score);
    
    // Sort by cost efficiency for cost efficiency ranking
    const costEfficiencyRanking = [...modelScores].sort((a, b) => b.cost_efficiency - a.cost_efficiency);
    
    // Sort by domain expertise for domain expertise ranking
    const domainExpertiseRanking = [...modelScores].sort((a, b) => b.domain_expertise_score - a.domain_expertise_score);
    
    // Create rankings with ranks assigned
    const rankings = modelScores.map(score => {
      const overallRank = overallRanking.findIndex(item => item.model_id === score.model_id) + 1;
      const costEfficiencyRank = costEfficiencyRanking.findIndex(item => item.model_id === score.model_id) + 1;
      const domainExpertiseRank = domainExpertiseRanking.findIndex(item => item.model_id === score.model_id) + 1;
      
      return {
        id: uuidv4(),
        benchmark_result_id: benchmarkResult.id,
        model_id: score.model_id,
        overall_rank: overallRank,
        performance_rank: overallRank, // Same as overall for now
        cost_efficiency_rank: costEfficiencyRank,
        domain_expertise_rank: domainExpertiseRank,
        score: score.overall_score,
        speed_level: score.speed_level,
        cost_level: score.cost_level,
        created_at: new Date().toISOString()
      };
    });
    
    // Save rankings to database
    const { error: insertError } = await supabase
      .from('model_rankings')
      .insert(rankings);
    
    if (insertError) {
      console.error('Error saving rankings:', insertError);
      throw insertError;
    }
    
    return rankings;
  } catch (error) {
    console.error('Error generating rankings:', error);
    
    // Create a minimal set of rankings if possible
    if (benchmarkResult && benchmarkResult.test_case_results && benchmarkResult.test_case_results.length > 0) {
      try {
        console.log('Attempting to create fallback rankings');
        
        // Extract model IDs from test case results
        const modelIds = [...new Set(benchmarkResult.test_case_results.map(tcr => tcr.model_id))];
        
        if (modelIds.length > 0) {
          // Create basic rankings with default values
          const fallbackRankings = modelIds.map((modelId, index) => ({
            id: uuidv4(),
            benchmark_result_id: benchmarkResult.id,
            model_id: modelId,
            overall_rank: index + 1,
            performance_rank: index + 1,
            cost_efficiency_rank: index + 1,
            domain_expertise_rank: index + 1,
            score: 0.5, // Default score
            speed_level: 3, // Default middle level
            cost_level: 3, // Default middle level
            created_at: new Date().toISOString()
          }));
          
          console.log(`Created ${fallbackRankings.length} fallback rankings`);
          return fallbackRankings;
        }
      } catch (fallbackError) {
        console.error('Error creating fallback rankings:', fallbackError);
      }
    }
    
    throw new Error(`Failed to generate rankings: ${error.message}`);
  }
};

/**
 * Analyze cost efficiency of models
 * @param {Object} benchmarkResult - The benchmark result object
 * @param {Array} rankings - The model rankings
 * @returns {Promise<Object>} - The cost efficiency analysis
 */
const analyzeCostEfficiency = async (benchmarkResult, rankings) => {
  try {
    // Validate inputs
    if (!benchmarkResult || !benchmarkResult.test_case_results) {
      throw new Error('Invalid benchmark result');
    }
    
    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) {
      throw new Error('Invalid rankings');
    }
    
    // Extract model IDs from rankings
    const modelIds = rankings.map(ranking => ranking.model_id);
    
    // Calculate cost breakdown for each model
    const costBreakdown = modelIds.map(modelId => {
      const modelResults = benchmarkResult.test_case_results.filter(tcr => tcr.model_id === modelId);
      
      if (modelResults.length === 0) {
        console.warn(`No test case results found for model ${modelId}`);
        return null;
      }
      
      const totalCost = modelResults.reduce((sum, tcr) => sum + (tcr.cost || 0), 0);
      const costPerTestCase = totalCost / modelResults.length;
      const ranking = rankings.find(r => r.model_id === modelId);
      
      if (!ranking) {
        console.warn(`No ranking found for model ${modelId}`);
        return null;
      }
      
      return {
        model_id: modelId,
        totalCost,
        costPerTestCase,
        costEfficiencyRank: ranking.cost_efficiency_rank,
        overallRank: ranking.overall_rank
      };
    }).filter(Boolean); // Remove null entries
    
    if (costBreakdown.length === 0) {
      throw new Error('No valid cost breakdown data could be generated');
    }
    
    // Sort by cost efficiency rank
    costBreakdown.sort((a, b) => a.costEfficiencyRank - b.costEfficiencyRank);
    
    return {
      rankings: rankings.sort((a, b) => a.cost_efficiency_rank - b.cost_efficiency_rank),
      costBreakdown
    };
  } catch (error) {
    console.error('Error analyzing cost efficiency:', error);
    
    // Return a basic response with error information
    return {
      error: error.message,
      rankings: rankings || [],
      costBreakdown: []
    };
  }
};

/**
 * Analyze domain expertise of models
 * @param {Object} benchmarkResult - The benchmark result object
 * @param {Array} rankings - The model rankings
 * @returns {Promise<Object>} - The domain expertise analysis
 */
const analyzeDomainExpertise = async (benchmarkResult, rankings) => {
  try {
    // Validate inputs
    if (!benchmarkResult || !benchmarkResult.test_case_results) {
      throw new Error('Invalid benchmark result');
    }
    
    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) {
      throw new Error('Invalid rankings');
    }
    
    // Extract model IDs from rankings
    const modelIds = rankings.map(ranking => ranking.model_id);
    
    // Get test case categories
    const testCaseIds = [...new Set(benchmarkResult.test_case_results.map(tcr => tcr.test_case_id))];
    const testCaseCategories = {};
    
    // Try to get categories from test_cases in benchmark_configs
    if (benchmarkResult.benchmark_configs?.test_cases) {
      let testCases;
      if (typeof benchmarkResult.benchmark_configs.test_cases === 'string') {
        try {
          testCases = JSON.parse(benchmarkResult.benchmark_configs.test_cases);
        } catch (e) {
          console.error('Error parsing test cases:', e);
          // Continue with empty categories rather than failing
        }
      } else {
        testCases = benchmarkResult.benchmark_configs.test_cases;
      }
      
      if (Array.isArray(testCases)) {
        testCases.forEach(tc => {
          if (tc.id && tc.category) {
            testCaseCategories[tc.id] = tc.category;
          }
        });
      }
    }
    
    // If no categories were found, create default categories
    if (Object.keys(testCaseCategories).length === 0) {
      console.log('No test case categories found, using default categories');
      testCaseIds.forEach((id, index) => {
        testCaseCategories[id] = `Category ${index + 1}`;
      });
    }
    
    // Generate domain insights for each model
    const domainInsights = modelIds.map(modelId => {
      const modelResults = benchmarkResult.test_case_results.filter(tcr => tcr.model_id === modelId);
      
      if (modelResults.length === 0) {
        console.warn(`No test case results found for model ${modelId}`);
        return null;
      }
      
      const ranking = rankings.find(r => r.model_id === modelId);
      
      if (!ranking) {
        console.warn(`No ranking found for model ${modelId}`);
        return null;
      }
      
      // Group results by category
      const resultsByCategory = {};
      modelResults.forEach(tcr => {
        const category = testCaseCategories[tcr.test_case_id] || 'unknown';
        if (!resultsByCategory[category]) {
          resultsByCategory[category] = [];
        }
        resultsByCategory[category].push(tcr);
      });
      
      // Calculate average score by category
      const categoryScores = Object.entries(resultsByCategory).map(([category, results]) => {
        const avgScore = results.reduce((sum, tcr) => sum + (tcr.domain_expertise_score || 0), 0) / results.length;
        return { category, score: avgScore };
      });
      
      // Sort by score
      categoryScores.sort((a, b) => b.score - a.score);
      
      // Get top 3 strengths and weaknesses (or fewer if not enough categories)
      const strengths = categoryScores.slice(0, Math.min(3, categoryScores.length));
      const weaknesses = [...categoryScores].sort((a, b) => a.score - b.score).slice(0, Math.min(3, categoryScores.length));
      
      return {
        model_id: modelId,
        domainExpertiseRank: ranking.domain_expertise_rank,
        overallRank: ranking.overall_rank,
        strengths,
        weaknesses
      };
    }).filter(Boolean); // Remove null entries
    
    if (domainInsights.length === 0) {
      throw new Error('No valid domain insights could be generated');
    }
    
    // Sort by domain expertise rank
    domainInsights.sort((a, b) => a.domainExpertiseRank - b.domainExpertiseRank);
    
    return {
      rankings: rankings.sort((a, b) => a.domain_expertise_rank - b.domain_expertise_rank),
      domainInsights
    };
  } catch (error) {
    console.error('Error analyzing domain expertise:', error);
    
    // Return a basic response with error information
    return {
      error: error.message,
      rankings: rankings || [],
      domainInsights: []
    };
  }
};

/**
 * Generate a summary of the benchmark results
 * @param {Object} benchmarkResult - The benchmark result object
 * @param {Array} rankings - The model rankings
 * @returns {Object} - The summary
 */
const generateSummary = (benchmarkResult, rankings) => {
  try {
    // Validate inputs
    if (!benchmarkResult) {
      throw new Error('Invalid benchmark result');
    }
    
    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) {
      throw new Error('Invalid rankings');
    }
    
    // Make a copy of the arrays to avoid modifying the original
    const rankingsCopy = [...rankings];
    
    // Get top 3 models (or fewer if not enough models)
    const topModels = rankingsCopy.sort((a, b) => a.overall_rank - b.overall_rank).slice(0, Math.min(3, rankingsCopy.length));
    
    // Get most cost-effective model
    const mostCostEffective = rankingsCopy.sort((a, b) => a.cost_efficiency_rank - b.cost_efficiency_rank)[0];
    
    // Get best domain expertise model
    const bestDomainExpert = rankingsCopy.sort((a, b) => a.domain_expertise_rank - b.domain_expertise_rank)[0];
    
    return {
      topic: benchmarkResult.benchmark_configs?.topic || 'Unknown',
      totalModels: rankings.length,
      topModels: topModels.map(model => ({
        model_id: model.model_id,
        rank: model.overall_rank,
        score: model.score
      })),
      mostCostEffective: {
        model_id: mostCostEffective.model_id,
        rank: mostCostEffective.cost_efficiency_rank,
        score: mostCostEffective.score
      },
      bestDomainExpert: {
        model_id: bestDomainExpert.model_id,
        rank: bestDomainExpert.domain_expertise_rank,
        score: bestDomainExpert.score
      }
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    
    // Return a basic summary with error information
    return {
      error: error.message,
      topic: benchmarkResult?.benchmark_configs?.topic || 'Unknown',
      totalModels: rankings?.length || 0,
      topModels: [],
      mostCostEffective: null,
      bestDomainExpert: null
    };
  }
};
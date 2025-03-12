import supabase from '../supabase.js';
import { getOpenRouterModels } from './openrouter.js';
import { generateWithLangchain } from './langchain-service.js';
import { v4 as uuidv4 } from 'uuid';
import * as specializedCapabilityService from './specialized-capability-service.js';

/**
 * Helper function to extract JSON array from LLM response
 * @param {string} response - The raw response from the LLM
 * @returns {Array} - The extracted JSON array
 */
const extractJsonArrayFromResponse = (response) => {
  // First try to parse the entire response as JSON
  try {
    const parsed = JSON.parse(response);
    return parsed;
  } catch (directParseError) {
    // If that fails, try to extract a JSON array from the response
    const jsonMatch = response.match(/\[\s*\{.*\}\s*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // If no JSON array is found, look for any JSON object
      const objectMatch = response.match(/\{\s*".*"\s*:.*\}/s);
      if (objectMatch) {
        const parsedObject = JSON.parse(objectMatch[0]);
        // Check if the object has a property that contains an array
        const arrayProperty = Object.values(parsedObject).find(value => Array.isArray(value));
        if (arrayProperty) {
          return arrayProperty;
        } else {
          throw new Error('No valid JSON array found in response object');
        }
      } else {
        throw new Error('No valid JSON found in response');
      }
    }
  }
};

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
      3. A category for the test case using one of these standardized categories:
         - factual-knowledge: Testing recall of facts and information
         - problem-solving: Testing ability to solve problems or puzzles
         - creative-writing: Testing creative and narrative abilities
         - reasoning: Testing logical reasoning and inference
         - technical-knowledge: Testing specialized technical information
         - conceptual-understanding: Testing grasp of abstract concepts
         - procedural-knowledge: Testing understanding of processes and procedures
         - domain-specific-terminology: Testing knowledge of specialized vocabulary
         - analytical-thinking: Testing ability to analyze complex information
         - ethical-reasoning: Testing understanding of ethical considerations
      
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
      - Use a balanced mix of the standardized categories listed above
      
      Return only the JSON array with no additional text.
    `;

    // Use Gemini Flash 2.0 with a lower max_tokens setting to avoid token capacity issues
    const response = await generateWithLangchain(prompt, {
      model: "google/gemini-2.0-flash-001",  // Using Gemini 2.0 Flash with the correct model ID
      temperature: 0.7,
      max_tokens: 1500  // Reduced to stay within available token capacity
    });

    // Parse the response as JSON
    let testCases;
    try {
      testCases = extractJsonArrayFromResponse(response);
      
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
          // Assign a more specific category based on the content of the question
          let category = 'factual-knowledge'; // Default category
          
          if (line.toLowerCase().includes('solve') || line.toLowerCase().includes('calculate')) {
            category = 'problem-solving';
          } else if (line.toLowerCase().includes('explain') || line.toLowerCase().includes('why')) {
            category = 'reasoning';
          } else if (line.toLowerCase().includes('write') || line.toLowerCase().includes('create')) {
            category = 'creative-writing';
          } else if (line.toLowerCase().includes('analyze') || line.toLowerCase().includes('compare')) {
            category = 'analytical-thinking';
          } else if (line.toLowerCase().includes('ethical') || line.toLowerCase().includes('should')) {
            category = 'ethical-reasoning';
          } else if (line.toLowerCase().includes('process') || line.toLowerCase().includes('steps')) {
            category = 'procedural-knowledge';
          } else if (line.toLowerCase().includes('concept') || line.toLowerCase().includes('theory')) {
            category = 'conceptual-understanding';
          } else if (line.toLowerCase().includes('technical') || line.toLowerCase().includes('specification')) {
            category = 'technical-knowledge';
          } else if (line.toLowerCase().includes('term') || line.toLowerCase().includes('definition')) {
            category = 'domain-specific-terminology';
          }
          
          testCases.push({
            id: uuidv4(),
            name: `Test case ${testCases.length + 1}`,
            category: category,
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
 * Helper function to get filtered fallback models
 * @param {Array} selectedProviders - Array of provider IDs to filter models by
 * @returns {Array} - Filtered fallback models
 */
const getFilteredFallbackModels = (selectedProviders = []) => {
  const fallbackModels = [
    { id: 'openai/gpt-3.5-turbo', description: 'GPT-3.5 Turbo' },
    { id: 'anthropic/claude-3-haiku', description: 'Claude 3 Haiku' },
    { id: 'google/gemini-pro', description: 'Gemini Pro' },
    { id: 'meta-llama/llama-3-8b-instruct', description: 'Llama 3 8B' },
    { id: 'mistralai/mistral-7b-instruct', description: 'Mistral 7B' }
  ];
  
  // If no providers specified, return all fallback models
  if (!selectedProviders || selectedProviders.length === 0) {
    return fallbackModels;
  }
  
  // Filter models by provider
  const filteredModels = fallbackModels.filter(model => {
    const provider = model.id.split('/')[0];
    return selectedProviders.includes(provider);
  });
  
  // If no models match the selected providers, use all fallback models
  if (filteredModels.length === 0) {
    console.warn('No fallback models match selected providers, using all fallback models');
    return fallbackModels;
  }
  
  return filteredModels;
};

export const selectModels = async (topic, maxModels = 50, prioritizeCost = false, selectedProviders = []) => {
  try {
    // Get available models from OpenRouter
    const modelsResponse = await getOpenRouterModels();
    
    // Extract the models array from the response
    // The OpenRouter API returns models in the 'data' property
    let availableModels = modelsResponse.data || [];
    
    // Filter models by provider if selectedProviders is not empty
    if (selectedProviders && selectedProviders.length > 0) {
      console.log(`Filtering models by providers: ${selectedProviders.join(', ')}`);
      const filteredModels = availableModels.filter(model => {
        const provider = model.id.split('/')[0]; // Extract provider from id (e.g., "openai" from "openai/gpt-4")
        return selectedProviders.includes(provider);
      });
      
      // If filtering results in no models, keep the original list
      if (filteredModels.length === 0) {
        console.log('No models match the selected providers, keeping all available models');
      } else {
        availableModels = filteredModels;
        console.log(`After filtering, ${availableModels.length} models remain`);
      }
    }
    
    if (!Array.isArray(availableModels)) {
      console.error('Invalid models response format, trying to extract data property:', modelsResponse);
      
      // Try to extract from data.data (nested structure)
      if (modelsResponse.data && Array.isArray(modelsResponse.data.data)) {
        console.log('Found models in data.data property');
        availableModels = modelsResponse.data.data;
      } else {
        // If still not an array, create a fallback array with some common models
        console.warn('Creating fallback models array');
        availableModels = getFilteredFallbackModels(selectedProviders);
      }
    }
    
    if (availableModels.length === 0) {
      console.warn('No models found, using fallback models');
      availableModels = getFilteredFallbackModels(selectedProviders);
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
            "top_p": 1
            // No max_tokens limit
          }
        }
      ]
      
      Select up to ${maxModels} models, focusing on diversity and coverage of different capabilities.
      Include both specialized models that might excel at this topic and general-purpose models for comparison.
      
      Return only the JSON array with no additional text.
    `;

    // Use Gemini Flash 2.0 with a lower max_tokens setting to avoid token capacity issues
    const response = await generateWithLangchain(prompt, {
      model: "google/gemini-2.0-flash-001",  // Using Gemini 2.0 Flash with the correct model ID
      temperature: 0.7,
      max_tokens: 1500  // Reduced to stay within available token capacity
    });

    // Parse the response as JSON
    let selectedModels;
    try {
      selectedModels = extractJsonArrayFromResponse(response);
      
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
            top_p: 1
            // No max_tokens limit
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
 * Generate a domain summary for a model
 * @param {string} modelId - The model ID
 * @param {number} overallScore - The overall domain expertise score
 * @param {number} consistencyScore - The consistency score
 * @param {Array} strengths - The model's strengths
 * @param {Array} weaknesses - The model's weaknesses
 * @param {string} topic - The benchmark topic
 * @returns {string} - A summary of the model's domain expertise
 */
const generateDomainSummary = (modelId, overallScore, consistencyScore, strengths, weaknesses, topic) => {
  // Format the model name for display
  const modelName = modelId.split('/').pop().replace(/-/g, ' ').replace(/(\b\w)/g, match => match.toUpperCase());
  
  // Generate a performance descriptor based on the score
  let performanceLevel = 'poor';
  if (overallScore >= 0.8) {
    performanceLevel = 'excellent';
  } else if (overallScore >= 0.6) {
    performanceLevel = 'good';
  } else if (overallScore >= 0.4) {
    performanceLevel = 'average';
  } else if (overallScore >= 0.2) {
    performanceLevel = 'below average';
  }
  
  // Generate a consistency descriptor
  let consistencyLevel = 'inconsistent';
  if (consistencyScore >= 0.8) {
    consistencyLevel = 'highly consistent';
  } else if (consistencyScore >= 0.6) {
    consistencyLevel = 'consistent';
  } else if (consistencyScore >= 0.4) {
    consistencyLevel = 'moderately consistent';
  }
  
  // Format strengths and weaknesses
  const strengthsList = strengths.map(s => `${s.category} (${(s.score * 100).toFixed(0)}%)`).join(', ');
  const weaknessesList = weaknesses.map(w => `${w.category} (${(w.score * 100).toFixed(0)}%)`).join(', ');
  
  // Generate the summary
  return `${modelName} demonstrates ${performanceLevel} domain expertise in ${topic} with an overall score of ${(overallScore * 100).toFixed(0)}%. 
The model is ${consistencyLevel} across different test categories. 
Key strengths: ${strengthsList}. 
Areas for improvement: ${weaknessesList}.`;
};

/**
 * Analyze categories across all models
 * @param {Array} domainInsights - The domain insights for all models
 * @returns {Object} - Analysis of categories across models
 */
const analyzeCategoriesAcrossModels = (domainInsights) => {
  // Collect all categories
  const allCategories = new Set();
  const categoryScores = {};
  
  // Gather all categories and scores
  domainInsights.forEach(model => {
    model.strengths.concat(model.weaknesses).forEach(item => {
      allCategories.add(item.category);
      
      if (!categoryScores[item.category]) {
        categoryScores[item.category] = [];
      }
      
      categoryScores[item.category].push({
        model_id: model.model_id,
        score: item.score
      });
    });
  });
  
  // Calculate average scores and find best model for each category
  const categoryAnalysis = Array.from(allCategories).map(category => {
    const scores = categoryScores[category];
    const avgScore = scores.reduce((sum, item) => sum + item.score, 0) / scores.length;
    const bestModel = scores.sort((a, b) => b.score - a.score)[0];
    
    return {
      category,
      averageScore: avgScore,
      bestModel: bestModel.model_id,
      bestModelScore: bestModel.score,
      modelCount: scores.length
    };
  });
  
  // Sort by average score
  categoryAnalysis.sort((a, b) => b.averageScore - a.averageScore);
  
  return categoryAnalysis;
};

/**
 * Generate domain-specific recommendations
 * @param {Array} domainInsights - The domain insights for all models
 * @param {string} topic - The benchmark topic
 * @returns {Array} - Recommendations for model selection
 */
const generateDomainRecommendations = (domainInsights, topic) => {
  // Find the best overall model
  const bestOverall = domainInsights.sort((a, b) => a.domainExpertiseRank - b.domainExpertiseRank)[0];
  
  // Find the most consistent model
  const mostConsistent = [...domainInsights].sort((a, b) => b.metrics.consistencyScore - a.metrics.consistencyScore)[0];
  
  // Find models that excel in specific categories
  const categorySpecialists = [];
  const processedCategories = new Set();
  
  domainInsights.forEach(model => {
    if (model.strengths.length > 0) {
      const topStrength = model.strengths[0];
      
      // Only add if this category hasn't been covered yet and the score is good
      if (!processedCategories.has(topStrength.category) && topStrength.score >= 0.7) {
        categorySpecialists.push({
          model_id: model.model_id,
          category: topStrength.category,
          score: topStrength.score
        });
        
        processedCategories.add(topStrength.category);
      }
    }
  });
  
  // Generate recommendations
  const recommendations = [
    {
      type: 'general',
      recommendation: `For general ${topic} tasks, ${bestOverall.model_id} is recommended with an overall domain expertise score of ${(bestOverall.domainExpertiseScore * 100).toFixed(0)}%.`
    },
    {
      type: 'consistency',
      recommendation: `For consistent performance across all ${topic} categories, ${mostConsistent.model_id} is recommended with a consistency score of ${(mostConsistent.metrics.consistencyScore * 100).toFixed(0)}%.`
    }
  ];
  
  // Add category-specific recommendations
  categorySpecialists.forEach(specialist => {
    recommendations.push({
      type: 'category',
      category: specialist.category,
      recommendation: `For ${specialist.category} tasks within ${topic}, ${specialist.model_id} is recommended with a score of ${(specialist.score * 100).toFixed(0)}%.`
    });
  });
  
  return recommendations;
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
        // Get domain analysis to include specialized capabilities in general analysis
        const domainAnalysis = await analyzeDomainExpertise(benchmarkResult, rankings);
        
        // Generate summary with specialized capabilities
        const summary = generateSummary(benchmarkResult, rankings);
        
        // Add domain analysis summary to general analysis
        summary.domainAnalysisSummary = domainAnalysis.domainAnalysisSummary;
        
        // Add specialized capabilities to top models
        if (summary.topModels && domainAnalysis.domainInsights) {
          summary.topModels.forEach(model => {
            const domainInsight = domainAnalysis.domainInsights.find(
              insight => insight.model_id === model.model_id
            );
            if (domainInsight) {
              model.specializedCapabilities = domainInsight.specializedCapabilities;
            }
          });
        }
        
        return {
          rankings,
          summary
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
        domain_expertise_score: score.domain_expertise_score, // Add domain expertise score
        accuracy_score: score.accuracy_score, // Add accuracy score
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
            domain_expertise_score: 0.5, // Default domain expertise score
            accuracy_score: 0.5, // Default accuracy score
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
 * Analyze specialized capabilities of models
 * @param {Object} benchmarkResult - The benchmark result object
 * @param {Array} rankings - The model rankings
 * @returns {Promise<Object>} - The specialized capability analysis
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
    
    // If no categories were found, create default categories based on test case content
    if (Object.keys(testCaseCategories).length === 0) {
      console.log('No test case categories found, creating categories based on content');
      
      // Standard categories
      const standardCategories = [
        'factual-knowledge',
        'problem-solving',
        'creative-writing',
        'reasoning',
        'technical-knowledge',
        'conceptual-understanding',
        'procedural-knowledge',
        'domain-specific-terminology',
        'analytical-thinking',
        'ethical-reasoning'
      ];
      
      // Assign categories based on test case content
      testCaseIds.forEach((id, index) => {
        // Find the test case in the results
        const testCase = benchmarkResult.test_case_results.find(tcr => tcr.test_case_id === id);
        
        if (testCase && testCase.prompt) {
          const prompt = testCase.prompt.toLowerCase();
          
          // Determine category based on prompt content
          if (prompt.includes('solve') || prompt.includes('calculate')) {
            testCaseCategories[id] = 'problem-solving';
          } else if (prompt.includes('explain') || prompt.includes('why')) {
            testCaseCategories[id] = 'reasoning';
          } else if (prompt.includes('write') || prompt.includes('create')) {
            testCaseCategories[id] = 'creative-writing';
          } else if (prompt.includes('analyze') || prompt.includes('compare')) {
            testCaseCategories[id] = 'analytical-thinking';
          } else if (prompt.includes('ethical') || prompt.includes('should')) {
            testCaseCategories[id] = 'ethical-reasoning';
          } else if (prompt.includes('process') || prompt.includes('steps')) {
            testCaseCategories[id] = 'procedural-knowledge';
          } else if (prompt.includes('concept') || prompt.includes('theory')) {
            testCaseCategories[id] = 'conceptual-understanding';
          } else if (prompt.includes('technical') || prompt.includes('specification')) {
            testCaseCategories[id] = 'technical-knowledge';
          } else if (prompt.includes('term') || prompt.includes('definition')) {
            testCaseCategories[id] = 'domain-specific-terminology';
          } else {
            // Default to factual-knowledge or distribute evenly among standard categories
            testCaseCategories[id] = standardCategories[index % standardCategories.length];
          }
        } else {
          // If no prompt is found, assign a default category
          testCaseCategories[id] = standardCategories[index % standardCategories.length];
        }
      });
    }
    
    // Get topic information
    const topic = benchmarkResult.benchmark_configs?.topic || 'Unknown';
    
    // Generate specialized capability insights for each model
    const domainInsights = [];
    
    for (const modelId of modelIds) {
      const modelResults = benchmarkResult.test_case_results.filter(tcr => tcr.model_id === modelId);
      
      if (modelResults.length === 0) {
        console.warn(`No test case results found for model ${modelId}`);
        continue;
      }
      
      const ranking = rankings.find(r => r.model_id === modelId);
      
      if (!ranking) {
        console.warn(`No ranking found for model ${modelId}`);
        continue;
      }
      
      // Evaluate specialized capabilities for each test case
      const capabilityResults = [];
      
      for (const result of modelResults) {
        const category = testCaseCategories[result.test_case_id] || 'unknown';
        
        // Skip test cases without necessary data
        if (!result.output || !result.prompt) continue;
        
        // Evaluate specialized capabilities
        const capabilities = await specializedCapabilityService.evaluateSpecializedCapabilities(
          result.output,
          result.prompt,
          category
        );
        
        capabilityResults.push({
          testCaseId: result.test_case_id,
          category,
          capabilities
        });
      }
      
      // Calculate average scores for each capability
      const avgCodeQuality = capabilityResults.reduce((sum, r) => sum + r.capabilities.codeQuality, 0) / capabilityResults.length;
      const avgMathAccuracy = capabilityResults.reduce((sum, r) => sum + r.capabilities.mathematicalAccuracy, 0) / capabilityResults.length;
      const avgCreativeQuality = capabilityResults.reduce((sum, r) => sum + r.capabilities.creativeQuality, 0) / capabilityResults.length;
      const avgAnalyticalDepth = capabilityResults.reduce((sum, r) => sum + r.capabilities.analyticalDepth, 0) / capabilityResults.length;
      
      // Calculate overall score
      const overallScore = (avgCodeQuality + avgMathAccuracy + avgCreativeQuality + avgAnalyticalDepth) / 4;
      
      // Group results by category
      const resultsByCategory = {};
      capabilityResults.forEach(result => {
        if (!resultsByCategory[result.category]) {
          resultsByCategory[result.category] = [];
        }
        resultsByCategory[result.category].push(result);
      });
      
      // Calculate average score by category
      const categoryScores = Object.entries(resultsByCategory).map(([category, results]) => {
        // Calculate average overall score for this category
        const categoryOverallScores = results.map(r =>
          specializedCapabilityService.calculateOverallCapabilityScore(r.capabilities)
        );
        const avgScore = categoryOverallScores.reduce((sum, score) => sum + score, 0) / categoryOverallScores.length;
        
        // Get sample responses
        const sampleResponses = modelResults
          .filter(tcr => testCaseCategories[tcr.test_case_id] === category)
          .slice(0, 2)
          .map(tcr => ({
            prompt: tcr.prompt,
            output: tcr.output.substring(0, 150) + (tcr.output.length > 150 ? '...' : ''),
            score: avgScore
          }));
        
        return {
          category,
          score: avgScore,
          testCount: results.length,
          sampleResponses
        };
      });
      
      // Sort by score
      categoryScores.sort((a, b) => b.score - a.score);
      
      // Get top 3 strengths and weaknesses (or fewer if not enough categories)
      const strengths = categoryScores.slice(0, Math.min(3, categoryScores.length));
      const weaknesses = [...categoryScores].sort((a, b) => a.score - b.score).slice(0, Math.min(3, categoryScores.length));
      
      // Calculate score distribution
      const allScores = capabilityResults.map(r =>
        specializedCapabilityService.calculateOverallCapabilityScore(r.capabilities)
      );
      
      const scoreDistribution = {
        excellent: allScores.filter(score => score >= 0.8).length,
        good: allScores.filter(score => score >= 0.6 && score < 0.8).length,
        average: allScores.filter(score => score >= 0.4 && score < 0.6).length,
        poor: allScores.filter(score => score >= 0.2 && score < 0.4).length,
        veryPoor: allScores.filter(score => score < 0.2).length
      };
      
      // Calculate consistency score (lower standard deviation = more consistent)
      const mean = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
      const variance = allScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / allScores.length;
      const stdDev = Math.sqrt(variance);
      const consistencyScore = Math.max(0, 1 - stdDev);
      
      // Create specialized capability metrics
      const specializedCapabilities = {
        codeQuality: avgCodeQuality,
        mathematicalAccuracy: avgMathAccuracy,
        creativeQuality: avgCreativeQuality,
        analyticalDepth: avgAnalyticalDepth
      };
      
      // Add to domain insights
      domainInsights.push({
        model_id: modelId,
        domainExpertiseRank: ranking.domain_expertise_rank,
        overallRank: ranking.overall_rank,
        domainExpertiseScore: overallScore, // Use specialized capability score as domain expertise score
        specializedCapabilities,
        strengths,
        weaknesses,
        metrics: {
          overallScore,
          consistencyScore,
          scoreDistribution,
          categoryCount: categoryScores.length,
          topCategory: categoryScores[0]?.category || 'None',
          topCategoryScore: categoryScores[0]?.score || 0,
          worstCategory: categoryScores[categoryScores.length - 1]?.category || 'None',
          worstCategoryScore: categoryScores[categoryScores.length - 1]?.score || 0
        },
        domainSummary: specializedCapabilityService.generateCapabilitySummary(modelId, specializedCapabilities)
      });
    }
    
    if (domainInsights.length === 0) {
      throw new Error('No valid specialized capability insights could be generated');
    }
    
    // Sort by domain expertise rank
    domainInsights.sort((a, b) => a.domainExpertiseRank - b.domainExpertiseRank);
    
    // Generate overall specialized capability analysis
    const topPerformer = domainInsights[0];
    const domainAnalysisSummary = {
      topic,
      modelCount: domainInsights.length,
      topPerformer: topPerformer ? {
        model_id: topPerformer.model_id,
        score: topPerformer.domainExpertiseScore,
        strengths: topPerformer.strengths,
        topCategory: topPerformer.metrics.topCategory,
        specializedCapabilities: topPerformer.specializedCapabilities
      } : null,
      averageScore: domainInsights.reduce((sum, model) => sum + model.metrics.overallScore, 0) / domainInsights.length,
      categoryAnalysis: analyzeCategoriesAcrossModels(domainInsights),
      recommendations: generateDomainRecommendations(domainInsights, topic),
      // Add specialized capability summary
      specializedCapabilitySummary: {
        avgCodeQuality: domainInsights.reduce((sum, model) => sum + model.specializedCapabilities.codeQuality, 0) / domainInsights.length,
        avgMathAccuracy: domainInsights.reduce((sum, model) => sum + model.specializedCapabilities.mathematicalAccuracy, 0) / domainInsights.length,
        avgCreativeQuality: domainInsights.reduce((sum, model) => sum + model.specializedCapabilities.creativeQuality, 0) / domainInsights.length,
        avgAnalyticalDepth: domainInsights.reduce((sum, model) => sum + model.specializedCapabilities.analyticalDepth, 0) / domainInsights.length,
        bestForCode: domainInsights.sort((a, b) => b.specializedCapabilities.codeQuality - a.specializedCapabilities.codeQuality)[0].model_id,
        bestForMath: domainInsights.sort((a, b) => b.specializedCapabilities.mathematicalAccuracy - a.specializedCapabilities.mathematicalAccuracy)[0].model_id,
        bestForCreative: domainInsights.sort((a, b) => b.specializedCapabilities.creativeQuality - a.specializedCapabilities.creativeQuality)[0].model_id,
        bestForAnalytical: domainInsights.sort((a, b) => b.specializedCapabilities.analyticalDepth - a.specializedCapabilities.analyticalDepth)[0].model_id
      }
    };
    
    // Update rankings with new specialized capability scores
    const updatedRankings = [...rankings];
    for (const insight of domainInsights) {
      const rankingIndex = updatedRankings.findIndex(r => r.model_id === insight.model_id);
      if (rankingIndex >= 0) {
        updatedRankings[rankingIndex].domain_expertise_score = insight.domainExpertiseScore;
      }
    }
    
    // Re-sort rankings by specialized capability score
    updatedRankings.sort((a, b) => b.domain_expertise_score - a.domain_expertise_score);
    
    // Reassign domain expertise ranks
    updatedRankings.forEach((ranking, index) => {
      ranking.domain_expertise_rank = index + 1;
    });
    
    return {
      rankings: updatedRankings.sort((a, b) => a.domain_expertise_rank - b.domain_expertise_rank),
      domainInsights,
      domainAnalysisSummary
    };
  } catch (error) {
    console.error('Error analyzing specialized capabilities:', error);
    
    // Return a basic response with error information
    return {
      error: error.message,
      rankings: rankings || [],
      domainInsights: []
    };
  }
};

/**
 * Helper function to calculate average metrics
 * @param {Array} rankings - The model rankings
 * @param {string} metricName - The name of the metric to average
 * @param {number} maxValue - The maximum value for normalization
 * @param {boolean} isRank - Whether the metric is a rank (lower is better)
 * @returns {number} - The average metric value (0-1 scale)
 */
const calculateAverageMetric = (rankings, metricName, maxValue, isRank = false) => {
  // For ranks, lower is better, so we need to invert the calculation
  if (isRank) {
    const validRankings = rankings.filter(r => r[metricName] !== undefined && r[metricName] !== null);
    if (validRankings.length === 0) return 0;
    
    // For ranks, we calculate how close to the top rank (1) each model is
    return validRankings.reduce((sum, r) => sum + (1 - ((r[metricName] - 1) / maxValue)), 0) / validRankings.length;
  }
  
  // For regular metrics (like levels), higher is better
  const validRankings = rankings.filter(r => r[metricName] !== undefined && r[metricName] !== null);
  if (validRankings.length === 0) return 0;
  
  return validRankings.reduce((sum, r) => sum + (r[metricName] / maxValue), 0) / validRankings.length;
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
    
    // Get fastest model (lowest latency)
    const fastestModel = rankingsCopy.sort((a, b) => (a.speed_level || 0) - (b.speed_level || 0)).reverse()[0];
    
    // Calculate average scores across all models
    const avgScores = {
      overall: rankings.reduce((sum, r) => sum + (r.score || 0), 0) / rankings.length,
      costEfficiency: calculateAverageMetric(rankings, 'cost_level', 5),
      domainExpertise: calculateAverageMetric(rankings, 'domain_expertise_rank', rankings.length, true),
      speed: calculateAverageMetric(rankings, 'speed_level', 5)
    };
    
    // Get detailed model information for top performers
    const detailedTopModels = topModels.map(model => {
      // Find test case results for this model
      const modelResults = benchmarkResult.test_case_results?.filter(tcr => tcr.model_id === model.model_id) || [];
      
      // Calculate average scores
      let avgDomainExpertiseScore;
      
      // If the model has specialized capabilities, use them to calculate domain expertise score
      if (model.specializedCapabilities) {
        // Calculate domain expertise as the average of specialized capabilities
        avgDomainExpertiseScore = (
          model.specializedCapabilities.codeQuality +
          model.specializedCapabilities.mathematicalAccuracy +
          model.specializedCapabilities.creativeQuality +
          model.specializedCapabilities.analyticalDepth
        ) / 4;
      } else {
        // Fall back to the original calculation if specialized capabilities aren't available
        avgDomainExpertiseScore = modelResults.reduce((sum, tcr) => sum + (tcr.domain_expertise_score || 0), 0) /
                                 (modelResults.filter(tcr => tcr.domain_expertise_score !== null && tcr.domain_expertise_score !== undefined).length || 1);
      }
      
      const avgAccuracyScore = modelResults.reduce((sum, tcr) => sum + (tcr.accuracy_score || 0), 0) /
                              (modelResults.filter(tcr => tcr.accuracy_score !== null && tcr.accuracy_score !== undefined).length || 1);
      
      const avgLatency = modelResults.reduce((sum, tcr) => sum + (tcr.latency || 0), 0) / (modelResults.length || 1);
      
      const totalCost = modelResults.reduce((sum, tcr) => sum + (tcr.cost || 0), 0);
      
      // Calculate component scores using the same formula as in generateRankings
      const latencyScore = Math.max(0, 1 - (avgLatency / 10000));
      const costScore = Math.max(0, 1 - (totalCost / 0.1));
      
      // Calculate weighted components
      const weightedComponents = {
        accuracy: avgAccuracyScore * 0.4,
        domainExpertise: avgDomainExpertiseScore * 0.3,
        latency: latencyScore * 0.1,
        cost: costScore * 0.2
      };
      
      return {
        model_id: model.model_id,
        rank: model.overall_rank,
        score: model.score,
        components: {
          accuracy: avgAccuracyScore,
          domainExpertise: avgDomainExpertiseScore,
          latency: avgLatency,
          cost: totalCost
        },
        weightedComponents,
        speedLevel: model.speed_level,
        costLevel: model.cost_level
      };
    });
    
    return {
      topic: benchmarkResult.benchmark_configs?.topic || 'Unknown',
      totalModels: rankings.length,
      scoringMethodology: {
        description: "Models are ranked based on a weighted average of key metrics including specialized capabilities",
        weights: {
          accuracy: "40% - How well responses match expected outputs",
          domainExpertise: "30% - Specialized capabilities in the specific domain",
          latency: "10% - Response speed (lower is better)",
          cost: "20% - Cost efficiency (lower is better)"
        },
        formula: "score = (accuracy * 0.4) + (domainExpertise * 0.3) + (latencyScore * 0.1) + (costScore * 0.2)",
        normalization: {
          latency: "Converted to 0-1 scale using: max(0, 1 - (avgLatency / 10000))",
          cost: "Converted to 0-1 scale using: max(0, 1 - (totalCost / 0.1))"
        },
        specializedCapabilities: {
          description: "Domain expertise is now calculated based on four specialized capabilities",
          capabilities: {
            codeQuality: "Evaluates syntax correctness, structure, and functionality of code",
            mathematicalAccuracy: "Measures precision in calculations and mathematical reasoning",
            creativeQuality: "Assesses creativity, narrative structure, and stylistic elements",
            analyticalDepth: "Evaluates depth of analysis, reasoning, and critical thinking"
          },
          calculation: "domainExpertise = (codeQuality + mathematicalAccuracy + creativeQuality + analyticalDepth) / 4"
        }
      },
      benchmarkStats: {
        averageScores: avgScores,
        modelCount: rankings.length,
        testCaseCount: benchmarkResult.test_case_results ?
                      [...new Set(benchmarkResult.test_case_results.map(tcr => tcr.test_case_id))].length : 0
      },
      topModels: detailedTopModels,
      categoryWinners: {
        overall: {
          model_id: topModels[0]?.model_id,
          rank: topModels[0]?.overall_rank,
          score: topModels[0]?.score
        },
        costEfficiency: {
          model_id: mostCostEffective.model_id,
          rank: mostCostEffective.cost_efficiency_rank,
          score: mostCostEffective.score,
          costLevel: mostCostEffective.cost_level
        },
        domainExpertise: {
          model_id: bestDomainExpert.model_id,
          rank: bestDomainExpert.domain_expertise_rank,
          score: bestDomainExpert.score
        },
        speed: {
          model_id: fastestModel.model_id,
          speedLevel: fastestModel.speed_level,
          score: fastestModel.score
        }
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
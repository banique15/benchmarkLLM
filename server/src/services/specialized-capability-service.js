import { generateWithLangchain } from './langchain-service.js';

/**
 * Specialized capability testing service
 * This service provides functions to evaluate models on specific capabilities:
 * - Code Generation Quality
 * - Mathematical Accuracy
 * - Creative Quality
 * - Analytical Depth
 */

/**
 * Evaluate code generation quality
 * @param {string} response - The model's response
 * @param {string} prompt - The original prompt
 * @returns {Promise<number>} - Score between 0 and 1
 */
export const evaluateCodeQuality = async (response, prompt) => {
  if (!response) return 0;
  
  // Check if the response contains code blocks
  const codeBlockRegex = /```[\s\S]*?```|`[\s\S]*?`/g;
  const codeBlocks = response.match(codeBlockRegex);
  
  if (!codeBlocks || codeBlocks.length === 0) {
    // If no code blocks, check if the prompt was asking for code
    if (prompt.toLowerCase().includes('code') || 
        prompt.toLowerCase().includes('function') || 
        prompt.toLowerCase().includes('program')) {
      // Prompt asked for code but none was provided
      return 0.1; // Very low score
    }
    // Prompt might not have been asking for code
    return 0.5; // Neutral score
  }
  
  // Extract the code from the code blocks
  const code = codeBlocks.map(block => {
    // Remove the backticks and language identifier
    return block.replace(/```[\w]*\n|```|`/g, '');
  }).join('\n');
  
  // Basic code quality checks
  const score = calculateCodeQualityScore(code, prompt);
  
  return score;
};

/**
 * Calculate code quality score based on various factors
 * @param {string} code - The code to evaluate
 * @param {string} prompt - The original prompt
 * @returns {number} - Score between 0 and 1
 */
const calculateCodeQualityScore = (code, prompt) => {
  let score = 0.5; // Start with a neutral score
  
  // Check for syntax errors (very basic check)
  const syntaxErrorIndicators = [
    'undefined variable', 'unexpected token', 'syntax error',
    'missing', 'expected', 'unterminated'
  ];
  
  const hasSyntaxErrors = syntaxErrorIndicators.some(indicator => 
    code.toLowerCase().includes(indicator)
  );
  
  if (hasSyntaxErrors) {
    score -= 0.2; // Penalize for syntax errors
  }
  
  // Check for code structure and organization
  const hasComments = code.includes('//') || code.includes('/*');
  const hasFunctions = code.includes('function ') || code.includes('def ') || 
                      code.includes('class ') || code.includes('method');
  const hasErrorHandling = code.includes('try') || code.includes('catch') || 
                          code.includes('except') || code.includes('error');
  
  if (hasComments) score += 0.1;
  if (hasFunctions) score += 0.1;
  if (hasErrorHandling) score += 0.1;
  
  // Check if code addresses the prompt
  const promptKeywords = prompt.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3);
  
  const codeAddressesPrompt = promptKeywords.some(keyword => 
    code.toLowerCase().includes(keyword)
  );
  
  if (codeAddressesPrompt) score += 0.2;
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
};

/**
 * Evaluate mathematical accuracy
 * @param {string} response - The model's response
 * @param {string} prompt - The original prompt
 * @returns {Promise<number>} - Score between 0 and 1
 */
export const evaluateMathematicalAccuracy = async (response, prompt) => {
  if (!response) return 0;
  
  // Check if the prompt is mathematical in nature
  const mathKeywords = ['calculate', 'compute', 'solve', 'equation', 'formula', 
                        'math', 'arithmetic', 'algebra', 'calculus', 'number'];
  
  const isMathPrompt = mathKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword)
  );
  
  if (!isMathPrompt) {
    return 0.5; // Neutral score for non-math prompts
  }
  
  // Extract numbers from the response
  const numbers = response.match(/\d+(\.\d+)?/g);
  const hasNumbers = numbers && numbers.length > 0;
  
  if (!hasNumbers) {
    return 0.2; // Low score for math prompt with no numbers in response
  }
  
  // Check for mathematical expressions
  const hasMathExpressions = response.includes('=') || 
                            response.includes('+') || 
                            response.includes('-') || 
                            response.includes('*') || 
                            response.includes('/');
  
  // Check for step-by-step working
  const hasStepByStep = response.includes('step') || 
                        response.match(/\d+\s*\.\s*[\w\s]/g) || // Numbered steps
                        response.match(/first|second|third|next|then|finally/gi);
  
  // Calculate score based on these factors
  let score = 0.5; // Start with a neutral score
  
  if (hasNumbers) score += 0.2;
  if (hasMathExpressions) score += 0.2;
  if (hasStepByStep) score += 0.1;
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
};

/**
 * Evaluate creative quality
 * @param {string} response - The model's response
 * @param {string} prompt - The original prompt
 * @returns {Promise<number>} - Score between 0 and 1
 */
export const evaluateCreativeQuality = async (response, prompt) => {
  if (!response) return 0;
  
  // Check if the prompt is asking for creative content
  const creativeKeywords = ['write', 'create', 'story', 'poem', 'creative', 
                           'imagine', 'fiction', 'narrative', 'describe'];
  
  const isCreativePrompt = creativeKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword)
  );
  
  if (!isCreativePrompt) {
    return 0.5; // Neutral score for non-creative prompts
  }
  
  // Evaluate creativity based on various factors
  const responseLength = response.length;
  const sentenceCount = (response.match(/[.!?]+/g) || []).length;
  const averageSentenceLength = responseLength / (sentenceCount || 1);
  
  // Check for descriptive language
  const descriptiveWords = ['beautiful', 'stunning', 'amazing', 'wonderful', 
                           'magnificent', 'brilliant', 'fantastic', 'incredible',
                           'elegant', 'graceful', 'vibrant', 'vivid', 'lush'];
  
  const descriptiveCount = descriptiveWords.filter(word => 
    response.toLowerCase().includes(word)
  ).length;
  
  // Check for dialogue
  const hasDialogue = response.includes('"') || response.includes('"') || 
                     response.includes("'") || response.includes("'");
  
  // Check for narrative structure
  const hasNarrativeStructure = response.match(/beginning|middle|end|finally|conclusion/gi);
  
  // Calculate score based on these factors
  let score = 0.5; // Start with a neutral score
  
  // Longer responses tend to be more creative (up to a point)
  if (responseLength > 500) score += 0.1;
  
  // Varied sentence length indicates more creative writing
  if (averageSentenceLength > 10 && averageSentenceLength < 30) score += 0.1;
  
  // Descriptive language
  score += Math.min(0.2, descriptiveCount * 0.02);
  
  // Dialogue and narrative structure
  if (hasDialogue) score += 0.1;
  if (hasNarrativeStructure) score += 0.1;
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
};

/**
 * Evaluate analytical depth
 * @param {string} response - The model's response
 * @param {string} prompt - The original prompt
 * @returns {Promise<number>} - Score between 0 and 1
 */
export const evaluateAnalyticalDepth = async (response, prompt) => {
  if (!response) return 0;
  
  // Check if the prompt is asking for analysis
  const analyticalKeywords = ['analyze', 'analysis', 'evaluate', 'assessment', 
                             'examine', 'investigate', 'review', 'critique',
                             'compare', 'contrast', 'pros and cons'];
  
  const isAnalyticalPrompt = analyticalKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword)
  );
  
  if (!isAnalyticalPrompt) {
    return 0.5; // Neutral score for non-analytical prompts
  }
  
  // Evaluate analytical depth based on various factors
  
  // Check for structured analysis
  const hasStructure = response.match(/first|second|third|next|then|finally|in conclusion/gi);
  
  // Check for comparative language
  const hasComparison = response.match(/however|although|while|whereas|on the other hand|in contrast|similarly|likewise/gi);
  
  // Check for evidence or examples
  const hasEvidence = response.match(/for example|for instance|evidence|data|research|study|according to|demonstrates|shows/gi);
  
  // Check for consideration of multiple perspectives
  const hasMultiplePerspectives = response.match(/different perspectives|various viewpoints|some argue|others believe|alternative view/gi);
  
  // Check for depth indicators
  const depthIndicators = ['deeper', 'underlying', 'fundamental', 'core', 
                          'essential', 'critical', 'significant', 'important',
                          'implications', 'consequences', 'impact'];
  
  const depthCount = depthIndicators.filter(word => 
    response.toLowerCase().includes(word)
  ).length;
  
  // Calculate score based on these factors
  let score = 0.5; // Start with a neutral score
  
  if (hasStructure) score += 0.1;
  if (hasComparison) score += 0.1;
  if (hasEvidence) score += 0.1;
  if (hasMultiplePerspectives) score += 0.1;
  score += Math.min(0.1, depthCount * 0.02);
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
};

/**
 * Evaluate specialized capabilities for a response
 * @param {string} response - The model's response
 * @param {string} prompt - The original prompt
 * @param {string} category - The test case category
 * @returns {Promise<Object>} - Specialized capability scores
 */
export const evaluateSpecializedCapabilities = async (response, prompt, category) => {
  console.log(`Evaluating specialized capabilities for category: ${category}`);
  console.log(`Response length: ${response?.length || 0}, Prompt length: ${prompt?.length || 0}`);
  
  // Safety check for null/undefined inputs
  if (!response || !prompt) {
    console.warn('Missing response or prompt in specialized capability evaluation');
    return {
      codeQuality: 0.5,
      mathematicalAccuracy: 0.5,
      creativeQuality: 0.5,
      analyticalDepth: 0.5,
      primaryCapability: 'analyticalDepth'
    };
  }
  
  // Normalize category to prevent null/undefined issues
  const normalizedCategory = (category || '').toLowerCase();
  console.log(`Normalized category: ${normalizedCategory}`);
  
  // Determine which capabilities to evaluate based on the category
  let codeScore = 0.5;
  let mathScore = 0.5;
  let creativeScore = 0.5;
  let analyticalScore = 0.5;
  
  try {
    // Evaluate based on category
    if (normalizedCategory.includes('code') || normalizedCategory.includes('programming') ||
        normalizedCategory === 'technical-knowledge' || normalizedCategory === 'procedural-knowledge') {
      console.log('Evaluating as code-related category');
      codeScore = await evaluateCodeQuality(response, prompt);
      analyticalScore = await evaluateAnalyticalDepth(response, prompt);
      console.log(`Code score: ${codeScore}, Analytical score: ${analyticalScore}`);
      
      // For code-related categories, code quality is most important
      return {
        codeQuality: codeScore,
        mathematicalAccuracy: 0.5, // Neutral
        creativeQuality: 0.5, // Neutral
        analyticalDepth: analyticalScore,
        primaryCapability: 'codeQuality'
      };
    }
    
    if (normalizedCategory.includes('math') || normalizedCategory.includes('calculation') ||
        normalizedCategory === 'problem-solving') {
      console.log('Evaluating as math-related category');
      mathScore = await evaluateMathematicalAccuracy(response, prompt);
      analyticalScore = await evaluateAnalyticalDepth(response, prompt);
      console.log(`Math score: ${mathScore}, Analytical score: ${analyticalScore}`);
      
      // For math-related categories, mathematical accuracy is most important
      return {
        codeQuality: 0.5, // Neutral
        mathematicalAccuracy: mathScore,
        creativeQuality: 0.5, // Neutral
        analyticalDepth: analyticalScore,
        primaryCapability: 'mathematicalAccuracy'
      };
    }
    
    if (normalizedCategory.includes('creative') || normalizedCategory.includes('writing') ||
        normalizedCategory === 'creative-writing') {
      console.log('Evaluating as creative category');
      creativeScore = await evaluateCreativeQuality(response, prompt);
      console.log(`Creative score: ${creativeScore}`);
      
      // For creative categories, creative quality is most important
      return {
        codeQuality: 0.5, // Neutral
        mathematicalAccuracy: 0.5, // Neutral
        creativeQuality: creativeScore,
        analyticalDepth: 0.5, // Neutral
        primaryCapability: 'creativeQuality'
      };
    }
    
    if (normalizedCategory.includes('analysis') || normalizedCategory.includes('analytical') ||
        normalizedCategory === 'analytical-thinking' || normalizedCategory === 'reasoning') {
      console.log('Evaluating as analytical category');
      analyticalScore = await evaluateAnalyticalDepth(response, prompt);
      console.log(`Analytical score: ${analyticalScore}`);
      
      // For analytical categories, analytical depth is most important
      return {
        codeQuality: 0.5, // Neutral
        mathematicalAccuracy: 0.5, // Neutral
        creativeQuality: 0.5, // Neutral
        analyticalDepth: analyticalScore,
        primaryCapability: 'analyticalDepth'
      };
    }
    
    // For other categories, evaluate all capabilities
    console.log('Evaluating as general category');
    const allScores = {
      codeQuality: await evaluateCodeQuality(response, prompt),
      mathematicalAccuracy: await evaluateMathematicalAccuracy(response, prompt),
      creativeQuality: await evaluateCreativeQuality(response, prompt),
      analyticalDepth: await evaluateAnalyticalDepth(response, prompt),
      primaryCapability: 'analyticalDepth' // Default to analytical depth
    };
    
    console.log('All scores:', allScores);
    return allScores;
  } catch (error) {
    console.error('Error in specialized capability evaluation:', error);
    // Return default scores in case of error
    return {
      codeQuality: 0.5,
      mathematicalAccuracy: 0.5,
      creativeQuality: 0.5,
      analyticalDepth: 0.5,
      primaryCapability: 'analyticalDepth'
    };
  }
};

/**
 * Calculate overall specialized capability score
 * @param {Object} capabilities - The specialized capability scores
 * @returns {number} - Overall score between 0 and 1
 */
export const calculateOverallCapabilityScore = (capabilities) => {
  console.log('Calculating overall capability score for:', capabilities);
  
  // Safety check
  if (!capabilities) {
    console.warn('No capabilities provided, returning default score of 0.5');
    return 0.5; // Return a neutral score instead of 0
  }
  
  // If there's a primary capability, weight it more heavily
  if (capabilities.primaryCapability && capabilities[capabilities.primaryCapability] !== undefined) {
    const primaryScore = capabilities[capabilities.primaryCapability] || 0.5;
    console.log(`Primary capability: ${capabilities.primaryCapability}, score: ${primaryScore}`);
    
    const otherScores = Object.entries(capabilities)
      .filter(([key]) => key !== 'primaryCapability' && key !== capabilities.primaryCapability)
      .map(([key, value]) => {
        // Ensure we only include numeric scores
        return typeof value === 'number' ? value : 0.5;
      });
    
    console.log('Other capability scores:', otherScores);
    
    // Prevent division by zero
    if (otherScores.length === 0) {
      console.warn('No other scores found, using only primary score');
      return primaryScore;
    }
    
    const avgOtherScore = otherScores.reduce((sum, score) => sum + score, 0) / otherScores.length;
    console.log(`Average of other scores: ${avgOtherScore}`);
    
    // Weight primary capability at 70%, others at 30%
    const weightedScore = (primaryScore * 0.7) + (avgOtherScore * 0.3);
    console.log(`Weighted score: ${weightedScore}`);
    
    return weightedScore;
  }
  
  // Otherwise, take a simple average
  const scores = [
    typeof capabilities.codeQuality === 'number' ? capabilities.codeQuality : 0.5,
    typeof capabilities.mathematicalAccuracy === 'number' ? capabilities.mathematicalAccuracy : 0.5,
    typeof capabilities.creativeQuality === 'number' ? capabilities.creativeQuality : 0.5,
    typeof capabilities.analyticalDepth === 'number' ? capabilities.analyticalDepth : 0.5
  ];
  
  console.log('All capability scores for averaging:', scores);
  
  // Calculate average (will always have 4 scores so no division by zero)
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  console.log(`Average score: ${avgScore}`);
  
  return avgScore;
};

/**
 * Generate specialized capability summary
 * @param {string} modelId - The model ID
 * @param {Object} capabilities - The specialized capability scores
 * @returns {string} - Summary of specialized capabilities
 */
export const generateCapabilitySummary = (modelId, capabilities) => {
  console.log(`Generating capability summary for model ${modelId}:`, capabilities);
  
  // Safety check
  if (!capabilities) {
    console.warn(`No capabilities provided for model ${modelId}, returning default summary`);
    return `${modelId.split('/').pop().replace(/-/g, ' ').replace(/(\b\w)/g, match => match.toUpperCase())} has not been evaluated for specialized capabilities.`;
  }
  
  try {
    // Format the model name for display
    const modelName = modelId.split('/').pop().replace(/-/g, ' ').replace(/(\b\w)/g, match => match.toUpperCase());
    
    // Determine the model's strongest capability with safety checks
    const capabilityScores = {
      'Code Generation': typeof capabilities.codeQuality === 'number' ? capabilities.codeQuality : 0.5,
      'Mathematical Accuracy': typeof capabilities.mathematicalAccuracy === 'number' ? capabilities.mathematicalAccuracy : 0.5,
      'Creative Writing': typeof capabilities.creativeQuality === 'number' ? capabilities.creativeQuality : 0.5,
      'Analytical Thinking': typeof capabilities.analyticalDepth === 'number' ? capabilities.analyticalDepth : 0.5
    };
    
    console.log(`Capability scores for ${modelId}:`, capabilityScores);
    
    // Sort capabilities by score
    const sortedCapabilities = Object.entries(capabilityScores).sort(([, a], [, b]) => b - a);
    
    // Get strongest and weakest capabilities
    const strongestCapability = sortedCapabilities[0][0];
    const weakestCapability = sortedCapabilities[sortedCapabilities.length - 1][0];
    
    console.log(`Strongest: ${strongestCapability}, Weakest: ${weakestCapability}`);
    
    // Generate performance descriptors
    const getPerformanceLevel = (score) => {
      if (score >= 0.8) return 'excellent';
      if (score >= 0.6) return 'good';
      if (score >= 0.4) return 'average';
      if (score >= 0.2) return 'below average';
      return 'poor';
    };
    
    // Calculate overall score
    const overallScore = calculateOverallCapabilityScore(capabilities);
    const overallPerformance = getPerformanceLevel(overallScore);
    
    console.log(`Overall score: ${overallScore}, Performance level: ${overallPerformance}`);
    
    // Generate the summary
    return `${modelName} demonstrates ${overallPerformance} specialized capabilities with an overall score of ${(overallScore * 100).toFixed(0)}%.
The model excels in ${strongestCapability} (${(capabilityScores[strongestCapability] * 100).toFixed(0)}%)
but shows room for improvement in ${weakestCapability} (${(capabilityScores[weakestCapability] * 100).toFixed(0)}%).`;
  } catch (error) {
    console.error(`Error generating capability summary for ${modelId}:`, error);
    return `${modelId.split('/').pop().replace(/-/g, ' ').replace(/(\b\w)/g, match => match.toUpperCase())} has specialized capabilities that could not be properly evaluated.`;
  }
};
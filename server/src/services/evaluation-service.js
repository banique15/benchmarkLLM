import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { getModelInstance } from "./langchain-service.js";

/**
 * Evaluate a model's response against expected output
 * @param {string} prompt - The original prompt
 * @param {string} expectedOutput - The expected output (if available)
 * @param {string} actualOutput - The model's actual output
 * @param {string} evaluatorModel - The model to use for evaluation (e.g., 'openai/gpt-4')
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} - Evaluation results
 */
export const evaluateResponse = async (prompt, expectedOutput, actualOutput, evaluatorModel, apiKey) => {
  try {
    console.log(`Evaluating response using ${evaluatorModel}`);
    
    // Create a LangChain model instance for evaluation
    // Default to Claude 3 Haiku if no specific evaluator model is provided
    const modelToUse = evaluatorModel || "anthropic/claude-3-haiku";
    const evaluator = getModelInstance(modelToUse, {
      temperature: 0.2,
      max_tokens: 2000  // Set a reasonable token limit for evaluation responses
    }, apiKey);
    
    // Create a prompt template for evaluation
    const evaluationTemplate = PromptTemplate.fromTemplate(`
You are evaluating a language model's response to a given prompt.

Prompt: {prompt}

${expectedOutput ? 'Expected output: {expectedOutput}\n' : ''}
Actual output: {actualOutput}

Evaluate the response on the following criteria:
1. Relevance (1-10): How relevant is the response to the prompt?
2. Accuracy (1-10): How accurate is the information provided?
3. Completeness (1-10): How complete is the response?
4. Coherence (1-10): How coherent and well-structured is the response?
5. Creativity (1-10): How creative or innovative is the response?

For each criterion, provide a score from 1-10 and a brief explanation.
Then provide an overall score (1-10) and a summary of the evaluation.

Return your evaluation as a JSON object with the following structure:
{
  "relevance": {
    "score": <number>,
    "explanation": "<explanation>"
  },
  "accuracy": {
    "score": <number>,
    "explanation": "<explanation>"
  },
  "completeness": {
    "score": <number>,
    "explanation": "<explanation>"
  },
  "coherence": {
    "score": <number>,
    "explanation": "<explanation>"
  },
  "creativity": {
    "score": <number>,
    "explanation": "<explanation>"
  },
  "overall": {
    "score": <number>,
    "summary": "<summary>"
  }
}
`);
    
    // Create an output parser for JSON
    const outputParser = new JsonOutputParser();
    
    // Create a chain
    const chain = evaluationTemplate.pipe(evaluator).pipe(outputParser);
    
    // Run the chain
    const evaluationParams = {
      prompt,
      actualOutput,
    };
    
    // Add expected output if available
    if (expectedOutput) {
      evaluationParams.expectedOutput = expectedOutput;
    }
    
    const evaluation = await chain.invoke(evaluationParams);
    
    return evaluation;
  } catch (error) {
    console.error('Error evaluating response:', error);
    return {
      error: error.message,
      overall: {
        score: 0,
        summary: "Evaluation failed due to an error."
      }
    };
  }
};

/**
 * Evaluate a model's response for a specific task type
 * @param {string} taskType - The type of task (e.g., 'summarization', 'question-answering')
 * @param {string} prompt - The original prompt
 * @param {string} expectedOutput - The expected output (if available)
 * @param {string} actualOutput - The model's actual output
 * @param {string} evaluatorModel - The model to use for evaluation
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} - Task-specific evaluation results
 */
export const evaluateTaskSpecific = async (taskType, prompt, expectedOutput, actualOutput, evaluatorModel, apiKey) => {
  try {
    console.log(`Performing task-specific evaluation for ${taskType}`);
    
    // Create a LangChain model instance for evaluation
    // Default to Claude 3 Haiku if no specific evaluator model is provided
    const modelToUse = evaluatorModel || "anthropic/claude-3-haiku";
    const evaluator = getModelInstance(modelToUse, {
      temperature: 0.2,
      max_tokens: 2000  // Set a reasonable token limit for evaluation responses
    }, apiKey);
    
    // Define task-specific evaluation criteria
    const taskCriteria = {
      'summarization': `
Evaluate the summary on:
1. Conciseness (1-10): How concise is the summary?
2. Information Retention (1-10): How well does it retain the key information?
3. Redundancy (1-10): How well does it avoid redundant information? (10 = no redundancy)
      `,
      'question-answering': `
Evaluate the answer on:
1. Directness (1-10): How directly does it answer the question?
2. Factual Correctness (1-10): How factually correct is the answer?
3. Comprehensiveness (1-10): How comprehensive is the answer?
      `,
      'code-generation': `
Evaluate the code on:
1. Correctness (1-10): Does the code correctly solve the problem?
2. Efficiency (1-10): How efficient is the code?
3. Readability (1-10): How readable and well-documented is the code?
4. Best Practices (1-10): How well does it follow best practices?
      `,
      'creative-writing': `
Evaluate the writing on:
1. Originality (1-10): How original is the content?
2. Engagement (1-10): How engaging is the writing?
3. Style (1-10): How effective is the writing style?
4. Coherence (1-10): How coherent is the narrative?
      `,
      'reasoning': `
Evaluate the reasoning on:
1. Logical Flow (1-10): How logical is the reasoning process?
2. Depth (1-10): How deep is the analysis?
3. Consideration of Alternatives (1-10): How well does it consider alternative viewpoints?
4. Conclusion Quality (1-10): How well-supported is the conclusion?
      `,
      'classification': `
Evaluate the classification on:
1. Correctness (1-10): Is the classification correct?
2. Confidence (1-10): How confident and decisive is the classification?
3. Explanation (1-10): How well is the classification explained or justified?
      `,
    };
    
    // Use default criteria if task type is not recognized
    const evaluationCriteria = taskCriteria[taskType] || `
Evaluate the response on:
1. Quality (1-10): Overall quality of the response
2. Relevance (1-10): Relevance to the prompt
3. Usefulness (1-10): Usefulness of the information provided
    `;
    
    // Create a prompt template for task-specific evaluation
    const evaluationTemplate = PromptTemplate.fromTemplate(`
You are evaluating a language model's response to a ${taskType} task.

Prompt: {prompt}

${expectedOutput ? 'Expected output: {expectedOutput}\n' : ''}
Actual output: {actualOutput}

${evaluationCriteria}

For each criterion, provide a score from 1-10 and a brief explanation.
Then provide an overall score (1-10) and a summary of the evaluation.

Return your evaluation as a JSON object.
`);
    
    // Create an output parser for JSON
    const outputParser = new JsonOutputParser();
    
    // Create a chain
    const chain = evaluationTemplate.pipe(evaluator).pipe(outputParser);
    
    // Run the chain
    const evaluationParams = {
      prompt,
      actualOutput,
    };
    
    // Add expected output if available
    if (expectedOutput) {
      evaluationParams.expectedOutput = expectedOutput;
    }
    
    const evaluation = await chain.invoke(evaluationParams);
    
    return evaluation;
  } catch (error) {
    console.error('Error performing task-specific evaluation:', error);
    return {
      error: error.message,
      overall: {
        score: 0,
        summary: "Task-specific evaluation failed due to an error."
      }
    };
  }
};

export default {
  evaluateResponse,
  evaluateTaskSpecific,
};
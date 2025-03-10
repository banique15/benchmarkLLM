import { PromptTemplate } from "@langchain/core/prompts";

/**
 * Collection of prompt templates for different benchmark tasks
 */

// Text completion prompt template
export const textCompletionTemplate = PromptTemplate.fromTemplate(`
{input}
`);

// Summarization prompt template
export const summarizationTemplate = PromptTemplate.fromTemplate(`
Please summarize the following text in {format}:

{text}

Summary:
`);

// Question answering prompt template
export const questionAnsweringTemplate = PromptTemplate.fromTemplate(`
Question: {question}

Answer:
`);

// Code generation prompt template
export const codeGenerationTemplate = PromptTemplate.fromTemplate(`
Write {language} code to solve the following problem:

{problem}

Your code should be well-commented and follow best practices.

Code:
`);

// Creative writing prompt template
export const creativeWritingTemplate = PromptTemplate.fromTemplate(`
Write a {genre} about {topic} with the following characteristics:
- {characteristic1}
- {characteristic2}
- {characteristic3}

Your writing should be engaging and creative.
`);

// Reasoning prompt template
export const reasoningTemplate = PromptTemplate.fromTemplate(`
{problem}

Think through this step by step and provide your reasoning.
`);

// Classification prompt template
export const classificationTemplate = PromptTemplate.fromTemplate(`
Classify the following text into one of these categories: {categories}

Text: {text}

Classification:
`);

/**
 * Get a prompt template for a specific task category
 * @param {string} category - Task category (e.g., 'text-completion', 'summarization')
 * @returns {PromptTemplate} - LangChain prompt template
 */
export const getPromptTemplateForCategory = (category) => {
  const templates = {
    'text-completion': textCompletionTemplate,
    'summarization': summarizationTemplate,
    'question-answering': questionAnsweringTemplate,
    'code-generation': codeGenerationTemplate,
    'creative-writing': creativeWritingTemplate,
    'reasoning': reasoningTemplate,
    'classification': classificationTemplate,
  };

  return templates[category] || textCompletionTemplate;
};

/**
 * Format a prompt using the appropriate template for the category
 * @param {string} category - Task category
 * @param {string} prompt - Original prompt text
 * @param {Object} variables - Additional variables for the template
 * @returns {Promise<string>} - Formatted prompt
 */
export const formatPromptWithTemplate = async (category, prompt, variables = {}) => {
  // Get the appropriate template
  const template = getPromptTemplateForCategory(category);
  
  // For simple text completion, just use the original prompt
  if (category === 'text-completion') {
    return template.format({ input: prompt });
  }
  
  // For other categories, try to extract variables from the prompt or use provided variables
  let templateVariables = { ...variables };
  
  switch (category) {
    case 'summarization':
      templateVariables = {
        text: prompt,
        format: variables.format || '3 sentences',
      };
      break;
      
    case 'question-answering':
      templateVariables = {
        question: prompt,
      };
      break;
      
    case 'code-generation':
      // Try to extract language from prompt if not provided
      if (!templateVariables.language) {
        const languageMatch = prompt.match(/in (JavaScript|Python|Java|C\+\+|Ruby|Go)/i);
        templateVariables.language = languageMatch ? languageMatch[1] : 'JavaScript';
      }
      
      templateVariables.problem = prompt;
      break;
      
    case 'classification':
      templateVariables = {
        text: prompt,
        categories: variables.categories || 'positive, negative, neutral',
      };
      break;
      
    default:
      // For other categories, just use the prompt as input
      templateVariables.input = prompt;
  }
  
  // Format the prompt with the template
  return template.format(templateVariables);
};

export default {
  getPromptTemplateForCategory,
  formatPromptWithTemplate,
};
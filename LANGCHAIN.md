# LangChain Integration for BenchmarkLLM

This document describes the integration of LangChain into the BenchmarkLLM project, which enhances the application's capabilities for benchmarking and evaluating language models.

## Overview

LangChain is a framework designed to build applications with LLMs through composability. The integration adds the following capabilities to BenchmarkLLM:

1. **Standardized Model Interface**: Unified API for working with different LLM providers
2. **Enhanced Prompt Management**: Structured prompting with templates
3. **Evaluation Chains**: Sophisticated evaluation of model outputs
4. **Future Extensibility**: Foundation for adding agents, memory, and document loaders

## Components

### 1. LangChain Service

The core of the integration is the `langchain-service.js` file, which provides:

- A custom OpenRouter chat model class that extends ChatOpenAI
- Methods for model instantiation and interaction
- Standardized interfaces for completions and chat completions

```javascript
// Example: Getting a model instance
const llm = getModelInstance('openai/gpt-4', { temperature: 0.7 }, apiKey);

// Example: Running a model test
const result = await runModelTest(modelId, prompt, options, apiKey);
```

### 2. Prompt Templates

The `prompt-templates.js` file provides structured templates for different benchmark tasks:

- Text completion
- Summarization
- Question answering
- Code generation
- Creative writing
- Reasoning
- Classification

```javascript
// Example: Formatting a prompt with a template
const formattedPrompt = await formatPromptWithTemplate(
  'summarization',
  originalPrompt,
  { format: '3 sentences' }
);
```

### 3. Evaluation Service

The `evaluation-service.js` file implements LangChain-based evaluation of model outputs:

- General response evaluation
- Task-specific evaluation
- Criteria-based scoring

```javascript
// Example: Evaluating a model's response
const evaluation = await evaluateResponse(
  prompt,
  expectedOutput,
  actualOutput,
  'openai/gpt-4',
  apiKey
);
```

### 4. API Routes

New API routes have been added to expose the LangChain functionality:

- `/api/langchain/*`: LangChain-based model interactions
- `/api/evaluation/*`: Model output evaluation endpoints

## Usage

### Server-Side

```javascript
// Import the LangChain service
import langchainService from './services/langchain-service.js';

// Run a model test
const result = await langchainService.runModelTest(
  'openai/gpt-4',
  'Explain quantum computing in simple terms.',
  { temperature: 0.7 },
  apiKey
);
```

### Client-Side

```javascript
// Import the LangChain client service
import { runBenchmark } from '../services/langchain.js';

// Run a benchmark
const benchmarkResult = await runBenchmark(benchmarkConfig);
```

## Evaluation

The evaluation system uses LangChain to assess model outputs based on various criteria:

1. **General Evaluation**:
   - Relevance
   - Accuracy
   - Completeness
   - Coherence
   - Creativity

2. **Task-Specific Evaluation**:
   - Summarization: Conciseness, Information Retention, Redundancy
   - Question Answering: Directness, Factual Correctness, Comprehensiveness
   - Code Generation: Correctness, Efficiency, Readability, Best Practices
   - Creative Writing: Originality, Engagement, Style, Coherence
   - Reasoning: Logical Flow, Depth, Consideration of Alternatives, Conclusion Quality
   - Classification: Correctness, Confidence, Explanation

## Future Enhancements

This integration lays the groundwork for further enhancements:

1. **Agents**: Implement LangChain agents for automated benchmark creation and analysis
2. **Memory**: Add memory components to track model improvements over time
3. **Document Loaders**: Use document loaders for importing test cases from various sources
4. **Chains**: Create more sophisticated evaluation and processing chains
5. **Retrievers**: Implement retrievers for finding relevant test cases

## Implementation Notes

- The LangChain integration runs alongside the existing OpenRouter implementation
- Both implementations share the same API structure for easy transition
- The client can switch between implementations by changing the import source

## Dependencies

- `langchain`: Core LangChain framework
- `@langchain/openai`: OpenAI integration for LangChain
- `@langchain/community`: Community extensions for LangChain

## Getting Started

1. Install the required dependencies:
   ```bash
   cd server
   npm install langchain @langchain/openai @langchain/community
   ```

2. Use the LangChain-based endpoints:
   - For model interactions: `/api/langchain/*`
   - For evaluations: `/api/evaluation/*`

3. Update client imports to use LangChain services:
   ```javascript
   // Before
   import { runBenchmark } from '../services/openrouter.js';
   
   // After
   import { runBenchmark } from '../services/langchain.js';
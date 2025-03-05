// Task categories
export const TASK_CATEGORIES = [
  { id: 'text-completion', name: 'Text Completion' },
  { id: 'summarization', name: 'Summarization' },
  { id: 'question-answering', name: 'Question Answering' },
  { id: 'code-generation', name: 'Code Generation' },
  { id: 'creative-writing', name: 'Creative Writing' },
  { id: 'reasoning', name: 'Reasoning' },
  { id: 'classification', name: 'Classification' },
];

// Default model parameters
export const DEFAULT_MODEL_PARAMETERS = {
  temperature: 0.7,
  max_tokens: 1000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

// Default test cases
export const DEFAULT_TEST_CASES = [
  // Text Completion
  {
    id: 'text-completion-1',
    name: 'Simple Text Completion',
    category: 'text-completion',
    prompt: 'Complete the following sentence: The quick brown fox jumps over the',
    expectedOutput: 'lazy dog',
  },
  {
    id: 'text-completion-2',
    name: 'Story Continuation',
    category: 'text-completion',
    prompt: 'Continue this story: Once upon a time, there was a young wizard who discovered a mysterious book in the attic of his grandmother\'s house. When he opened it,',
    expectedOutput: '',
  },
  
  // Summarization
  {
    id: 'summarization-1',
    name: 'Article Summarization',
    category: 'summarization',
    prompt: `Summarize the following article in 3 sentences:

The James Webb Space Telescope (JWST) has made an extraordinary discovery that could reshape our understanding of the early universe. Scientists analyzing data from the telescope have identified galaxies that appear to be much more massive and mature than expected for their age, challenging existing models of galaxy formation. These galaxies, observed as they were just 500-700 million years after the Big Bang, show structures and stellar populations that typically take billions of years to develop according to current theories. The findings, published in the journal Nature, suggest that either galaxy formation occurred much more rapidly in the early universe than previously thought, or our understanding of how we measure the mass and age of distant galaxies needs significant revision. "These objects are simply not supposed to exist," said lead researcher Dr. Iva Momcheva. "They're too massive, too mature for the young universe. It's like finding fully formed oak trees one year after a forest fire." The JWST, with its unprecedented infrared sensitivity, has been observing the universe's earliest galaxies since it began operations in 2022, providing data that was impossible to obtain with previous telescopes. The research team is now conducting follow-up observations to confirm the galaxies' masses and better understand their formation mechanisms, which could lead to a major revision of cosmic evolution models.`,
    expectedOutput: '',
  },
  {
    id: 'summarization-2',
    name: 'Research Paper Summary',
    category: 'summarization',
    prompt: `Summarize this research abstract in 2-3 sentences:

ABSTRACT: Large language models (LLMs) have demonstrated remarkable capabilities across a wide range of tasks, but their tendency to generate false or misleading information remains a significant challenge. This paper introduces a novel framework for improving factual accuracy in LLMs through a technique we call "retrieval-augmented generation with factual verification" (RAGFV). Our approach combines traditional retrieval-augmented generation with an additional verification step that cross-references generated content against multiple reliable knowledge sources. We evaluate RAGFV on a comprehensive benchmark of factual questions spanning science, history, geography, and current events, demonstrating a 37% reduction in factual errors compared to standard RAG approaches and a 62% reduction compared to non-retrieval baselines. Additionally, we show that RAGFV significantly reduces the model's tendency to "hallucinate" information while maintaining response fluency and relevance. Our analysis reveals that the verification component is particularly effective for ambiguous queries and topics with rapidly evolving information. These results suggest that multi-stage verification processes may be a promising direction for improving the reliability of LLM-generated content.`,
    expectedOutput: '',
  },
  
  // Question Answering
  {
    id: 'question-answering-1',
    name: 'Factual Question',
    category: 'question-answering',
    prompt: 'What is the capital of France?',
    expectedOutput: 'Paris',
  },
  {
    id: 'question-answering-2',
    name: 'Scientific Question',
    category: 'question-answering',
    prompt: 'Explain how photosynthesis works in simple terms.',
    expectedOutput: '',
  },
  {
    id: 'question-answering-3',
    name: 'Historical Question',
    category: 'question-answering',
    prompt: 'What were the main causes of World War I?',
    expectedOutput: '',
  },
  
  // Code Generation
  {
    id: 'code-generation-1',
    name: 'Simple Function',
    category: 'code-generation',
    prompt: 'Write a JavaScript function that returns the factorial of a number.',
    expectedOutput: '',
  },
  {
    id: 'code-generation-2',
    name: 'Algorithm Implementation',
    category: 'code-generation',
    prompt: 'Implement a function in Python that performs binary search on a sorted array.',
    expectedOutput: '',
  },
  {
    id: 'code-generation-3',
    name: 'Web Component',
    category: 'code-generation',
    prompt: 'Create a React component for a responsive navigation bar that collapses into a hamburger menu on mobile devices.',
    expectedOutput: '',
  },
  
  // Creative Writing
  {
    id: 'creative-writing-1',
    name: 'Short Story',
    category: 'creative-writing',
    prompt: 'Write a short story about a time traveler who accidentally changes history.',
    expectedOutput: '',
  },
  {
    id: 'creative-writing-2',
    name: 'Poetry',
    category: 'creative-writing',
    prompt: 'Write a poem about the changing seasons.',
    expectedOutput: '',
  },
  {
    id: 'creative-writing-3',
    name: 'Character Description',
    category: 'creative-writing',
    prompt: 'Create a detailed description of a complex villain character for a fantasy novel.',
    expectedOutput: '',
  },
  
  // Reasoning
  {
    id: 'reasoning-1',
    name: 'Logical Puzzle',
    category: 'reasoning',
    prompt: `Solve this logical puzzle:

Four friends (Alex, Blake, Casey, and Dana) each ordered a different drink (coffee, tea, water, and juice) at a café. Based on the following clues, determine who ordered which drink:
1. Alex did not order coffee or juice.
2. The person who ordered water sits next to the person who ordered tea.
3. Casey sits across from the person who ordered juice.
4. Blake sits next to Dana.
5. The person who ordered coffee sits across from Alex.`,
    expectedOutput: '',
  },
  {
    id: 'reasoning-2',
    name: 'Ethical Dilemma',
    category: 'reasoning',
    prompt: 'A self-driving car is about to crash and must choose between hitting five pedestrians or swerving into a wall, likely killing the single passenger inside. What ethical frameworks could be applied to this decision, and what might each suggest is the right course of action?',
    expectedOutput: '',
  },
  {
    id: 'reasoning-3',
    name: 'Business Strategy',
    category: 'reasoning',
    prompt: 'A small bookstore is facing competition from a new large chain bookstore that opened nearby. Sales have dropped 30% in the last three months. What strategies could the small bookstore implement to remain competitive and survive?',
    expectedOutput: '',
  },
  
  // Classification
  {
    id: 'classification-1',
    name: 'Sentiment Analysis',
    category: 'classification',
    prompt: 'Classify the sentiment of the following review as positive, negative, or neutral: "The food was decent but the service was extremely slow and the waiter seemed annoyed when we asked for refills."',
    expectedOutput: 'Negative',
  },
  {
    id: 'classification-2',
    name: 'Topic Classification',
    category: 'classification',
    prompt: 'Classify the following text into one of these categories: Technology, Politics, Sports, Entertainment, or Science: "Researchers at MIT have developed a new algorithm that can detect early signs of Alzheimer\'s disease through speech pattern analysis with 94% accuracy."',
    expectedOutput: 'Science',
  },
  {
    id: 'classification-3',
    name: 'Intent Recognition',
    category: 'classification',
    prompt: 'Determine whether the following customer message is a complaint, inquiry, or feedback: "I\'ve been waiting for my order #45789 for over two weeks now, and the tracking information hasn\'t updated in 10 days. Can someone tell me what\'s going on?"',
    expectedOutput: 'Complaint',
  },
];

// Popular models
export const POPULAR_MODELS = [
  {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'OpenAI\'s most advanced model',
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and efficient model with good performance',
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Anthropic\'s most capable model',
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and efficiency',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fast and efficient model',
  },
  {
    id: 'meta-llama/llama-3-70b',
    name: 'Llama 3 (70B)',
    provider: 'Meta',
    description: 'Meta\'s largest open model',
  },
];

// Storage keys
export const STORAGE_KEYS = {
  API_KEY: 'openrouter_api_key',
  RECENT_CONFIGS: 'recent_benchmark_configs',
  RECENT_RESULTS: 'recent_benchmark_results',
  SETTINGS: 'benchmark_settings',
};
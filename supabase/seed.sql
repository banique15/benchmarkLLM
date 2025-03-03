-- Insert sample benchmark configurations
INSERT INTO benchmark_configs (id, name, description, test_cases, model_configs, metric_configs, public_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Basic LLM Comparison',
  'A simple benchmark comparing GPT-4, GPT-3.5, and Claude 3 on basic tasks',
  '[
    {
      "id": "text-completion-1",
      "name": "Simple Text Completion",
      "category": "text-completion",
      "prompt": "Complete the following sentence: The quick brown fox",
      "expectedOutput": ""
    },
    {
      "id": "summarization-1",
      "name": "Article Summarization",
      "category": "summarization",
      "prompt": "Summarize the following article in 3 sentences: The James Webb Space Telescope (JWST) is a space telescope designed primarily to conduct infrared astronomy. The U.S. National Aeronautics and Space Administration (NASA) led development of the telescope in collaboration with the European Space Agency (ESA) and the Canadian Space Agency (CSA). The telescope is named after James E. Webb, who was the administrator of NASA from 1961 to 1968 during the Mercury, Gemini, and Apollo programs. The JWST was launched on 25 December 2021 on an Ariane 5 rocket from Kourou, French Guiana, and arrived at the Sun–Earth L2 Lagrange point in January 2022. The telescope is the successor to the Hubble Space Telescope as NASA''s flagship mission in astrophysics.",
      "expectedOutput": ""
    },
    {
      "id": "question-answering-1",
      "name": "Factual Question",
      "category": "question-answering",
      "prompt": "What is the capital of France?",
      "expectedOutput": "Paris"
    },
    {
      "id": "code-generation-1",
      "name": "Simple Function",
      "category": "code-generation",
      "prompt": "Write a JavaScript function that returns the factorial of a number.",
      "expectedOutput": ""
    }
  ]'::jsonb,
  '[
    {
      "modelId": "openai/gpt-4",
      "provider": "OpenAI",
      "enabled": true,
      "parameters": {
        "temperature": 0.7,
        "max_tokens": 1000
      }
    },
    {
      "modelId": "openai/gpt-3.5-turbo",
      "provider": "OpenAI",
      "enabled": true,
      "parameters": {
        "temperature": 0.7,
        "max_tokens": 1000
      }
    },
    {
      "modelId": "anthropic/claude-3-sonnet",
      "provider": "Anthropic",
      "enabled": true,
      "parameters": {
        "temperature": 0.7,
        "max_tokens": 1000
      }
    }
  ]'::jsonb,
  '[
    {
      "id": "latency",
      "name": "Latency",
      "enabled": true,
      "weight": 1
    },
    {
      "id": "tokens",
      "name": "Token Usage",
      "enabled": true,
      "weight": 1
    },
    {
      "id": "cost",
      "name": "Cost",
      "enabled": true,
      "weight": 1
    }
  ]'::jsonb,
  'sample001'
);

INSERT INTO benchmark_configs (id, name, description, test_cases, model_configs, metric_configs, public_id)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Code Generation Benchmark',
  'Comparing different models on code generation tasks',
  '[
    {
      "id": "code-gen-1",
      "name": "Factorial Function",
      "category": "code-generation",
      "prompt": "Write a JavaScript function that calculates the factorial of a number recursively.",
      "expectedOutput": ""
    },
    {
      "id": "code-gen-2",
      "name": "Array Sorting",
      "category": "code-generation",
      "prompt": "Write a Python function that implements the merge sort algorithm for an array of integers.",
      "expectedOutput": ""
    },
    {
      "id": "code-gen-3",
      "name": "String Manipulation",
      "category": "code-generation",
      "prompt": "Write a function in a language of your choice that checks if a string is a palindrome.",
      "expectedOutput": ""
    },
    {
      "id": "code-gen-4",
      "name": "Data Structure Implementation",
      "category": "code-generation",
      "prompt": "Implement a binary search tree in a language of your choice with insert, search, and delete operations.",
      "expectedOutput": ""
    }
  ]'::jsonb,
  '[
    {
      "modelId": "openai/gpt-4",
      "provider": "OpenAI",
      "enabled": true,
      "parameters": {
        "temperature": 0.3,
        "max_tokens": 2000
      }
    },
    {
      "modelId": "anthropic/claude-3-opus",
      "provider": "Anthropic",
      "enabled": true,
      "parameters": {
        "temperature": 0.3,
        "max_tokens": 2000
      }
    },
    {
      "modelId": "meta-llama/llama-3-70b",
      "provider": "Meta",
      "enabled": true,
      "parameters": {
        "temperature": 0.3,
        "max_tokens": 2000
      }
    }
  ]'::jsonb,
  '[
    {
      "id": "latency",
      "name": "Latency",
      "enabled": true,
      "weight": 1
    },
    {
      "id": "tokens",
      "name": "Token Usage",
      "enabled": true,
      "weight": 1
    },
    {
      "id": "cost",
      "name": "Cost",
      "enabled": true,
      "weight": 1
    }
  ]'::jsonb,
  'sample002'
);

-- Note: We're not inserting sample benchmark results since those would typically be generated
-- by running the benchmarks. The application will create these when benchmarks are executed.
import express from 'express';
import axios from 'axios';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Middleware to extract API key from request
const extractApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  console.log('Headers received:', Object.keys(req.headers));
  console.log('X-API-Key header:', apiKey ? 'Present' : 'Not present');
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key is required. Please provide it in the X-API-Key header.',
    });
  }
  
  req.apiKey = apiKey;
  console.log('API Key extracted:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key');
  
  next();
};

// Get available models
router.get('/models', extractApiKey, async (req, res, next) => {
  try {
    const models = await openRouterService.getAvailableModels(req.apiKey);
    res.json(models);
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key. Please check your OpenRouter API key.',
      });
    }
    next(error);
  }
});

// Generate completion
router.post('/completions', extractApiKey, async (req, res, next) => {
  try {
    const { model, prompt, ...options } = req.body;
    
    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const completion = await openRouterService.generateCompletion(
      model,
      prompt,
      options,
      req.apiKey
    );
    
    res.json(completion);
  } catch (error) {
    next(error);
  }
});

// Generate chat completion
router.post('/chat/completions', extractApiKey, async (req, res, next) => {
  try {
    const { model, messages, ...options } = req.body;
    
    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const completion = await openRouterService.generateChatCompletion(
      model,
      messages,
      options,
      req.apiKey
    );
    
    res.json(completion);
  } catch (error) {
    next(error);
  }
});

// Run a single model test
router.post('/test', extractApiKey, async (req, res, next) => {
  try {
    const { model, prompt, options } = req.body;
    
    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const result = await openRouterService.runModelTest(
      model,
      prompt,
      options || {},
      req.apiKey
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Run a benchmark
router.post('/benchmark', extractApiKey, async (req, res, next) => {
  try {
    const benchmarkConfig = req.body;
    
    if (!benchmarkConfig) {
      return res.status(400).json({ error: 'Benchmark configuration is required' });
    }
    
    if (!benchmarkConfig.model_configs || !Array.isArray(benchmarkConfig.model_configs) || benchmarkConfig.model_configs.length === 0) {
      return res.status(400).json({ error: 'Model configurations are required' });
    }
    
    if (!benchmarkConfig.test_cases || !Array.isArray(benchmarkConfig.test_cases) || benchmarkConfig.test_cases.length === 0) {
      return res.status(400).json({ error: 'Test cases are required' });
    }
    
    // Log the API key (masked for security)
    console.log('API Key received:', req.apiKey ? `${req.apiKey.substring(0, 4)}...${req.apiKey.substring(req.apiKey.length - 4)}` : 'No API key');
    
    // Import the benchmark service
    const benchmarkService = await import('../services/benchmark.js');
    
    // Run the benchmark using the actual benchmark service
    const result = await benchmarkService.default.runBenchmark(benchmarkConfig, req.apiKey);
    
    // Store the result ID in a global variable for easy access
    global.lastBenchmarkId = result.id;
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Test API key
router.get('/test-api-key', extractApiKey, async (req, res, next) => {
  try {
    console.log('Testing API key:', req.apiKey ? `${req.apiKey.substring(0, 4)}...${req.apiKey.substring(req.apiKey.length - 4)}` : 'No API key');
    
    if (!req.apiKey) {
      return res.status(401).json({
        valid: false,
        message: 'API key is required',
      });
    }
    
    try {
      // Use the validateApiKey function from openRouterService
      const validationResult = await openRouterService.validateApiKey(req.apiKey);
      
      console.log('API key validation result:', {
        valid: validationResult.valid,
        hasCredits: validationResult.hasCredits,
        credits: validationResult.credits,
        error: validationResult.error || 'None'
      });
      
      if (!validationResult.valid) {
        return res.status(401).json({
          valid: false,
          message: validationResult.error || 'Invalid API key',
          error: validationResult.error
        });
      }
      
      // Check if the API key has sufficient credits
      // OpenRouter credits are used for each API call. Benchmarks can use a significant amount
      // of credits depending on the number of models and test cases.
      if (validationResult.credits !== null &&
          validationResult.credits !== undefined &&
          validationResult.credits < 500) {
        return res.status(402).json({
          valid: true,
          hasCredits: false,
          credits: validationResult.credits,
          message: `Insufficient OpenRouter credits. You have ${validationResult.credits} credits available, but we recommend at least 500 credits to run benchmarks. Each benchmark test consumes credits based on the models used and the length of prompts. You can add more credits at https://openrouter.ai/credits`,
          error: 'insufficient_credits'
        });
      }
      
      res.json({
        valid: true,
        hasCredits: true,
        credits: validationResult.credits,
        message: validationResult.credits !== null ?
          `API key is valid. You have ${validationResult.credits} OpenRouter credits available (recommended minimum: 500). These credits are consumed when running benchmarks, with each model call using a different amount based on the model and prompt length.` :
          'API key is valid. OpenRouter credits are used when running benchmarks.',
      });
    } catch (error) {
      console.error('Error testing API key:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        } : 'No response',
        request: error.request ? 'Request made' : 'No request',
      });
      
      res.status(401).json({
        valid: false,
        message: 'API key is invalid',
        error: error.response?.data?.error?.message || error.message,
      });
    }
  } catch (error) {
    console.error('Unexpected error in test-api-key endpoint:', error);
    next(error);
  }
});

// Get benchmark status
router.get('/benchmark/:id/status', extractApiKey, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Benchmark ID is required' });
    }
    
    // Import the benchmark service
    const benchmarkService = await import('../services/benchmark.js');
    
    // Get the benchmark status using the actual benchmark service
    const status = await benchmarkService.default.getBenchmarkStatus(id);
    
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// This function has been replaced by the benchmark service

export default router;
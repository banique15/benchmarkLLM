import express from 'express';
import evaluationService from '../services/evaluation-service.js';

const router = express.Router();

// Middleware to extract API key from request
const extractApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key is required. Please provide it in the X-API-Key header.',
    });
  }
  
  req.apiKey = apiKey;
  next();
};

// Evaluate a model's response
router.post('/evaluate', extractApiKey, async (req, res, next) => {
  try {
    const { prompt, expectedOutput, actualOutput, evaluatorModel } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!actualOutput) {
      return res.status(400).json({ error: 'Actual output is required' });
    }
    
    // Default to GPT-4 for evaluation if not specified
    const model = evaluatorModel || 'openai/gpt-4';
    
    const evaluation = await evaluationService.evaluateResponse(
      prompt,
      expectedOutput,
      actualOutput,
      model,
      req.apiKey
    );
    
    res.json(evaluation);
  } catch (error) {
    next(error);
  }
});

// Evaluate a model's response for a specific task
router.post('/evaluate-task', extractApiKey, async (req, res, next) => {
  try {
    const { taskType, prompt, expectedOutput, actualOutput, evaluatorModel } = req.body;
    
    if (!taskType) {
      return res.status(400).json({ error: 'Task type is required' });
    }
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!actualOutput) {
      return res.status(400).json({ error: 'Actual output is required' });
    }
    
    // Default to GPT-4 for evaluation if not specified
    const model = evaluatorModel || 'openai/gpt-4';
    
    const evaluation = await evaluationService.evaluateTaskSpecific(
      taskType,
      prompt,
      expectedOutput,
      actualOutput,
      model,
      req.apiKey
    );
    
    res.json(evaluation);
  } catch (error) {
    next(error);
  }
});

// Batch evaluate multiple responses
router.post('/evaluate-batch', extractApiKey, async (req, res, next) => {
  try {
    const { evaluations, evaluatorModel } = req.body;
    
    if (!evaluations || !Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({ error: 'Evaluations array is required' });
    }
    
    // Default to GPT-4 for evaluation if not specified
    const model = evaluatorModel || 'openai/gpt-4';
    
    // Process each evaluation in parallel
    const results = await Promise.all(
      evaluations.map(async (evalItem) => {
        try {
          const { id, prompt, expectedOutput, actualOutput, taskType } = evalItem;
          
          if (!prompt || !actualOutput) {
            return {
              id,
              error: 'Prompt and actual output are required for each evaluation',
            };
          }
          
          // Use task-specific evaluation if taskType is provided
          if (taskType) {
            return {
              id,
              result: await evaluationService.evaluateTaskSpecific(
                taskType,
                prompt,
                expectedOutput,
                actualOutput,
                model,
                req.apiKey
              ),
            };
          }
          
          // Use general evaluation otherwise
          return {
            id,
            result: await evaluationService.evaluateResponse(
              prompt,
              expectedOutput,
              actualOutput,
              model,
              req.apiKey
            ),
          };
        } catch (error) {
          return {
            id: evalItem.id,
            error: error.message,
          };
        }
      })
    );
    
    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;
import express from 'express';
import supabase from '../supabase.js';

const router = express.Router();

// Get all benchmark configurations
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('benchmark_configs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get a specific benchmark configuration
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Configuration ID is required' });
    }
    
    const { data, error } = await supabase
      .from('benchmark_configs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Create a new benchmark configuration
router.post('/', async (req, res, next) => {
  try {
    const config = req.body;
    
    if (!config) {
      return res.status(400).json({ error: 'Configuration data is required' });
    }
    
    if (!config.name) {
      return res.status(400).json({ error: 'Configuration name is required' });
    }
    
    if (!config.test_cases || !Array.isArray(config.test_cases) || config.test_cases.length === 0) {
      return res.status(400).json({ error: 'Test cases are required' });
    }
    
    if (!config.model_configs || !Array.isArray(config.model_configs) || config.model_configs.length === 0) {
      return res.status(400).json({ error: 'Model configurations are required' });
    }
    
    // Generate a public ID for sharing
    config.public_id = generatePublicId();
    
    const { data, error } = await supabase
      .from('benchmark_configs')
      .insert(config)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Update a benchmark configuration
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Configuration ID is required' });
    }
    
    if (!updates) {
      return res.status(400).json({ error: 'Update data is required' });
    }
    
    const { data, error } = await supabase
      .from('benchmark_configs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Delete a benchmark configuration
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Configuration ID is required' });
    }
    
    const { error } = await supabase
      .from('benchmark_configs')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Get a benchmark configuration by public ID
router.get('/public/:publicId', async (req, res, next) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' });
    }
    
    const { data, error } = await supabase
      .from('benchmark_configs')
      .select('*')
      .eq('public_id', publicId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Helper function to generate a public ID
function generatePublicId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default router;
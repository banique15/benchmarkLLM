import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export default supabase;

// Benchmark configurations
export const getBenchmarkConfigs = async () => {
  const { data, error } = await supabase
    .from('benchmark_configs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching benchmark configs:', error);
    throw error;
  }
  
  return data;
};

export const getBenchmarkConfigById = async (id) => {
  const { data, error } = await supabase
    .from('benchmark_configs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching benchmark config with id ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const createBenchmarkConfig = async (config) => {
  const { data, error } = await supabase
    .from('benchmark_configs')
    .insert(config)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating benchmark config:', error);
    throw error;
  }
  
  return data;
};

// Benchmark results
export const getBenchmarkResults = async () => {
  const { data, error } = await supabase
    .from('benchmark_results')
    .select('*')
    .order('executed_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching benchmark results:', error);
    throw error;
  }
  
  return data;
};

export const getBenchmarkResultById = async (id) => {
  const { data, error } = await supabase
    .from('benchmark_results')
    .select('*, test_case_results(*)')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching benchmark result with id ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const createBenchmarkResult = async (result) => {
  const { data, error } = await supabase
    .from('benchmark_results')
    .insert(result)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating benchmark result:', error);
    throw error;
  }
  
  return data;
};

export const updateBenchmarkResult = async (id, updates) => {
  const { data, error } = await supabase
    .from('benchmark_results')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating benchmark result with id ${id}:`, error);
    throw error;
  }
  
  return data;
};
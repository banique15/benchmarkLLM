import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create an axios instance for API requests
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Benchmark configurations
export const getBenchmarkConfigs = async () => {
  try {
    const response = await apiClient.get('/api/configs');
    return response.data;
  } catch (error) {
    console.error('Error fetching benchmark configs:', error);
    throw error;
  }
};

export const getBenchmarkConfigById = async (id) => {
  try {
    const response = await apiClient.get(`/api/configs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching benchmark config with id ${id}:`, error);
    throw error;
  }
};

export const createBenchmarkConfig = async (config) => {
  try {
    const response = await apiClient.post('/api/configs', config);
    return response.data;
  } catch (error) {
    console.error('Error creating benchmark config:', error);
    throw error;
  }
};

// Benchmark results
export const getBenchmarkResults = async () => {
  try {
    const response = await apiClient.get('/api/results');
    return response.data;
  } catch (error) {
    console.error('Error fetching benchmark results:', error);
    throw error;
  }
};

export const getBenchmarkResultById = async (id) => {
  try {
    const response = await apiClient.get(`/api/results/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching benchmark result with id ${id}:`, error);
    throw error;
  }
};

export const createBenchmarkResult = async (result) => {
  try {
    const response = await apiClient.post('/api/results', result);
    return response.data;
  } catch (error) {
    console.error('Error creating benchmark result:', error);
    throw error;
  }
};
export const updateBenchmarkResult = async (id, updates) => {
  try {
    const response = await apiClient.put(`/api/results/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Error updating benchmark result with id ${id}:`, error);
    throw error;
  }
};

export const deleteBenchmarkResult = async (id) => {
  try {
    const response = await apiClient.delete(`/api/results/${id}`);
    return response.status === 204;
  } catch (error) {
    console.error(`Error deleting benchmark result with id ${id}:`, error);
    throw error;
  }
};

export default {
  getBenchmarkConfigs,
  getBenchmarkConfigById,
  createBenchmarkConfig,
  getBenchmarkResults,
  getBenchmarkResultById,
  createBenchmarkResult,
  updateBenchmarkResult,
  deleteBenchmarkResult
};

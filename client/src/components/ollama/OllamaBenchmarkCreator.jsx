import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOllamaModels, createOllamaBenchmark } from '../../services/ollama';

/**
 * Component for creating a new Ollama benchmark
 */
const OllamaBenchmarkCreator = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [benchmarkName, setBenchmarkName] = useState('React Coding Benchmark');
  const [benchmarkDescription, setBenchmarkDescription] = useState('Benchmark for React coding tasks');
  const [difficulties, setDifficulties] = useState(['basic', 'intermediate', 'advanced', 'expert']);
  const [testCasesPerDifficulty, setTestCasesPerDifficulty] = useState(3);
  const [parameters, setParameters] = useState({
    temperature: 0.7,
    top_p: 1,
    max_tokens: 2048
  });

  // Fetch available Ollama models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        const availableModels = await getOllamaModels();
        
        // Filter models to only include 7B and 8B parameter models
        const filteredModels = availableModels.filter(model => {
          const modelName = model.name.toLowerCase();
          return modelName.includes('7b') || modelName.includes('8b');
        });
        
        setModels(filteredModels);
        
        // Pre-select up to 10 models
        if (filteredModels.length > 0) {
          setSelectedModels(filteredModels.slice(0, Math.min(10, filteredModels.length)));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Ollama models:', error);
        setError('Failed to fetch Ollama models. Please make sure the Ollama server is running.');
        setIsLoading(false);
      }
    };
    
    fetchModels();
  }, []);

  // Handle model selection
  const handleModelSelection = (model) => {
    if (selectedModels.some(m => m.id === model.id)) {
      // Remove model if already selected
      setSelectedModels(selectedModels.filter(m => m.id !== model.id));
    } else {
      // Add model if not selected
      setSelectedModels([...selectedModels, model]);
    }
  };

  // Handle difficulty selection
  const handleDifficultySelection = (difficulty) => {
    if (difficulties.includes(difficulty)) {
      // Remove difficulty if already selected
      setDifficulties(difficulties.filter(d => d !== difficulty));
    } else {
      // Add difficulty if not selected
      setDifficulties([...difficulties, difficulty]);
    }
  };

  // Handle parameter change
  const handleParameterChange = (parameter, value) => {
    setParameters({
      ...parameters,
      [parameter]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedModels.length === 0) {
      setError('Please select at least one model');
      return;
    }
    
    if (difficulties.length === 0) {
      setError('Please select at least one difficulty level');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const benchmarkConfig = {
        name: benchmarkName,
        description: benchmarkDescription,
        models: selectedModels,
        difficulties,
        testCasesPerDifficulty,
        parameters
      };
      
      const result = await createOllamaBenchmark(benchmarkConfig);
      
      setIsLoading(false);
      
      // Navigate to the benchmark runner
      navigate(`/ollama/run/${result.id}`);
    } catch (error) {
      console.error('Error creating Ollama benchmark:', error);
      setError('Failed to create Ollama benchmark');
      setIsLoading(false);
    }
  };

  // If loading, show loading state
  if (isLoading && models.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16">
        <svg className="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-medium text-dark-600">Loading Ollama models...</p>
        <p className="text-gray-500 mt-2">This may take a few moments</p>
      </div>
    );
  }

  // If error, show error message
  if (error && models.length === 0) {
    return (
      <div className="card bg-gradient-to-br from-red-50 to-white">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-red-100 mr-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Error</h2>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <div className="p-2 rounded-md bg-primary-100 mr-3">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-dark-600">Create New Benchmark</h2>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="benchmarkName" className="block text-sm font-medium text-dark-600 mb-1">Benchmark Name</label>
          <input
            type="text"
            id="benchmarkName"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={benchmarkName}
            onChange={(e) => setBenchmarkName(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="benchmarkDescription" className="block text-sm font-medium text-dark-600 mb-1">Description</label>
          <textarea
            id="benchmarkDescription"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={benchmarkDescription}
            onChange={(e) => setBenchmarkDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-dark-600 mb-2">Select Models</h3>
          <p className="text-sm text-gray-500 mb-4">Select up to 10 models to benchmark. Only 7B and 8B parameter models are shown.</p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-dark-600">Selected Models: {selectedModels.length}</span>
              <button
                type="button"
                className="text-sm text-primary-600 hover:text-primary-800"
                onClick={() => setSelectedModels(models.slice(0, Math.min(10, models.length)))}
              >
                Select All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map(model => (
              <div
                key={model.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedModels.some(m => m.id === model.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-300'
                }`}
                onClick={() => handleModelSelection(model)}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={selectedModels.some(m => m.id === model.id)}
                    onChange={() => {}}
                  />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-dark-600">{model.name}</h4>
                    <p className="text-xs text-gray-500">{model.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-dark-600 mb-2">Difficulty Levels</h3>
          <p className="text-sm text-gray-500 mb-4">Select the difficulty levels to include in the benchmark.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['basic', 'intermediate', 'advanced', 'expert'].map(difficulty => (
              <div
                key={difficulty}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  difficulties.includes(difficulty)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-300'
                }`}
                onClick={() => handleDifficultySelection(difficulty)}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={difficulties.includes(difficulty)}
                    onChange={() => {}}
                  />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-dark-600 capitalize">{difficulty}</h4>
                    <p className="text-xs text-gray-500">
                      {difficulty === 'basic' && 'Simple component creation and props handling'}
                      {difficulty === 'intermediate' && 'State management and hooks (useState, useEffect)'}
                      {difficulty === 'advanced' && 'Complex hooks and performance optimization'}
                      {difficulty === 'expert' && 'Custom hooks and advanced patterns'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-dark-600 mb-2">Test Cases</h3>
          
          <div className="mb-4">
            <label htmlFor="testCasesPerDifficulty" className="block text-sm font-medium text-dark-600 mb-1">
              Test Cases Per Difficulty Level
            </label>
            <input
              type="number"
              id="testCasesPerDifficulty"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={testCasesPerDifficulty}
              onChange={(e) => setTestCasesPerDifficulty(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
              min={1}
              max={5}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Total test cases: {testCasesPerDifficulty * difficulties.length}
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-dark-600 mb-2">Model Parameters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-dark-600 mb-1">
                Temperature
              </label>
              <input
                type="number"
                id="temperature"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={parameters.temperature}
                onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
                step={0.1}
                min={0}
                max={2}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Controls randomness (0-2)
              </p>
            </div>
            
            <div>
              <label htmlFor="top_p" className="block text-sm font-medium text-dark-600 mb-1">
                Top P
              </label>
              <input
                type="number"
                id="top_p"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={parameters.top_p}
                onChange={(e) => handleParameterChange('top_p', parseFloat(e.target.value))}
                step={0.1}
                min={0}
                max={1}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Controls diversity (0-1)
              </p>
            </div>
            
            <div>
              <label htmlFor="max_tokens" className="block text-sm font-medium text-dark-600 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                id="max_tokens"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={parameters.max_tokens}
                onChange={(e) => handleParameterChange('max_tokens', parseInt(e.target.value))}
                step={128}
                min={256}
                max={4096}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum response length
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-secondary mr-3"
            onClick={() => navigate('/ollama')}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Create Benchmark
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OllamaBenchmarkCreator;
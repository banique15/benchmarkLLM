import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBenchmarkConfig } from '../../services/api';
import { getAvailableModels } from '../../services/openrouter';
import { TASK_CATEGORIES, DEFAULT_MODEL_PARAMETERS, DEFAULT_TEST_CASES } from '../../constants';

const BenchmarkCreator = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [testCases, setTestCases] = useState([...DEFAULT_TEST_CASES]);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [modelSearchQuery, setModelSearchQuery] = useState('');

  // Load API key from localStorage
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openrouter_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  // Fetch available models when API key is available
  useEffect(() => {
    const fetchModels = async () => {
      if (!apiKey) return;
      
      try {
        setIsLoading(true);
        const models = await getAvailableModels();
        setAvailableModels(models.data || []);
        
        // Pre-select some popular models
        if (models.data && models.data.length > 0) {
          const popularModelIds = [
            'openai/gpt-4',
            'openai/gpt-3.5-turbo',
            'anthropic/claude-3-sonnet'
          ];
          
          const preSelectedModels = models.data
            .filter(model => popularModelIds.includes(model.id))
            .map(model => ({
              modelId: model.id,
              provider: model.id.split('/')[0],
              enabled: true,
              parameters: { ...DEFAULT_MODEL_PARAMETERS }
            }));
          
          setSelectedModels(preSelectedModels);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch available models. Please check your API key.');
        setIsLoading(false);
      }
    };
    
    fetchModels();
  }, [apiKey]);

  // Add a new test case
  const handleAddTestCase = () => {
    const newId = `test-case-${Date.now()}`;
    setTestCases([
      ...testCases,
      {
        id: newId,
        name: 'New Test Case',
        category: TASK_CATEGORIES[0].id,
        prompt: '',
        expectedOutput: '',
      }
    ]);
  };

  // Update a test case
  const handleUpdateTestCase = (index, field, value) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      [field]: value
    };
    setTestCases(updatedTestCases);
  };

  // Remove a test case
  const handleRemoveTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  // Toggle model selection
  const handleToggleModel = (modelId) => {
    const modelIndex = selectedModels.findIndex(m => m.modelId === modelId);
    
    if (modelIndex >= 0) {
      // Remove model if already selected
      setSelectedModels(selectedModels.filter((_, i) => i !== modelIndex));
    } else {
      // Add model if not selected
      const model = availableModels.find(m => m.id === modelId);
      if (model) {
        setSelectedModels([
          ...selectedModels,
          {
            modelId: model.id,
            provider: model.id.split('/')[0],
            enabled: true,
            parameters: { ...DEFAULT_MODEL_PARAMETERS }
          }
        ]);
      }
    }
  };

  // Update model parameters
  const handleUpdateModelParams = (index, paramName, value) => {
    const updatedModels = [...selectedModels];
    updatedModels[index] = {
      ...updatedModels[index],
      parameters: {
        ...updatedModels[index].parameters,
        [paramName]: value
      }
    };
    setSelectedModels(updatedModels);
  };

  // Save benchmark configuration
  const handleSaveBenchmark = async () => {
    if (!name) {
      setError('Benchmark name is required');
      return;
    }
    
    if (testCases.length === 0) {
      setError('At least one test case is required');
      return;
    }
    
    if (selectedModels.length === 0) {
      setError('At least one model must be selected');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const benchmarkConfig = {
        name,
        description,
        test_cases: testCases,
        model_configs: selectedModels,
        metric_configs: [
          { id: 'latency', name: 'Latency', enabled: true },
          { id: 'tokens', name: 'Token Usage', enabled: true },
          { id: 'cost', name: 'Cost', enabled: true }
        ]
      };
      
      const savedConfig = await createBenchmarkConfig(benchmarkConfig);
      
      setIsLoading(false);
      navigate(`/benchmarks/run/${savedConfig.id}`);
    } catch (err) {
      setError('Failed to save benchmark configuration');
      setIsLoading(false);
    }
  };

  // If no API key is set, show a message
  if (!apiKey) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Benchmark</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                OpenRouter API key is required to create benchmarks.
                Please set your API key in the <a href="/settings" className="font-medium underline text-yellow-700 hover:text-yellow-600">Settings</a> page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Benchmark</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Benchmark Information</h2>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter benchmark name"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter benchmark description (optional)"
            rows={3}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Test Cases Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Test Cases</h2>
            <button
              type="button"
              className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              onClick={handleAddTestCase}
            >
              Add Test Case
            </button>
          </div>
          
          {testCases.length === 0 ? (
            <p className="text-gray-500">No test cases added yet. Click "Add Test Case" to create one.</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {testCases.map((testCase, index) => (
                <div key={testCase.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={testCase.name}
                        onChange={(e) => handleUpdateTestCase(index, 'name', e.target.value)}
                        placeholder="Test case name"
                      />
                    </div>
                    <div className="ml-2">
                      <button
                        type="button"
                        className="p-1 text-red-600 hover:text-red-800"
                        onClick={() => handleRemoveTestCase(index)}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={testCase.category}
                      onChange={(e) => handleUpdateTestCase(index, 'category', e.target.value)}
                    >
                      {TASK_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prompt
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={testCase.prompt}
                      onChange={(e) => handleUpdateTestCase(index, 'prompt', e.target.value)}
                      placeholder="Enter prompt for the model"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Output (Optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={testCase.expectedOutput}
                      onChange={(e) => handleUpdateTestCase(index, 'expectedOutput', e.target.value)}
                      placeholder="Enter expected output (optional)"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Select Models Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Select Models</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2">Loading models...</span>
            </div>
          ) : (
            <>
              {availableModels.length === 0 ? (
                <p className="text-gray-500">No models available. Please check your API key.</p>
              ) : (
                <>
                  <div className="mb-3">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Search models..."
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-md p-2">
                    <div className="space-y-2">
                      {availableModels
                        .filter(model =>
                          model.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                          (model.name && model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
                        )
                        .map((model) => (
                          <div key={model.id} className="flex items-center py-1 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              id={`model-${model.id}`}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              checked={selectedModels.some(m => m.modelId === model.id)}
                              onChange={() => handleToggleModel(model.id)}
                            />
                            <label htmlFor={`model-${model.id}`} className="ml-2 block text-sm text-gray-900">
                              {model.name || model.id}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
              
              {selectedModels.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-700 mb-2">Model Parameters</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Tokens</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedModels.map((model, index) => (
                          <tr key={model.modelId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {model.modelId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <input
                                type="number"
                                className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                                value={model.parameters?.temperature || 0.7}
                                onChange={(e) => handleUpdateModelParams(index, 'temperature', parseFloat(e.target.value))}
                                min="0"
                                max="2"
                                step="0.1"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <input
                                type="number"
                                className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                                value={model.parameters?.max_tokens || 1000}
                                onChange={(e) => handleUpdateModelParams(index, 'max_tokens', parseInt(e.target.value))}
                                min="1"
                                max="4000"
                                step="1"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-2"
          onClick={() => navigate('/')}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          onClick={handleSaveBenchmark}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save & Run Benchmark'}
        </button>
      </div>
    </div>
  );
};

export default BenchmarkCreator;
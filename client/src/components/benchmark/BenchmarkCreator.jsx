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
    <div className="p-6 animate-fadeIn">
      <h1 className="text-3xl font-bold text-dark-600 mb-8">Create Benchmark</h1>
      
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
      
      <div className="card bg-gradient-to-br from-blue-50 to-white mb-8">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-blue-100 mr-3">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Benchmark Information</h2>
        </div>
        <div className="mb-5">
          <label htmlFor="name" className="label">
            Name
          </label>
          <input
            type="text"
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter benchmark name"
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="description" className="label">
            Description
          </label>
          <textarea
            id="description"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter benchmark description (optional)"
            rows={3}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Test Cases Section */}
        <div className="card">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-md bg-secondary-100 mr-3">
              <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-dark-600">Test Cases</h2>
            <button
              type="button"
              className="ml-auto btn btn-primary"
              onClick={handleAddTestCase}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Test Case
              </span>
            </button>
          </div>
          
          {testCases.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No test cases added yet.</p>
              <button
                type="button"
                className="mt-3 btn btn-secondary"
                onClick={handleAddTestCase}
              >
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Your First Test Case
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2">
              {testCases.map((testCase, index) => (
                <div key={testCase.id} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        className="input"
                        value={testCase.name}
                        onChange={(e) => handleUpdateTestCase(index, 'name', e.target.value)}
                        placeholder="Test case name"
                      />
                    </div>
                    <div className="ml-2">
                      <button
                        type="button"
                        className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition-colors"
                        onClick={() => handleRemoveTestCase(index)}
                        title="Remove test case"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="label">
                      Category
                    </label>
                    <select
                      className="input"
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
                  
                  <div className="mb-4">
                    <label className="label">
                      Prompt
                    </label>
                    <textarea
                      className="input"
                      value={testCase.prompt}
                      onChange={(e) => handleUpdateTestCase(index, 'prompt', e.target.value)}
                      placeholder="Enter prompt for the model"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="label">
                      Expected Output (Optional)
                    </label>
                    <textarea
                      className="input"
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
        <div className="card">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-md bg-primary-100 mr-3">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-dark-600">Select Models</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-3 text-primary-600 font-medium">Loading models...</span>
            </div>
          ) : (
            <>
              {availableModels.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <p className="text-gray-500">No models available. Please check your API key.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="input pl-10"
                        placeholder="       Search models..."
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="space-y-1">
                      {availableModels
                        .filter(model =>
                          model.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                          (model.name && model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
                        )
                        .map((model) => (
                          <div key={model.id} className="flex items-center py-2 px-2 rounded-md hover:bg-gray-50 transition-colors">
                            <input
                              type="checkbox"
                              id={`model-${model.id}`}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              checked={selectedModels.some(m => m.modelId === model.id)}
                              onChange={() => handleToggleModel(model.id)}
                            />
                            <label htmlFor={`model-${model.id}`} className="ml-2 block text-sm text-dark-600 cursor-pointer flex-grow">
                              {model.name || model.id}
                            </label>
                            {model.description && (
                              <span className="text-xs text-gray-500 truncate max-w-[200px]">{model.description}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
              
              {selectedModels.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center mb-4">
                    <h3 className="font-semibold text-dark-600">Model Parameters</h3>
                    <span className="ml-2 bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {selectedModels.length} models selected
                    </span>
                  </div>
                  <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Tokens</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedModels.map((model, index) => (
                          <tr key={model.modelId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-600">
                              {model.modelId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <input
                                type="number"
                                className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
                                className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                value={model.parameters?.max_tokens || 1000}
                                onChange={(e) => handleUpdateModelParams(index, 'max_tokens', parseInt(e.target.value))}
                                min="1"
                                max="4000"
                                step="1"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              <button
                                type="button"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded-full transition-colors"
                                onClick={() => handleToggleModel(model.modelId)}
                                title="Remove model"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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
      
      <div className="flex justify-end mt-8">
        <button
          type="button"
          className="btn btn-secondary mr-3"
          onClick={() => navigate('/')}
        >
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </span>
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSaveBenchmark}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Save & Run Benchmark
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default BenchmarkCreator;
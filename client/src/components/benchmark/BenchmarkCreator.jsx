import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBenchmarkConfig } from '../../services/api';
import { getAvailableModels } from '../../services/openrouter';
import { TASK_CATEGORIES, DEFAULT_MODEL_PARAMETERS, DEFAULT_TEST_CASES } from '../../constants';

const BenchmarkCreator = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [testCases, setTestCases] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [testCaseSearchQuery, setTestCaseSearchQuery] = useState('');
  const [selectedDescriptionModel, setSelectedDescriptionModel] = useState(null);
  const [modalSelectedTestCases, setModalSelectedTestCases] = useState([]);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showNewTestCaseModal, setShowNewTestCaseModal] = useState(false);
  const [newTestCase, setNewTestCase] = useState({
    name: 'New Test Case',
    category: TASK_CATEGORIES[0].id,
    prompt: '',
    expectedOutput: '',
  });

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
        ...newTestCase
      }
    ]);
    
    // Reset the new test case form and close the modal
    setNewTestCase({
      name: 'New Test Case',
      category: TASK_CATEGORIES[0].id,
      prompt: '',
      expectedOutput: '',
    });
    setShowNewTestCaseModal(false);
  };
  
  // Update new test case form
  const handleUpdateNewTestCase = (field, value) => {
    setNewTestCase({
      ...newTestCase,
      [field]: value
    });
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Benchmark Information */}
        <div className="card bg-gradient-to-br from-blue-50 to-white">
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
        
        {/* Benchmark Metrics Configuration */}
        <div className="card bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-md bg-purple-100 mr-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-dark-600">Benchmark Metrics</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Metrics tracked during benchmark execution:
          </p>
          
          <div className="flex justify-center space-x-8 py-6 overflow-visible">
            {/* Latency Metric */}
            <div className="transform -rotate-12 hover:-rotate-6 transition-transform duration-300">
              <div className="h-32 w-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-md shadow-md flex flex-col items-center justify-center relative overflow-visible">
                <div className="absolute top-1 right-1">
                  <input
                    type="checkbox"
                    id="metric-latency"
                    className="h-3 w-3 text-white focus:ring-purple-500 border-purple-300 rounded"
                    checked={true}
                    readOnly
                  />
                </div>
                <div className="absolute -top-2 -left-2 bg-white p-1 rounded-full shadow-sm">
                  <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold transform -rotate-90 text-sm tracking-wider mt-2">LATENCY</h3>
              </div>
            </div>
            
            {/* Token Usage Metric */}
            <div className="transform rotate-12 hover:rotate-6 transition-transform duration-300">
              <div className="h-32 w-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md shadow-md flex flex-col items-center justify-center relative overflow-visible">
                <div className="absolute top-1 right-1">
                  <input
                    type="checkbox"
                    id="metric-tokens"
                    className="h-3 w-3 text-white focus:ring-blue-500 border-blue-300 rounded"
                    checked={true}
                    readOnly
                  />
                </div>
                <div className="absolute -top-2 -left-2 bg-white p-1 rounded-full shadow-sm">
                  <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold transform -rotate-90 text-sm tracking-wider mt-2">TOKENS</h3>
              </div>
            </div>
            
            {/* Cost Metric */}
            <div className="transform -rotate-12 hover:-rotate-6 transition-transform duration-300">
              <div className="h-32 w-14 bg-gradient-to-br from-green-400 to-green-600 rounded-md shadow-md flex flex-col items-center justify-center relative overflow-visible">
                <div className="absolute top-1 right-1">
                  <input
                    type="checkbox"
                    id="metric-cost"
                    className="h-3 w-3 text-white focus:ring-green-500 border-green-300 rounded"
                    checked={true}
                    readOnly
                  />
                </div>
                <div className="absolute -top-2 -left-2 bg-white p-1 rounded-full shadow-sm">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold transform -rotate-90 text-sm tracking-wider mt-2">COST</h3>
              </div>
            </div>
            
            {/* Accuracy Metric */}
            <div className="transform rotate-12 hover:rotate-6 transition-transform duration-300 opacity-80">
              <div className="h-32 w-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-md shadow-md flex flex-col items-center justify-center relative overflow-visible">
                <div className="absolute top-1 right-1">
                  <input
                    type="checkbox"
                    id="metric-accuracy"
                    className="h-3 w-3 text-white focus:ring-gray-300 border-gray-300 rounded cursor-not-allowed"
                    checked={false}
                    disabled
                  />
                </div>
                <div className="absolute -top-2 -left-2 bg-white p-1 rounded-full shadow-sm">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="absolute bottom-1 text-white text-[10px] bg-gray-700 px-1.5 py-0.5 rounded-full">SOON</span>
                <h3 className="text-white font-bold transform -rotate-90 text-sm tracking-wider mt-2">ACCURACY</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Test Cases Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-secondary-100 mr-3">
                <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-dark-600">Test Cases</h2>
              
              {/* Test case count badge */}
              <span className="ml-2 bg-secondary-100 text-secondary-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {testCases.length} test cases
              </span>
            </div>
            
            {/* Buttons moved to search bar */}
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Choose from our pre-defined test cases or create your own custom test cases. Each test case should have a name, category, and prompt. The expected output is optional and can be used for evaluation.
                </p>
              </div>
            </div>
          </div>
          
          {/* Test Case Options */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-dark-600">Add Test Cases</h3>
            </div>
            
            <div className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Default Test Cases Option */}
                <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center mb-3">
                    <div className="p-1.5 rounded-md bg-blue-100 mr-2">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-dark-600">Choose Default Test Cases</h4>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Select from our curated collection of test cases covering various categories.
                  </p>
                  
                  <button
                    type="button"
                    className="w-full btn btn-secondary"
                    onClick={() => {
                      // Initialize modal selected test cases with current selections
                      setModalSelectedTestCases(
                        testCases
                          .filter(tc => DEFAULT_TEST_CASES.some(dtc => tc.id.startsWith(dtc.id)))
                          .map(tc => tc.id.split('-')[0]) // Extract the base ID
                      );
                      
                      // Show modal
                      const defaultTestCasesModal = document.getElementById('defaultTestCasesModal');
                      if (defaultTestCasesModal) {
                        defaultTestCasesModal.classList.remove('hidden');
                      }
                    }}
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                      </svg>
                      Browse Default Test Cases
                    </span>
                  </button>
                </div>
                
                {/* Custom Test Case Option */}
                <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center mb-3">
                    <div className="p-1.5 rounded-md bg-green-100 mr-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-dark-600">Create Custom Test Case</h4>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Create your own test case with custom prompts and expected outputs.
                  </p>
                  
                  <button
                    type="button"
                    className="w-full btn btn-primary"
                    onClick={() => setShowNewTestCaseModal(true)}
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create New Test Case
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* New Test Case Modal */}
          {showNewTestCaseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-secondary-50 to-white rounded-t-2xl">
                  <div className="flex items-center">
                    <div className="p-2 rounded-md bg-secondary-100 mr-3">
                      <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-lg text-dark-600">Create New Test Case</h3>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNewTestCaseModal(false)}
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          Create a custom test case with your own prompt and expected output. This test case will be used to evaluate the performance of the selected models.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="mb-4">
                      <label className="label flex items-center">
                        <svg className="w-4 h-4 mr-1 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Name
                      </label>
                      <input
                        type="text"
                        className="input focus:ring-secondary-500 focus:border-secondary-500 rounded-xl"
                        value={newTestCase.name}
                        onChange={(e) => handleUpdateNewTestCase('name', e.target.value)}
                        placeholder="Test case name"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="label flex items-center">
                        <svg className="w-4 h-4 mr-1 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Category
                      </label>
                      <select
                        className="input focus:ring-secondary-500 focus:border-secondary-500 rounded-xl"
                        value={newTestCase.category}
                        onChange={(e) => handleUpdateNewTestCase('category', e.target.value)}
                      >
                        {TASK_CATEGORIES.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="label flex items-center">
                      <svg className="w-4 h-4 mr-1 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Prompt
                    </label>
                    <textarea
                      className="input focus:ring-secondary-500 focus:border-secondary-500 rounded-xl"
                      value={newTestCase.prompt}
                      onChange={(e) => handleUpdateNewTestCase('prompt', e.target.value)}
                      placeholder="Enter prompt for the model"
                      rows={5}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="label flex items-center">
                      <svg className="w-4 h-4 mr-1 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Expected Output (Optional)
                    </label>
                    <textarea
                      className="input focus:ring-secondary-500 focus:border-secondary-500 rounded-xl"
                      value={newTestCase.expectedOutput}
                      onChange={(e) => handleUpdateNewTestCase('expectedOutput', e.target.value)}
                      placeholder="Enter expected output (optional)"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      className="btn btn-secondary rounded-xl"
                      onClick={() => setShowNewTestCaseModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary rounded-xl"
                      onClick={handleAddTestCase}
                      disabled={!newTestCase.name || !newTestCase.prompt}
                    >
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Test Case
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Reset Confirmation Modal */}
          {showResetConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-red-50 to-white rounded-t-2xl">
                  <h3 className="font-semibold text-lg text-dark-600">Confirm Reset</h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setShowResetConfirmation(false)}
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-full bg-red-100 mr-3">
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900">Remove all test cases?</h4>
                  </div>
                  <p className="text-gray-600 mb-6">
                    This will remove all test cases from your benchmark. This action cannot be undone.
                  </p>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                      onClick={() => setShowResetConfirmation(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                      onClick={() => {
                        setTestCases([]);
                        setShowResetConfirmation(false);
                      }}
                    >
                      Remove All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Default Test Cases Modal */}
          <div id="defaultTestCasesModal" className="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
                <div className="flex items-center">
                  <div className="p-2 rounded-md bg-blue-100 mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg text-dark-600">Default Test Cases</h3>
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {modalSelectedTestCases.length} selected
                  </span>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    const defaultTestCasesModal = document.getElementById('defaultTestCasesModal');
                    if (defaultTestCasesModal) {
                      defaultTestCasesModal.classList.add('hidden');
                    }
                  }}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-grow">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Choose from our curated collection of test cases covering various categories. Select multiple test cases to add them to your benchmark.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-md bg-blue-100 mr-2">
                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="flex-grow bg-transparent border-none focus:ring-0 focus:outline-none text-sm"
                      placeholder="Search default test cases by name or category..."
                      onChange={(e) => setTestCaseSearchQuery(e.target.value)}
                    />
                    {testCaseSearchQuery && (
                      <button
                        type="button"
                        className="p-1 text-gray-400 hover:text-gray-600"
                        onClick={() => setTestCaseSearchQuery('')}
                        title="Clear search"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DEFAULT_TEST_CASES
                    .filter(testCase =>
                      !testCaseSearchQuery ||
                      testCase.name.toLowerCase().includes(testCaseSearchQuery.toLowerCase()) ||
                      TASK_CATEGORIES.find(cat => cat.id === testCase.category)?.name.toLowerCase().includes(testCaseSearchQuery.toLowerCase())
                    )
                    .map((testCase) => {
                      const categoryName = TASK_CATEGORIES.find(cat => cat.id === testCase.category)?.name || 'Unknown';
                      const isSelected = modalSelectedTestCases.includes(testCase.id);
                      
                      return (
                        <div
                          key={testCase.id}
                          className={`border rounded-xl shadow-sm hover:shadow-md transition-all ${
                            isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            // Toggle selection of this test case in the modal only
                            if (isSelected) {
                              setModalSelectedTestCases(modalSelectedTestCases.filter(id => id !== testCase.id));
                            } else {
                              setModalSelectedTestCases([...modalSelectedTestCases, testCase.id]);
                            }
                          }}
                        >
                          <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200 rounded-t-xl">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                testCase.category === 'text-completion' ? 'bg-blue-500' :
                                testCase.category === 'summarization' ? 'bg-green-500' :
                                testCase.category === 'question-answering' ? 'bg-yellow-500' :
                                testCase.category === 'code-generation' ? 'bg-purple-500' :
                                testCase.category === 'creative-writing' ? 'bg-pink-500' :
                                testCase.category === 'reasoning' ? 'bg-indigo-500' :
                                testCase.category === 'classification' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`}></div>
                              <span className="text-xs font-medium text-gray-500">{categoryName}</span>
                            </div>
                            
                            <div className="flex items-center">
                              {isSelected ? (
                                <div className="bg-primary-100 p-1 rounded-full">
                                  <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="bg-gray-100 p-1 rounded-full">
                                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="p-3 cursor-pointer">
                            <h4 className="font-medium text-dark-600 mb-2">{testCase.name}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded-xl border border-gray-100">{testCase.prompt.substring(0, 100)}...</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {DEFAULT_TEST_CASES.filter(testCase =>
                  !testCaseSearchQuery ||
                  testCase.name.toLowerCase().includes(testCaseSearchQuery.toLowerCase()) ||
                  TASK_CATEGORIES.find(cat => cat.id === testCase.category)?.name.toLowerCase().includes(testCaseSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-gray-500">No test cases found matching your search.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-2xl">
                <div className="text-sm text-gray-500">
                  {modalSelectedTestCases.length} test case{modalSelectedTestCases.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    className="btn btn-secondary rounded-xl"
                    onClick={() => {
                      const defaultTestCasesModal = document.getElementById('defaultTestCasesModal');
                      if (defaultTestCasesModal) {
                        defaultTestCasesModal.classList.add('hidden');
                      }
                    }}
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
                    className="btn btn-primary rounded-xl"
                    onClick={() => {
                      // Apply the selected test cases
                      const selectedDefaultTestCases = DEFAULT_TEST_CASES
                        .filter(testCase => modalSelectedTestCases.includes(testCase.id))
                        .map(testCase => ({
                          ...testCase,
                          id: `${testCase.id}-${Date.now()}`
                        }));
                      
                      // Remove any existing default test cases and add the newly selected ones
                      const customTestCases = testCases.filter(tc =>
                        !DEFAULT_TEST_CASES.some(dtc => tc.id.startsWith(dtc.id))
                      );
                      
                      setTestCases([...customTestCases, ...selectedDefaultTestCases]);
                      
                      // Close the modal
                      const defaultTestCasesModal = document.getElementById('defaultTestCasesModal');
                      if (defaultTestCasesModal) {
                        defaultTestCasesModal.classList.add('hidden');
                      }
                    }}
                  >
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Apply Selected
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Test case filter/search with Reset button */}
          <div className="mb-4 p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-grow">
                <div className="p-1.5 rounded-md bg-secondary-100 mr-2">
                  <svg className="h-4 w-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="flex-grow bg-transparent border-none focus:ring-0 focus:outline-none text-sm"
                  placeholder="Search test cases by name or category..."
                  value={testCaseSearchQuery || ''}
                  onChange={(e) => setTestCaseSearchQuery(e.target.value)}
                />
                {testCaseSearchQuery && (
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-gray-600"
                    onClick={() => setTestCaseSearchQuery('')}
                    title="Clear search"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Reset button */}
              <button
                type="button"
                className="ml-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center text-sm"
                onClick={() => setShowResetConfirmation(true)}
                title="Remove all test cases"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </div>
          
          {testCases.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 mb-4">No test cases added yet.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    // Initialize modal selected test cases (empty since we have no selections yet)
                    setModalSelectedTestCases([]);
                    
                    // Show modal
                    const defaultTestCasesModal = document.getElementById('defaultTestCasesModal');
                    if (defaultTestCasesModal) {
                      defaultTestCasesModal.classList.remove('hidden');
                    }
                  }}
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    Choose Default Test Cases
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowNewTestCaseModal(true)}
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create New Test Case
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 p-3 bg-gray-50 rounded-lg">
              {testCases
                .filter(testCase =>
                  !testCaseSearchQuery ||
                  testCase.name.toLowerCase().includes(testCaseSearchQuery.toLowerCase()) ||
                  TASK_CATEGORIES.find(cat => cat.id === testCase.category)?.name.toLowerCase().includes(testCaseSearchQuery.toLowerCase())
                )
                .map((testCase, index) => {
                  // Find the category name for display
                  const categoryName = TASK_CATEGORIES.find(cat => cat.id === testCase.category)?.name || 'Unknown';
                  
                  return (
                    <div key={testCase.id} className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      {/* Test case header */}
                      <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            testCase.category === 'text-completion' ? 'bg-blue-500' :
                            testCase.category === 'summarization' ? 'bg-green-500' :
                            testCase.category === 'question-answering' ? 'bg-yellow-500' :
                            testCase.category === 'code-generation' ? 'bg-purple-500' :
                            testCase.category === 'creative-writing' ? 'bg-pink-500' :
                            testCase.category === 'reasoning' ? 'bg-indigo-500' :
                            testCase.category === 'classification' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="text-xs font-medium text-gray-500">{categoryName}</span>
                        </div>
                        
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                            onClick={() => {
                              // Duplicate test case
                              const newTestCase = {...testCase, id: `test-case-${Date.now()}`};
                              setTestCases([...testCases, newTestCase]);
                            }}
                            title="Duplicate test case"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors"
                            onClick={() => handleRemoveTestCase(index)}
                            title="Remove test case"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Test case content */}
                      <div className="p-4">
                        <div className="mb-4">
                          <label className="label">Name</label>
                          <input
                            type="text"
                            className="input"
                            value={testCase.name}
                            onChange={(e) => handleUpdateTestCase(index, 'name', e.target.value)}
                            placeholder="Test case name"
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="label">Category</label>
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
                          <label className="label">Prompt</label>
                          <textarea
                            className="input"
                            value={testCase.prompt}
                            onChange={(e) => handleUpdateTestCase(index, 'prompt', e.target.value)}
                            placeholder="Enter prompt for the model"
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <label className="label">Expected Output (Optional)</label>
                          <textarea
                            className="input"
                            value={testCase.expectedOutput}
                            onChange={(e) => handleUpdateTestCase(index, 'expectedOutput', e.target.value)}
                            placeholder="Enter expected output (optional)"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  {/* Model Parameters Section - Moved to top for better accessibility */}
                  {selectedModels.length > 0 && (
                    <div className="mb-6">
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
                  
                  {/* Model Selection Section - Enhanced with search and checkboxes */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-dark-600">Available Models</h3>
                      
                      {/* Model count badge */}
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {availableModels.filter(model =>
                          model.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                          (model.name && model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
                        ).length} models available
                      </span>
                    </div>
                    
                    {/* Custom dropdown with search and checkboxes */}
                    <div className="relative">
                      {/* Search input with improved styling */}
                      <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-1.5 rounded-md bg-primary-100 mr-2">
                            <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            className="flex-grow bg-transparent border-none focus:ring-0 focus:outline-none text-sm"
                            placeholder="Search models by name or provider..."
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                          />
                          {modelSearchQuery && (
                            <button
                              type="button"
                              className="p-1 text-gray-400 hover:text-gray-600"
                              onClick={() => setModelSearchQuery('')}
                              title="Clear search"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Models with checkboxes */}
                      <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="space-y-1">
                          {availableModels
                            .filter(model =>
                              model.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                              (model.name && model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
                            )
                            .map((model) => (
                              <div
                                key={model.id}
                                className={`flex items-center py-2 px-2 rounded-md hover:bg-gray-50 transition-colors ${selectedDescriptionModel === model.id ? 'bg-blue-50' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  id={`model-${model.id}`}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                  checked={selectedModels.some(m => m.modelId === model.id)}
                                  onChange={() => handleToggleModel(model.id)}
                                />
                                <label htmlFor={`model-${model.id}`} className="ml-2 block text-sm text-dark-600 cursor-pointer">
                                  {model.name || model.id}
                                </label>
                                
                                <button
                                  type="button"
                                  className={`ml-auto text-xs px-2 py-1 rounded ${
                                    selectedDescriptionModel === model.id
                                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                  onClick={() => setSelectedDescriptionModel(model.id === selectedDescriptionModel ? null : model.id)}
                                >
                                  {selectedDescriptionModel === model.id ? 'Hide Details' : 'See Description'}
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Model description container */}
                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <div className="p-1.5 rounded-md bg-blue-100 mr-2">
                          <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-dark-600">Model Description</h4>
                      </div>
                      
                      {selectedDescriptionModel ? (
                        <div className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 min-h-[100px] max-h-[200px] overflow-y-auto">
                          {availableModels.find(model => model.id === selectedDescriptionModel)?.description ||
                           "No description available for this model."}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 bg-white p-3 rounded border border-gray-200 min-h-[100px] flex items-center justify-center italic">
                          Click on a model to view its description
                        </div>
                      )}
                    </div>
                  </div>
                </>
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
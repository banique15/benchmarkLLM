import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBenchmarkConfigById } from '../../services/api';
import { runBenchmark, getBenchmarkStatus } from '../../services/openrouter';

const BenchmarkRunner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [benchmarkConfig, setBenchmarkConfig] = useState(null);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    status: 'initializing',
    currentModel: '',
    currentTest: '',
    progress: 0,
    totalTests: 0,
  });
  const [apiKey, setApiKey] = useState('');

  // Load API key from localStorage
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openrouter_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      setError('OpenRouter API key is required. Please set it in the Settings page.');
      setIsLoading(false);
    }
  }, []);

  // Fetch benchmark configuration
  useEffect(() => {
    const fetchBenchmarkConfig = async () => {
      if (!id) return;
      
      try {
        const config = await getBenchmarkConfigById(id);
        setBenchmarkConfig(config);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch benchmark configuration');
        setIsLoading(false);
      }
    };
    
    fetchBenchmarkConfig();
  }, [id]);

  // Start the benchmark
  const startBenchmark = async () => {
    if (!benchmarkConfig || !apiKey) return;
    
    try {
      console.log('Starting benchmark with API key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key');
      console.log('Benchmark config:', {
        name: benchmarkConfig.name,
        testCases: benchmarkConfig.test_cases.length,
        models: benchmarkConfig.model_configs.filter(m => m.enabled).length,
      });
      
      setIsLoading(true);
      setProgress({
        status: 'starting',
        currentModel: '',
        currentTest: '',
        progress: 0,
        totalTests: benchmarkConfig.test_cases.length * benchmarkConfig.model_configs.filter(m => m.enabled).length,
      });
      
      const result = await runBenchmark(benchmarkConfig);
      console.log('Benchmark started successfully:', result);
      setBenchmarkResult(result);
      
      // Start polling for status updates
      pollBenchmarkStatus(result.id);
    } catch (err) {
      console.error('Failed to start benchmark:', err);
      setError(`Failed to start benchmark: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Poll for benchmark status updates
  const pollBenchmarkStatus = async (resultId) => {
    try {
      console.log(`Polling benchmark status for ID: ${resultId}`);
      const status = await getBenchmarkStatus(resultId);
      
      console.log('Received benchmark status:', {
        id: resultId,
        status: status.status,
        progress: status.status_details?.progress,
        totalTests: status.status_details?.totalTests,
        currentModel: status.status_details?.currentModel,
        currentTest: status.status_details?.currentTest,
      });
      
      setBenchmarkResult(status);
      
      if (status.status === 'running') {
        setProgress({
          status: 'running',
          currentModel: status.status_details?.currentModel || '',
          currentTest: status.status_details?.currentTest || '',
          progress: status.status_details?.progress || 0,
          totalTests: status.status_details?.totalTests || 0,
        });
        
        // Continue polling
        console.log('Benchmark still running, continuing to poll...');
        setTimeout(() => pollBenchmarkStatus(resultId), 2000);
      } else if (status.status === 'completed') {
        console.log('Benchmark completed successfully');
        setProgress({
          status: 'completed',
          progress: 100,
          totalTests: 100,
        });
        setIsLoading(false);
        
        // Show success message
        setError(null);
        alert('Benchmark completed successfully! Redirecting to results page...');
        
        // Navigate to results page with the benchmark ID
        console.log(`Navigating to results page: /results/${resultId}`);
        navigate(`/results/${resultId}`);
      } else if (status.status === 'failed') {
        console.error(`Benchmark failed: ${status.error || 'Unknown error'}`);
        setError(`Benchmark failed: ${status.error || 'Unknown error'}`);
        setProgress({
          status: 'failed',
          progress: 0,
          totalTests: 100,
        });
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to get benchmark status:', err);
      setError(`Failed to get benchmark status: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (progress.status === 'completed') return 100;
    if (progress.totalTests === 0) return 0;
    return Math.round((progress.progress / progress.totalTests) * 100);
  };

  // If no API key is set, show a message
  if (!apiKey) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Run Benchmark</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                OpenRouter API key is required to run benchmarks.
                Please set your API key in the <a href="/settings" className="font-medium underline text-yellow-700 hover:text-yellow-600">Settings</a> page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !benchmarkConfig) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Run Benchmark</h1>
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2">Loading benchmark configuration...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Run Benchmark</h1>
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
        <div className="flex">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!benchmarkConfig) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Run Benchmark</h1>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Benchmark configuration not found</p>
            </div>
          </div>
        </div>
        <div className="flex">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Run Benchmark</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Benchmark Information</h2>
        <div className="mb-4">
          <p className="text-gray-700"><span className="font-medium">Name:</span> {benchmarkConfig.name}</p>
          {benchmarkConfig.description && (
            <p className="text-gray-700 mt-2"><span className="font-medium">Description:</span> {benchmarkConfig.description}</p>
          )}
        </div>
        
        <div className="mb-4">
          <p className="text-gray-700"><span className="font-medium">Test Cases:</span> {benchmarkConfig.test_cases.length}</p>
          <p className="text-gray-700"><span className="font-medium">Models:</span> {benchmarkConfig.model_configs.filter(m => m.enabled).length}</p>
          <p className="text-gray-700"><span className="font-medium">Total Tests:</span> {benchmarkConfig.test_cases.length * benchmarkConfig.model_configs.filter(m => m.enabled).length}</p>
        </div>
      </div>
      
      {benchmarkResult ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Benchmark Progress</h2>
          
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {progress.status === 'running' ? 'Running...' : progress.status === 'completed' ? 'Completed' : 'Starting...'}
              </span>
              <span className="text-sm font-medium text-gray-700">{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
          
          {progress.status === 'running' && (
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">Current Model:</span> {progress.currentModel}</p>
              <p><span className="font-medium">Current Test:</span> {progress.currentTest}</p>
              <p><span className="font-medium">Progress:</span> {progress.progress} of {progress.totalTests} tests</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Ready to Run</h2>
          <p className="text-gray-600 mb-4">
            This benchmark will test {benchmarkConfig.model_configs.filter(m => m.enabled).length} models with {benchmarkConfig.test_cases.length} test cases,
            for a total of {benchmarkConfig.test_cases.length * benchmarkConfig.model_configs.filter(m => m.enabled).length} individual tests.
          </p>
          <p className="text-gray-600 mb-4">
            The benchmark will run on the server and may take several minutes to complete, depending on the number of tests and the response time of the models.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Running this benchmark will use your OpenRouter API credits. Make sure you have sufficient credits available.
                </p>
              </div>
            </div>
          </div>
          <div className="flex">
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
              onClick={startBenchmark}
              disabled={isLoading}
            >
              {isLoading ? 'Starting...' : 'Start Benchmark'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchmarkRunner;
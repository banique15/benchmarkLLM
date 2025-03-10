import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBenchmarkConfigById } from '../../services/api';
import { runBenchmark, getBenchmarkStatus } from '../../services/langchain';

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
        
        // Just set the completed status, user will click the button to navigate
        setError(null);
        console.log(`Benchmark completed. Results available at: /results/${resultId}`);
        
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
      <div className="p-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-dark-600 mb-8">Run Benchmark</h1>
        <div className="card bg-gradient-to-br from-yellow-50 to-white">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-md bg-yellow-100 mr-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-dark-600">API Key Required</h2>
          </div>
          
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
          
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/settings')}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Go to Settings
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !benchmarkConfig) {
    return (
      <div className="p-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-dark-600 mb-8">Run Benchmark</h1>
        <div className="card flex flex-col items-center justify-center py-16">
          <svg className="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium text-dark-600">Loading benchmark configuration...</p>
          <p className="text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-dark-600 mb-8">Run Benchmark</h1>
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
              onClick={() => navigate('/')}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Dashboard
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!benchmarkConfig) {
    return (
      <div className="p-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-dark-600 mb-8">Run Benchmark</h1>
        <div className="card bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-md bg-red-100 mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-dark-600">Configuration Not Found</h2>
          </div>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">The benchmark configuration you're looking for could not be found.</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Dashboard
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn">
      <h1 className="text-3xl font-bold text-dark-600 mb-8">Run Benchmark</h1>
      
      <div className="card bg-gradient-to-br from-blue-50 to-white mb-8">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-blue-100 mr-3">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Benchmark Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
          <div>
            <div className="mb-4">
              <p className="text-dark-600"><span className="font-semibold">Name:</span> {benchmarkConfig.name}</p>
              {benchmarkConfig.description && (
                <p className="text-dark-600 mt-2"><span className="font-semibold">Description:</span> {benchmarkConfig.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <div className="p-1.5 rounded-md bg-secondary-100 mr-2">
                <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-dark-600"><span className="font-semibold">Test Cases:</span> {benchmarkConfig.test_cases.length}</p>
            </div>
            
            <div className="flex items-center">
              <div className="p-1.5 rounded-md bg-primary-100 mr-2">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <p className="text-dark-600"><span className="font-semibold">Models:</span> {benchmarkConfig.model_configs.filter(m => m.enabled).length}</p>
            </div>
            
            <div className="flex items-center">
              <div className="p-1.5 rounded-md bg-gray-100 mr-2">
                <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-dark-600"><span className="font-semibold">Total Tests:</span> {benchmarkConfig.test_cases.length * benchmarkConfig.model_configs.filter(m => m.enabled).length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {benchmarkResult ? (
        <div className="card mb-8">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-md bg-primary-100 mr-3">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-dark-600">Benchmark Progress</h2>
            {progress.status === 'running' && (
              <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running
              </span>
            )}
            {progress.status === 'completed' && (
              <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Completed
              </span>
            )}
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-dark-600">
                {progress.status === 'running' ? 'Running...' : progress.status === 'completed' ? 'Completed' : 'Starting...'}
              </span>
              <span className="text-sm font-medium text-dark-600">{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  progress.status === 'completed' ? 'bg-green-500' : 'bg-primary-600'
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
          
          {progress.status === 'running' && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <div className="p-1.5 rounded-md bg-blue-100 mr-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Model</p>
                    <p className="text-sm font-medium text-dark-600">{progress.currentModel}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="p-1.5 rounded-md bg-blue-100 mr-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Test</p>
                    <p className="text-sm font-medium text-dark-600">{progress.currentTest}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="p-1.5 rounded-md bg-blue-100 mr-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Progress</p>
                    <p className="text-sm font-medium text-dark-600">{progress.progress} of {progress.totalTests} tests</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {progress.status === 'completed' && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/results/${benchmarkResult.id}`)}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Results
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card mb-8">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-md bg-secondary-100 mr-3">
              <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-dark-600">Ready to Run</h2>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-lg mb-6">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex-1">
                <p className="text-dark-600 mb-2">
                  This benchmark will test <span className="font-semibold">{benchmarkConfig.model_configs.filter(m => m.enabled).length} models</span> with <span className="font-semibold">{benchmarkConfig.test_cases.length} test cases</span>,
                  for a total of <span className="font-semibold">{benchmarkConfig.test_cases.length * benchmarkConfig.model_configs.filter(m => m.enabled).length} individual tests</span>.
                </p>
                <p className="text-dark-600">
                  The benchmark will run on the server and may take several minutes to complete, depending on the number of tests and the response time of the models.
                </p>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
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
          
          <div className="flex justify-end">
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
              onClick={startBenchmark}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Start Benchmark
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchmarkRunner;
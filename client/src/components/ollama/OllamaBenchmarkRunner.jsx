import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOllamaBenchmark, getOllamaBenchmarkStatus } from '../../services/ollama';

/**
 * Component for running an Ollama benchmark
 */
const OllamaBenchmarkRunner = () => {
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

  // Fetch benchmark configuration
  useEffect(() => {
    const fetchBenchmarkConfig = async () => {
      if (!id) return;
      
      try {
        const result = await getOllamaBenchmark(id);
        setBenchmarkConfig(result.benchmark_config);
        setBenchmarkResult(result);
        setIsLoading(false);
        
        // Start polling for status updates
        pollBenchmarkStatus(id);
      } catch (err) {
        console.error('Failed to fetch benchmark configuration:', err);
        setError('Failed to fetch benchmark configuration');
        setIsLoading(false);
      }
    };
    
    fetchBenchmarkConfig();
  }, [id]);

  // Poll for benchmark status updates
  const pollBenchmarkStatus = async (benchmarkId) => {
    try {
      console.log(`Polling benchmark status for ID: ${benchmarkId}`);
      const status = await getOllamaBenchmarkStatus(benchmarkId);
      
      console.log('Received benchmark status:', {
        id: benchmarkId,
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
        setTimeout(() => pollBenchmarkStatus(benchmarkId), 2000);
      } else if (status.status === 'completed') {
        setProgress({
          status: 'completed',
          progress: status.status_details?.totalTests || 100,
          totalTests: status.status_details?.totalTests || 100,
        });
        setIsLoading(false);
      } else if (status.status === 'failed') {
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

  // If loading and no benchmark config, show loading state
  if (isLoading && !benchmarkConfig) {
    return (
      <div className="card flex flex-col items-center justify-center py-16">
        <svg className="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-medium text-dark-600">Loading benchmark configuration...</p>
        <p className="text-gray-500 mt-2">This may take a few moments</p>
      </div>
    );
  }

  // If error, show error message
  if (error) {
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
            onClick={() => navigate('/ollama')}
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
    );
  }

  // If no benchmark config, show error message
  if (!benchmarkConfig) {
    return (
      <div className="card bg-gradient-to-br from-red-50 to-white">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-red-100 mr-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Benchmark Not Found</h2>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">The benchmark you're looking for could not be found.</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/ollama')}
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
    );
  }

  return (
    <div className="card">
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
            <p className="text-dark-600"><span className="font-semibold">Models:</span> {benchmarkConfig.models.length}</p>
          </div>
          
          <div className="flex items-center">
            <div className="p-1.5 rounded-md bg-gray-100 mr-2">
              <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <p className="text-dark-600"><span className="font-semibold">Total Tests:</span> {benchmarkConfig.test_cases.length * benchmarkConfig.models.length}</p>
          </div>
        </div>
      </div>
      
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
              onClick={() => navigate(`/ollama/results/${id}`)}
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
    </div>
  );
};

export default OllamaBenchmarkRunner;
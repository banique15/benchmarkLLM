import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { checkOllamaStatus } from '../../services/ollama';
import OllamaBenchmarkCreator from './OllamaBenchmarkCreator';
import OllamaBenchmarkRunner from './OllamaBenchmarkRunner';
import OllamaBenchmarkResults from './OllamaBenchmarkResults';
import OllamaBenchmarkList from './OllamaBenchmarkList';

/**
 * Main component for Ollama benchmarking feature
 */
const OllamaBenchmark = () => {
  const navigate = useNavigate();
  const [ollamaStatus, setOllamaStatus] = useState({
    status: 'checking',
    message: 'Checking Ollama server status...'
  });
  const [error, setError] = useState(null);

  // Check if Ollama server is running
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkOllamaStatus();
        setOllamaStatus(status);
        
        if (status.status !== 'running') {
          setError('Ollama server is not running. Please start the Ollama server and try again.');
        }
      } catch (error) {
        console.error('Error checking Ollama status:', error);
        setOllamaStatus({
          status: 'error',
          message: 'Failed to check Ollama server status'
        });
        setError('Failed to connect to Ollama server. Please make sure the server is running and accessible.');
      }
    };
    
    checkStatus();
  }, []);

  // If Ollama server is not running, show error message
  if (ollamaStatus.status !== 'running' && ollamaStatus.status !== 'checking') {
    return (
      <div className="p-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-dark-600 mb-8">Ollama Benchmark</h1>
        
        <div className="card bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-md bg-red-100 mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-dark-600">Ollama Server Not Running</h2>
          </div>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error || 'Ollama server is not running. Please start the Ollama server and try again.'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-dark-600 mb-2">How to Start Ollama Server</h3>
            <ol className="list-decimal list-inside space-y-2 text-dark-600">
              <li>Make sure Ollama is installed on your system. If not, download it from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">ollama.ai</a>.</li>
              <li>Open a terminal or command prompt.</li>
              <li>Run the command: <code className="bg-gray-200 px-2 py-1 rounded">ollama serve</code></li>
              <li>Wait for the server to start, then refresh this page.</li>
            </ol>
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
                Refresh
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If still checking, show loading state
  if (ollamaStatus.status === 'checking') {
    return (
      <div className="p-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-dark-600 mb-8">Ollama Benchmark</h1>
        
        <div className="card flex flex-col items-center justify-center py-16">
          <svg className="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium text-dark-600">Checking Ollama server status...</p>
          <p className="text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Ollama server is running, show the benchmark UI
  return (
    <div className="p-6 animate-fadeIn">
      <h1 className="text-3xl font-bold text-dark-600 mb-8">Ollama Benchmark</h1>
      
      <div className="card bg-gradient-to-br from-green-50 to-white mb-8">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-green-100 mr-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Ollama Server Status</h2>
        </div>
        
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{ollamaStatus.message}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Link to="/ollama/create" className="btn btn-primary">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Benchmark
            </span>
          </Link>
          
          <Link to="/ollama/benchmarks" className="btn btn-secondary">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View Benchmarks
            </span>
          </Link>
        </div>
      </div>
      
      <Routes>
        <Route path="/" element={<OllamaBenchmarkList />} />
        <Route path="/create" element={<OllamaBenchmarkCreator />} />
        <Route path="/run/:id" element={<OllamaBenchmarkRunner />} />
        <Route path="/results/:id" element={<OllamaBenchmarkResults />} />
        <Route path="/benchmarks" element={<OllamaBenchmarkList />} />
      </Routes>
    </div>
  );
};

export default OllamaBenchmark;
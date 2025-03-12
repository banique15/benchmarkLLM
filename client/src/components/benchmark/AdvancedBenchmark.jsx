import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateBenchmark } from '../../services/advanced-benchmark';
import TopicInput from './advanced/TopicInput';
import BenchmarkOptions from './advanced/BenchmarkOptions';
import GenerationProgress from './advanced/GenerationProgress';
import TestCasePreview from './advanced/TestCasePreview';
import ModelSelectionPreview from './advanced/ModelSelectionPreview';

const AdvancedBenchmark = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [options, setOptions] = useState({
    maxModels: 5,  // Further reduced from 10 to require less token capacity
    testCaseCount: 3,  // Further reduced from 5 to require less token capacity
    prioritizeCost: false,
    domainSpecific: true,
    includeReasoning: false,
    selectedProviders: [],  // Empty array means all providers are included
  });
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [generatedConfig, setGeneratedConfig] = useState(null);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Load API key from localStorage
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openrouter_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);
  
  const handleGenerate = async () => {
    if (!topic) {
      setError('Please enter a topic or question for the benchmark');
      return;
    }
    
    if (!apiKey) {
      setError('OpenRouter API key is required. Please set it in the Settings page.');
      return;
    }
    
    if (!options.selectedProviders || options.selectedProviders.length === 0) {
      setError('Please select at least one model provider. This selection is required.');
      return;
    }
    
    try {
      setError(null);
      setIsLoading(true);
      setStatus('generating-tests');
      setProgress(10);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1500);
      
      // Update status based on progress
      setTimeout(() => setStatus('selecting-models'), 3000);
      setTimeout(() => setStatus('creating-benchmark'), 6000);
      
      // Generate benchmark
      const result = await generateBenchmark(topic, options);
      
      clearInterval(progressInterval);
      
      // Check if there was an error
      if (result.error) {
        setStatus('error');
        
        // Check if it's a credits error
        if (result.message && result.message.includes('credits')) {
          setError(`Insufficient OpenRouter API credits. Please add more credits to your account to continue. ${result.details || ''}`);
        } else {
          setError(`Failed to generate benchmark: ${result.message}`);
        }
        
        setIsLoading(false);
        return;
      }
      
      setProgress(100);
      setStatus('completed');
      setGeneratedConfig(result);
      setIsLoading(false);
      
      // Navigate to benchmark runner
      setTimeout(() => {
        navigate(`/benchmarks/run/${result.id}`);
      }, 1000);
      
    } catch (err) {
      setError(`Failed to generate benchmark: ${err.message}`);
      setStatus('error');
      setIsLoading(false);
    }
  };
  
  // If no API key is set, show a message
  if (!apiKey) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Advanced Benchmark</h1>
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
      <h1 className="text-3xl font-bold text-dark-600 mb-8">Advanced Benchmark Creator</h1>
      
      {error && (
        <div className={`${error.includes('credits') ? 'bg-yellow-50 border-yellow-500' : 'bg-red-50 border-red-500'} border-l-4 p-4 mb-6`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {error.includes('credits') ? (
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm ${error.includes('credits') ? 'text-yellow-700' : 'text-red-700'}`}>
                {error}
                {error.includes('credits') && (
                  <a
                    href="https://openrouter.ai/credits"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 font-medium underline hover:text-yellow-800"
                  >
                    Add more credits
                  </a>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              The advanced benchmark uses AI to generate test cases and select models based on your topic.
              Simply enter what you want to test, and the system will create a comprehensive benchmark.
            </p>
          </div>
        </div>
      </div>
      
      {/* Topic Input */}
      <TopicInput topic={topic} setTopic={setTopic} />
      
      {/* Benchmark Options */}
      <BenchmarkOptions options={options} setOptions={setOptions} />
      
      {/* Generation Progress */}
      {status !== 'idle' && (
        <GenerationProgress status={status} progress={progress} />
      )}
      
      {/* Test Case Preview */}
      {generatedConfig && generatedConfig.test_cases && (
        <TestCasePreview testCases={generatedConfig.test_cases} />
      )}
      
      {/* Model Selection Preview */}
      {generatedConfig && (
        <div>
          {/* Add debug info to help diagnose issues */}
          {console.log('Generated config:', generatedConfig)}
          {generatedConfig.model_configs ? (
            <ModelSelectionPreview models={generatedConfig.model_configs} />
          ) : (
            <div className="card bg-white p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-md bg-indigo-100 mr-3">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-dark-600">Selected Models</h2>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-700">
                  No models were found in the generated configuration. This might be due to an API error or token capacity issue.
                </p>
                <pre className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(generatedConfig, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-end mt-8">
        <button
          type="button"
          className="btn btn-secondary mr-3"
          onClick={() => navigate('/benchmarks')}
          disabled={isLoading}
        >
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Selection
          </span>
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Benchmark
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdvancedBenchmark;
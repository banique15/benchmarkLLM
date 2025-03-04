import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBenchmarkResultById } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResultDetails = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedTestCase, setSelectedTestCase] = useState(null);

  // Fetch benchmark result
  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await getBenchmarkResultById(id);
        setResult(data);
        
        // Set default selected model if available
        if (data.model_results && Object.keys(data.model_results).length > 0) {
          setSelectedModel(Object.keys(data.model_results)[0]);
        }
        
        // Set default selected test case if available
        if (data.test_case_results && data.test_case_results.length > 0) {
          const testCaseIds = [...new Set(data.test_case_results.map(tcr => tcr.test_case_id))];
          if (testCaseIds.length > 0) {
            setSelectedTestCase(testCaseIds[0]);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch benchmark result');
        setIsLoading(false);
      }
    };
    
    fetchResult();
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Prepare chart data for latency comparison
  const prepareLatencyChartData = () => {
    if (!result || !result.test_case_results || result.test_case_results.length === 0) {
      return [];
    }
    
    // Group by test case
    const testCases = [...new Set(result.test_case_results.map(tcr => tcr.test_case_id))];
    
    return testCases.map(testCaseId => {
      const testCaseResults = result.test_case_results.filter(tcr => tcr.test_case_id === testCaseId);
      
      // Create data point with test case name and latency for each model
      const dataPoint = {
        name: testCaseId,
      };
      
      testCaseResults.forEach(tcr => {
        dataPoint[tcr.model_id] = tcr.latency;
      });
      
      return dataPoint;
    });
  };

  // Prepare chart data for token usage comparison
  const prepareTokenChartData = () => {
    if (!result || !result.test_case_results || result.test_case_results.length === 0) {
      return [];
    }
    
    // Group by model
    const models = [...new Set(result.test_case_results.map(tcr => tcr.model_id))];
    
    return models.map(modelId => {
      const modelResults = result.test_case_results.filter(tcr => tcr.model_id === modelId);
      
      // Sum token counts for the model
      const totalTokens = modelResults.reduce((sum, tcr) => sum + tcr.token_count, 0);
      
      return {
        name: modelId.split('/').pop(), // Just show the model name without provider
        tokens: totalTokens,
      };
    });
  };

  // Prepare chart data for cost comparison
  const prepareCostChartData = () => {
    if (!result || !result.test_case_results || result.test_case_results.length === 0) {
      return [];
    }
    
    // Group by model
    const models = [...new Set(result.test_case_results.map(tcr => tcr.model_id))];
    
    return models.map(modelId => {
      const modelResults = result.test_case_results.filter(tcr => tcr.model_id === modelId);
      
      // Sum costs for the model
      const totalCost = modelResults.reduce((sum, tcr) => sum + tcr.cost, 0);
      
      return {
        name: modelId.split('/').pop(), // Just show the model name without provider
        cost: totalCost,
      };
    });
  };

  // Get test case result for selected model and test case
  const getSelectedTestCaseResult = () => {
    if (!result || !result.test_case_results || !selectedModel || !selectedTestCase) {
      return null;
    }
    
    return result.test_case_results.find(
      tcr => tcr.model_id === selectedModel && tcr.test_case_id === selectedTestCase
    );
  };

  // Get test case details from config
  const getTestCaseDetails = (testCaseId) => {
    if (!result || !testCaseId) {
      return null;
    }
    
    // Debug log to understand the structure
    console.log('Looking for test case:', testCaseId);
    console.log('Result structure:', {
      hasTestCases: !!result.test_cases,
      testCasesType: result.test_cases ? typeof result.test_cases : 'N/A',
      hasBenchmarkConfigs: !!result.benchmark_configs,
      benchmarkConfigsType: result.benchmark_configs ? typeof result.benchmark_configs : 'N/A',
      benchmarkConfigsFields: result.benchmark_configs ? Object.keys(result.benchmark_configs) : [],
      hasTestCasesInConfig: result.benchmark_configs && !!result.benchmark_configs.test_cases,
      testCasesInConfigType: result.benchmark_configs && result.benchmark_configs.test_cases ?
        typeof result.benchmark_configs.test_cases : 'N/A'
    });
    
    // Try to find test case in various possible locations
    
    // 1. Check in result.test_cases array
    if (result.test_cases && Array.isArray(result.test_cases)) {
      console.log('Checking in result.test_cases array:', result.test_cases.length);
      const testCase = result.test_cases.find(tc => tc.id === testCaseId);
      if (testCase) {
        console.log('Found test case in result.test_cases:', testCase);
        return testCase;
      }
    }
    
    // 2. Check in benchmark_configs.test_cases (which is a JSON field)
    if (result.benchmark_configs && result.benchmark_configs.test_cases) {
      console.log('Checking in benchmark_configs.test_cases');
      try {
        // If it's already an array, use it directly
        if (Array.isArray(result.benchmark_configs.test_cases)) {
          console.log('benchmark_configs.test_cases is an array:', result.benchmark_configs.test_cases.length);
          const testCase = result.benchmark_configs.test_cases.find(tc => tc.id === testCaseId);
          if (testCase) {
            console.log('Found test case in benchmark_configs.test_cases array:', testCase);
            return testCase;
          }
        }
        // If it's a string, try to parse it as JSON
        else if (typeof result.benchmark_configs.test_cases === 'string') {
          console.log('benchmark_configs.test_cases is a string, parsing as JSON');
          const testCasesArray = JSON.parse(result.benchmark_configs.test_cases);
          if (Array.isArray(testCasesArray)) {
            console.log('Parsed JSON is an array:', testCasesArray.length);
            const testCase = testCasesArray.find(tc => tc.id === testCaseId);
            if (testCase) {
              console.log('Found test case in parsed JSON array:', testCase);
              return testCase;
            }
          }
        } else {
          console.log('benchmark_configs.test_cases is neither array nor string:',
            typeof result.benchmark_configs.test_cases);
        }
      } catch (err) {
        console.error('Error parsing test_cases JSON:', err);
      }
    }
    
    // 3. Check in model_results for test case info
    if (result.model_results) {
      console.log('Checking in model_results:', Object.keys(result.model_results));
      for (const modelId in result.model_results) {
        const modelResult = result.model_results[modelId];
        console.log(`Checking model ${modelId}:`, {
          hasTestResults: !!modelResult.testResults,
          testResultsType: modelResult.testResults ? typeof modelResult.testResults : 'N/A',
          hasTestCaseId: modelResult.testResults && !!modelResult.testResults[testCaseId]
        });
        
        if (modelResult.testResults && modelResult.testResults[testCaseId]) {
          const testResult = modelResult.testResults[testCaseId];
          console.log(`Found test result for ${testCaseId} in model ${modelId}:`, {
            hasPrompt: !!testResult.prompt,
            promptType: testResult.prompt ? typeof testResult.prompt : 'N/A'
          });
          
          if (testResult.prompt) {
            console.log('Using prompt from model_results.testResults');
            return {
              id: testCaseId,
              name: testCaseId,
              prompt: testResult.prompt
            };
          }
        }
      }
    }
    
    // 4. Check in test_case_results for prompt information
    if (result.test_case_results && Array.isArray(result.test_case_results)) {
      console.log('Checking in test_case_results array:', result.test_case_results.length);
      
      // First look for metrics.prompt
      const testCaseResult = result.test_case_results.find(tcr =>
        tcr.test_case_id === testCaseId && tcr.metrics && tcr.metrics.prompt
      );
      
      if (testCaseResult && testCaseResult.metrics && testCaseResult.metrics.prompt) {
        console.log('Found prompt in test_case_results.metrics.prompt');
        return {
          id: testCaseId,
          name: testCaseId,
          prompt: testCaseResult.metrics.prompt
        };
      }
      
      // If we still don't have the prompt, check if we can find it in the first test case result
      const firstResult = result.test_case_results.find(tcr => tcr.test_case_id === testCaseId);
      if (firstResult) {
        console.log('Found matching test case result:', {
          hasInput: !!firstResult.input,
          inputType: firstResult.input ? typeof firstResult.input : 'N/A',
          hasMetrics: !!firstResult.metrics,
          metricsKeys: firstResult.metrics ? Object.keys(firstResult.metrics) : []
        });
        
        if (firstResult.input) {
          console.log('Using input field from test_case_results');
          return {
            id: testCaseId,
            name: testCaseId,
            prompt: firstResult.input
          };
        }
      }
    }
    
    // Default fallback
    console.log('No prompt found for test case, using default fallback');
    return { id: testCaseId, name: testCaseId, prompt: 'Prompt not available' };
  };

  if (isLoading) {
    return (
      <div className="p-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-dark-600 mb-8">Benchmark Result</h1>
        <div className="card flex flex-col items-center justify-center py-16">
          <svg className="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium text-dark-600">Loading benchmark result...</p>
          <p className="text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-dark-600 mb-8">Benchmark Result</h1>
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
            <Link to="/results" className="btn btn-primary">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Results
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-dark-600 mb-8">Benchmark Result</h1>
        <div className="card bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-md bg-red-100 mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-dark-600">Result Not Found</h2>
          </div>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">The benchmark result you're looking for could not be found.</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Link to="/results" className="btn btn-primary">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Results
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-dark-600">Benchmark Result</h1>
        <div className="flex space-x-3">
          <a
            href={`/api/results/${result.id}/export?format=json`}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </span>
          </a>
          <a
            href={`/api/results/${result.id}/export?format=csv`}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </span>
          </a>
        </div>
      </div>
      
      <div className="card bg-gradient-to-br from-blue-50 to-white mb-8">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-blue-100 mr-3">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Benchmark Information</h2>
          <div className="ml-auto">
            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(result.status)}`}>
              {result.status}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="p-1.5 rounded-md bg-gray-100 mr-2 mt-0.5">
                <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-dark-600 font-medium">{result.benchmark_configs?.name || 'Unnamed Benchmark'}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="p-1.5 rounded-md bg-gray-100 mr-2 mt-0.5">
                <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Executed</p>
                <p className="text-dark-600 font-medium">{formatDate(result.executed_at)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center">
              <div className="p-1.5 rounded-md bg-primary-100 mr-2">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <p className="text-dark-600"><span className="font-semibold">Models:</span> {result.model_results ? Object.keys(result.model_results).length : 0}</p>
            </div>
            
            <div className="flex items-center">
              <div className="p-1.5 rounded-md bg-secondary-100 mr-2">
                <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-dark-600"><span className="font-semibold">Test Cases:</span> {result.test_case_results ? [...new Set(result.test_case_results.map(tcr => tcr.test_case_id))].length : 0}</p>
            </div>
            
            <div className="flex items-center">
              <div className="p-1.5 rounded-md bg-gray-100 mr-2">
                <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-dark-600"><span className="font-semibold">Total Tests:</span> {result.test_case_results ? result.test_case_results.length : 0}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="card overflow-hidden mb-8">
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex">
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'summary'
                  ? 'border-primary-500 text-primary-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Summary
              </span>
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'comparison'
                  ? 'border-primary-500 text-primary-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('comparison')}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Comparison
              </span>
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-primary-500 text-primary-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('details')}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Details
              </span>
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'summary' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
              
              {result.status !== 'completed' ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        {result.status === 'running'
                          ? 'Benchmark is still running. Results will be available when completed.'
                          : 'Benchmark failed to complete. Some results may be missing or incomplete.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <div className="p-1.5 rounded-md bg-blue-100 mr-2">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-dark-600 uppercase tracking-wider">Average Latency</h4>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareLatencyChartData()[0] ? Object.keys(prepareLatencyChartData()[0])
                            .filter(key => key !== 'name')
                            .map(modelId => ({
                              name: modelId.split('/').pop(),
                              latency: result.summary?.models?.[modelId]?.avgLatency || 0,
                            })) : []}
                          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fill: '#4a5568'}} />
                          <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#4a5568' }} tick={{fill: '#4a5568'}} />
                          <Tooltip
                            formatter={(value) => `${value.toFixed(0)} ms`}
                            contentStyle={{backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', border: '1px solid #e2e8f0'}}
                          />
                          <Bar dataKey="latency" fill="#3498db" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <div className="p-1.5 rounded-md bg-green-100 mr-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-dark-600 uppercase tracking-wider">Token Usage</h4>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareTokenChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fill: '#4a5568'}} />
                          <YAxis label={{ value: 'tokens', angle: -90, position: 'insideLeft', fill: '#4a5568' }} tick={{fill: '#4a5568'}} />
                          <Tooltip
                            formatter={(value) => `${value.toFixed(0)} tokens`}
                            contentStyle={{backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', border: '1px solid #e2e8f0'}}
                          />
                          <Bar dataKey="tokens" fill="#1abc9c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <div className="p-1.5 rounded-md bg-yellow-100 mr-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-dark-600 uppercase tracking-wider">Cost</h4>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareCostChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fill: '#4a5568'}} />
                          <YAxis label={{ value: 'USD', angle: -90, position: 'insideLeft', fill: '#4a5568' }} tick={{fill: '#4a5568'}} />
                          <Tooltip
                            formatter={(value) => `$${value.toFixed(4)}`}
                            contentStyle={{backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', border: '1px solid #e2e8f0'}}
                          />
                          <Bar dataKey="cost" fill="#f1c40f" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'comparison' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Model Comparison</h3>
              
              {result.status !== 'completed' ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        {result.status === 'running'
                          ? 'Benchmark is still running. Results will be available when completed.'
                          : 'Benchmark failed to complete. Some results may be missing or incomplete.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="p-1.5 rounded-md bg-blue-100 mr-2">
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-md font-medium text-dark-600">Latency by Test Case</h4>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-8">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareLatencyChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fill: '#4a5568'}} />
                          <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#4a5568' }} tick={{fill: '#4a5568'}} />
                          <Tooltip
                            formatter={(value) => `${value.toFixed(0)} ms`}
                            contentStyle={{backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', border: '1px solid #e2e8f0'}}
                          />
                          <Legend iconType="circle" />
                          {result.test_case_results && [...new Set(result.test_case_results.map(tcr => tcr.model_id))].map((modelId, index) => {
                            // Create a color palette with different hues
                            const colors = ['#3498db', '#1abc9c', '#f1c40f', '#e74c3c', '#9b59b6', '#34495e'];
                            return (
                              <Bar
                                key={modelId}
                                dataKey={modelId}
                                name={modelId.split('/').pop()}
                                fill={colors[index % colors.length]}
                                radius={[4, 4, 0, 0]}
                              />
                            );
                          })}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <div className="p-1.5 rounded-md bg-primary-100 mr-2">
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    </div>
                    <h4 className="text-md font-medium text-dark-600">Model Performance Summary</h4>
                  </div>
                  <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Model
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg. Latency
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Tokens
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Success Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.summary && result.summary.models && Object.entries(result.summary.models).map(([modelId, metrics], index) => (
                          <tr key={modelId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                                  {modelId.split('/').pop().charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-dark-600">{modelId.split('/').pop()}</div>
                                  <div className="text-xs text-gray-500">{modelId.split('/')[0]}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {metrics.avgLatency ? `${metrics.avgLatency.toFixed(0)} ms` : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {metrics.totalTokens || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {metrics.totalCost ? `$${metrics.totalCost.toFixed(4)}` : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                metrics.successRate && metrics.successRate >= 0.9
                                  ? 'bg-green-100 text-green-800'
                                  : metrics.successRate && metrics.successRate >= 0.7
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {metrics.successRate ? `${(metrics.successRate * 100).toFixed(0)}%` : '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'details' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Test Case Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-dark-600 mb-2">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      Model
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
                      value={selectedModel || ''}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      <option value="">Select a model</option>
                      {result.test_case_results && [...new Set(result.test_case_results.map(tcr => tcr.model_id))].map(modelId => (
                        <option key={modelId} value={modelId}>
                          {modelId}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-600 mb-2">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Test Case
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
                      value={selectedTestCase || ''}
                      onChange={(e) => setSelectedTestCase(e.target.value)}
                    >
                      <option value="">Select a test case</option>
                      {result.test_case_results && [...new Set(result.test_case_results.map(tcr => tcr.test_case_id))].map(testCaseId => {
                        const testCase = getTestCaseDetails(testCaseId);
                        return (
                          <option key={testCaseId} value={testCaseId}>
                            {testCase?.name || testCaseId}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedModel && selectedTestCase ? (
                <div className="mt-4">
                  {(() => {
                    const testCaseResult = getSelectedTestCaseResult();
                    const testCase = getTestCaseDetails(selectedTestCase);
                    
                    if (!testCaseResult) {
                      return (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-yellow-700">
                                No result found for this model and test case combination.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-blue-50 to-white px-4 py-3 border-b border-gray-200">
                          <h4 className="text-md font-medium text-dark-600 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Result Details
                          </h4>
                        </div>
                        <div className="p-5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-center justify-center">
                              <span className="block text-sm font-medium text-gray-500 mb-1">Latency</span>
                              <span className="block text-2xl font-bold text-primary-600">{testCaseResult.latency.toFixed(0)} ms</span>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center justify-center">
                              <span className="block text-sm font-medium text-gray-500 mb-1">Tokens</span>
                              <span className="block text-2xl font-bold text-green-600">{testCaseResult.token_count}</span>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4 flex flex-col items-center justify-center">
                              <span className="block text-sm font-medium text-gray-500 mb-1">Cost</span>
                              <span className="block text-2xl font-bold text-yellow-600">${testCaseResult.cost.toFixed(4)}</span>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <h5 className="text-sm font-medium text-dark-600 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              Prompt
                            </h5>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-inner text-dark-600 h-48 overflow-auto">
                              <pre className="whitespace-pre-wrap text-sm">{testCase?.prompt || 'Prompt not available'}</pre>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-dark-600 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Response
                            </h5>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-inner text-dark-600 h-48 overflow-auto">
                              <pre className="whitespace-pre-wrap text-sm">{testCaseResult.output || 'No response'}</pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded border border-gray-200 text-center">
                  <p className="text-gray-500">Select a model and test case to view details</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultDetails;
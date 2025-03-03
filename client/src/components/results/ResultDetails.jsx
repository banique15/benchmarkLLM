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
    if (!result || !result.config_id || !testCaseId) {
      return null;
    }
    
    // Find test case in the benchmark config
    const testCase = result.test_cases?.find(tc => tc.id === testCaseId);
    
    return testCase || { id: testCaseId, name: testCaseId, prompt: 'Prompt not available' };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Benchmark Result</h1>
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2">Loading result...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Benchmark Result</h1>
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
          <Link to="/results" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
            Back to Results
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Benchmark Result</h1>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Benchmark result not found</p>
            </div>
          </div>
        </div>
        <div className="flex">
          <Link to="/results" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
            Back to Results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Benchmark Result</h1>
        <div className="flex space-x-2">
          <a
            href={`/api/results/${result.id}/export?format=json`}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Export JSON
          </a>
          <a
            href={`/api/results/${result.id}/export?format=csv`}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Export CSV
          </a>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Benchmark Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-700"><span className="font-medium">Name:</span> {result.config_name || 'Unnamed Benchmark'}</p>
            <p className="text-gray-700"><span className="font-medium">Executed:</span> {formatDate(result.executed_at)}</p>
            <p className="text-gray-700">
              <span className="font-medium">Status:</span>{' '}
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(result.status)}`}>
                {result.status}
              </span>
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <span className="font-medium">Models:</span>{' '}
              {result.model_results ? Object.keys(result.model_results).length : 0}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Test Cases:</span>{' '}
              {result.test_case_results ? [...new Set(result.test_case_results.map(tcr => tcr.test_case_id))].length : 0}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Total Tests:</span>{' '}
              {result.test_case_results ? result.test_case_results.length : 0}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'comparison'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('comparison')}
            >
              Comparison
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Details
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
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Average Latency</h4>
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
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => `${value.toFixed(0)} ms`} />
                          <Bar dataKey="latency" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Token Usage</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareTokenChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis label={{ value: 'tokens', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => `${value.toFixed(0)} tokens`} />
                          <Bar dataKey="tokens" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Cost</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareCostChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis label={{ value: 'USD', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => `$${value.toFixed(4)}`} />
                          <Bar dataKey="cost" fill="#ffc658" />
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
                  <h4 className="text-md font-medium text-gray-700 mb-3">Latency by Test Case</h4>
                  <div className="h-80 mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareLatencyChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                        <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => `${value.toFixed(0)} ms`} />
                        <Legend />
                        {result.test_case_results && [...new Set(result.test_case_results.map(tcr => tcr.model_id))].map((modelId, index) => (
                          <Bar
                            key={modelId}
                            dataKey={modelId}
                            name={modelId.split('/').pop()}
                            fill={`hsl(${index * 30}, 70%, 50%)`}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <h4 className="text-md font-medium text-gray-700 mb-3">Model Performance Summary</h4>
                  <div className="overflow-x-auto">
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
                        {result.summary && result.summary.models && Object.entries(result.summary.models).map(([modelId, metrics]) => (
                          <tr key={modelId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {modelId.split('/').pop()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {metrics.avgLatency ? `${metrics.avgLatency.toFixed(0)} ms` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {metrics.totalTokens || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {metrics.totalCost ? `$${metrics.totalCost.toFixed(4)}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {metrics.successRate ? `${(metrics.successRate * 100).toFixed(0)}%` : '-'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Case
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h4 className="text-md font-medium text-gray-700">Result Details</h4>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <span className="block text-sm font-medium text-gray-500">Latency</span>
                              <span className="block text-lg font-semibold">{testCaseResult.latency.toFixed(0)} ms</span>
                            </div>
                            <div>
                              <span className="block text-sm font-medium text-gray-500">Tokens</span>
                              <span className="block text-lg font-semibold">{testCaseResult.token_count}</span>
                            </div>
                            <div>
                              <span className="block text-sm font-medium text-gray-500">Cost</span>
                              <span className="block text-lg font-semibold">${testCaseResult.cost.toFixed(4)}</span>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Prompt</h5>
                            <div className="bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap">
                              {testCase?.prompt || 'Prompt not available'}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Response</h5>
                            <div className="bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap">
                              {testCaseResult.output || 'No response'}
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
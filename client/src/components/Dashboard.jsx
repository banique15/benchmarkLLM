import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBenchmarkResults } from '../services/api';

const Dashboard = () => {
  const [recentBenchmarks, setRecentBenchmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalBenchmarks: 0,
    totalModels: 0,
    totalTestCases: 0
  });

  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        const data = await getBenchmarkResults();
        
        // Debug: Log the structure of the first result to understand the data
        if (data.length > 0) {
          console.log('First benchmark result structure:', JSON.stringify(data[0], null, 2));
        }
        
        // Sort by date (newest first) and take the most recent 5
        const sortedData = [...data].sort((a, b) =>
          new Date(b.executed_at) - new Date(a.executed_at)
        ).slice(0, 5);
        
        setRecentBenchmarks(sortedData);
        
        // Calculate stats
        const uniqueModels = new Set();
        let testCaseCount = 0;
        
        data.forEach(result => {
          if (result.model_results) {
            Object.keys(result.model_results).forEach(model => uniqueModels.add(model));
          }
          
          // Debug: Log test case related data
          console.log(`Result ID ${result.id} test case data:`, {
            hasTestCaseResults: !!result.test_case_results,
            testCaseResultsType: result.test_case_results ? typeof result.test_case_results : 'N/A',
            isArray: result.test_case_results ? Array.isArray(result.test_case_results) : 'N/A',
            length: result.test_case_results ? (Array.isArray(result.test_case_results) ? result.test_case_results.length : 'Not an array') : 'N/A'
          });
          
          // Extract test case information from model_results
          if (result.model_results && Object.keys(result.model_results).length > 0) {
            // Get the first model result to extract test case IDs
            const firstModelId = Object.keys(result.model_results)[0];
            const firstModelResult = result.model_results[firstModelId];
            
            if (firstModelResult && firstModelResult.testResults) {
              // Count unique test case IDs across all results
              const testCaseIds = Object.keys(firstModelResult.testResults);
              console.log(`Found ${testCaseIds.length} test cases in model_results for result ${result.id}`);
              testCaseCount += testCaseIds.length;
            }
          }
          // Check for summary data that might contain test case count
          else if (result.summary && result.summary.models) {
            // Get the first model's test count from summary
            const firstModelId = Object.keys(result.summary.models)[0];
            if (firstModelId && result.summary.models[firstModelId].testCount) {
              const count = result.summary.models[firstModelId].testCount;
              console.log(`Found ${count} test cases in summary for result ${result.id}`);
              testCaseCount += count;
            }
          }
          // If we have status_details with totalTests, use that
          else if (result.status_details && result.status_details.totalTests) {
            const count = result.status_details.totalTests;
            console.log(`Found ${count} test cases in status_details for result ${result.id}`);
            testCaseCount += count;
          }
        });
        
        setStats({
          totalBenchmarks: data.length,
          totalModels: uniqueModels.size,
          totalTestCases: testCaseCount
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching benchmark results:', err);
        setError('Failed to fetch benchmark results');
        setIsLoading(false);
      }
    };
    
    fetchBenchmarks();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'running':
        return 'badge-info';
      case 'failed':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dark-600">Dashboard</h1>
        <Link to="/benchmarks/create" className="btn btn-primary">
          <span className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Benchmark
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-md bg-blue-100 mr-3">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-dark-600">Total Benchmarks</h2>
          </div>
          <p className="text-4xl font-bold text-primary-600">
            {isLoading ? (
              <span className="inline-block w-12 h-8 bg-blue-100 animate-pulse rounded"></span>
            ) : (
              stats.totalBenchmarks
            )}
          </p>
        </div>
        
        <div className="card bg-gradient-to-br from-teal-50 to-white">
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-md bg-teal-100 mr-3">
              <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-dark-600">Models Compared</h2>
          </div>
          <p className="text-4xl font-bold text-secondary-600">
            {isLoading ? (
              <span className="inline-block w-12 h-8 bg-teal-100 animate-pulse rounded"></span>
            ) : (
              stats.totalModels
            )}
          </p>
        </div>
        
        <div className="card bg-gradient-to-br from-gray-50 to-white">
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-md bg-gray-100 mr-3">
              <svg className="w-6 h-6 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-dark-600">Test Cases</h2>
          </div>
          <p className="text-4xl font-bold text-dark-500">
            {isLoading ? (
              <span className="inline-block w-12 h-8 bg-gray-100 animate-pulse rounded"></span>
            ) : (
              stats.totalTestCases
            )}
          </p>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-dark-600">Recent Benchmarks</h2>
          <Link to="/results" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            View All →
          </Link>
        </div>
        {isLoading ? (
          <div className="card p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
        ) : error ? (
          <div className="card bg-red-50 p-6">
            <div className="flex items-center mb-4">
              <svg className="h-6 w-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <p className="text-red-600">Unable to load recent benchmarks. Please try again later.</p>
          </div>
        ) : recentBenchmarks.length === 0 ? (
          <div className="card p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-dark-600">No benchmarks yet</h3>
            <p className="mt-1 text-gray-500">Get started by creating your first benchmark.</p>
            <div className="mt-6">
              <Link to="/benchmarks/create" className="btn btn-primary">
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Benchmark
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBenchmarks.map((benchmark, index) => (
                  <tr key={benchmark.id} className={index % 2 === 0 ? 'hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-dark-600">
                            {benchmark.benchmark_configs?.name || 'Unnamed Benchmark'}
                          </div>
                          <div className="text-xs text-gray-500">ID: {benchmark.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-dark-600">
                      {formatDate(benchmark.executed_at)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(benchmark.status)}`}>
                        {benchmark.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/results/${benchmark.id}`}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          View
                        </Link>
                        {benchmark.status === 'completed' && (
                          <Link
                            to={`/benchmarks/run/${benchmark.config_id}`}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            </svg>
                            Run Again
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-dark-600 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/benchmarks/create"
            className="card hover:bg-gray-50 flex items-center group"
          >
            <div className="mr-5 p-3 rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-dark-600 mb-1">Create New Benchmark</h3>
              <p className="text-gray-600">Configure and run a new benchmark</p>
            </div>
          </Link>
          <Link
            to="/results"
            className="card hover:bg-gray-50 flex items-center group"
          >
            <div className="mr-5 p-3 rounded-full bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200 transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-dark-600 mb-1">View All Results</h3>
              <p className="text-gray-600">Analyze and compare benchmark results</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
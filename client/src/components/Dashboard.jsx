import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  // This would be replaced with actual data from Supabase
  const recentBenchmarks = [
    { id: '1', name: 'GPT-4 vs Claude 3', date: '2025-03-01', status: 'completed' },
    { id: '2', name: 'Code Generation Test', date: '2025-02-28', status: 'completed' },
    { id: '3', name: 'Reasoning Benchmark', date: '2025-02-25', status: 'completed' },
  ];

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
          <p className="text-4xl font-bold text-primary-600">12</p>
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
          <p className="text-4xl font-bold text-secondary-600">8</p>
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
          <p className="text-4xl font-bold text-dark-500">156</p>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-dark-600">Recent Benchmarks</h2>
          <Link to="/results" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            View All →
          </Link>
        </div>
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-header px-6 py-3">Name</th>
                <th className="table-header px-6 py-3">Date</th>
                <th className="table-header px-6 py-3">Status</th>
                <th className="table-header px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBenchmarks.map((benchmark) => (
                <tr key={benchmark.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <div className="text-sm font-medium text-dark-600">{benchmark.name}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-500">{benchmark.date}</div>
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-success">
                      {benchmark.status}
                    </span>
                  </td>
                  <td className="table-cell text-right text-sm font-medium">
                    <Link to={`/results/${benchmark.id}`} className="text-primary-600 hover:text-primary-700 mr-4">
                      View Results
                    </Link>
                    <Link to={`/benchmarks/run/${benchmark.id}`} className="text-primary-600 hover:text-primary-700">
                      Run Again
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
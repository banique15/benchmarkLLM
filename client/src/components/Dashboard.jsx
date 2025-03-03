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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/benchmarks/create" className="btn btn-primary">
          Create New Benchmark
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Total Benchmarks</h2>
          <p className="text-3xl font-bold text-indigo-600">12</p>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Models Compared</h2>
          <p className="text-3xl font-bold text-indigo-600">8</p>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Test Cases</h2>
          <p className="text-3xl font-bold text-indigo-600">156</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Benchmarks</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBenchmarks.map((benchmark) => (
                <tr key={benchmark.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{benchmark.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{benchmark.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {benchmark.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/results/${benchmark.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      View Results
                    </Link>
                    <Link to={`/benchmarks/run/${benchmark.id}`} className="text-indigo-600 hover:text-indigo-900">
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
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/benchmarks/create"
            className="card hover:bg-gray-50 transition-colors flex items-center"
          >
            <div className="mr-4 text-indigo-600">
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
              <h3 className="font-medium text-gray-900">Create New Benchmark</h3>
              <p className="text-sm text-gray-500">Configure and run a new benchmark</p>
            </div>
          </Link>
          <Link
            to="/results"
            className="card hover:bg-gray-50 transition-colors flex items-center"
          >
            <div className="mr-4 text-indigo-600">
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
              <h3 className="font-medium text-gray-900">View All Results</h3>
              <p className="text-sm text-gray-500">Analyze and compare benchmark results</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
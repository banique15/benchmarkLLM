import React from 'react';
import { useNavigate } from 'react-router-dom';

const BenchmarkTypeSelector = () => {
  const navigate = useNavigate();

  const handleSelectBasic = () => {
    navigate('/benchmarks/basic/create');
  };

  const handleSelectAdvanced = () => {
    navigate('/benchmarks/advanced/create');
  };

  return (
    <div className="p-6 animate-fadeIn">
      <h1 className="text-3xl font-bold text-dark-600 mb-8">Select Benchmark Type</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Benchmark Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow cursor-pointer" onClick={handleSelectBasic}>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-md bg-blue-100 mr-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-dark-600">Basic Benchmark</h2>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Quick model testing</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Standard metrics</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Manual test case selection</span>
              </li>
            </ul>
            
            <button className="btn btn-primary w-full">Select Basic Benchmark</button>
          </div>
        </div>
        
        {/* Advanced Benchmark Card */}
        <div className="card bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow cursor-pointer" onClick={handleSelectAdvanced}>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-md bg-purple-100 mr-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-dark-600">Advanced Benchmark</h2>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>AI-generated test cases</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Automatic model selection</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Domain-specific evaluation</span>
              </li>
            </ul>
            
            <button className="btn btn-primary w-full">Select Advanced Benchmark</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkTypeSelector;
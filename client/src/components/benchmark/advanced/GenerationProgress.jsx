import React from 'react';

const GenerationProgress = ({ status, progress }) => {
  if (!status || status === 'idle') return null;
  
  const getStatusText = () => {
    switch (status) {
      case 'generating-tests':
        return 'Generating test cases...';
      case 'selecting-models':
        return 'Selecting models...';
      case 'creating-benchmark':
        return 'Creating benchmark...';
      case 'completed':
        return 'Benchmark created successfully!';
      case 'error':
        return 'Error creating benchmark';
      default:
        return 'Processing...';
    }
  };
  
  const getDetailText = () => {
    switch (status) {
      case 'generating-tests':
        return 'Using AI to create challenging test cases for your topic...';
      case 'selecting-models':
        return 'Analyzing models to find the best ones for your benchmark...';
      case 'creating-benchmark':
        return 'Finalizing benchmark configuration...';
      case 'completed':
        return 'Redirecting to benchmark runner...';
      case 'error':
        return 'Please check the error message above.';
      default:
        return 'Processing your request...';
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-primary-600';
    }
  };
  
  return (
    <div className="card bg-white p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-md bg-blue-100 mr-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-dark-600">Generation Progress</h2>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-dark-600">
            {getStatusText()}
          </span>
          <span className="text-sm font-medium text-dark-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getStatusColor()}`} 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
        {status !== 'completed' && status !== 'error' && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        
        {status === 'completed' && (
          <svg className="h-5 w-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        
        {status === 'error' && (
          <svg className="h-5 w-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        
        <span className={`text-${status === 'completed' ? 'green' : status === 'error' ? 'red' : 'primary'}-600`}>
          {getDetailText()}
        </span>
      </div>
    </div>
  );
};

export default GenerationProgress;
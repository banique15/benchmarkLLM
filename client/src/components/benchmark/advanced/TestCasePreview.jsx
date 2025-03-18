import React, { useState } from 'react';

const TestCasePreview = ({ testCases }) => {
  const [expandedCase, setExpandedCase] = useState(null);
  
  if (!testCases || testCases.length === 0) return null;
  
  return (
    <div className="card bg-white p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 rounded-md bg-green-100 mr-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Generated Test Cases</h2>
        </div>
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {testCases.length} test cases
        </span>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              These test cases were automatically generated based on your topic. They cover various aspects of the domain to thoroughly evaluate model performance.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {testCases.map((testCase, index) => (
          <div 
            key={testCase.id || index}
            className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div 
              className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
              onClick={() => setExpandedCase(expandedCase === index ? null : index)}
            >
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  testCase.category === 'text-completion' ? 'bg-blue-500' :
                  testCase.category === 'summarization' ? 'bg-green-500' :
                  testCase.category === 'question-answering' ? 'bg-yellow-500' :
                  testCase.category === 'code-generation' ? 'bg-purple-500' :
                  testCase.category === 'creative-writing' ? 'bg-pink-500' :
                  testCase.category === 'reasoning' ? 'bg-indigo-500' :
                  testCase.category === 'classification' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}></div>
                <span className="font-medium text-dark-600">{testCase.name}</span>
                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                  {testCase.category}
                </span>
              </div>
              
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedCase === index ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {expandedCase === index && (
              <div className="p-3">
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-500">Prompt:</span>
                  <p className="text-sm text-dark-600 bg-gray-50 p-2 rounded-md mt-1">{testCase.prompt}</p>
                </div>
                
                {testCase.expectedOutput && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Expected Output:</span>
                    <p className="text-sm text-dark-600 bg-gray-50 p-2 rounded-md mt-1">{testCase.expectedOutput}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {testCases.length > 5 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            onClick={() => setExpandedCase(null)}
          >
            Collapse All
          </button>
        </div>
      )}
    </div>
  );
};

export default TestCasePreview;
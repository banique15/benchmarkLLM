import React, { useState, useEffect } from 'react';

const ModelSelectionPreview = ({ models }) => {
  const [viewAll, setViewAll] = useState(false);
  const [debugInfo, setDebugInfo] = useState(false);
  
  // Add debug info to help diagnose issues
  useEffect(() => {
    console.log('ModelSelectionPreview received models:', models);
  }, [models]);
  
  if (!models || models.length === 0) {
    console.warn('No models provided to ModelSelectionPreview');
    return (
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
          <p className="text-sm text-yellow-700">No models were generated or selected for this benchmark.</p>
        </div>
      </div>
    );
  }
  
  const displayModels = viewAll ? models : models.slice(0, 5);
  
  // Group models by provider
  const modelsByProvider = displayModels.reduce((acc, model) => {
    // Handle different model ID formats
    const provider = model.provider ||
                    (model.modelId && model.modelId.includes('/') ? model.modelId.split('/')[0] :
                    (model.id && model.id.includes('/') ? model.id.split('/')[0] : 'unknown'));
    
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(model);
    return acc;
  }, {});
  
  return (
    <div className="card bg-white p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 rounded-md bg-indigo-100 mr-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Selected Models</h2>
        </div>
        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {models.length} models
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
              These models were automatically selected based on your topic. They represent the best models for your specific benchmark requirements.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {Object.entries(modelsByProvider).map(([provider, providerModels]) => (
          <div key={provider} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b border-gray-200">
              <h3 className="font-medium text-dark-600">{provider}</h3>
            </div>
            <div className="p-3">
              <div className="space-y-2">
                {providerModels.map((model, index) => (
                  <div
                    key={model.modelId || model.id || index}
                    className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="p-1.5 rounded-md bg-indigo-100 mr-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <span className="font-medium text-dark-600">
                        {/* Handle different model ID formats */}
                        {model.modelId ?
                          (model.modelId.includes('/') ? model.modelId.split('/')[1] : model.modelId) :
                          (model.id ?
                            (model.id.includes('/') ? model.id.split('/')[1] : model.id) :
                            'Unknown Model')}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {model.parameters?.temperature ? `Temp: ${model.parameters.temperature}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between mt-4">
        {models.length > 5 && (
          <button
            type="button"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            onClick={() => setViewAll(!viewAll)}
          >
            {viewAll ? 'Show Less' : `Show All (${models.length})`}
          </button>
        )}
        
        <button
          type="button"
          className="text-xs text-gray-500 hover:text-gray-700"
          onClick={() => {
            setDebugInfo(!debugInfo);
            console.log('Model data:', models);
          }}
        >
          {debugInfo ? 'Hide Debug Info' : 'Debug Info'}
        </button>
      </div>
      
      {debugInfo && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-auto max-h-60">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(models, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ModelSelectionPreview;
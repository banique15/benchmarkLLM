import React from 'react';

const BenchmarkOptions = ({ options, setOptions }) => {
  const handleChange = (field, value) => {
    setOptions({
      ...options,
      [field]: value
    });
  };
  
  // Common model providers
  const providers = [
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'google', name: 'Google' },
    { id: 'meta-llama', name: 'Meta (Llama)' },
    { id: 'mistralai', name: 'Mistral AI' },
    { id: 'cohere', name: 'Cohere' },
    { id: 'moonshotai', name: 'Moonshot AI' },
    { id: 'cognitivecomputations', name: 'Cognitive Computations' }
  ];
  
  const toggleProvider = (providerId) => {
    const currentProviders = options.selectedProviders || [];
    const newProviders = currentProviders.includes(providerId)
      ? currentProviders.filter(id => id !== providerId)
      : [...currentProviders, providerId];
    
    handleChange('selectedProviders', newProviders);
  };

  return (
    <div className="card bg-white p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-md bg-blue-100 mr-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-dark-600">Benchmark Options</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="prioritizeCost"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            checked={options.prioritizeCost}
            onChange={(e) => handleChange('prioritizeCost', e.target.checked)}
          />
          <label htmlFor="prioritizeCost" className="ml-2 block text-sm text-dark-600">
            Prioritize cost-effectiveness (select models that provide the best value for money)
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="domainSpecific"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            checked={options.domainSpecific}
            onChange={(e) => handleChange('domainSpecific', e.target.checked)}
          />
          <label htmlFor="domainSpecific" className="ml-2 block text-sm text-dark-600">
            Domain-specific evaluation (evaluate models based on domain expertise)
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="includeReasoning"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            checked={options.includeReasoning}
            onChange={(e) => handleChange('includeReasoning', e.target.checked)}
          />
          <label htmlFor="includeReasoning" className="ml-2 block text-sm text-dark-600">
            Include reasoning assessment (evaluate models' reasoning capabilities)
          </label>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-dark-600 mb-2">
            Filter by Model Providers <span className="text-red-500">*</span>
          </label>
          <div className={`bg-gray-50 p-3 rounded-md border ${options.selectedProviders && options.selectedProviders.length > 0 ? 'border-gray-200' : 'border-red-300'}`}>
            <p className="text-xs text-gray-500 mb-2">
              {options.selectedProviders && options.selectedProviders.length > 0
                ? 'Only models from selected providers will be included in the benchmark.'
                : 'Please select at least one provider. This selection is required.'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {providers.map(provider => (
                <div key={provider.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`provider-${provider.id}`}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={(options.selectedProviders || []).includes(provider.id)}
                    onChange={() => toggleProvider(provider.id)}
                  />
                  <label htmlFor={`provider-${provider.id}`} className="ml-2 block text-sm text-dark-600">
                    {provider.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="maxModels" className="block text-sm font-medium text-dark-600">
              Maximum models to test
            </label>
            <select
              id="maxModels"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={options.maxModels}
              onChange={(e) => handleChange('maxModels', parseInt(e.target.value))}
            >
              {[2, 3, 5, 8, 10, 15].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Higher numbers may use more API credits</p>
          </div>
          
          <div>
            <label htmlFor="testCaseCount" className="block text-sm font-medium text-dark-600">
              Number of test cases
            </label>
            <select
              id="testCaseCount"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={options.testCaseCount}
              onChange={(e) => handleChange('testCaseCount', parseInt(e.target.value))}
            >
              {[2, 3, 5, 8, 10, 12].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">More test cases provide better evaluation</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 mt-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Running this benchmark will use your OpenRouter API credits. The advanced benchmark uses AI to generate test cases and may consume more credits than a basic benchmark.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Token Capacity Tip:</strong> If you encounter a "token capacity" error, try reducing the number of test cases and models. Smaller values require less token capacity and are more likely to succeed with limited credits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkOptions;
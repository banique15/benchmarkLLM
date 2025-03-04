import React, { useState, useEffect } from 'react';

// Import the API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Settings = () => {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // State to track if the API key is masked
  const [isMasked, setIsMasked] = useState(true);
  
  // Load API key from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openrouter_api_key');
    if (storedApiKey) {
      // Only show first and last few characters for security
      const maskedKey = `${storedApiKey.substring(0, 4)}...${storedApiKey.substring(
        storedApiKey.length - 4
      )}`;
      setApiKey(isMasked ? maskedKey : storedApiKey);
    }
  }, [isMasked]);

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Validate that the API key is not masked
      if (apiKey.includes('...') && isMasked) {
        setError('Please unmask the API key before saving or enter a new API key.');
        setIsSaving(false);
        return;
      }

      // Test the API key by making a request to the OpenRouter API
      try {
        const response = await fetch(`${API_URL}/api/openrouter/test-api-key`, {
          headers: {
            'X-API-Key': apiKey
          }
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.valid) {
          throw new Error(result.message || 'Invalid API key');
        }
        
        console.log('API key test result:', result);
        
        // API key is valid, save it to localStorage
        localStorage.setItem('openrouter_api_key', apiKey);
        
        setIsSaving(false);
        setSaveSuccess(true);
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } catch (apiError) {
        console.error('API key test error:', apiError);
        setIsSaving(false);
        setError('Invalid API key. Please check your OpenRouter API key and try again.');
      }
    } catch (err) {
      console.error('Save API key error:', err);
      setIsSaving(false);
      setError('Failed to save API key. Please try again.');
    }
  };
  
  // Test the API key directly
  const handleTestApiKey = async () => {
    if (apiKey.includes('...') && isMasked) {
      setError('Please unmask the API key before testing.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      const response = await fetch(`${API_URL}/api/openrouter/test-api-key`, {
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      const result = await response.json();
      console.log('API key test result:', result);
      
      if (response.ok && result.valid) {
        setError(null);
        setSaveSuccess(true);
        alert('API key is valid! ' + (result.message || ''));
      } else {
        setError('Invalid API key: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Test API key error:', err);
      setError('Failed to test API key: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('openrouter_api_key');
    setApiKey('');
    setSaveSuccess(false);
    setIsMasked(true);
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-dark-600 mb-8">Settings</h1>

      <div className="card max-w-3xl bg-white mb-8">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-blue-100 mr-3">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">API Configuration</h2>
        </div>
        
        <form onSubmit={handleSaveApiKey}>
          <div className="mb-5">
            <label htmlFor="apiKey" className="label">
              OpenRouter API Key
            </label>
            <div className="flex">
              <input
                id="apiKey"
                type={isMasked ? "text" : "text"}
                className="input flex-grow"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  // If user is typing, we're no longer showing the masked version
                  if (isMasked) setIsMasked(false);
                }}
                placeholder="Enter your OpenRouter API key"
                required
              />
              <button
                type="button"
                className="ml-2 px-4 py-2 bg-gray-100 text-dark-500 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => setIsMasked(!isMasked)}
              >
                {isMasked ? "Show" : "Hide"}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Your API key is stored locally in your browser and is never sent to our servers.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-md border-l-4 border-red-500">
              <div className="flex">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="mb-5 p-4 bg-green-50 text-green-700 rounded-md border-l-4 border-green-500">
              <div className="flex">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                API key saved successfully!
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save API Key
                </span>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestApiKey}
              disabled={isSaving || !apiKey}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Test API Key
              </span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearApiKey}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear API Key
              </span>
            </button>
          </div>
        </form>
      </div>

      <div className="card max-w-3xl bg-gradient-to-br from-gray-50 to-white">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-gray-100 mr-3">
            <svg className="w-6 h-6 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">About</h2>
        </div>
        <p className="text-gray-700 mb-3 leading-relaxed">
          LLM Benchmark is a tool for comparing and analyzing the performance of various Large Language Models
          using the OpenRouter API. Compare different models across a variety of tasks to find the best fit for your needs.
        </p>
        <div className="bg-dark-50 rounded-md p-3 inline-block mb-5">
          <p className="text-dark-600 font-medium">
            Version: <span className="text-primary-600">0.1.0</span>
          </p>
        </div>
        <div className="border-t border-gray-200 pt-5">
          <h3 className="font-medium text-dark-600 mb-3">Resources</h3>
          <ul className="space-y-2">
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <a
                href="https://openrouter.ai/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                OpenRouter Documentation
              </a>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <a
                href="https://github.com/yourusername/llm-benchmark"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                GitHub Repository
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
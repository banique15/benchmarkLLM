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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="card max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
        
        <form onSubmit={handleSaveApiKey}>
          <div className="mb-4">
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
                className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => setIsMasked(!isMasked)}
              >
                {isMasked ? "Show" : "Hide"}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Your API key is stored locally in your browser and is never sent to our servers.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              API key saved successfully!
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save API Key'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestApiKey}
              disabled={isSaving || !apiKey}
            >
              Test API Key
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearApiKey}
            >
              Clear API Key
            </button>
          </div>
        </form>
      </div>

      <div className="card max-w-2xl mt-6">
        <h2 className="text-xl font-semibold mb-4">About</h2>
        <p className="text-gray-700 mb-2">
          LLM Benchmark is a tool for comparing and analyzing the performance of various Large Language Models
          using the OpenRouter API.
        </p>
        <p className="text-gray-700 mb-4">
          Version: 0.1.0
        </p>
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-medium text-gray-900 mb-2">Resources</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>
              <a
                href="https://openrouter.ai/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800"
              >
                OpenRouter Documentation
              </a>
            </li>
            <li>
              <a
                href="https://github.com/yourusername/llm-benchmark"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800"
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
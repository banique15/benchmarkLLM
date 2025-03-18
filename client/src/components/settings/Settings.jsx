import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

// Import the API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Settings = () => {
  const [apiKey, setApiKey] = useState('');
  const [creditLimit, setCreditLimit] = useState('1000');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // State to track if the API key is masked
  const [isMasked, setIsMasked] = useState(true);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState({
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    onConfirm: null,
    cancelText: null,
    onCancel: null
  });
  
  // Helper function to show a modal
  const showModal = (props) => {
    setModalProps({
      title: props.title || 'Message',
      message: props.message || '',
      type: props.type || 'info',
      confirmText: props.confirmText || 'OK',
      onConfirm: props.onConfirm || (() => setModalOpen(false)),
      cancelText: props.cancelText,
      onCancel: props.onCancel
    });
    setModalOpen(true);
  };
  
  // Load API key and credit limit from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openrouter_api_key');
    if (storedApiKey) {
      // Only show first and last few characters for security
      const maskedKey = `${storedApiKey.substring(0, 4)}...${storedApiKey.substring(
        storedApiKey.length - 4
      )}`;
      setApiKey(isMasked ? maskedKey : storedApiKey);
    }
    
    const storedCreditLimit = localStorage.getItem('openrouter_credit_limit');
    if (storedCreditLimit) {
      setCreditLimit(storedCreditLimit);
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
        const errorMessage = 'Please unmask the API key before saving or enter a new API key.';
        setError(errorMessage);
        setIsSaving(false);
        
        // Show error in a modal
        showModal({
          title: 'Masked API Key',
          message: errorMessage,
          type: 'warning',
          confirmText: 'OK'
        });
        
        return;
      }
      
      // Validate that the credit limit is provided and is a valid number
      if (!creditLimit || isNaN(parseInt(creditLimit, 10)) || parseInt(creditLimit, 10) <= 0) {
        const errorMessage = 'Please enter a valid credit limit (a positive number).';
        setError(errorMessage);
        setIsSaving(false);
        
        // Show error in a modal
        showModal({
          title: 'Invalid Credit Limit',
          message: errorMessage,
          type: 'warning',
          confirmText: 'OK'
        });
        
        return;
      }

      // Test the API key by making a request to the OpenRouter API
      try {
        const response = await fetch(`${API_URL}/api/openrouter/test-api-key`, {
          headers: {
            'X-API-Key': apiKey,
            'X-Credit-Limit': creditLimit
          }
        });
        
        const result = await response.json();
        console.log('API key test result:', result);
        
        if (!response.ok) {
          throw new Error(result.message || 'Invalid API key');
        }
        
        if (!result.valid) {
          throw new Error(result.message || 'Invalid API key');
        }
        
        // Check if the API key has sufficient credits
        if (result.valid && !result.hasCredits) {
          // We'll show a warning but still allow saving the key
          setError(`Warning: ${result.message || 'Insufficient credits to run benchmarks. You may need to add more credits before running benchmarks.'}`);
          
          // Ask the user if they want to save the key anyway using our modal
          setIsSaving(false);
          showModal({
            title: 'Insufficient Credits',
            message: `Your API key is valid but has insufficient credits.\n\n${result.message || 'You may need to add more credits before running benchmarks.'}\n\nDo you still want to save this API key?`,
            type: 'warning',
            confirmText: 'Save Anyway',
            onConfirm: () => {
              // Save the API key and credit limit if confirmed
              localStorage.setItem('openrouter_api_key', apiKey);
              localStorage.setItem('openrouter_credit_limit', creditLimit);
              setModalOpen(false);
              setSaveSuccess(true);
              
              // Reset success message after 3 seconds
              setTimeout(() => {
                setSaveSuccess(false);
              }, 3000);
            },
            cancelText: 'Cancel',
            onCancel: () => {
              setModalOpen(false);
            }
          });
          
          return; // Exit early, the save will happen in the modal's onConfirm if user confirms
        }
        
        // API key is valid and has sufficient credits, save it to localStorage
        localStorage.setItem('openrouter_api_key', apiKey);
        localStorage.setItem('openrouter_credit_limit', creditLimit);
        
        setIsSaving(false);
        setSaveSuccess(true);
        
        // Show success modal
        showModal({
          title: 'API Key Saved',
          message: 'Your API key has been saved successfully.',
          type: 'success',
          confirmText: 'OK'
        });
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } catch (apiError) {
        console.error('API key test error:', apiError);
        setIsSaving(false);
        const errorMessage = apiError.message || 'Invalid API key. Please check your OpenRouter API key and try again.';
        setError(errorMessage);
        
        // Show error in a modal
        showModal({
          title: 'API Key Error',
          message: errorMessage,
          type: 'error',
          confirmText: 'OK'
        });
      }
    } catch (err) {
      console.error('Save API key error:', err);
      setIsSaving(false);
      const errorMessage = 'Failed to save API key. Please try again.';
      setError(errorMessage);
      
      // Show error in a modal
      showModal({
        title: 'Save Error',
        message: errorMessage,
        type: 'error',
        confirmText: 'OK'
      });
    }
  };
  
  // Test the API key directly
  const handleTestApiKey = async () => {
    if (apiKey.includes('...') && isMasked) {
      const errorMessage = 'Please unmask the API key before testing.';
      setError(errorMessage);
      
      // Show error in a modal
      showModal({
        title: 'Masked API Key',
        message: errorMessage,
        type: 'warning',
        confirmText: 'OK'
      });
      
      return;
    }
    
    // Validate that the credit limit is provided and is a valid number
    if (!creditLimit || isNaN(parseInt(creditLimit, 10)) || parseInt(creditLimit, 10) <= 0) {
      const errorMessage = 'Please enter a valid credit limit (a positive number).';
      setError(errorMessage);
      
      // Show error in a modal
      showModal({
        title: 'Invalid Credit Limit',
        message: errorMessage,
        type: 'warning',
        confirmText: 'OK'
      });
      
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      const response = await fetch(`${API_URL}/api/openrouter/test-api-key`, {
        headers: {
          'X-API-Key': apiKey,
          'X-Credit-Limit': creditLimit
        }
      });
      
      const result = await response.json();
      console.log('API key test result:', result);
      
      if (response.ok && result.valid) {
        setError(null);
        setSaveSuccess(true);
        
        if (result.hasCredits === false) {
          // API key is valid but doesn't have enough credits
          showModal({
            title: 'API Key Valid - Insufficient Credits',
            message: `Your API key is valid but has insufficient credits.\n\n${result.message || ''}`,
            type: 'warning',
            confirmText: 'OK'
          });
          
          // Show a warning in the UI
          setError(`Warning: Valid API key but insufficient credits. You may need to add more credits before running benchmarks.`);
          setSaveSuccess(false);
        } else {
          // API key is valid and has sufficient credits
          showModal({
            title: 'API Key Valid',
            message: `Your API key is valid and has sufficient credits!\n\n${result.message || ''}`,
            type: 'success',
            confirmText: 'OK'
          });
        }
      } else {
        const errorMessage = 'Invalid API key: ' + (result.message || 'Unknown error');
        setError(errorMessage);
        
        // Show error in a modal
        showModal({
          title: 'API Key Error',
          message: errorMessage,
          type: 'error',
          confirmText: 'OK'
        });
      }
    } catch (err) {
      console.error('Test API key error:', err);
      const errorMessage = 'Failed to test API key: ' + err.message;
      setError(errorMessage);
      
      // Show error in a modal
      showModal({
        title: 'API Key Test Failed',
        message: errorMessage,
        type: 'error',
        confirmText: 'OK'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to check token capacity removed

  const handleClearApiKey = () => {
    // Show confirmation modal
    showModal({
      title: 'Clear API Key',
      message: 'Are you sure you want to clear your API key? This action cannot be undone.',
      type: 'warning',
      confirmText: 'Clear Key',
      onConfirm: () => {
        localStorage.removeItem('openrouter_api_key');
        localStorage.removeItem('openrouter_credit_limit');
        setApiKey('');
        setCreditLimit('1000'); // Reset to default
        setSaveSuccess(false);
        setIsMasked(true);
        setModalOpen(false);
      },
      cancelText: 'Cancel',
      onCancel: () => {
        setModalOpen(false);
      }
    });
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-dark-600 mb-8">Settings</h1>
      
      {/* Modal for alerts and confirmations */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalProps.title}
        type={modalProps.type}
        confirmText={modalProps.confirmText}
        onConfirm={modalProps.onConfirm}
        cancelText={modalProps.cancelText}
        onCancel={modalProps.onCancel}
      >
        {modalProps.message}
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* API Configuration Card */}
        <div className="card bg-white overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-50 to-primary-50 p-4 border-b border-blue-100">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-blue-100 mr-3 shadow-sm">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-dark-600">API Configuration</h2>
                <p className="text-sm text-gray-600">Configure your OpenRouter API connection</p>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <form onSubmit={handleSaveApiKey}>
              {/* Single column layout */}
              <div className="grid grid-cols-1 gap-6">
                {/* Left column - API Key Input */}
                <div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                      <label htmlFor="apiKey" className="block font-medium text-dark-600 mb-2">
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
                          className="ml-2 px-4 py-2 bg-white text-dark-500 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                          onClick={() => setIsMasked(!isMasked)}
                        >
                          {isMasked ? "Show" : "Hide"}
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Your API key is stored locally in your browser and is never sent to our servers.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                      <label htmlFor="creditLimit" className="block font-medium text-dark-600 mb-2">
                        Manual Credit Limit <span className="text-red-500">*</span>
                      </label>
                      <div className="flex">
                        <input
                          id="creditLimit"
                          type="number"
                          min="1"
                          step="1"
                          className="input flex-grow"
                          value={creditLimit}
                          onChange={(e) => setCreditLimit(e.target.value)}
                          placeholder="Enter your credit limit"
                          required
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Required: Set a manual credit limit for calculating available credits. This value will be used instead of the default 1000.
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Messages */}
                  <div className="mt-4">
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border-l-4 border-red-500 text-sm">
                        <div className="flex">
                          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{error}</span>
                        </div>
                      </div>
                    )}

                    {saveSuccess && (
                      <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border-l-4 border-green-500 text-sm">
                        <div className="flex">
                          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>API key saved successfully!</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap gap-3">
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
                </div>
                
                {/* Animation Container */}
                <div className="flex items-center justify-center mt-4">
                  <div className="relative w-full h-[280px]">
                    {/* API/Security Animation */}
                    <div className="absolute inset-0">
                      {/* Background grid */}
                      <div className="absolute inset-0 overflow-hidden">
                        {[...Array(15)].map((_, i) => (
                          <div
                            key={`h-${i}`}
                            className="absolute bg-blue-100 opacity-20"
                            style={{
                              height: '1px',
                              width: '100%',
                              top: `${i * 18}px`,
                              left: 0,
                              animation: `pulse 3s infinite alternate-reverse ${i * 0.2}s`
                            }}
                          />
                        ))}
                        {[...Array(20)].map((_, i) => (
                          <div
                            key={`v-${i}`}
                            className="absolute bg-blue-100 opacity-20"
                            style={{
                              width: '1px',
                              height: '100%',
                              left: `${i * 5}%`,
                              top: 0,
                              animation: `pulse 4s infinite alternate ${i * 0.3}s`
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Lock Icon */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-primary-500 flex items-center justify-center shadow-lg animate-[pulse_3s_infinite_alternate]">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          
                          {/* Orbiting particles */}
                          {[...Array(8)].map((_, i) => {
                            const angle = (i * 45) * (Math.PI / 180);
                            const radius = 70;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;
                            
                            return (
                              <div
                                key={`p-${i}`}
                                className="absolute w-3 h-3 rounded-full bg-blue-300 shadow-sm"
                                style={{
                                  left: `calc(50% + ${x}px)`,
                                  top: `calc(50% + ${y}px)`,
                                  animation: `orbit ${6 + i}s linear infinite`,
                                  opacity: 0.7,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Data streams */}
                      {[...Array(12)].map((_, i) => {
                        const startX = Math.random() * 100;
                        const startY = Math.random() * 100;
                        
                        return (
                          <div
                            key={`s-${i}`}
                            className="absolute bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                            style={{
                              height: '1px',
                              width: `${50 + Math.random() * 150}px`,
                              left: `${startX}%`,
                              top: `${startY}%`,
                              transform: `rotate(${Math.random() * 360}deg)`,
                              opacity: 0.4,
                              animation: `dataStream ${2 + Math.random() * 4}s infinite ${Math.random() * 2}s`
                            }}
                          />
                        );
                      })}
                      
                      {/* Key fragments */}
                      {[...Array(15)].map((_, i) => (
                        <div
                          key={`k-${i}`}
                          className="absolute text-sm font-mono text-primary-500 opacity-40"
                          style={{
                            left: `${Math.random() * 90}%`,
                            top: `${Math.random() * 90}%`,
                            animation: `float ${3 + Math.random() * 3}s infinite alternate ${Math.random() * 2}s`
                          }}
                        >
                          {Math.random() > 0.5 ? '*' : Math.random().toString(36).substring(2, 4)}
                        </div>
                      ))}
                    </div>
                    
                    {/* Overlay text */}
                    <div className="absolute bottom-3 right-3 text-sm text-primary-500 font-medium opacity-70">
                      Secure API Connection
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* About Card */}
        <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Tech Image */}
            <div className="md:w-1/3 flex items-center justify-center p-6 bg-gradient-to-br from-indigo-500 to-purple-600">
              <div className="relative w-full max-w-[240px] aspect-square">
                {/* Brain Network Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-4/5 h-4/5">
                    {/* Brain outline */}
                    <svg className="w-full h-full text-white opacity-90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.5 2C9.5 2 9 6 7.5 7.5C6 9 2 9.5 2 9.5C2 9.5 6 10 7.5 11.5C9 13 9.5 17 9.5 17C9.5 17 10 13 11.5 11.5C13 10 17 9.5 17 9.5C17 9.5 13 9 11.5 7.5C10 6 9.5 2 9.5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 15C16 15 15.5 17 14.5 18C13.5 19 11.5 19.5 11.5 19.5C11.5 19.5 13.5 20 14.5 21C15.5 22 16 24 16 24C16 24 16.5 22 17.5 21C18.5 20 20.5 19.5 20.5 19.5C20.5 19.5 18.5 19 17.5 18C16.5 17 16 15 16 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    
                    {/* Connection lines */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full relative">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute bg-white opacity-30 rounded-full"
                            style={{
                              width: '2px',
                              height: `${30 + Math.random() * 40}%`,
                              left: `${10 + Math.random() * 80}%`,
                              top: `${10 + Math.random() * 80}%`,
                              transform: `rotate(${Math.random() * 360}deg)`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Nodes */}
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{
                          width: `${4 + Math.random() * 8}px`,
                          height: `${4 + Math.random() * 8}px`,
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          opacity: 0.5 + Math.random() * 0.5,
                          animation: `pulse ${1 + Math.random() * 2}s infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Circular data visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-4 border-white border-opacity-20 animate-[spin_20s_linear_infinite]" />
                  <div className="absolute w-4/5 h-4/5 rounded-full border-4 border-white border-opacity-10 animate-[spin_15s_linear_infinite_reverse]" />
                  <div className="absolute w-3/5 h-3/5 rounded-full border-4 border-white border-opacity-5 animate-[spin_10s_linear_infinite]" />
                </div>
              </div>
            </div>
            
            {/* About Content */}
            <div className="md:w-2/3 p-6">
              <div className="flex items-center mb-6">
                <div className="p-2 rounded-md bg-indigo-100 mr-3">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-indigo-800">Understanding LLM Benchmarking</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  LLM Benchmark is a tool for comparing and analyzing the performance of various Large Language Models
                  using the OpenRouter API. By running standardized tests, you can make data-driven decisions about which models best suit your specific needs.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white bg-opacity-60 p-3 rounded-lg shadow-sm">
                    <h3 className="font-medium text-indigo-700 mb-1 text-sm">Why Benchmark?</h3>
                    <ul className="text-sm space-y-1 list-disc pl-4 text-gray-700">
                      <li>Compare model capabilities objectively</li>
                      <li>Identify strengths and weaknesses</li>
                      <li>Optimize cost vs. performance</li>
                      <li>Track improvements over time</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white bg-opacity-60 p-3 rounded-lg shadow-sm">
                    <h3 className="font-medium text-indigo-700 mb-1 text-sm">Key Metrics</h3>
                    <ul className="text-sm space-y-1 list-disc pl-4 text-gray-700">
                      <li>Response quality and accuracy</li>
                      <li>Processing speed (latency)</li>
                      <li>Token efficiency</li>
                      <li>Cost-effectiveness</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-dark-50 rounded-md p-3 inline-block">
                  <p className="text-dark-600 font-medium">
                    Version: <span className="text-indigo-600">0.1.0</span>
                  </p>
                </div>
              </div>
              
              <div className="border-t border-indigo-100 mt-5 pt-5">
                <h3 className="font-medium text-indigo-700 mb-3">Resources</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <a
                      href="https://openrouter.ai/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      OpenRouter Documentation
                    </a>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <a
                      href="https://github.com/yourusername/llm-benchmark"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      GitHub Repository
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
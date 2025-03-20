import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOllamaBenchmarkResults } from '../../services/ollama';

/**
 * Component for displaying Ollama benchmark results
 */
const OllamaBenchmarkResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

  // Fetch benchmark results
  useEffect(() => {
    const fetchResults = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await getOllamaBenchmarkResults(id);
        setResults(data);
        
        // Set the first model as selected by default
        if (data.modelRankings && data.modelRankings.length > 0) {
          setSelectedModel(data.modelRankings[0].model_id);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch benchmark results:', err);
        setError('Failed to fetch benchmark results');
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [id]);

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="card flex flex-col items-center justify-center py-16">
        <svg className="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-medium text-dark-600">Loading benchmark results...</p>
        <p className="text-gray-500 mt-2">This may take a few moments</p>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="card bg-gradient-to-br from-red-50 to-white">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-red-100 mr-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Error</h2>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/ollama')}
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Dashboard
            </span>
          </button>
        </div>
      </div>
    );
  }

  // If no results, show error message
  if (!results) {
    return (
      <div className="card bg-gradient-to-br from-red-50 to-white">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-red-100 mr-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Results Not Found</h2>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">The benchmark results you're looking for could not be found.</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/ollama')}
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Dashboard
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Extract data from results
  const { benchmarkResult, testCaseResults, modelRankings } = results;
  const benchmarkConfig = benchmarkResult.benchmark_config;
  
  // Get unique difficulties
  const difficulties = [...new Set(testCaseResults.map(result => result.difficulty))];
  
  // Get test case results for selected model and difficulty
  const getFilteredTestCaseResults = () => {
    let filtered = testCaseResults;
    
    if (selectedModel) {
      filtered = filtered.filter(result => result.model_id === selectedModel);
    }
    
    if (selectedDifficulty) {
      filtered = filtered.filter(result => result.difficulty === selectedDifficulty);
    }
    
    return filtered;
  };
  
  // Calculate average accuracy by difficulty for a model
  const getModelAccuracyByDifficulty = (modelId) => {
    const modelResults = testCaseResults.filter(result => result.model_id === modelId);
    
    return difficulties.map(difficulty => {
      const difficultyResults = modelResults.filter(result => result.difficulty === difficulty);
      const avgAccuracy = difficultyResults.reduce((sum, result) => sum + result.accuracy_score, 0) / difficultyResults.length;
      
      return {
        difficulty,
        avgAccuracy
      };
    });
  };
  
  // Calculate average latency by difficulty for a model
  const getModelLatencyByDifficulty = (modelId) => {
    const modelResults = testCaseResults.filter(result => result.model_id === modelId);
    
    return difficulties.map(difficulty => {
      const difficultyResults = modelResults.filter(result => result.difficulty === difficulty);
      const avgLatency = difficultyResults.reduce((sum, result) => sum + result.latency, 0) / difficultyResults.length;
      
      return {
        difficulty,
        avgLatency
      };
    });
  };
  
  // Get model ranking by model ID
  const getModelRanking = (modelId) => {
    return modelRankings.find(ranking => ranking.model_id === modelId);
  };
  
  // Format model name for display
  const formatModelName = (modelId) => {
    return modelId.split('/').pop().replace(/-/g, ' ');
  };
  
  // Format difficulty for display
  const formatDifficulty = (difficulty) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };
  
  // Format latency for display
  const formatLatency = (latency) => {
    if (latency < 1000) {
      return `${latency.toFixed(0)}ms`;
    } else {
      return `${(latency / 1000).toFixed(1)}s`;
    }
  };
  
  // Format accuracy for display
  const formatAccuracy = (accuracy) => {
    return `${(accuracy * 100).toFixed(0)}%`;
  };
  
  // Get color class based on accuracy
  const getAccuracyColorClass = (accuracy) => {
    if (accuracy >= 0.8) return 'text-green-600';
    if (accuracy >= 0.6) return 'text-green-500';
    if (accuracy >= 0.4) return 'text-yellow-500';
    if (accuracy >= 0.2) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <div className="p-2 rounded-md bg-primary-100 mr-3">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-dark-600">Benchmark Results</h2>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-dark-600 mb-2">{benchmarkConfig.name}</h3>
        {benchmarkConfig.description && (
          <p className="text-gray-600 mb-4">{benchmarkConfig.description}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="p-1.5 rounded-md bg-blue-100 mr-2">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-dark-600">Models</h4>
            </div>
            <p className="text-2xl font-bold text-dark-600">{modelRankings.length}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="p-1.5 rounded-md bg-green-100 mr-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-dark-600">Test Cases</h4>
            </div>
            <p className="text-2xl font-bold text-dark-600">{benchmarkConfig.test_cases.length}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="p-1.5 rounded-md bg-purple-100 mr-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-dark-600">Completed</h4>
            </div>
            <p className="text-2xl font-bold text-dark-600">{new Date(benchmarkResult.completed_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`${
                activeTab === 'categories'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </button>
            <button
              className={`${
                activeTab === 'models'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('models')}
            >
              Models
            </button>
            <button
              className={`${
                activeTab === 'testCases'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('testCases')}
            >
              Test Cases
            </button>
          </nav>
        </div>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <h3 className="text-lg font-medium text-dark-600 mb-4">Model Rankings</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latency
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {modelRankings.sort((a, b) => a.overall_rank - b.overall_rank).map((ranking) => (
                  <tr key={ranking.model_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedModel(ranking.model_id)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ranking.overall_rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatModelName(ranking.model_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${ranking.overall_score * 100}%` }}></div>
                        </div>
                        <span>{formatAccuracy(ranking.overall_score)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={getAccuracyColorClass(ranking.accuracy_score)}>
                        {formatAccuracy(ranking.accuracy_score)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLatency(testCaseResults
                        .filter(result => result.model_id === ranking.model_id)
                        .reduce((sum, result) => sum + result.latency, 0) /
                        testCaseResults.filter(result => result.model_id === ranking.model_id).length
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <h3 className="text-lg font-medium text-dark-600 mt-8 mb-4">Performance by Difficulty</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {difficulties.map(difficulty => (
              <div key={difficulty} className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-dark-600 mb-2 capitalize">{difficulty}</h4>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Model
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Accuracy
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {modelRankings
                        .map(ranking => {
                          const modelAccuracy = getModelAccuracyByDifficulty(ranking.model_id)
                            .find(acc => acc.difficulty === difficulty)?.avgAccuracy || 0;
                          
                          return {
                            model_id: ranking.model_id,
                            accuracy: modelAccuracy
                          };
                        })
                        .sort((a, b) => b.accuracy - a.accuracy)
                        .map((model, index) => (
                          <tr key={model.model_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                            setSelectedModel(model.model_id);
                            setSelectedDifficulty(difficulty);
                            setActiveTab('testCases');
                          }}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatModelName(model.model_id)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              <span className={getAccuracyColorClass(model.accuracy)}>
                                {formatAccuracy(model.accuracy)}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Code Accuracy Category */}
            <div className="card bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-md bg-blue-100 mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-dark-600">Code Accuracy</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">How well the code fulfills the requirements</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Model
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modelRankings
                      .sort((a, b) => a.accuracy_rank - b.accuracy_rank)
                      .map((ranking) => (
                        <tr key={ranking.model_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedModel(ranking.model_id)}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {ranking.accuracy_rank || 'N/A'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {formatModelName(ranking.model_id)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            <span className={getAccuracyColorClass(ranking.accuracy_category_score || 0)}>
                              {formatAccuracy(ranking.accuracy_category_score || 0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Code Correctness Category */}
            <div className="card bg-gradient-to-br from-green-50 to-white">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-md bg-green-100 mr-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-dark-600">Code Correctness</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Is the code free of bugs and errors</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Model
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modelRankings
                      .sort((a, b) => a.correctness_rank - b.correctness_rank)
                      .map((ranking) => (
                        <tr key={ranking.model_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedModel(ranking.model_id)}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {ranking.correctness_rank || 'N/A'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {formatModelName(ranking.model_id)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            <span className={getAccuracyColorClass(ranking.correctness_category_score || 0)}>
                              {formatAccuracy(ranking.correctness_category_score || 0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Code Efficiency Category */}
            <div className="card bg-gradient-to-br from-purple-50 to-white">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-md bg-purple-100 mr-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-dark-600">Code Efficiency</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">How optimized is the code</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Model
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modelRankings
                      .sort((a, b) => a.efficiency_rank - b.efficiency_rank)
                      .map((ranking) => (
                        <tr key={ranking.model_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedModel(ranking.model_id)}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {ranking.efficiency_rank || 'N/A'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {formatModelName(ranking.model_id)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            <span className={getAccuracyColorClass(ranking.efficiency_category_score || 0)}>
                              {formatAccuracy(ranking.efficiency_category_score || 0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="card bg-gray-50 p-6">
            <h3 className="text-lg font-medium text-dark-600 mb-4">Category Comparison</h3>
            <p className="text-sm text-gray-600 mb-6">Compare how models perform across different coding categories</p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overall Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accuracy Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correctness Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency Rank
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {modelRankings
                    .sort((a, b) => a.overall_rank - b.overall_rank)
                    .map((ranking) => (
                      <tr key={ranking.model_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedModel(ranking.model_id)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatModelName(ranking.model_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{ranking.overall_rank}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{ranking.accuracy_rank || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{ranking.correctness_rank || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{ranking.efficiency_rank || 'N/A'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Models Tab */}
      {activeTab === 'models' && (
        <div>
          <div className="mb-6">
            <label htmlFor="modelSelect" className="block text-sm font-medium text-dark-600 mb-1">
              Select Model
            </label>
            <select
              id="modelSelect"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={selectedModel || ''}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {modelRankings.sort((a, b) => a.overall_rank - b.overall_rank).map((ranking) => (
                <option key={ranking.model_id} value={ranking.model_id}>
                  {formatModelName(ranking.model_id)} (Rank: {ranking.overall_rank})
                </option>
              ))}
            </select>
          </div>
          
          {selectedModel && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-dark-600 mb-4">
                  {formatModelName(selectedModel)}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-medium text-dark-600 mb-2">Overall Rank</h4>
                    <p className="text-2xl font-bold text-dark-600">
                      #{getModelRanking(selectedModel)?.overall_rank || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-medium text-dark-600 mb-2">Accuracy Score</h4>
                    <p className={`text-2xl font-bold ${getAccuracyColorClass(getModelRanking(selectedModel)?.accuracy_score || 0)}`}>
                      {formatAccuracy(getModelRanking(selectedModel)?.accuracy_score || 0)}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-medium text-dark-600 mb-2">Avg. Latency</h4>
                    <p className="text-2xl font-bold text-dark-600">
                      {formatLatency(testCaseResults
                        .filter(result => result.model_id === selectedModel)
                        .reduce((sum, result) => sum + result.latency, 0) /
                        testCaseResults.filter(result => result.model_id === selectedModel).length
                      )}
                    </p>
                  </div>
                </div>
                
                <h4 className="text-md font-medium text-dark-600 mb-3">Category Scores</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-medium text-dark-600">Code Accuracy</h5>
                      <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Rank #{getModelRanking(selectedModel)?.accuracy_rank || 'N/A'}
                      </span>
                    </div>
                    <p className={`text-xl font-bold ${getAccuracyColorClass(getModelRanking(selectedModel)?.accuracy_category_score || 0)}`}>
                      {formatAccuracy(getModelRanking(selectedModel)?.accuracy_category_score || 0)}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-medium text-dark-600">Code Correctness</h5>
                      <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Rank #{getModelRanking(selectedModel)?.correctness_rank || 'N/A'}
                      </span>
                    </div>
                    <p className={`text-xl font-bold ${getAccuracyColorClass(getModelRanking(selectedModel)?.correctness_category_score || 0)}`}>
                      {formatAccuracy(getModelRanking(selectedModel)?.correctness_category_score || 0)}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-medium text-dark-600">Code Efficiency</h5>
                      <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        Rank #{getModelRanking(selectedModel)?.efficiency_rank || 'N/A'}
                      </span>
                    </div>
                    <p className={`text-xl font-bold ${getAccuracyColorClass(getModelRanking(selectedModel)?.efficiency_category_score || 0)}`}>
                      {formatAccuracy(getModelRanking(selectedModel)?.efficiency_category_score || 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-dark-600 mb-4">Performance by Difficulty</h3>
              
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accuracy
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Latency
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getModelAccuracyByDifficulty(selectedModel).map((difficultyData) => {
                      const latencyData = getModelLatencyByDifficulty(selectedModel)
                        .find(data => data.difficulty === difficultyData.difficulty);
                      
                      // Calculate rank for this model in this difficulty
                      const difficultyRank = modelRankings
                        .map(ranking => {
                          const modelAccuracy = getModelAccuracyByDifficulty(ranking.model_id)
                            .find(acc => acc.difficulty === difficultyData.difficulty)?.avgAccuracy || 0;
                          
                          return {
                            model_id: ranking.model_id,
                            accuracy: modelAccuracy
                          };
                        })
                        .sort((a, b) => b.accuracy - a.accuracy)
                        .findIndex(model => model.model_id === selectedModel) + 1;
                      
                      return (
                        <tr key={difficultyData.difficulty} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                          setSelectedDifficulty(difficultyData.difficulty);
                          setActiveTab('testCases');
                        }}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                            {difficultyData.difficulty}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={getAccuracyColorClass(difficultyData.avgAccuracy)}>
                              {formatAccuracy(difficultyData.avgAccuracy)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatLatency(latencyData?.avgLatency || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            #{difficultyRank}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Test Cases Tab */}
      {activeTab === 'testCases' && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="w-full md:w-1/2">
              <label htmlFor="modelFilterSelect" className="block text-sm font-medium text-dark-600 mb-1">
                Filter by Model
              </label>
              <select
                id="modelFilterSelect"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedModel || ''}
                onChange={(e) => setSelectedModel(e.target.value || null)}
              >
                <option value="">All Models</option>
                {modelRankings.sort((a, b) => a.overall_rank - b.overall_rank).map((ranking) => (
                  <option key={ranking.model_id} value={ranking.model_id}>
                    {formatModelName(ranking.model_id)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-1/2">
              <label htmlFor="difficultyFilterSelect" className="block text-sm font-medium text-dark-600 mb-1">
                Filter by Difficulty
              </label>
              <select
                id="difficultyFilterSelect"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedDifficulty || ''}
                onChange={(e) => setSelectedDifficulty(e.target.value || null)}
              >
                <option value="">All Difficulties</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {formatDifficulty(difficulty)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-6">
            {getFilteredTestCaseResults().map((result) => (
              <div key={result.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h4 className="text-md font-medium text-dark-600">{result.currentTest || 'Test Case'}</h4>
                    <p className="text-sm text-gray-500 capitalize">
                      {result.difficulty} - {result.category.replace(/-/g, ' ')}
                    </p>
                  </div>
                  
                  <div className="flex items-center mt-2 md:mt-0">
                    <span className={`text-sm font-medium ${getAccuracyColorClass(result.accuracy_score)}`}>
                      Accuracy: {formatAccuracy(result.accuracy_score)}
                    </span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-sm text-gray-500">
                      Latency: {formatLatency(result.latency)}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-dark-600 mb-1">Prompt:</h5>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result.prompt}</pre>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-dark-600 mb-1">Response:</h5>
                  <div className="bg-white p-3 rounded-md border border-gray-200">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result.output}</pre>
                  </div>
                </div>
              </div>
            ))}
            
            {getFilteredTestCaseResults().length === 0 && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No test case results match the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OllamaBenchmarkResults;
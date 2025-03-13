import React, { useState } from 'react';
import { getAdvancedAnalysis } from '../../services/advanced-benchmark';

const AdvancedResultsView = ({ benchmarkResult, benchmarkConfig }) => {
  const [analysisType, setAnalysisType] = useState('general');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Check if this is an advanced benchmark
  const isAdvancedBenchmark = benchmarkConfig?.benchmark_type === 'advanced';
  
  if (!isAdvancedBenchmark) {
    return null;
  }
  
  const loadAnalysis = async (type) => {
    if (!benchmarkResult?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setAnalysisType(type);
      
      const result = await getAdvancedAnalysis(benchmarkResult.id, type);
      setAnalysis(result);
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to load analysis: ${err.message}`);
      setIsLoading(false);
    }
  };
  
  // Load general analysis if not already loaded
  if (!analysis && !isLoading && !error && benchmarkResult?.status === 'completed') {
    loadAnalysis('general');
  }
  
  // No debug functions in production
  
  if (!analysis) {
    return (
      <div className="card bg-white p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-md bg-indigo-100 mr-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Advanced Analysis</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-3 text-primary-600 font-medium">Loading analysis...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
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
        ) : (
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-500">Analysis will be available when the benchmark is completed.</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="card bg-white p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 rounded-md bg-indigo-100 mr-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-600">Advanced Analysis: {benchmarkConfig.topic || 'Unknown Topic'}</h2>
        </div>
        
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded-md ${analysisType === 'general' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => loadAnalysis('general')}
          >
            General
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${analysisType === 'cost' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => loadAnalysis('cost')}
          >
            Cost
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${analysisType === 'domain' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => loadAnalysis('domain')}
          >
            Domain
          </button>
          {/* Debug button removed */}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-primary-600 font-medium">Loading analysis...</span>
        </div>
      ) : (
        <>
          {/* Model Rankings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-dark-600 mb-4">
              {analysisType === 'general' ? 'Overall Rankings' : 
               analysisType === 'cost' ? 'Cost-Efficiency Rankings' : 
               'Domain Expertise Rankings'}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    {analysisType === 'domain' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain Expertise</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysis.rankings.map((model) => (
                    <tr key={model.model_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-600">
                        {analysisType === 'general' ? model.overall_rank : 
                         analysisType === 'cost' ? model.cost_efficiency_rank : 
                         model.domain_expertise_rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-600">
                        <div className="flex flex-col">
                          <span>{model.model_id}</span>
                          {model.accuracy_score !== undefined && (
                            <span className="text-xs text-gray-500 mt-1">
                              Accuracy: {(model.accuracy_score * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg 
                              key={i}
                              className={`w-4 h-4 ${i < Math.round(model.score * 5) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">{(model.score * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${i < model.cost_level ? 'text-green-600' : 'text-gray-300'}`}
                              >
                                $
                              </span>
                            ))}
                          </div>
                          {analysisType === 'cost' && benchmarkResult?.test_case_results && (
                            <div className="text-xs text-gray-500 mt-1">
                              Total: ${(benchmarkResult.test_case_results
                                .filter(tcr => tcr.model_id === model.model_id)
                                .reduce((sum, tcr) => sum + (tcr.cost || 0), 0)).toFixed(4)}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Rank: #{model.cost_efficiency_rank}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < model.speed_level ? 'text-blue-500' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                            ))}
                          </div>
                          {benchmarkResult?.test_case_results && (
                            <div className="text-xs text-gray-500 mt-1">
                              Avg: {Math.round(benchmarkResult.test_case_results
                                .filter(tcr => tcr.model_id === model.model_id)
                                .reduce((sum, tcr) => sum + (tcr.latency || 0), 0) /
                                Math.max(1, benchmarkResult.test_case_results.filter(tcr => tcr.model_id === model.model_id).length))} ms
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-600 font-semibold">
                        {model.score.toFixed(2)}
                      </td>
                      {analysisType === 'domain' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{ width: `${(model.domain_expertise_score || 0) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{((model.domain_expertise_score || 0) * 100).toFixed(0)}%</span>
                            </div>
                            <span className="text-xs text-gray-500 mt-1">Rank: #{model.domain_expertise_rank}</span>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Analysis Summary */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-dark-600 mb-4">Analysis Summary</h3>
            
            {analysisType === 'general' && (
              <div className="space-y-6">
                <p className="text-gray-700">
                  The benchmark evaluated {analysis.rankings.length} models on the topic: <span className="font-semibold">{benchmarkConfig.topic || 'Unknown'}</span>.
                </p>
                
                {/* Scoring Methodology Section removed */}
                
                {/* Benchmark Stats and Winner Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Benchmark Stats */}
                  {analysis.summary?.benchmarkStats && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-dark-600 mb-3">Benchmark Statistics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-500">Models Tested</p>
                          <p className="text-xl font-bold text-blue-600">{analysis.summary.benchmarkStats.modelCount}</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <p className="text-xs text-gray-500">Test Cases</p>
                          <p className="text-xl font-bold text-purple-600">{analysis.summary.benchmarkStats.testCaseCount}</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-gray-500">Avg. Performance</p>
                          <p className="text-xl font-bold text-green-600">{(analysis.summary.benchmarkStats.averageScores?.overall * 100).toFixed(0)}%</p>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded-lg">
                          <p className="text-xs text-gray-500">Avg. Cost Level</p>
                          <p className="text-xl font-bold text-yellow-600">{(analysis.summary.benchmarkStats.averageScores?.costEfficiency * 5).toFixed(1)}/5</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Winner Cards */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-dark-600 mb-3">Category Winners</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center p-2 bg-indigo-50 rounded-lg">
                        <div className="p-2 rounded-md bg-indigo-100 mr-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Best Overall</p>
                          <p className="font-semibold">{analysis.summary?.categoryWinners?.overall?.model_id || analysis.rankings[0]?.model_id || 'Unknown'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center p-2 bg-green-50 rounded-lg">
                        <div className="p-2 rounded-md bg-green-100 mr-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Most Cost-Effective</p>
                          <p className="font-semibold">
                            {analysis.summary?.categoryWinners?.costEfficiency?.model_id ||
                             analysis.rankings.sort((a, b) => a.cost_efficiency_rank - b.cost_efficiency_rank)[0]?.model_id ||
                             'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center p-2 bg-purple-50 rounded-lg">
                        <div className="p-2 rounded-md bg-purple-100 mr-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Best Domain Expertise</p>
                          <p className="font-semibold">
                            {analysis.summary?.categoryWinners?.domainExpertise?.model_id ||
                             analysis.rankings.sort((a, b) => a.domain_expertise_rank - b.domain_expertise_rank)[0]?.model_id ||
                             'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Top Models with Detailed Scores */}
                <div className="mb-4">
                  <h4 className="font-medium text-dark-600 mb-3">Top Models Performance Breakdown</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {analysis.summary?.topModels && analysis.summary.topModels.map((model, index) => (
                      <div key={model.model_id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-md ${index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : 'bg-amber-50'} mr-2`}>
                              <span className={`font-bold text-lg ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-amber-600'}`}>
                                #{model.rank}
                              </span>
                            </div>
                            <span className="font-semibold text-dark-600">{model.model_id}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Score: {(model.score * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        {model.components && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-600 mb-2">Component Scores</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div className="bg-blue-50 p-2 rounded">
                                <div className="flex justify-between items-center">
                                  <p className="text-xs text-gray-500">Accuracy</p>
                                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                </div>
                                <p className="font-medium text-blue-700">{(model.components.accuracy * 100).toFixed(1)}%</p>
                              </div>
                              <div className="bg-purple-50 p-2 rounded">
                                <div className="flex justify-between items-center">
                                  <p className="text-xs text-gray-500">Domain Expertise</p>
                                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                </div>
                                <p className="font-medium text-purple-700">{(model.components.domainExpertise * 100).toFixed(1)}%</p>
                                {/* Specialized capabilities removed from general tab */}
                              </div>
                              <div className="bg-green-50 p-2 rounded">
                                <div className="flex justify-between items-center">
                                  <p className="text-xs text-gray-500">Speed</p>
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <p className="font-medium text-green-700">{model.components.latency.toFixed(0)} ms</p>
                              </div>
                              <div className="bg-yellow-50 p-2 rounded">
                                <div className="flex justify-between items-center">
                                  <p className="text-xs text-gray-500">Cost</p>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                </div>
                                <p className="font-medium text-yellow-700">${model.components.cost.toFixed(4)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {model.weightedComponents && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-600 mb-2">Score Contribution</h5>
                            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div className="flex h-full">
                                <div className="bg-blue-500 h-full" style={{ width: `${model.weightedComponents.accuracy * 100 / model.score}%` }}></div>
                                <div className="bg-purple-500 h-full" style={{ width: `${model.weightedComponents.domainExpertise * 100 / model.score}%` }}></div>
                                <div className="bg-green-500 h-full" style={{ width: `${model.weightedComponents.latency * 100 / model.score}%` }}></div>
                                <div className="bg-yellow-500 h-full" style={{ width: `${model.weightedComponents.cost * 100 / model.score}%` }}></div>
                              </div>
                            </div>
                            <div className="flex text-xs mt-1 text-gray-600 justify-between">
                              <span>Accuracy: {(model.weightedComponents.accuracy * 100 / model.score).toFixed(0)}%</span>
                              <span>Domain: {(model.weightedComponents.domainExpertise * 100 / model.score).toFixed(0)}%</span>
                              <span>Speed: {(model.weightedComponents.latency * 100 / model.score).toFixed(0)}%</span>
                              <span>Cost: {(model.weightedComponents.cost * 100 / model.score).toFixed(0)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Category Analysis Section */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Category analysis content will be shown here */}
                </div>
              </div>
            )}
            
            {analysisType === 'cost' && analysis.costBreakdown && (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Cost analysis shows the efficiency of each model in terms of performance per credit spent.
                </p>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-dark-600 mb-2">Cost Breakdown</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Per Test</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analysis.costBreakdown.map((model) => (
                          <tr key={model.model_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-600">{model.model_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-600">${model.totalCost.toFixed(4)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-600">${model.costPerTestCase.toFixed(4)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className="bg-green-600 h-2.5 rounded-full" 
                                    style={{ width: `${(1 - (model.costPerTestCase / Math.max(...analysis.costBreakdown.map(m => m.costPerTestCase)))) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {analysisType === 'domain' && analysis.domainInsights && (
              <div className="space-y-6">
                <p className="text-gray-700">
                  Domain expertise analysis shows how well each model performs in the specific topic area: <span className="font-semibold">{benchmarkConfig.topic || 'Unknown'}</span>.
                </p>
                
                {/* Domain Analysis Summary */}
                {analysis.domainAnalysisSummary && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                    <h4 className="font-medium text-dark-600 mb-3">Domain Analysis Summary</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">Top Performer</h5>
                        {analysis.domainAnalysisSummary.topPerformer && (
                          <div className="bg-purple-50 p-3 rounded">
                            <p className="font-medium text-purple-800">{analysis.domainAnalysisSummary.topPerformer.model_id}</p>
                            <p className="text-sm text-purple-600">Score: {(analysis.domainAnalysisSummary.topPerformer.score * 100).toFixed(0)}%</p>
                            <p className="text-sm text-purple-600">Best in: {analysis.domainAnalysisSummary.topPerformer.topCategory}</p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">Overall Statistics</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Models Analyzed</p>
                            <p className="font-medium text-blue-700">{analysis.domainAnalysisSummary.modelCount}</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Avg. Domain Score</p>
                            <p className="font-medium text-green-700">{(analysis.domainAnalysisSummary.averageScore * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Domain expertise categories will be shown here */}
                    
                    {/* Recommendations */}
                    {analysis.domainAnalysisSummary.recommendations && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-600 mb-2">Recommendations</h5>
                        <div className="bg-yellow-50 p-3 rounded space-y-2">
                          {analysis.domainAnalysisSummary.recommendations.map((rec, index) => (
                            <p key={index} className="text-sm text-gray-700">
                              <span className="font-medium">{rec.type === 'category' ? `${rec.category}: ` : `${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}: `}</span>
                              {rec.recommendation}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Category Analysis removed */}
                  </div>
                )}
                
                {/* Individual Model Analysis */}
                <h4 className="font-medium text-dark-600 mb-3">Model-by-Model Analysis</h4>
                <div className="grid grid-cols-1 gap-4">
                  {analysis.domainInsights.map((model) => (
                    <div key={model.model_id} className="bg-white p-4 rounded-lg border border-gray-200">
                      {/* Compact Model Card Header */}
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className="font-medium text-dark-600 mr-2">{model.model_id}</span>
                          <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                            #{model.domainExpertiseRank}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-purple-700">{(model.domainExpertiseScore * 100).toFixed(0)}%</span>
                      </div>
                      
                      {/* Compact Metrics Row */}
                      <div className="flex space-x-2 mb-2 text-xs">
                        <span className="bg-blue-50 px-1.5 py-0.5 rounded">Consistency: {(model.metrics?.consistencyScore * 100).toFixed(0)}%</span>
                        <span className="bg-purple-50 px-1.5 py-0.5 rounded">Domain Score: {(model.domainExpertiseScore * 100).toFixed(0)}%</span>
                      </div>
                      
                      {/* Score Distribution (more compact) */}
                      {model.metrics?.scoreDistribution && (
                        <div className="mb-2">
                          <div className="flex h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${model.metrics.scoreDistribution.excellent * 100 / Object.values(model.metrics.scoreDistribution).reduce((a, b) => a + b, 0)}%` }}></div>
                            <div className="bg-blue-500 h-full" style={{ width: `${model.metrics.scoreDistribution.good * 100 / Object.values(model.metrics.scoreDistribution).reduce((a, b) => a + b, 0)}%` }}></div>
                            <div className="bg-yellow-500 h-full" style={{ width: `${model.metrics.scoreDistribution.average * 100 / Object.values(model.metrics.scoreDistribution).reduce((a, b) => a + b, 0)}%` }}></div>
                            <div className="bg-orange-500 h-full" style={{ width: `${model.metrics.scoreDistribution.poor * 100 / Object.values(model.metrics.scoreDistribution).reduce((a, b) => a + b, 0)}%` }}></div>
                            <div className="bg-red-500 h-full" style={{ width: `${model.metrics.scoreDistribution.veryPoor * 100 / Object.values(model.metrics.scoreDistribution).reduce((a, b) => a + b, 0)}%` }}></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Domain Summary (more compact) */}
                      {model.domainSummary && (
                        <div className="bg-gray-50 p-2 rounded mb-2 text-xs text-gray-700 line-clamp-2">
                          {model.domainSummary}
                        </div>
                      )}
                      
                      {/* Strengths and Weaknesses section removed */}
                      
                      {/* Category-based performance metrics will be shown here */}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdvancedResultsView;
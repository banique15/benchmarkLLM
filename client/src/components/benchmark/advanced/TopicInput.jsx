import React from 'react';

const TopicInput = ({ topic, setTopic }) => {
  return (
    <div className="card bg-white p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-md bg-purple-100 mr-3">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-dark-600">What do you want to benchmark?</h2>
      </div>
      
      <div className="mb-2">
        <textarea
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 h-32"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., What's the best model for medical knowledge? or Which model is most cost-effective for creative writing?"
          required
        />
      </div>
      
      <p className="text-sm text-gray-500">
        Describe the domain or specific knowledge you want to test. Be as specific as possible to get the most relevant test cases.
      </p>
    </div>
  );
};

export default TopicInput;
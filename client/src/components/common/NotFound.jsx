import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-indigo-600 mb-4">
        <svg
          className="w-24 h-24"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily
        unavailable.
      </p>
      <Link to="/" className="btn btn-primary">
        Go back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
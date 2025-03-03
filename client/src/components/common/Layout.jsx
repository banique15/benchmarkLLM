import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const Layout = () => {
  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md transition-colors ${
      isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg
              className="w-8 h-8 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
              <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
              <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <h1 className="text-xl font-bold text-gray-900">LLM Benchmark</h1>
          </div>
          <div className="flex items-center space-x-4">
            <NavLink to="/" className={navLinkClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/benchmarks/create" className={navLinkClass}>
              Create Benchmark
            </NavLink>
            <NavLink to="/results" className={navLinkClass}>
              Results
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              Settings
            </NavLink>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} LLM Benchmark. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const Layout = () => {
  const navLinkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-nav">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <svg
                className="w-7 h-7 text-white"
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
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-dark-600">LLM Benchmark</h1>
              <span
                className="ml-1 text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-transparent bg-clip-text transform hover:scale-105 transition-all duration-300 tracking-wide"
                style={{
                  animation: "elegant-pulse 3s ease-in-out infinite",
                  display: "inline-block",
                  position: "relative",
                  top: "-2px"
                }}
              >
                <style>
                  {`
                    @keyframes elegant-pulse {
                      0% {
                        filter: drop-shadow(0 0 1px rgba(79, 70, 229, 0.3));
                        opacity: 0.9;
                      }
                      50% {
                        filter: drop-shadow(0 0 2px rgba(79, 70, 229, 0.8));
                        opacity: 1;
                      }
                      100% {
                        filter: drop-shadow(0 0 1px rgba(79, 70, 229, 0.3));
                        opacity: 0.9;
                      }
                    }
                  `}
                </style>
                PLUS
              </span>
            </div>
          </div>
          <nav className="flex items-center space-x-6">
            <NavLink to="/" className={navLinkClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/benchmarks" className={navLinkClass}>
              Create Benchmark
            </NavLink>
            <NavLink to="/results" className={navLinkClass}>
              Results
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              Settings
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8 animate-fadeIn">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} LLM Benchmark PLUS. All rights reserved.
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">Privacy Policy</a>
              <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">Terms of Service</a>
              <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
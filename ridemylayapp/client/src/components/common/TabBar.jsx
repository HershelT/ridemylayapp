import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const TabBar = () => {
  const location = useLocation();
  const path = location.pathname;
  
  const isActive = (route) => {
    if (route === '/' && path === '/') return true;
    if (route !== '/' && path.startsWith(route)) return true;
    return false;
  };
  
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
      <div className="grid grid-cols-5 h-16">
        {/* Home */}
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center ${isActive('/') ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        {/* Search */}
        <Link 
          to="/search" 
          className={`flex flex-col items-center justify-center ${isActive('/search') ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs mt-1">Search</span>
        </Link>
        
        {/* Post */}
        <Link 
          to="/post" 
          className={`flex flex-col items-center justify-center ${isActive('/post') ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <div className="bg-primary-500 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs mt-1">Post</span>
        </Link>
        
        {/* Leaderboard */}
        <Link 
          to="/leaderboard" 
          className={`flex flex-col items-center justify-center ${isActive('/leaderboard') ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs mt-1">Leaders</span>
        </Link>
        
        {/* Profile */}
        <Link 
          to="/profile" 
          className={`flex flex-col items-center justify-center ${isActive('/profile') ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default TabBar;

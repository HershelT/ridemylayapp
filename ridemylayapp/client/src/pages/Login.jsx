import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaExclamationCircle } from 'react-icons/fa';
import useAuthStore from '../store/authStore';

const Login = () => {  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  
  const { emailOrUsername, password } = formData;
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
    
    return () => {
      clearError();
    };
  }, [isAuthenticated, navigate, clearError]);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
    const handleSubmit = async (e) => {
    e.preventDefault();
    await login({ emailOrUsername, password });
    // Remove navigation here since useEffect will handle it
  };
    return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-4 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full sm:max-w-md space-y-8 bg-gray-800 p-4 sm:p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
              create a new account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900/50 text-red-200 p-3 rounded-lg flex items-center space-x-2">
            <FaExclamationCircle className="text-red-400" />
            <span>{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-5 w-5 text-gray-500" />
              </div>              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                autoComplete="username"
                required
                value={emailOrUsername}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-700 bg-gray-700/50 placeholder-gray-500 text-gray-100 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email or Username"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-700 bg-gray-700/50 placeholder-gray-500 text-gray-100 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-gray-700/50"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                Remember me
              </label>
            </div>
            
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-indigo-400 hover:text-indigo-300">
                Forgot your password?
              </Link>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

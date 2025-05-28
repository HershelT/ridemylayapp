import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaLock, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  
  const { token } = useParams();
  const navigate = useNavigate();
  
  const { password, confirmPassword } = formData;
  
  useEffect(() => {
    // Verify token is valid on component mount
    const verifyToken = async () => {
      try {
        await authAPI.verifyResetToken(token);
      } catch (error) {
        setTokenValid(false);
        setError('Password reset link is invalid or has expired');
      }
    };
    
    verifyToken();
  }, [token]);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Clear password error when user types in password fields
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setPasswordError('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }
    
    // Validate password strength
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await authAPI.resetPassword({
        token,
        password,
      });
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Something went wrong. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your new password below
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900/50 text-red-200 p-3 rounded-lg flex items-center space-x-2">
            <FaExclamationCircle className="text-red-400" />
            <span>{error}</span>
          </div>
        )}
        
        {passwordError && (
          <div className="bg-red-900/50 text-red-200 p-3 rounded-lg flex items-center space-x-2">
            <FaExclamationCircle className="text-red-400" />
            <span>{passwordError}</span>
          </div>
        )}
        
        {success ? (
          <div className="mt-8">
            <div className="bg-green-900/50 text-green-200 p-3 rounded-lg flex items-center space-x-2 mb-4">
              <FaCheckCircle className="text-green-400" />
              <span>Password reset successful! You can now login with your new password.</span>
            </div>
            <p className="text-center text-sm text-gray-400 mb-4">
              Redirecting to login page...
            </p>
            <Link 
              to="/login" 
              className="w-full inline-flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login now
            </Link>
          </div>
        ) : (
          <>
            {!tokenValid ? (
              <div className="mt-8 text-center">
                <p className="text-gray-400 mb-4">
                  The password reset link is invalid or has expired.
                </p>
                <Link 
                  to="/forgot-password" 
                  className="w-full inline-flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Request a new link
                </Link>
              </div>
            ) : (
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md shadow-sm -space-y-px">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={handleChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-700 bg-gray-700/50 placeholder-gray-500 text-gray-100 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="New password"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={handleChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-700 bg-gray-700/50 placeholder-gray-500 text-gray-100 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Confirm new password"
                    />
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
                    ) : 'Reset Password'}
                  </button>
                </div>
                
                <div className="text-center">
                  <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import Post from './pages/Post';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import BetDetails from './pages/BetDetails';
import Messages from './pages/Messages'; // Add this import


// Components
import Header from './components/common/Header';
import TabBar from './components/common/TabBar';

// Services
import { initializeSocket } from './services/socket';

// Store
import useAuthStore from './store/authStore';

const App = () => {
  const { isAuthenticated, user, loadUser, token } = useAuthStore();
  const [theme, setTheme] = React.useState('light');

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    // Initialize socket connection if user is authenticated
    if (token) {
      initializeSocket();
    }

    // Load user data if token exists
    if (token) {
      loadUser();
    }
  }, [token, loadUser]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <Router>
      <div className={`App min-h-screen ${theme === 'dark' ? 'dark bg-dark text-white' : 'bg-gray-50 text-gray-900'}`}>
        {isAuthenticated && <Header toggleTheme={toggleTheme} />}
        <main className={`container mx-auto px-4 ${isAuthenticated ? 'pb-16 pt-16' : 'py-0'}`}>
          <Routes>
            {/* Auth Routes (Public) */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
            <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" /> : <ForgotPassword />} />
            <Route path="/reset-password/:token" element={isAuthenticated ? <Navigate to="/" /> : <ResetPassword />} />
            
            {/* Protected Routes */}
            <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />            
            <Route path="/search" element={isAuthenticated ? <Search /> : <Navigate to="/login" />} />
            <Route path="/post" element={isAuthenticated ? <Post /> : <Navigate to="/login" />} />
            <Route path="/messages" element={isAuthenticated ? <Messages /> : <Navigate to="/login" />} /> 
            <Route path="/leaderboard" element={isAuthenticated ? <Leaderboard /> : <Navigate to="/login" />} />
            <Route path="/profile/:userId?" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/bets/:id" element={isAuthenticated ? <BetDetails /> : <Navigate to="/login" />} />
          </Routes>
        </main>
        {isAuthenticated && <TabBar />}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: theme === 'dark' ? '#374151' : '#ffffff',
              color: theme === 'dark' ? '#ffffff' : '#1f2937',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;

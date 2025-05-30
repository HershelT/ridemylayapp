import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, betAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Search = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('users');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);  // Start with true to show initial loading state
  const [selectedSport, setSelectedSport] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  const sports = [
    { id: 'all', name: 'All Sports' },
    { id: 'football', name: 'Football' },
    { id: 'basketball', name: 'Basketball' },
    { id: 'baseball', name: 'Baseball' },
    { id: 'soccer', name: 'Soccer' },
    { id: 'hockey', name: 'Hockey' },
  ];

  // Fetch data on component mount and when page, searchType, or timeRange changes
  // This matches the pattern in Leaderboard.jsx
  useEffect(() => {
    fetchSearchData();
  }, [searchType, page]);

  // Auto-search when typing in the search box (with debounce)
  useEffect(() => {
    if (searchType === 'users') {
      const timer = setTimeout(() => {
        fetchSearchData();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const fetchSearchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (searchType === 'users') {
        // For users, always perform a search even with empty query
        // This will show all users (like Leaderboard does)
        const query = searchQuery.trim();
        
        // Get default results if query is empty
        const response = await userAPI.searchUsers(query || 'a', page, 10);
        console.log('Search response:', response);

        if (!response?.data?.users) {
          throw new Error('Invalid user data received');
        }
        
        // Get auth store's isFollowingUser function
        const isFollowingUser = useAuthStore.getState().isFollowingUser;
        
        // Format data similar to Leaderboard, but handle the different API response format
        const formattedData = response.data.users.map((user, index) => {
          // Check if the data fields exist, use placeholders if not
          return {
            _id: user._id,
            rank: (page - 1) * 10 + index + 1,
            username: user.username || 'Unknown User',
            avatarUrl: user.avatarUrl || '',
            verified: user.verified || false,
            // These fields might be missing from search API, so provide defaults
            winRate: user.winRate || 0,
            profitLoss: user.profit || 0,
            streak: user.streak || 0,
            following: isFollowingUser(user._id),
            bio: user.bio || ''
          };
        });
        
        setSearchResults(formattedData);
        setTotalPages(response.data.pages || 1);
      } else if (searchType === 'games') {
        // Handle games search
        const filters = selectedSport !== 'all' ? { sport: selectedSport } : {};
        const response = await betAPI.getAllBets(page, 10, {
          ...filters,
          query: searchQuery.trim() || undefined
        });
        
        if (response.data?.bets) {
          setSearchResults(response.data.bets);
          setTotalPages(response.data.pages || 1);
        } else {
          setSearchResults([]);
          setTotalPages(1);
        }
      } else if (searchType === 'topics') {
        // Handle topics search
        const response = await betAPI.getAllBets(page, 10, { 
          query: searchQuery.trim() || undefined,
          grouped: true
        });
        
        if (response.data?.topics) {
          setSearchResults(response.data.topics);
          setTotalPages(response.data.pages || 1);
        } else {
          setSearchResults([]);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Error fetching search data:', error);
      setError('Failed to load search results. Please try again later.');
      toast.error('Failed to load search results');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    setPage(1); // Reset to page 1
    fetchSearchData();
  };

  // Handle follow/unfollow toggle - use same logic as Leaderboard
  const handleFollowToggle = async (username) => {
    try {
      const userToUpdate = searchResults.find(u => u.username === username);
      if (!userToUpdate) return;
      
      // Call the auth store action to handle the follow/unfollow
      const response = await useAuthStore.getState().followUser(username);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update follow status');
      }
      
      // Show success toast
      toast.success(response.isFollowing ? 'Started following user' : 'Unfollowed user');
      
      // Update the follow status in the local state
      setSearchResults(prevData => 
        prevData.map(user => {
          if (user.username === username) {
            return { 
              ...user, 
              following: response.isFollowing 
            };
          }
          return user;
        })
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error(error.message || 'Failed to update follow status');
    }
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  const renderSearchResults = () => {
    if (loading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (error) {
      return <div className="text-red-500 text-center mb-4">{error}</div>;
    }

    if (searchResults.length === 0) {
      return <div className="text-center py-8 text-gray-500">No results found for the selected filters.</div>;
    }

    if (searchType === 'users') {
      return (
        <>
          <div className="grid grid-cols-12 py-2 px-4 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-200 text-sm">
            <div className="col-span-1">#</div>
            <div className="col-span-5">User</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-2 text-center">P/L</div>
            <div className="col-span-2 text-center">Action</div>
          </div>
          
          {searchResults.map(user => (
            <div 
              key={user._id} 
              className="grid grid-cols-12 py-3 px-4 border-b border-gray-200 dark:border-gray-700 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="col-span-1 font-medium">{user.rank}</div>
              <div className="col-span-5 flex items-center">
                <img 
                  src={user.avatarUrl} 
                  alt={`${user.username}'s avatar`} 
                  className="w-8 h-8 rounded-full mr-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleUserClick(user.username)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/9.x/icons/svg?seed=${user.username}`;
                  }}
                />
                <div>
                  <div className="flex items-center">
                    <span 
                      className="font-medium cursor-pointer hover:text-primary-500 transition-colors"
                      onClick={() => handleUserClick(user.username)}
                    >
                      {user.username}
                    </span>
                    {user.verified && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" />
                        <path d="M7.9 8.6l2.1 2.1 4.1-4.1 1.4 1.4-5.5 5.5-3.5-3.5 1.4-1.4z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.streak > 0 ? 
                      <span className="text-green-500">🔥 {user.streak} streak</span> : 
                      user.streak < 0 ? 
                      <span className="text-red-500">❄️ {Math.abs(user.streak)} losses</span> : 
                      'No streak'
                    }
                  </div>
                </div>
              </div>
              <div className="col-span-2 text-center">{user.winRate}%</div>
              <div className={`col-span-2 text-center ${user.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {user.profitLoss >= 0 ? '+' : ''}{user.profitLoss.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </div>
              <div className="col-span-2 text-center">
                <button 
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    user.following ? 
                    'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300' : 
                    'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                  onClick={() => handleFollowToggle(user.username)}
                >
                  {user.following ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          ))}
        </>
      );
    }

    // Games and Topics renderers remain the same
    if (searchType === 'games') {
      return (
        <div className="space-y-4">
          {searchResults.map(bet => (
            <div key={bet._id} className="card">
              <div className="flex justify-between items-center mb-2">
                <span className={`px-2 py-1 rounded-full text-xs ${bet.status === 'pending' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {bet.status === 'pending' ? 'LIVE' : bet.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">{bet.bettingSiteId?.name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  {bet.legs.map((leg, index) => (
                    <div key={index} className="flex justify-between items-center mb-2">
                      <span className="font-medium">{leg.team}</span>
                      <span className="font-bold">{leg.odds}</span>
                    </div>
                  ))}
                </div>
                
                <div className="px-4 text-center">
                  <div className="font-medium text-red-500">{bet.status}</div>
                  <div className="text-xs text-gray-500 mt-1">{bet.sport.toUpperCase()}</div>
                </div>
                
                <div className="flex-1 text-right">
                  <div className="mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Stake: </span>
                    <span className="font-medium">${bet.stake}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Potential Win: </span>
                    <span className="font-medium">${bet.potentialWinnings}</span>
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-3 btn-primary" onClick={() => navigate(`/bets/${bet._id}`)}>
                View Bet
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (searchType === 'topics') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {searchResults.map(topic => (
            <div key={topic._id} className="card">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">{topic.name}</h3>
                {topic.isHot && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    🔥 Hot
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{topic.betCount} bets</p>
              <button className="w-full mt-3 btn-primary" onClick={() => navigate(`/search/topic/${topic.name}`)}>
                View Bets
              </button>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold mb-4">Search</h1>

      <div className="card mb-4">
        <div className="flex mb-3">
          <button 
            className={`flex-1 py-2 text-center rounded-l-md ${searchType === 'games' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            onClick={() => setSearchType('games')}
          >
            Games
          </button>
          <button 
            className={`flex-1 py-2 text-center ${searchType === 'topics' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            onClick={() => setSearchType('topics')}
          >
            Topics
          </button>
          <button 
            className={`flex-1 py-2 text-center rounded-r-md ${searchType === 'users' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            onClick={() => setSearchType('users')}
          >
            Users
          </button>
        </div>

        <div className="flex">
          <input
            type="text"
            className="flex-1 input"
            placeholder={`Search for ${searchType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <button 
            className="ml-2 bg-primary-500 text-white px-4 rounded-md hover:bg-primary-600"
            onClick={handleSearch}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {searchType === 'games' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {sports.map(sport => (
              <button
                key={sport.id}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedSport === sport.id 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setSelectedSport(sport.id)}
              >
                {sport.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        {renderSearchResults()}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-3 py-1 rounded-md ${
              page === 1 
                ? 'bg-gray-200 text-gray-500' 
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded-md ${
              page === totalPages
                ? 'bg-gray-200 text-gray-500'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Search;
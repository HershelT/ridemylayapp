import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, betAPI } from '../services/api';
import useAuthStore from '../store/authStore'; // Add this import

const Search = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('users'); // Default to 'users' now instead of 'games'
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState('all');
  
  // Pagination state for users
  const [userPage, setUserPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef();
  const lastUserRef = useRef(null);

  const sports = [
    { id: 'all', name: 'All Sports' },
    { id: 'football', name: 'Football' },
    { id: 'basketball', name: 'Basketball' },
    { id: 'baseball', name: 'Baseball' },
    { id: 'soccer', name: 'Soccer' },
    { id: 'hockey', name: 'Hockey' },
  ];

  // Function to load users with pagination
  const loadUsers = useCallback(async (page = 1, query = '', reset = false) => {
    try {
      if (!hasMore && !reset) return;
      
      if (page === 1 || reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // If query is empty, use a default search that will match all users
      // For example, search for a very common character like 'a' or use a space
      // This is a workaround since your API requires a search query
      const searchQuery = query.trim() ? query : 'a';
      
      const response = await userAPI.searchUsers(searchQuery, page, 20);
      
      if (reset || page === 1) {
        setSearchResults(response.data.users);
      } else {
        setSearchResults(prev => [...prev, ...response.data.users]);
      }
      
      setHasMore(response.data.users.length > 0 && response.data.page < response.data.pages);
      setUserPage(page);
      setInitialLoad(false);
    } catch (error) {
      console.error('Error loading users:', error);
      // Set an empty array to prevent infinite loading attempts
      setSearchResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [hasMore]);

  // Handle the search for non-user content types
  const handleSearch = async () => {
    if (searchType === 'users') {
      // For users, we'll handle this separately with loadUsers
      setUserPage(1);
      loadUsers(1, searchQuery, true);
      return;
    }
    
    // For other search types
    setLoading(true);
    try {
      if (searchType === 'games') {
        const filters = selectedSport !== 'all' ? { sport: selectedSport } : {};
        const response = await betAPI.getAllBets(1, 10, {
          ...filters,
          query: searchQuery 
        });
        setSearchResults(response.data.bets);
      } else if (searchType === 'topics') {
        // Topics are now just grouped bets by popular categories
        const response = await betAPI.getAllBets(1, 10, { 
          query: searchQuery,
          grouped: true
        });
        setSearchResults(response.data.topics || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial users when the component mounts or search type changes
  useEffect(() => {
    if (searchType === 'users') {
      setUserPage(1);
      loadUsers(1, searchQuery, true);
    } else {
      // For other search types, we'll wait for explicit search
      setSearchResults([]);
    }
  }, [searchType, loadUsers]);

  // Debounced search for users as you type
  useEffect(() => {
    if (searchType !== 'users') return;
    
    const timer = setTimeout(() => {
      setUserPage(1);
      loadUsers(1, searchQuery, true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, searchType, loadUsers]);

  // Intersection observer for infinite scrolling
  useEffect(() => {
    if (searchType !== 'users' || loading || !hasMore) return;
    
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const handleObserver = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loadingMore) {
        setUserPage(prev => prev + 1);
        loadUsers(userPage + 1, searchQuery);
      }
    };
    
    const currentObserver = new IntersectionObserver(handleObserver, options);
    observer.current = currentObserver;
    
    if (lastUserRef.current) {
      currentObserver.observe(lastUserRef.current);
    }
    
    return () => {
      if (lastUserRef.current) {
        currentObserver.unobserve(lastUserRef.current);
      }
    };
  }, [searchResults, hasMore, loading, loadingMore, searchType, userPage, searchQuery, loadUsers]);

  const renderSearchResults = () => {
    if (loading && searchResults.length === 0) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (searchResults.length === 0 && !loading && !initialLoad) {
      return <div className="text-center py-8 text-gray-500">No results found</div>;
    }

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

    // User search results with infinite scroll
    return (
  <div className="space-y-4">
    {searchResults.map((user, index) => {
      const isLastItem = index === searchResults.length - 1;
      // Safely check if the user is being followed
      const isFollowing = user._id ? useAuthStore.getState().isFollowingUser(user._id) : false;
      
      // Extract user data with fallbacks
      const {
        _id = '',
        username = 'Anonymous',
        avatarUrl = null,
        verified = false,
        winRate = 0,
        followerCount = 0,
        streak = 0,
        bio = ''
      } = user || {};
      
      return (
        <div 
          key={_id || index} 
          ref={isLastItem ? lastUserRef : null}
          className="card p-4 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center">
            {/* User Avatar */}
            <div 
              className="w-12 h-12 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 flex-shrink-0 cursor-pointer"
              onClick={() => navigate(`/profile/${username}`)}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={`${username}'s avatar`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/9.x/icons/svg?seed=${username}`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-medium text-indigo-600 dark:text-indigo-400">
                  {username.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* User Details */}
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center mb-1">
                <span 
                  className="font-medium text-gray-900 dark:text-white hover:text-primary-500 cursor-pointer truncate"
                  onClick={() => navigate(`/profile/${username}`)}
                >
                  {username}
                </span>
                {verified && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <span className="mr-1">💯</span>
                  <span className="font-medium">{Number(winRate).toFixed(1)}%</span>
                </div>
                <div className="flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <span className="mr-1">👥</span>
                  <span className="font-medium">{Number(followerCount).toLocaleString()}</span>
                </div>
                {streak !== 0 && (
                  <div className={`flex items-center px-2 py-0.5 ${
                    streak > 0 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    } rounded-md`}
                  >
                    <span className="mr-1">{streak > 0 ? '🔥' : '❄️'}</span>
                    <span className="font-medium">
                      {Math.abs(streak)} {streak > 0 ? 'win' : 'loss'} streak
                    </span>
                  </div>
                )}
              </div>
              
              {bio && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-1">
                  {bio}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 ml-2">
              <button 
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isFollowing 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600' 
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
                onClick={async () => {
                  try {
                    const result = await useAuthStore.getState().followUser(username);
                    if (result.success) {
                      // Force a re-render by updating state
                      setSearchResults(prev => prev.map(u => 
                        u._id === _id 
                          ? {...u, isFollowing: !isFollowing} 
                          : u
                      ));
                    }
                  } catch (error) {
                    console.error("Failed to follow/unfollow user:", error);
                  }
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              
              <button 
                className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => navigate(`/profile/${username}`)}
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      );
    })}
    
    {loadingMore && (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
      </div>
    )}
  </div>
);
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
              if (e.key === 'Enter' && searchType !== 'users') {
                handleSearch();
              }
            }}
          />
          {searchType !== 'users' && (
            <button 
              className="ml-2 bg-primary-500 text-white px-4 rounded-md hover:bg-primary-600"
              onClick={handleSearch}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
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

      {renderSearchResults()}
    </div>
  );
};

export default Search;
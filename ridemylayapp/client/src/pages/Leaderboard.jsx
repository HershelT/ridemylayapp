import React, { useState, useEffect } from 'react';
import { userAPI, leaderboardAPI } from '../services/api';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const [leaderboardType, setLeaderboardType] = useState('country');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, [leaderboardType, timeRange, page]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      let timeframe = timeRange === 'allTime' ? 'all' : timeRange;      
      const response = await leaderboardAPI.getLeaderboard(timeframe, page);
      console.log('Leaderboard API response:', response.data); // Debug log
      
      if (!response.data.leaderboard || !Array.isArray(response.data.leaderboard)) {
        throw new Error('Invalid leaderboard data received');
      }
      
      // Format the leaderboard data
      const formattedData = response.data.leaderboard.map((user, index) => ({
        _id: user._id,
        rank: (page - 1) * 10 + index + 1,
        username: user.username || 'Unknown User',
        avatarUrl: user.avatarUrl || '',
        verified: user.verified || false,
        winRate: user.winRate ? Math.round(user.winRate) : 0,
        profitLoss: user.profit || 0,
        streak: user.streak || 0,
        following: user.isFollowing || false,
      }));

      setLeaderboardData(formattedData);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setError('Failed to load leaderboard data. Please try again later.');
      toast.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (username) => {
    try {
      await userAPI.toggleFollow(username);
      setLeaderboardData(prevData => 
        prevData.map(user => {
          if (user.username === username) {
            return { ...user, following: !user.following };
          }
          return user;
        })
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
  };

  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      
      <div className="mb-4 flex flex-wrap">
        <div className="w-full mb-2">
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-md p-1">
            <button 
              className={`flex-1 py-2 text-center rounded-md ${leaderboardType === 'country' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
              onClick={() => setLeaderboardType('country')}
            >
              Country
            </button>
            <button 
              className={`flex-1 py-2 text-center rounded-md ${leaderboardType === 'friends' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
              onClick={() => setLeaderboardType('friends')}
            >
              Friends
            </button>
            <button 
              className={`flex-1 py-2 text-center rounded-md ${leaderboardType === 'influencers' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
              onClick={() => setLeaderboardType('influencers')}
            >
              Influencers
            </button>
          </div>
        </div>
        
        <div className="w-full">
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 text-sm rounded-full ${timeRange === 'day' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              onClick={() => setTimeRange('day')}
            >
              Today
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-full ${timeRange === 'week' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              onClick={() => setTimeRange('week')}
            >
              This Week
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-full ${timeRange === 'month' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              onClick={() => setTimeRange('month')}
            >
              This Month
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-full ${timeRange === 'allTime' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              onClick={() => setTimeRange('allTime')}
            >
              All Time
            </button>
          </div>
        </div>
      </div>
      
      <div className="card">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div>
            <div className="grid grid-cols-12 py-2 px-4 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400 text-sm">
              <div className="col-span-1">#</div>
              <div className="col-span-5">User</div>
              <div className="col-span-2 text-center">Win Rate</div>
              <div className="col-span-2 text-center">P/L</div>
              <div className="col-span-2 text-center">Action</div>
            </div>
            
            {leaderboardData.map(user => (
              <div 
                key={user._id} 
                className="grid grid-cols-12 py-3 px-4 border-b border-gray-200 dark:border-gray-700 items-center hover:bg-gray-50 dark:hover:bg-gray-750"
              >
                <div className="col-span-1 font-medium">{user.rank}</div>
                <div className="col-span-5 flex items-center">
                  <img 
                    src={user.avatarUrl} 
                    alt={`${user.username}'s avatar`} 
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium">{user.username}</span>
                      {user.verified && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
                </div>                <div className="col-span-2 text-center">
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
          </div>
        )}
      </div>      {error && (
        <div className="text-red-500 text-center mb-4">{error}</div>
      )}

      {!error && !loading && leaderboardData.length === 0 && (
        <div className="text-center py-8">No data found for the selected filters.</div>
      )}

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
};

export default Leaderboard;

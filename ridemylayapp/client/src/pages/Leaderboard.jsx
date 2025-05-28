import React, { useState, useEffect } from 'react';

const Leaderboard = () => {
  const [leaderboardType, setLeaderboardType] = useState('country');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchLeaderboardData();
  }, [leaderboardType, timeRange]);

  const fetchLeaderboardData = async () => {
    setLoading(true);

    try {
      // Mock API call
      setTimeout(() => {
        setLeaderboardData(generateMockLeaderboardData());
        setLoading(false);
      }, 500);

      // Real API call would look like:
      // const response = await api.get(`/api/leaderboards/${leaderboardType}`, {
      //   params: { timeRange }
      // });
      // setLeaderboardData(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setLoading(false);
    }
  };

  // Generate mock data for demonstration
  const generateMockLeaderboardData = () => {
    return Array(20).fill().map((_, index) => ({
      _id: `user-${index + 1}`,
      rank: index + 1,
      username: `user${Math.floor(Math.random() * 1000)}`,
      avatarUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
      verified: Math.random() > 0.7,
      winRate: Math.floor(Math.random() * 100),
      profitLoss: Math.random() > 0.7 ? Math.floor(Math.random() * 5000) : -Math.floor(Math.random() * 2000),
      streak: Math.floor(Math.random() * 10) - 2,
      following: Math.random() > 0.5,
    }));
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
                </div>
                <div className="col-span-2 text-center">
                  <button 
                    className={`px-3 py-1 text-xs rounded-full ${
                      user.following ? 
                      'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 
                      'bg-primary-500 text-white'
                    }`}
                  >
                    {user.following ? 'Following' : 'Follow'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

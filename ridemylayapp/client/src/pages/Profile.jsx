import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfileHeader from '../components/user/ProfileHeader';
import BetCard from '../components/bets/BetCard';
import { userAPI, betAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('bets');
  const [bets, setBets] = useState([]);
  const [likes, setLikes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Function to handle follow status changes
  const handleFollowToggle = useCallback((isNowFollowing) => {
    setUser(prevUser => ({
      ...prevUser,
      isFollowing: isNowFollowing,
      followers: isNowFollowing ? 
        [...(prevUser.followers || []), 'currentUser'] : 
        (prevUser.followers || []).filter(f => f !== 'currentUser')
    }));
    // No need to refresh the whole profile since we're handling the state update here
  }, []);

  // Define fetchTabData first
  const fetchTabData = useCallback(async (tab, targetUser) => {
    try {
      const target = !userId || userId === 'me' 
        ? 'me' 
        : targetUser?.username;

      // If we don't have a target yet, skip fetching
      if (!target) {
        return;
      }

      // For analytics tab, fetch if we have a target
      if (tab === 'analytics' && target) {
        const analyticsResponse = await userAPI.getUserAnalytics(target);
        if (analyticsResponse.data.analytics) {
          setAnalytics(analyticsResponse.data.analytics);
        }
        setActiveTab(tab);
        return;
      }

      switch (tab) {
        case 'bets':
          const betsResponse = await userAPI.getUserBets(target);
          if (betsResponse.data.bets) {
            setBets(betsResponse.data.bets);
          }
          break;
            case 'likes':
          try {
            const likesResponse = await betAPI.getAllBets(1, 10, { 
              likedBy: target === 'me' ? user._id : targetUser._id 
            });
            
            setLikes(likesResponse.data.bets || []);
            setActiveTab(tab);
          } catch (error) {
            console.error('Error fetching liked bets:', error);
            setLikes([]);
            setError('Failed to load liked bets');
          }
          return; // Return here to prevent setActiveTab being called twice
          
        default:
          throw new Error('Invalid tab selection');
      }
      
      setActiveTab(tab);
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
      setError(`Error loading ${tab}: ${error.message}`);
    }
  }, [userId, isOwnProfile]); // Remove loading dependency

  // Then define fetchUserData
  const fetchUserData = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const userResponse = !userId || userId === 'me' 
        ? await authAPI.getCurrentUser()
        : await userAPI.getProfile(userId);
        
      if (!userResponse.data.user) {
        throw new Error('User not found');
      }
      
      const userData = userResponse.data.user;
      setUser(userData);
      setIsOwnProfile(!userId || userId === 'me' || userId === userData._id);
      
      // Load initial tab data only after we have the user
      await fetchTabData(activeTab, userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, activeTab, fetchTabData]);

  // Only fetch user data when component mounts or userId changes
  useEffect(() => {
    fetchUserData();
  }, [userId]); // Remove fetchUserData from dependencies

  // Handle tab changes separately from user data fetching
  useEffect(() => {
    if (user) {
      fetchTabData(activeTab, user);
    }
  }, [activeTab, fetchTabData, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  const renderTabContent = () => {
    if (loading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (activeTab === 'bets') {
      if (!bets || bets.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            No bets posted yet.
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {bets.map(bet => (
            <BetCard key={bet._id} bet={bet} />
          ))}
        </div>
      );
    }

    if (activeTab === 'likes') {
      if (loading) {
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        );
      }

      if (!likes || likes.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            No liked bets yet.
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {likes.map(bet => (
            <BetCard key={bet._id} bet={bet} />
          ))}
        </div>
      );
    }

    if (activeTab === 'analytics') {
      if (!analytics) {
        return (
          <div className="text-center py-8 text-gray-500">
            Analytics data unavailable.
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-bold mb-3">Overall Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Win Rate</div>
                <div className="text-2xl font-bold">{analytics.winRate.toFixed(1)}%</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Bets</div>
                <div className="text-2xl font-bold">{analytics.totalBets}</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Profit/Loss</div>
                <div className={`text-2xl font-bold ${analytics.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.profit >= 0 ? '+' : ''}{analytics.profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Avg. Odds</div>
                <div className="text-2xl font-bold">{analytics.avgOdds > 0 ? '+' : ''}{analytics.avgOdds}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold mb-3">Sport Breakdown</h3>
            <div className="space-y-2">
              {analytics.sportBreakdown.map(sport => (
                <div key={sport.sport} className="flex items-center justify-between space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium capitalize">{sport.sport}</div>
                      <div className="text-right font-semibold">
                        <span className={sport.winRate >= 50 ? 'text-green-500' : 'text-red-500'}>
                          {sport.winRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          sport.winRate >= 60 ? 'bg-green-500' :
                          sport.winRate >= 50 ? 'bg-green-400' :
                          sport.winRate >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.max(Math.min(sport.winRate, 100), 0)}%`,
                          transition: 'width 1s ease-in-out'
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {sport.betsCount} {sport.betsCount === 1 ? 'bet' : 'bets'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold mb-3">Recent Performance</h3>
            <div className="grid grid-cols-7 gap-2">
              {analytics.recentPerformance.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-green-500">{day.won} W</div>
                    <div className="text-red-500">{day.lost} L</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading && !user) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  if (!user) {
    return <div className="text-center py-8 text-red-500">User not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <ProfileHeader 
        user={user} 
        isOwnProfile={isOwnProfile}
        onFollowToggle={handleFollowToggle}
      />
      
      <div className="mt-8">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'bets' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => fetchTabData('bets')}
          >
            Bets
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'likes' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => fetchTabData('likes')}
          >
            Likes
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'analytics' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => fetchTabData('analytics')}
          >
            Analytics
          </button>
        </div>
        
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Profile;

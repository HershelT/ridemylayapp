import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ProfileHeader from '../components/user/ProfileHeader';
import BetCard from '../components/bets/BetCard';
import { userAPI, betAPI, authAPI } from '../services/api';

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

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user profile data
      const userResponse = !userId || userId === 'me' 
        ? await authAPI.getCurrentUser()
        : await userAPI.getProfile(userId);
        
      if (!userResponse.data.user) {
        throw new Error('User not found');
      }
      
      const isOwn = !userId || userId === 'me' || userId === userResponse.data.user._id;
      
      setUser(userResponse.data.user);
      setIsOwnProfile(isOwn);
      
      // Now that we have user data, load initial tab data
      await fetchTabData(activeTab);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, activeTab, fetchTabData]);

  useEffect(() => {
    fetchUserData();
  }, [userId, fetchUserData]);
  const fetchTabData = useCallback(async (tab) => {
    setLoading(true);
    setError(null);

    try {
      // Determine the target user identifier
      // If no userId or it's 'me', use 'me', otherwise use the stored user info
      const target = !userId || userId === 'me' 
        ? 'me' 
        : user?.username;

      // If we don't have a target yet and we're not loading the profile, throw an error
      if (!target && !loading) {
        throw new Error('No user information available');
      }

      // For analytics tab, only fetch if it's own profile and we have a target
      if (tab === 'analytics' && isOwnProfile && target) {
        const analyticsResponse = await userAPI.getUserAnalytics(target);
        if (analyticsResponse.data.analytics) {
          setAnalytics(analyticsResponse.data.analytics);
        }
        setActiveTab(tab);
        return;
      }

      // For other tabs, we need a valid target
      if (!target) {
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
          const likesResponse = await betAPI.getLikedBets(target);
          if (likesResponse.data.bets) {
            setLikes(likesResponse.data.bets);
          }
          break;
          
        default:
          throw new Error('Invalid tab selection');
      }
      
      setActiveTab(tab);
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
      setError(`Error loading ${tab}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [userId, user?.username, isOwnProfile, loading]);

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

    if (activeTab === 'analytics' && isOwnProfile) {
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
                <div key={sport.sport} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>{sport.sport}</div>
                      <div className="text-right">{sport.winRate.toFixed(1)}%</div>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${sport.winRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-gray-500">{sport.betsCount} bets</div>
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
          {isOwnProfile && (
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
          )}
        </div>
        
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Profile;

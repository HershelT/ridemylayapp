import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProfileHeader from '../components/user/ProfileHeader';
import BetCard from '../components/bets/BetCard';

const Profile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('bets');
  const [bets, setBets] = useState([]);
  const [likes, setLikes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);

    try {
      // For demo purposes, we'll use mock data
      setTimeout(() => {
        const mockUser = generateMockUser();
        setUser(mockUser);
        
        // Check if this is the current user's profile
        setIsOwnProfile(!userId || userId === 'me');
        
        // Fetch bets for the active tab
        fetchTabData('bets');
        
        setLoading(false);
      }, 500);

      // Real API calls would look like:
      // const userResponse = await api.get(userId ? `/api/users/${userId}` : '/api/users/me');
      // setUser(userResponse.data);
      // setIsOwnProfile(!userId || userId === 'me' || userId === userResponse.data._id);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const fetchTabData = async (tab) => {
    setLoading(true);

    try {
      if (tab === 'bets') {
        // Mock data for bets
        setBets(generateMockBets());
      } else if (tab === 'likes') {
        // Mock data for likes
        setLikes(generateMockBets());
      } else if (tab === 'analytics' && isOwnProfile) {
        // Mock data for analytics
        setAnalytics(generateMockAnalytics());
      }
      
      setActiveTab(tab);
      setLoading(false);
      
      // Real API calls would look like:
      // if (tab === 'bets') {
      //   const betsResponse = await api.get(`/api/bets/user/${userId || 'me'}`);
      //   setBets(betsResponse.data);
      // } else if (tab === 'likes') {
      //   const likesResponse = await api.get(`/api/users/${userId || 'me'}/likes`);
      //   setLikes(likesResponse.data);
      // } else if (tab === 'analytics' && isOwnProfile) {
      //   const analyticsResponse = await api.get('/api/users/me/analytics');
      //   setAnalytics(analyticsResponse.data);
      // }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
      setLoading(false);
    }
  };

  // Generate mock data for demonstration
  const generateMockUser = () => {
    return {
      _id: userId || 'user-1',
      username: `user${Math.floor(Math.random() * 1000)}`,
      avatarUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
      verified: Math.random() > 0.7,
      bio: 'Sports betting enthusiast. I share my best picks daily. Follow for consistent winners!',
      winRate: Math.floor(Math.random() * 100),
      streak: Math.floor(Math.random() * 10) - 2,
      betCount: Math.floor(Math.random() * 100) + 10,
      followers: Array(Math.floor(Math.random() * 1000)),
      following: Array(Math.floor(Math.random() * 500)),
      isFollowing: Math.random() > 0.7,
      settings: {
        showBio: true,
      }
    };
  };

  const generateMockBets = () => {
    return Array(5).fill().map((_, index) => ({
      _id: `bet-${index + 1}`,
      userId: user?._id,
      user: {
        username: user?.username,
        avatarUrl: user?.avatarUrl,
        verified: user?.verified,
        streak: user?.streak,
      },
      legs: [
        {
          team: `Team ${Math.floor(Math.random() * 30) + 1}`,
          betType: Math.random() > 0.5 ? 'Spread -1.5' : 'Moneyline',
          odds: Math.random() > 0.5 ? Math.floor(Math.random() * 300) + 100 : -Math.floor(Math.random() * 300) - 100,
        },
        {
          team: `Team ${Math.floor(Math.random() * 30) + 1}`,
          betType: Math.random() > 0.5 ? 'Total Over 220.5' : 'Total Under 220.5',
          odds: Math.random() > 0.5 ? Math.floor(Math.random() * 300) + 100 : -Math.floor(Math.random() * 300) - 100,
        },
      ],
      odds: Math.random() > 0.5 ? Math.floor(Math.random() * 500) + 100 : -Math.floor(Math.random() * 500) - 100,
      stake: Math.floor(Math.random() * 100) + 10,
      potentialWinnings: Math.floor(Math.random() * 500) + 50,
      status: ['won', 'lost', 'pending'][Math.floor(Math.random() * 3)],
      bettingSite: {
        name: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'][Math.floor(Math.random() * 4)],
        logoUrl: 'https://via.placeholder.com/20',
      },
      likes: Array(Math.floor(Math.random() * 50)),
      liked: Math.random() > 0.7,
      shares: Math.floor(Math.random() * 20),
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
    }));
  };

  const generateMockAnalytics = () => {
    return {
      overallWinRate: Math.floor(Math.random() * 100),
      totalBets: Math.floor(Math.random() * 100) + 10,
      profitLoss: Math.random() > 0.6 ? Math.floor(Math.random() * 5000) : -Math.floor(Math.random() * 2000),
      avgOdds: Math.floor(Math.random() * 300) + 100,
      sportBreakdown: [
        { sport: 'Basketball', winRate: Math.floor(Math.random() * 100), betsCount: Math.floor(Math.random() * 30) + 5 },
        { sport: 'Football', winRate: Math.floor(Math.random() * 100), betsCount: Math.floor(Math.random() * 30) + 5 },
        { sport: 'Baseball', winRate: Math.floor(Math.random() * 100), betsCount: Math.floor(Math.random() * 30) + 5 },
      ],
      recentPerformance: Array(7).fill().map((_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
        won: Math.floor(Math.random() * 5),
        lost: Math.floor(Math.random() * 5),
      })),
    };
  };

  const renderTabContent = () => {
    if (loading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (activeTab === 'bets') {
      if (bets.length === 0) {
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
      if (likes.length === 0) {
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
      return (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-bold mb-3">Overall Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Win Rate</div>
                <div className="text-2xl font-bold">{analytics.overallWinRate}%</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Bets</div>
                <div className="text-2xl font-bold">{analytics.totalBets}</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Profit/Loss</div>
                <div className={`text-2xl font-bold ${analytics.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.profitLoss >= 0 ? '+' : ''}{analytics.profitLoss.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Avg. Odds</div>
                <div className="text-2xl font-bold">+{analytics.avgOdds}</div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-bold mb-3">Sport Breakdown</h3>
            <div className="space-y-3">
              {analytics.sportBreakdown.map((sport, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-24">{sport.sport}</div>
                  <div className="flex-1 mx-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500" 
                        style={{ width: `${sport.winRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-16 text-right">{sport.winRate}%</div>
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
                    {day.date.toLocaleDateString(undefined, { weekday: 'short' })}
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

  return (
    <div className="pb-16">
      {user && <ProfileHeader user={user} isOwnProfile={isOwnProfile} />}
      
      <div className="card">
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex">
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'bets' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-500'}`}
              onClick={() => fetchTabData('bets')}
            >
              Bets
            </button>
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'likes' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-500'}`}
              onClick={() => fetchTabData('likes')}
            >
              Likes
            </button>
            {isOwnProfile && (
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'analytics' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-500'}`}
                onClick={() => fetchTabData('analytics')}
              >
                Analytics
              </button>
            )}
          </div>
        </div>
        
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Profile;

import React, { useState } from 'react';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('games'); // 'games', 'topics', 'users'
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState('all');

  const sports = [
    { id: 'all', name: 'All Sports' },
    { id: 'football', name: 'Football' },
    { id: 'basketball', name: 'Basketball' },
    { id: 'baseball', name: 'Baseball' },
    { id: 'soccer', name: 'Soccer' },
    { id: 'hockey', name: 'Hockey' },
  ];

  const handleSearch = () => {
    setLoading(true);

    // Mock search results
    setTimeout(() => {
      if (searchType === 'games') {
        setSearchResults(generateMockGames(selectedSport !== 'all' ? selectedSport : null));
      } else if (searchType === 'topics') {
        setSearchResults(generateMockTopics());
      } else {
        setSearchResults(generateMockUsers());
      }
      setLoading(false);
    }, 500);
  };

  // Generate mock data for demonstration
  const generateMockGames = (sportFilter = null) => {
    const sports = sportFilter ? [sportFilter] : ['football', 'basketball', 'baseball', 'soccer', 'hockey'];
    
    return Array(8).fill().map((_, index) => ({
      _id: `game-${index + 1}`,
      sport: sports[Math.floor(Math.random() * sports.length)],
      homeTeam: {
        name: `Team ${Math.floor(Math.random() * 15) + 1}`,
        score: Math.floor(Math.random() * 100),
      },
      awayTeam: {
        name: `Team ${Math.floor(Math.random() * 15) + 16}`,
        score: Math.floor(Math.random() * 100),
      },
      time: Math.random() > 0.3 ? `${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? '00' : '30'} ${Math.random() > 0.5 ? 'Q4' : 'Q3'}` : 'FINAL',
      odds: {
        spread: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : -Math.floor(Math.random() * 10) - 1,
        total: Math.floor(Math.random() * 50) + 200,
      },
      tv: ['ESPN', 'FOX', 'CBS', 'NBC', 'TNT'][Math.floor(Math.random() * 5)],
      isLive: Math.random() > 0.3,
    }));
  };

  const generateMockTopics = () => {
    const topics = [
      'NFL Week 1', 'NBA Playoffs', 'MLB Opening Day', 'Champions League Final',
      'College Football Bowl Season', 'March Madness', 'Stanley Cup Playoffs',
      'Super Bowl Props', 'World Series', 'Kentucky Derby'
    ];
    
    return topics.slice(0, 8).map((topic, index) => ({
      _id: `topic-${index + 1}`,
      name: topic,
      betsCount: Math.floor(Math.random() * 1000) + 100,
      isHot: Math.random() > 0.7,
    }));
  };

  const generateMockUsers = () => {
    return Array(8).fill().map((_, index) => ({
      _id: `user-${index + 1}`,
      username: `user${Math.floor(Math.random() * 1000)}`,
      avatarUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
      verified: Math.random() > 0.7,
      winRate: Math.floor(Math.random() * 100),
      followerCount: Math.floor(Math.random() * 10000),
    }));
  };

  const renderSearchResults = () => {
    if (loading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (searchResults.length === 0) {
      return <div className="text-center py-8 text-gray-500">No results found</div>;
    }

    if (searchType === 'games') {
      return (
        <div className="space-y-4">
          {searchResults.map(game => (
            <div key={game._id} className="card">
              <div className="flex justify-between items-center mb-2">
                <span className={`px-2 py-1 rounded-full text-xs ${game.isLive ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {game.isLive ? 'LIVE' : 'UPCOMING'}
                </span>
                <span className="text-xs text-gray-500">{game.tv}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{game.homeTeam.name}</span>
                    <span className="font-bold">{game.homeTeam.score}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{game.awayTeam.name}</span>
                    <span className="font-bold">{game.awayTeam.score}</span>
                  </div>
                </div>
                
                <div className="px-4 text-center">
                  <div className="font-medium text-red-500">{game.time}</div>
                  <div className="text-xs text-gray-500 mt-1">{game.sport.toUpperCase()}</div>
                </div>
                
                <div className="flex-1 text-right">
                  <div className="mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Spread: </span>
                    <span className="font-medium">{game.odds.spread > 0 ? `+${game.odds.spread}` : game.odds.spread}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total: </span>
                    <span className="font-medium">{game.odds.total}</span>
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-3 btn-primary">
                Place Bet
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
              <p className="text-sm text-gray-500 mt-1">{topic.betsCount} bets</p>
              <button className="w-full mt-3 btn-primary">
                View Bets
              </button>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {searchResults.map(user => (
          <div key={user._id} className="card flex items-center">
            <img 
              src={user.avatarUrl} 
              alt={`${user.username}'s avatar`} 
              className="w-12 h-12 rounded-full"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                <span className="font-medium">{user.username}</span>
                {user.verified && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Win Rate: {user.winRate}% · {user.followerCount.toLocaleString()} followers
              </div>
            </div>
            <button className="btn-primary text-sm">
              View Profile
            </button>
          </div>
        ))}
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
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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

      {renderSearchResults()}
    </div>
  );
};

export default Search;

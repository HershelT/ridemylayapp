import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import BetCard from '../components/bets/BetCard';

const Home = () => {
  const [bets, setBets] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch of bets
    fetchBets();
  }, []);

  const fetchBets = async () => {
    setLoading(true);
    try {
      // fetch the bets from the API (mongo)
    //   const mockBets = generateMockBets(page);
      
    //   setTimeout(() => {
    //     if (page > 3) {
    //       setHasMore(false);
    //     } else {
    //       setBets(prevBets => [...prevBets, ...mockBets]);
    //       setPage(prevPage => prevPage + 1);
    //     }
    //     setLoading(false);
    //   }, 1000);
      
      // Real API call would look like:
      const response = await api.get('/api/bets', { params: { page, limit: 10 } });
      setBets(prevBets => [...prevBets, ...response.data.bets]);
      setHasMore(response.data.hasMore);
      setPage(prevPage => prevPage + 1);
    } catch (error) {
      console.error('Error fetching bets:', error);
      setLoading(false);
    }
  };

  // Generate mock data for demonstration
  const generateMockBets = (page) => {
    const startIndex = (page - 1) * 5;
    return Array(5).fill().map((_, index) => ({
      _id: `bet-${startIndex + index + 1}`,
      userId: `user-${Math.floor(Math.random() * 10) + 1}`,
      user: {
        username: `user${Math.floor(Math.random() * 10) + 1}`,
        avatarUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
        verified: Math.random() > 0.7,
        streak: Math.floor(Math.random() * 10) - 5,
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

  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold mb-4">Home Feed</h1>
      
      <div id="bets-container">
        <InfiniteScroll
          dataLength={bets.length}
          next={fetchBets}
          hasMore={hasMore}
          loader={<h4 className="text-center py-4">Loading more bets...</h4>}
          endMessage={
            <p className="text-center py-4 text-gray-500">
              You've seen all bets for now!
            </p>
          }
        >
          {bets.map(bet => (
            <BetCard key={bet._id} bet={bet} />
          ))}
        </InfiniteScroll>
      </div>
      
      {bets.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No bets found. Follow some users to see their bets!</p>
        </div>
      )}
    </div>
  );
};

export default Home;

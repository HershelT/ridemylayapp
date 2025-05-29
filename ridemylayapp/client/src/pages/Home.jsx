import React, { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import BetCard from '../components/bets/BetCard';
import useBets from '../hooks/useBets';
import useAuthStore from '../store/authStore';

const Home = () => {
  const { user } = useAuthStore();
  const { 
    bets,
    hasMore,
    isLoading,
    error,
    fetchBets
  } = useBets();

  useEffect(() => {
    // Initial fetch of bets
    fetchBets({ following: true }); // Only fetch bets from users we follow
  }, [fetchBets]);

  // Load more bets for infinite scroll
  const loadMoreBets = () => {
    if (!isLoading) {
      fetchBets({ following: true });
    }
  };

  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold mb-4">Home Feed</h1>
      
      <div id="bets-container">
        <InfiniteScroll
          dataLength={bets.length}
          next={loadMoreBets}
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
      
      {bets.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {error || "No bets found. Follow some users to see their bets!"}
          </p>
        </div>
      )}

      {isLoading && bets.length === 0 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      )}
    </div>
  );
};

export default Home;

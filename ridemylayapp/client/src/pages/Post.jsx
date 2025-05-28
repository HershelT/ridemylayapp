import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, Navigate } from 'react-router-dom';
import CreateBetForm from '../components/bets/CreateBetForm';
import useAuthStore from '../store/authStore';
import useBets from '../hooks/useBets';

const Post = () => {
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const { fetchBet } = useBets();
  
  const [betToEdit, setBetToEdit] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Check if we're editing an existing bet
  const modifyBetId = searchParams.get('modify');
  const rideBetId = searchParams.get('ride');
  
  useEffect(() => {
    const loadBet = async () => {
      if (!modifyBetId && !rideBetId) return;
      
      setLoading(true);
      try {
        const betId = modifyBetId || rideBetId;
        const bet = await fetchBet(betId);
        
        if (bet) {
          setBetToEdit(bet);
          setIsEditing(!!modifyBetId); // Only set editing mode for modify, not ride
        } else {
          setError('Bet not found');
        }
      } catch (error) {
        setError('Failed to load bet');
        console.error('Error loading bet:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadBet();
  }, [modifyBetId, rideBetId, fetchBet]);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto py-6"
    >
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {isEditing ? 'Edit Bet' : (betToEdit ? 'Ride This Bet' : 'Create a New Bet')}
      </h1>
      <CreateBetForm existingBet={betToEdit} isEditing={isEditing} isRiding={!!rideBetId} />
    </motion.div>
  );
};

export default Post;

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto py-6"
    >
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {isEditing ? 'Edit Bet' : (betToEdit ? 'Ride This Bet' : 'Create a New Bet')}
      </h1>
      <CreateBetForm existingBet={betToEdit} isEditing={isEditing} isRiding={!!rideBetId} />
    </motion.div>
  );
};

export default Post;

  const addLeg = () => {
    setBetForm({
      ...betForm,
      legs: [...betForm.legs, { team: '', betType: '', odds: '' }]
    });
  };

  const removeLeg = (index) => {
    const updatedLegs = [...betForm.legs];
    updatedLegs.splice(index, 1);
    setBetForm({ ...betForm, legs: updatedLegs });
  };

  const calculatePotentialWinnings = () => {
    const stake = parseFloat(betForm.stake) || 0;
    
    // Calculate combined odds for parlay
    let totalOdds = 1;
    betForm.legs.forEach(leg => {
      const legOdds = parseFloat(leg.odds) || 0;
      if (legOdds > 0) {
        totalOdds *= (1 + legOdds / 100);
      } else if (legOdds < 0) {
        totalOdds *= (1 + 100 / Math.abs(legOdds));
      }
    });
    
    const potentialWinnings = stake * totalOdds;
    return potentialWinnings.toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // TODO: Add validation
    
    console.log('Submitting bet:', betForm);
    
    // TODO: Submit to API
    // api.post('/api/bets', betForm)
    //   .then(response => {
    //     // Handle success
    //   })
    //   .catch(error => {
    //     // Handle error
    //   });
  };

  const getSelectedBettingSite = () => {
    return bettingSites.find(site => site._id === betForm.bettingSiteId);
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto py-6"
    >
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {isEditing ? 'Edit Bet' : (betToEdit ? 'Ride This Bet' : 'Create a New Bet')}
      </h1>
      <CreateBetForm existingBet={betToEdit} isEditing={isEditing} isRiding={!!rideBetId} />
    </motion.div>
  );
};

export default Post;
